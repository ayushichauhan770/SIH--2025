import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { loginSchema, insertUserSchema, insertApplicationSchema, updateApplicationStatusSchema, insertFeedbackSchema, verifyOtpSchema, generateOtpSchema, insertDepartmentSchema, insertWarningSchema, insertCaseSchema } from "@shared/schema";
import type { User, Application } from "@shared/schema";
import { sendEmailOTP, verifyEmailConfig } from "./email-service";
import { sendSMSOTP } from "./sms-service";
import { aiRouting } from "./services/ai-routing";
import { timeline } from "./services/timeline";
import { escalationManager } from "./services/escalation-job";
import { investigationEngine } from "./investigation-engine";

const JWT_SECRET = process.env.SESSION_SECRET || "dev-secret-key";

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    req.user = user as User;
    next();
  });
}

function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendSMS(targetPhone: string, message: string) {
  // Prefer Twilio if configured; otherwise fall back to console logging
  const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
  const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN;
  const TWILIO_FROM = process.env.TWILIO_FROM;

  if (targetPhone.includes("@")) {
    // treat as email
    const SMTP_HOST = process.env.SMTP_HOST;
    const SMTP_PORT = Number(process.env.SMTP_PORT || "587");
    const SMTP_USER = process.env.SMTP_USER;
    const SMTP_PASS = process.env.SMTP_PASS;
    const FROM_EMAIL = process.env.FROM_EMAIL || process.env.TWILIO_FROM || "no-reply@example.com";

    if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
      try {
        // @ts-ignore optional dependency
        const nodemailer = (await import("nodemailer")) as any;
        const transporter = nodemailer.createTransport({
          host: SMTP_HOST,
          port: SMTP_PORT,
          secure: SMTP_PORT === 465,
          auth: { user: SMTP_USER, pass: SMTP_PASS },
        });
        await transporter.sendMail({ from: FROM_EMAIL, to: targetPhone, subject: "Your OTP Code", text: message });
        console.log(`Sent email OTP to ${targetPhone}`);
        return;
      } catch (err) {
        console.error("Email send failed, falling back to console: ", err);
      }
    }
  }

  if (TWILIO_SID && TWILIO_TOKEN && TWILIO_FROM) {
    try {
      // dynamic import so that the dependency is optional in dev environments
      // dynamic import - allow missing types in environments without Twilio installed
      // @ts-ignore - optional dependency
      const TwilioModule = await import("twilio");
      const Twilio = (TwilioModule as any).default as any;
      const client = Twilio(TWILIO_SID, TWILIO_TOKEN) as any;
      await client.messages.create({ from: TWILIO_FROM, to: targetPhone, body: message });
      console.log(`Sent SMS via Twilio to ${targetPhone}`);
    } catch (err) {
      console.error("Twilio send failed, falling back to console: ", err);
      console.log(`OTP for ${targetPhone}: ${message}`);
    }
  } else {
    console.log(`OTP for ${targetPhone}: ${message}`);
  }
}

class AIMonitoringService {
  async checkDelays() {
    const applications = await storage.getAllApplications();
    const now = Date.now();

    for (const app of applications) {
      if (["Approved", "Rejected", "Auto-Approved"].includes(app.status)) {
        continue;
      }

      const daysSinceSubmission = Math.floor(
        (now - new Date(app.submittedAt).getTime()) / (1000 * 60 * 60 * 24)
      );

      const daysSinceUpdate = Math.floor(
        (now - new Date(app.lastUpdatedAt).getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceUpdate > 7 && app.status !== "Submitted") {
        const citizen = await storage.getUser(app.citizenId);
        if (citizen) {
          await storage.createNotification(
            citizen.id,
            "delay",
            "Application Delayed",
            `Your application ${app.trackingId} has been pending for ${daysSinceUpdate} days.`,
            app.id
          );
        }

        if (app.officialId) {
          await storage.createNotification(
            app.officialId,
            "delay",
            "Delayed Application Alert",
            `Application ${app.trackingId} requires attention. ${daysSinceUpdate} days since last update.`,
            app.id
          );
        }
      }

      if (daysSinceSubmission >= 30) {
        await storage.updateApplicationStatus(
          app.id,
          "Auto-Approved",
          "system",
          "Auto-approved after 30 days"
        );

        const citizen = await storage.getUser(app.citizenId);
        if (citizen) {
          await storage.createNotification(
            citizen.id,
            "approval",
            "Application Auto-Approved",
            `Your application ${app.trackingId} has been automatically approved after 30 days.`,
            app.id
          );
        }
      }
    }
  }
}

const aiService = new AIMonitoringService();

async function autoAssignApplication(applicationId: string, departmentName: string, subDepartmentName: string | null = null, escalationLevel: number = 0) {
  console.log(`[Auto-Assign] Starting assignment for application ${applicationId}`);
  console.log(`[Auto-Assign] Department: ${departmentName}, Sub-Department: ${subDepartmentName || 'None'}`);

  const officials = await storage.getAllOfficials();
  console.log(`[Auto-Assign] Total officials in system: ${officials.length}`);

  if (officials.length === 0) {
    console.error('[Auto-Assign] ❌ No officials found in system! Cannot assign application.');
    return null;
  }

  const application = await storage.getApplication(applicationId);
  if (!application) {
    console.error(`[Auto-Assign] ❌ Application ${applicationId} not found!`);
    return null;
  }

  // Validate and normalize department name
  if (!departmentName || typeof departmentName !== 'string') {
    console.error('Invalid department name:', departmentName);
    return null;
  }

  // Validate and normalize sub-department name
  let normalizedSubDept: string | null = null;
  if (subDepartmentName) {
    if (typeof subDepartmentName === 'string' && subDepartmentName.trim()) {
      normalizedSubDept = subDepartmentName.trim();
    } else {
      // If it's not a valid string, set to null
      normalizedSubDept = null;
    }
  }

  // 1. Filter by Department
  // Normalize department names (handle "Health – Ministry..." vs "Health")
  let deptOfficials = officials.filter(u => {
    if (!u.department || typeof u.department !== 'string') return false;
    const uDept = u.department.split('–')[0].trim();
    const appDept = departmentName.split('–')[0].trim();
    const matches = uDept === appDept;
    if (matches) {
      console.log(`[Auto-Assign] ✅ Found matching official: ${u.fullName} (${u.department})`);
    }
    return matches;
  });

  console.log(`[Auto-Assign] Officials in department "${departmentName}": ${deptOfficials.length}`);

  // 2. Filter by Sub-Department if available (prefer sub-department match, but fallback to department-only)
  let subDeptOfficials: typeof deptOfficials = [];
  if (normalizedSubDept) {
    subDeptOfficials = deptOfficials.filter(u => {
      if (!u.subDepartment || typeof u.subDepartment !== 'string') return false;
      return u.subDepartment === normalizedSubDept;
    });

    // If we found officials with matching sub-department, use them
    // Otherwise, fall back to department-only officials
    if (subDeptOfficials.length > 0) {
      deptOfficials = subDeptOfficials;
      console.log(`✅ Found ${subDeptOfficials.length} official(s) matching department: ${departmentName} and sub-department: ${normalizedSubDept}`);
    } else {
      console.log(`⚠️ No officials found for sub-department: ${normalizedSubDept}, falling back to department: ${departmentName} only`);
      // Keep deptOfficials as is (department-only match)
    }
  }

  if (deptOfficials.length === 0) {
    console.error(`[Auto-Assign] ❌ No officials available for department: ${departmentName}${normalizedSubDept ? `, sub-department: ${normalizedSubDept}` : ''}`);
    console.log(`[Auto-Assign] Available officials and their departments:`);
    officials.forEach(o => {
      console.log(`  - ${o.fullName}: ${o.department || 'No department'} (Role: ${o.role})`);
    });
    return null;
  }

  // 2. Calculate Workload for each official
  const officialsWithStats = await Promise.all(
    deptOfficials.map(async (official) => {
      // Active Workload: Pending + In-Progress
      const activeWorkload = await storage.getOfficialCurrentWorkload(official.id);
      // Total Assigned: Lifetime count (already in official object)
      const totalAssigned = official.assignedCount || 0;

      return {
        ...official,
        activeWorkload,
        totalAssigned
      };
    })
  );

  // 3. Sort Logic (Tie-Breakers)
  officialsWithStats.sort((a, b) => {
    // Primary: Lowest Active Workload
    if (a.activeWorkload !== b.activeWorkload) {
      return a.activeWorkload - b.activeWorkload;
    }

    // Secondary: Lowest Total Assigned (History)
    if (a.totalAssigned !== b.totalAssigned) {
      return a.totalAssigned - b.totalAssigned;
    }

    // Tertiary: Earliest Created Date (Seniority/ID)
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  const bestOfficial = officialsWithStats[0];

  if (bestOfficial) {
    try {
      console.log(`[Auto-Assign] ✅ Selected official: ${bestOfficial.fullName} (ID: ${bestOfficial.id})`);
      console.log(`[Auto-Assign]   Workload - Active: ${bestOfficial.activeWorkload}, Total: ${bestOfficial.totalAssigned}`);

      // 4. Assign
      const assignedApp = await storage.assignApplication(applicationId, bestOfficial.id);
      console.log(`[Auto-Assign] ✅ Application assigned successfully!`);
      console.log(`[Auto-Assign]   Application ID: ${assignedApp.id}, Official ID: ${assignedApp.officialId}, Status: ${assignedApp.status}`);

      // 5. Update official stats
      await storage.updateUserStats(
        bestOfficial.id,
        bestOfficial.rating || 0,
        bestOfficial.solvedCount || 0,
        (bestOfficial.assignedCount || 0) + 1
      );

      // Update escalation level on application
      await storage.updateApplicationEscalation(applicationId, escalationLevel, bestOfficial.id);

      return {
        officialId: bestOfficial.id,
        officialName: bestOfficial.fullName,
        department: bestOfficial.department,
        workloadStats: {
          active: bestOfficial.activeWorkload,
          total: bestOfficial.totalAssigned
        },
        assignedAt: new Date()
      };
    } catch (error: any) {
      console.error('Error assigning application to official:', error);
      // Return null if assignment fails, but don't throw
      return null;
    }
  }

  return null;
}

import cron from "node-cron";

export async function registerRoutes(app: Express): Promise<Server> {
  // Start Escalation Job (Runs every 60 mins)
  escalationManager.startJob(60);

  // Verify email configuration on startup
  verifyEmailConfig().then((success) => {
    if (!success) {
      console.warn("WARNING: Email service configuration failed. OTP emails will not be sent.");
      console.warn("Please check your .env file and ensure SMTP_USER and SMTP_PASS are set correctly.");
    }
  });

  const isDev = (process.env.NODE_ENV || "development") !== "production";
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      // Manually add designation/level to schema parse or allow pass-through by updating insertion
      // For safety, let's explicitly extract them
      const data = insertUserSchema.parse({
         ...req.body,
         // Ensure extra fields are handled if schema is strict, but insertUserSchema omits ID/dates only
         // We need to cast hierarchyLevel to number if it came as string
         hierarchyLevel: req.body.hierarchyLevel ? Number(req.body.hierarchyLevel) : 1,
      });

      // Validate role
      if (data.role && !["citizen", "official", "admin"].includes(data.role)) {
        return res.status(400).json({ error: "Invalid role selected" });
      }

      // Verify Secret Key for Official and Admin
      if (data.role === "official") {
        const { secretKey, hierarchyLevel } = req.body;
        const level = Number(hierarchyLevel) || 1;

        if (level === 2 && secretKey !== "supervisor@2025") {
             return res.status(403).json({ error: "Invalid Secret Key for Supervisor (Level 2)" });
        } else if (level === 3 && secretKey !== "director@2025") {
             return res.status(403).json({ error: "Invalid Secret Key for Director (Level 3)" });
        } else if (level === 1 && secretKey !== "official@2025") {
             return res.status(403).json({ error: "Invalid Secret Key for Official (Level 1)" });
        }
      } else if (data.role === "admin") {
        const { secretKey } = req.body;
        if (secretKey !== "admin@2025") {
          return res.status(403).json({ error: "Invalid Secret Key for Admin registration" });
        }
      }

      const existing = await storage.getUserByUsername(data.username);
      if (existing) {
        return res.status(400).json({ error: "Username already exists" });
      }

      // check for duplicate email or phone
      if (data.email) {
        const existingEmail = await storage.getUserByEmail(data.email);
        if (existingEmail) {
          return res.status(400).json({ error: "This email is already registered. Please use a different email or mobile number." });
        }
      }

      if (data.phone) {
        const existingPhone = await storage.getUserByPhone(data.phone);
        if (existingPhone) {
          return res.status(400).json({ error: "This mobile number is already registered. Please use a different email or mobile number." });
        }
      }

      if (data.aadharNumber) {
        const existingAadhar = await storage.getUserByAadhar(data.aadharNumber);
        if (existingAadhar) {
          return res.status(400).json({ error: "This Aadhar number is already used. Please use a different Aadhar number." });
        }
      }

      const hashedPassword = await bcrypt.hash(data.password, 10);
      const user = await storage.createUser({
        ...data,
        password: hashedPassword,
        hierarchyLevel: req.body.hierarchyLevel ? parseInt(req.body.hierarchyLevel) : 1,
        designation: req.body.designation || "Official"
      });

      console.log(`User registered: username=${user.username}, phone=${user.phone}, email=${user.email}`);

      const { password, ...userWithoutPassword } = user;

      // If email provided, use two-step verification: generate OTP and return email
      if (user.email) {
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        await storage.createOTP(user.email, "email", otp, "register", expiresAt);

        // Send OTP via email
        try {
          await sendEmailOTP(user.email, otp, "register");
        } catch (error) {
          console.error("Failed to send email OTP:", error);
        }
        console.log(`Generated register OTP for email ${user.email}: ${otp}`);

        return res.json({
          user: userWithoutPassword,
          email: user.email,
          otpMethod: "email",
          ...(isDev ? { otp } : {})
        });
      } else if (user.phone) {
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        await storage.createOTP(user.phone, "phone", otp, "register", expiresAt);

        // Send OTP via SMS
        try {
          await sendSMSOTP(user.phone, otp, "register");
        } catch (error) {
          console.error("Failed to send SMS OTP:", error);
        }
        console.log(`Generated register OTP for phone ${user.phone}: ${otp}`);

        return res.json({
          user: userWithoutPassword,
          phone: user.phone,
          otpMethod: "phone",
          ...(isDev ? { otp } : {})
        });
      }

      // no phone or email -> issue token immediately
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.json({ user: userWithoutPassword, token });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const data = loginSchema.parse(req.body);
      let user: User | undefined;

      // 1. Mobile Login
      if (data.phone) {
        console.log(`Login attempt with phone: ${data.phone}`);
        user = await storage.getUserByPhone(data.phone);
        if (!user) {
          console.log(`No user found for phone: ${data.phone}`);
          return res.status(401).json({ error: "Invalid credentials" });
        }
        console.log(`User found: username=${user.username}, phone=${user.phone}`);

        // If password is provided, validate it
        if (data.password) {
          const validPassword = await bcrypt.compare(data.password, user.password);
          if (!validPassword) {
            return res.status(401).json({ error: "Invalid credentials" });
          }
        }
        // If no password provided, proceed with OTP-only login


        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        await storage.createOTP(user.phone!, "phone", otp, "login", expiresAt);

        // Send OTP via SMS
        try {
          await sendSMSOTP(user.phone!, otp, "login");
        } catch (error) {
          console.error("Failed to send SMS OTP:", error);
        }
        console.log(`Generated login OTP for phone ${user.phone}: ${otp}`);

        // Check if user is suspended
        const isSuspended = await storage.isUserSuspended(user.id);
        const suspendedUntil = user.suspendedUntil ? new Date(user.suspendedUntil) : null;
        const hoursRemaining = suspendedUntil && isSuspended
          ? Math.ceil((suspendedUntil.getTime() - Date.now()) / (1000 * 60 * 60))
          : 0;

        const { password, ...userWithoutPassword } = user;
        return res.json({
          user: userWithoutPassword,
          phone: user.phone,
          otpMethod: "phone",
          suspended: isSuspended,
          suspendedUntil: user.suspendedUntil,
          hoursRemaining: hoursRemaining > 0 ? hoursRemaining : 0,
          suspensionReason: user.suspensionReason,
          ...(isDev ? { otp } : {})
        });
      }

      // 2. Username/Email Login
      if (data.username || data.email) {
        if (data.username) {
          user = await storage.getUserByUsername(data.username);
        } else if (data.email) {
          user = await storage.getUserByEmail(data.email);
        }

        if (!user) {
          return res.status(401).json({ error: "Invalid credentials" });
        }

        // Password is mandatory for email/username login
        if (!data.password) {
          return res.status(400).json({ error: "Password is required" });
        }

        const validPassword = await bcrypt.compare(data.password, user.password);
        if (!validPassword) {
          return res.status(401).json({ error: "Invalid credentials" });
        }

        // Generate Email OTP for both password and passwordless login
        if (!user.email) {
          return res.status(400).json({ error: "User has no email for verification" });
        }

        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        await storage.createOTP(user.email, "email", otp, "login", expiresAt);

        // Send OTP via email
        try {
          await sendEmailOTP(user.email, otp, "login");
        } catch (error) {
          console.error("Failed to send email OTP:", error);
        }
        console.log(`Generated login OTP for email ${user.email}: ${otp}`);

        // Check if user is suspended
        const isSuspended = await storage.isUserSuspended(user.id);
        const suspendedUntil = user.suspendedUntil ? new Date(user.suspendedUntil) : null;
        const hoursRemaining = suspendedUntil && isSuspended
          ? Math.ceil((suspendedUntil.getTime() - Date.now()) / (1000 * 60 * 60))
          : 0;

        const { password, ...userWithoutPassword } = user;
        return res.json({
          user: userWithoutPassword,
          email: user.email,
          otpMethod: "email",
          suspended: isSuspended,
          suspendedUntil: user.suspendedUntil,
          hoursRemaining: hoursRemaining > 0 ? hoursRemaining : 0,
          suspensionReason: user.suspensionReason,
          ...(isDev ? { otp } : {})
        });
      }

      return res.status(400).json({ error: "Missing credentials" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Application Routes
  app.get("/api/auth/me", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check if user is suspended
      const isSuspended = await storage.isUserSuspended(user.id);
      const suspendedUntil = user.suspendedUntil ? new Date(user.suspendedUntil) : null;
      const hoursRemaining = suspendedUntil && isSuspended
        ? Math.ceil((suspendedUntil.getTime() - Date.now()) / (1000 * 60 * 60))
        : 0;

      const { password, ...userWithoutPassword } = user;
      res.json({
        ...userWithoutPassword,
        suspended: isSuspended,
        suspendedUntil: user.suspendedUntil,
        hoursRemaining: hoursRemaining > 0 ? hoursRemaining : 0,
        suspensionReason: user.suspensionReason
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/applications", authenticateToken, async (req: Request, res: Response) => {
    try {
      // Check if user is suspended
      const isSuspended = await storage.isUserSuspended(req.user!.id);
      if (isSuspended) {
        const user = await storage.getUser(req.user!.id);
        const suspendedUntil = user?.suspendedUntil ? new Date(user.suspendedUntil) : null;
        const hoursRemaining = suspendedUntil
          ? Math.ceil((suspendedUntil.getTime() - Date.now()) / (1000 * 60 * 60))
          : 0;
        return res.status(403).json({
          error: "You have reached the maximum submission limit for this department. Your account is temporarily suspended for 24 hours.",
          suspended: true,
          suspendedUntil: user?.suspendedUntil,
          hoursRemaining: hoursRemaining > 0 ? hoursRemaining : 0
        });
      }

      const data = insertApplicationSchema.parse(req.body);

      // Extract department from applicationType if not provided directly (same logic as createApplication)
      let department: string | null = data.department || null;
      if (!department && data.applicationType) {
        const match = data.applicationType.match(/^([^–]+)/);
        if (match) {
          department = match[1].trim();
        }
      }

      // Check for over-complaining before creating application (same department)
      // This check works for ALL departments, whether provided directly or extracted from applicationType
      if (department) {
        const isOverComplaining = await storage.checkOverComplaining(
          req.user!.id,
          department
        );

        if (isOverComplaining) {
          // Suspend user for 24 hours
          await storage.suspendUser(
            req.user!.id,
            "Reached maximum submission limit for department within 24 hours",
            24
          );

          // Send notification to user
          await storage.createNotification(
            req.user!.id,
            "suspension",
            "Account Suspended",
            "You have reached the maximum submission limit for this department. Your account is temporarily suspended for 24 hours.",
            undefined
          );

          return res.status(403).json({
            error: "You have reached the maximum submission limit for this department. Your account is temporarily suspended for 24 hours.",
            suspended: true,
            suspendedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            hoursRemaining: 24
          });
        }
      }

      const application = await storage.createApplication({
        ...data,
        citizenId: req.user!.id,
      });

      // AUTO-APPROVAL: Check for Aadhaar Department + Aadhaar Update with mandatory documents
      const isAadhaarDepartment = application.department === "Aadhaar – Unique Identification Authority of India (UIDAI)" ||
        application.department?.includes("Aadhaar");
      const isAadhaarUpdate = application.subDepartment === "Aadhaar Update (Name/DOB/Address mismatch)";

      let shouldAutoApprove = false;
      if (isAadhaarDepartment && isAadhaarUpdate) {
        // Parse the data field to check for documents
        try {
          const appData = JSON.parse(application.data || "{}");
          const documents = appData.documents || {};

          // Check if both required documents are uploaded
          const hasAadhaarCard = documents.aadhaarCard && documents.aadhaarCard.trim().length > 0;
          const hasAddressProof = documents.addressProof && documents.addressProof.trim().length > 0;

          if (hasAadhaarCard && hasAddressProof) {
            shouldAutoApprove = true;
            console.log(`[Auto-Approval] ✅ Application ${application.trackingId} eligible for auto-approval - both documents verified`);

            // Auto-approve the application
            await storage.updateApplicationStatus(
              application.id,
              "Auto-Approved (Documents Verified by System)",
              "system",
              "Application auto-approved: All mandatory documents (Aadhaar card and Address proof) verified by system."
            );

            // Update approvedAt timestamp
            const updatedApp = await storage.getApplication(application.id);
            if (updatedApp) {
              // Send notification to citizen
              await storage.createNotification(
                application.citizenId,
                "approval",
                "Application Auto-Approved",
                `Your application ${application.trackingId} has been automatically approved. All required documents have been verified by the system.`,
                application.id
              );

              console.log(`[Auto-Approval] ✅ Application ${application.trackingId} auto-approved successfully`);
            }
          } else {
            console.log(`[Auto-Approval] ⚠️ Application ${application.trackingId} missing required documents - Aadhaar Card: ${hasAadhaarCard}, Address Proof: ${hasAddressProof}`);
          }
        } catch (error) {
          console.error(`[Auto-Approval] ❌ Error parsing application data for ${application.trackingId}:`, error);
        }
      }

      // AUTO-ASSIGNMENT: Applications are automatically assigned to officials when submitted
      // Skip auto-assignment if application was auto-approved
      // No acceptance step is required - applications go directly to the official's "My Applications"
      // Assignment is based on: 1) Department match, 2) Sub-department match (if available),
      // 3) Lowest workload, 4) Total assigned count, 5) Seniority
      let assignedApplication = application;

      // Fetch updated application if it was auto-approved
      if (shouldAutoApprove) {
        const updatedApp = await storage.getApplication(application.id);
        if (updatedApp) {
          assignedApplication = updatedApp;
        }
      }

      // Always attempt auto-assignment if department is available and not auto-approved
      console.log(`[Application Submit] 📝 Application created: ${application.trackingId}`);
      console.log(`[Application Submit] Department: ${application.department || 'None'}, Sub-Department: ${application.subDepartment || 'None'}`);
      console.log(`[Application Submit] Auto-Approved: ${shouldAutoApprove ? 'Yes' : 'No'}`);

      if (application.department && !shouldAutoApprove) {
        try {
          console.log(`[Application Submit] 🔄 Attempting auto-assignment...`);
          const assignmentResult: { officialId: string; officialName: string; department: string | null; workloadStats: { active: number; total: number }; assignedAt: Date } | null = await autoAssignApplication(
            application.id,
            application.department,
            application.subDepartment || null,
            0
          );

          if (assignmentResult) {
            const subDeptInfo = application.subDepartment ? `, sub-department: ${application.subDepartment}` : '';
            console.log(`[Application Submit] ✅ Auto-assigned application ${application.trackingId} to ${assignmentResult.officialName}`);
            console.log(`[Application Submit]    Department: ${assignmentResult.department}${subDeptInfo}`);
            console.log(`[Application Submit]    Stats - Active: ${assignmentResult.workloadStats.active}, Total: ${assignmentResult.workloadStats.total}`);

            // Fetch the updated application with assignment details
            const updatedApp = await storage.getApplication(application.id);
            if (updatedApp && updatedApp.officialId) {
              console.log(`[Application Submit] ✅ Assignment confirmed - Official ID: ${updatedApp.officialId}, Status: ${updatedApp.status}`);
              assignedApplication = updatedApp;

              // Verify assignment was saved
              const verifyApp = await storage.getApplication(application.id);
              if (verifyApp && verifyApp.officialId === assignmentResult.officialId) {
                console.log(`[Application Submit] ✅ Assignment verified in storage`);
              } else {
                console.error(`[Application Submit] ❌ Assignment verification failed! Expected: ${assignmentResult.officialId}, Got: ${verifyApp?.officialId}`);
              }

              // Send notification to the assigned official
              await storage.createNotification(
                assignmentResult.officialId,
                "assignment",
                "New Application Assigned",
                `A new application ${application.trackingId} has been automatically assigned to you.`,
                application.id
              );

              // Notify the citizen that their application has been assigned
              await storage.createNotification(
                application.citizenId,
                "assignment",
                "Application Assigned",
                `Your application ${application.trackingId} has been automatically assigned to an official and is now being processed.`,
                application.id
              );
            }
          } else {
            console.warn(`⚠️ Could not auto-assign application ${application.trackingId} - no matching officials found in department: ${application.department}`);
          }
        } catch (error: any) {
          console.error(`❌ Error during auto-assignment for application ${application.trackingId}:`, error);
          // Continue even if assignment fails - application will remain unassigned
        }
      } else {
        console.warn(`⚠️ Application ${application.trackingId} has no department - cannot auto-assign. Department: ${application.department}, ApplicationType: ${application.applicationType}`);
      }

      // Return the application (with assignment details if auto-assigned)
      res.json(assignedApplication);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/applications/my", authenticateToken, async (req: Request, res: Response) => {
    try {
      const applications = await storage.getUserApplications(req.user!.id);
      res.json(applications);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/applications/track/:trackingId", async (req: Request, res: Response) => {
    try {
      const application = await storage.getApplicationByTrackingId(req.params.trackingId);
      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }
      res.json(application);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get application location history by tracking ID (public access)
  app.get("/api/applications/track/:trackingId/location-history", async (req: Request, res: Response) => {
    try {
      const application = await storage.getApplicationByTrackingId(req.params.trackingId);
      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }
      const locationHistory = await storage.getApplicationLocationHistory(application.id);
      res.json(locationHistory);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/applications/:id", authenticateToken, async (req: Request, res: Response) => {
    try {
      const application = await storage.getApplication(req.params.id);
      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }
      res.json(application);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/applications/:id/history", authenticateToken, async (req: Request, res: Response) => {
    try {
      const history = await storage.getApplicationHistory(req.params.id);
      res.json(history);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/applications", authenticateToken, requireRole("official", "admin"), async (req: Request, res: Response) => {
    try {
      let applications;
      if (req.user!.role === "admin") {
        applications = await storage.getAllApplications();
      } else {
        // For officials: return only their assigned applications (auto-assigned when citizen submits)
        // Applications are automatically assigned to officials in the same department when submitted
        const user = await storage.getUser(req.user!.id);
        if (!user || !user.department) {
          return res.status(400).json({ error: "Official has no department assigned" });
        }

        console.log(`[API /applications] Official: ${user.fullName} (${req.user!.id}), Department: ${user.department}`);

        // Get applications assigned to this official ONLY (strictly filtered by officialId)
        // Each application should only be visible to ONE official (the one it's assigned to)
        const assignedApps = await storage.getOfficialApplications(req.user!.id);
        console.log(`[API /applications] Found ${assignedApps.length} assigned applications for ${user.fullName} (ID: ${req.user!.id})`);

        // Verify all returned applications are actually assigned to this official
        const misassigned = assignedApps.filter(app => app.officialId !== req.user!.id);
        if (misassigned.length > 0) {
          console.error(`[API /applications] ❌ ERROR: Found ${misassigned.length} applications not assigned to ${req.user!.id}!`);
          misassigned.forEach(app => {
            console.error(`  - Application ${app.trackingId} assigned to ${app.officialId}, not ${req.user!.id}`);
          });
        }

        // Fetch ratings for assigned applications
        const assignedAppsWithRatings = await Promise.all(assignedApps.map(async (app) => {
          const feedback = await storage.getFeedbackByApplicationAndOfficialId(app.id, req.user!.id);
          return { ...app, rating: feedback?.rating };
        }));

        // Sort by priority (high > medium > low), then by submission date
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        applications = assignedAppsWithRatings
          .sort((a, b) => {
            const priorityDiff = (priorityOrder[(b.priority || "low").toLowerCase() as keyof typeof priorityOrder] || 0) - (priorityOrder[(a.priority || "low").toLowerCase() as keyof typeof priorityOrder] || 0);
            if (priorityDiff !== 0) return priorityDiff;
            return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
          });

        console.log(`[API /applications] Returning ${applications.length} applications for ${user.fullName}`);
        if (applications.length > 0) {
          console.log(`[API /applications] Latest application: ${applications[0].trackingId} (Official ID: ${applications[0].officialId}, Status: ${applications[0].status})`);
        }
      }
      res.json(applications);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/applications/:id/status", authenticateToken, requireRole("official", "admin"), async (req: Request, res: Response) => {
    try {
      const data = updateApplicationStatusSchema.parse(req.body);
      const application = await storage.updateApplicationStatus(
        req.params.id,
        data.status,
        req.user!.id,
        data.comment
      );

      // Auto-warning system: If official rejects 3+ applications, send automatic warning
      if (data.status === "Rejected" && req.user!.role === "official") {
        try {
          // Get all applications rejected by this official
          const allApplications = await storage.getAllApplications();
          const rejectedByOfficial = allApplications.filter(app =>
            app.officialId === req.user!.id && app.status === "Rejected"
          );

          // If official has rejected 3 or more applications, send automatic warning
          if (rejectedByOfficial.length >= 3) {
            // Check if we already sent a warning for this threshold recently (to avoid duplicate warnings)
            const existingWarnings = await storage.getWarnings(req.user!.id);
            const recentWarning = existingWarnings.find(w =>
              (w.message.includes("rejected") || w.message.includes("rejection")) &&
              w.message.includes("High rejection rates") &&
              new Date(w.sentAt).getTime() > (Date.now() - 24 * 60 * 60 * 1000) // Within last 24 hours
            );

            if (!recentWarning) {
              // Create automatic warning
              const warning = await storage.createWarning({
                officialId: req.user!.id,
                message: `You have rejected ${rejectedByOfficial.length} application(s). Please review your rejection decisions carefully. High rejection rates may indicate issues with application processing. Consider providing detailed feedback to citizens.`,
              });

              console.log(`⚠️ Auto-warning sent to official ${req.user!.id} (${req.user!.username}) for ${rejectedByOfficial.length} rejections`);

              // Send notification to the official
              await storage.createNotification(
                req.user!.id,
                "warning",
                "Automatic Warning: High Rejection Rate",
                `You have rejected ${rejectedByOfficial.length} application(s). Please review your decisions and ensure rejections are justified.`,
                application.id
              );
            } else {
              console.log(`ℹ️ Warning already sent to official ${req.user!.id} within last 24 hours, skipping duplicate warning`);
            }
          }
        } catch (warningError: any) {
          console.error(`❌ Error sending auto-warning for rejection:`, warningError);
          // Don't fail the status update if warning fails
        }
      }

      res.json(application);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Update application priority and remarks
  app.patch("/api/applications/:id", authenticateToken, requireRole("official", "admin"), async (req: Request, res: Response) => {
    try {
      const { priority, remarks } = req.body;
      const app = await storage.getApplication(req.params.id);

      if (!app) {
        return res.status(404).json({ error: "Application not found" });
      }

      // Update priority and remarks in storage
      const updated = {
        ...app,
        priority: priority !== undefined ? priority : app.priority,
        remarks: remarks !== undefined ? remarks : app.remarks,
        lastUpdatedAt: new Date(),
      };

      // @ts-ignore - We're updating the application map directly
      storage.applications.set(app.id, updated);

      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });


  // NEW: Automated File Submission Endpoint (AI Integrated)
  app.post("/api/files", authenticateToken, async (req: Request, res: Response) => {
    try {
      const data = insertApplicationSchema.parse(req.body);
      
      // 1. AI Analysis
      const aiResult = await aiRouting.analyzeComplaint(
        data.title || "User Complaint", 
        data.description, 
        data.location || "Unknown"
      );

      // 2. Calculate SLA & Auto-Approval
      const slaDueAt = escalationManager.calculateDueDate(aiResult.priority);
      
      // Auto-Approval Logic: If confidence > 90%, auto-approve in 36 hours
      let autoApprovalDate: Date | null = null;
      if (aiResult.confidence > 90) {
        autoApprovalDate = new Date(Date.now() + 36 * 60 * 60 * 1000); // 36 hours
      }

      // 1.5: Run Semantic Verification & Forensic Check (The "AI Official" Layer)
      const verification = await aiRouting.verifyApplication({
          ...data,
          fullName: req.user?.fullName,
          aadharNumber: req.user?.aadharNumber
      });

      // "Replace the Official" Logic:
      // If AI is extremely confident (>90%) AND Forensics are clean -> Instant Approval
      let status = aiResult.action === "AUTO_ASSIGN" ? "Submitted" : "PENDING_MANUAL_ROUTING";
      let remarks = "";
      
      const isForensicallyClean = !verification.forensics?.tamperingDetected && verification.forensics?.ocrNameMatch;
      
      if (verification.confidence > 90 && isForensicallyClean) {
          status = "Auto-Approved";
          remarks = `⚡ Instant AI Approval: Document forensics passed with ${verification.confidence}% confidence.`;
          autoApprovalDate = new Date(); // Approved now
      }

      // 3. Create Application
      const application = await storage.createApplication({
        ...data,
        citizenId: req.user!.id,
        department: aiResult.department,
        status: status,
        priority: aiResult.priority,
        slaDueAt: slaDueAt,
        autoApprovalDate: autoApprovalDate, 
        aiConfidence: Math.round(verification.confidence), // Use verification confidence
        remarks: remarks || undefined
      });

      // 4. Log AI Analysis
      await storage.createAiRoutingLog({
        applicationId: application.id,
        inputText: data.description,
        predictedDept: aiResult.department,
        predictedPriority: aiResult.priority,
        confidenceScore: Math.round(aiResult.confidence),
        reasoning: aiResult.reasoning,
        actionTaken: aiResult.action
      });

      // 5. Timeline Events
      if (status === "Auto-Approved") {
          // Log the creation by citizen first
          await timeline.logEvent(application.id, "CITIZEN", "CREATED", "Application submitted successfully", req.user!.id);
          // Then log the immediate AI approval
          await timeline.logEvent(application.id, "AI", "STATUS_CHANGED", "Application Auto-Approved by AI Official (Forensics Validated)", undefined, { reasoning: remarks });
      } else {
          await timeline.logEvent(
            application.id, 
            "CITIZEN", 
            "CREATED", 
            "Application submitted successfully",
             req.user!.id
          );
      }
      
      await timeline.logEvent(
        application.id, 
        "AI", 
        "AI_ROUTED", 
        `AI routed to ${aiResult.department} (${aiResult.priority} Priority). Confidence: ${Math.round(aiResult.confidence)}%`,
        undefined,
        { reasoning: aiResult.reasoning }
      );

      // Attempt Auto-Assignment if AI was confident
      if (aiResult.action === "AUTO_ASSIGN") {
         try {
           const assignment = await autoAssignApplication(application.id, aiResult.department);
           if (assignment) {
             await timeline.logEvent(
                application.id,
                "SYSTEM",
                "ASSIGNED",
                `System auto-assigned to ${assignment.officialName} (${assignment.department})`,
                undefined,
                { officialName: assignment.officialName, workload: assignment.workloadStats }
             );
           } else {
             await timeline.logEvent(
               application.id,
               "SYSTEM",
               "STATUS_CHANGED",
               "Auto-assignment failed: No available officials. Flags for manual routing."
             );
           }
         } catch (err) {
            console.error("AUTO_ASSIGN_ERROR", err);
         }
      }

      res.json(application);
    } catch (error: any) {
      console.error("FILE_SUBMISSION_ERROR", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Add new location update to application
  app.post("/api/applications/:id/location", authenticateToken, requireRole("official", "admin"), async (req: Request, res: Response) => {
    try {
      const { location } = req.body;
      if (!location || typeof location !== "string" || location.trim().length === 0) {
        return res.status(400).json({ error: "Location is required" });
      }

      const app = await storage.getApplication(req.params.id);
      if (!app) {
        return res.status(404).json({ error: "Application not found" });
      }

      const locationEntry = await storage.addApplicationLocation(
        req.params.id,
        location.trim(),
        req.user!.id
      );

      res.json(locationEntry);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // NEW: Get File Timeline
  app.get("/api/files/:id/timeline", authenticateToken, async (req: Request, res: Response) => {
    try {
      const events = await storage.getFileTimeline(req.params.id);
      res.json(events);
    } catch (error: any) {
       res.status(500).json({ error: error.message });
    }
  });

  // NEW: AI Verification Endpoint for Officials
  app.post("/api/applications/:id/verify-ai", authenticateToken, requireRole("official"), async (req: Request, res: Response) => {
    try {
       const application = await storage.getApplication(req.params.id);
       if (!application) return res.status(404).json({ error: "Application not found" });

       // Get user details for context
       const citizen = await storage.getUser(application.citizenId);
       
       const verificationResult = await aiRouting.verifyApplication({
         ...application,
         fullName: citizen?.fullName,
         aadharNumber: citizen?.aadharNumber
       });

       // Log the AI check logic
       await timeline.logEvent(
         application.id,
         "AI",
         "AI_ROUTED", // Reuse or add new event type like AI_VERIFY
         `AI Verification Checked. Outcome: ${verificationResult.recommendedStatus}`,
         undefined,
         { checklist: verificationResult.checklist, reasoning: verificationResult.reasoning }
       );

       res.json(verificationResult);
    } catch (error: any) {
       res.status(500).json({ error: error.message });
    }
  });

  // Get application location history
  app.get("/api/applications/:id/location-history", authenticateToken, async (req: Request, res: Response) => {
    try {
      const application = await storage.getApplication(req.params.id);
      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }

      // Ensure citizens can only view their own application's location history
      if (req.user!.role === "citizen" && application.citizenId !== req.user!.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      const locationHistory = await storage.getApplicationLocationHistory(req.params.id);
      res.json(locationHistory);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/applications/:id/assign", authenticateToken, requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { officialId } = req.body;
      const application = await storage.assignApplication(req.params.id, officialId);
      res.json(application);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/applications/:id/accept", authenticateToken, requireRole("official", "admin"), async (req: Request, res: Response) => {
    try {
      console.log(`[Assignment Debug] User ${req.user!.username} (${req.user!.id}) is accepting application ${req.params.id}`);

      const application = await storage.assignApplication(req.params.id, req.user!.id);

      console.log(`[Assignment Debug] Application ${application.id} assigned to officialId: ${application.officialId}`);

      // Notify the citizen
      const citizen = await storage.getUser(application.citizenId);
      if (citizen) {
        await storage.createNotification(
          citizen.id,
          "assignment",
          "Application Assigned",
          `Your application ${application.trackingId} has been assigned to an official and is now being processed.`,
          application.id
        );
      }

      res.json(application);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // NEW: Chat with Sahayak Assistant
  app.post("/api/chat", async (req: Request, res: Response) => {
    try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ error: "Message required" });
        
        const response = await aiRouting.chatWithAssistant(message);
        res.json({ response });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/applications/:id/feedback", authenticateToken, async (req: Request, res: Response) => {
    try {
      const application = await storage.getApplication(req.params.id);
      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }

      // Ensure application belongs to the current user
      if (application.citizenId !== req.user!.id) {
        return res.status(403).json({ error: "You can only rate your own applications" });
      }

      // Determine which official should receive this rating
      let targetOfficialId = application.officialId;

      // If no official is assigned but department exists, find an official from that department
      if (!targetOfficialId && application.department) {
        const allOfficials = await storage.getAllOfficials();
        const normalizedDept = application.department.split('–')[0].trim();

        let deptOfficials = allOfficials.filter(u => {
          if (!u.department) return false;
          const uDept = u.department.split('–')[0].trim();
          return uDept === normalizedDept;
        });

        // If sub-department exists, prefer officials with matching sub-department
        if (application.subDepartment && deptOfficials.length > 0) {
          const subDeptOfficials = deptOfficials.filter(u =>
            u.subDepartment === application.subDepartment
          );
          if (subDeptOfficials.length > 0) {
            deptOfficials = subDeptOfficials;
          }
        }

        if (deptOfficials.length > 0) {
          targetOfficialId = deptOfficials[0].id;
        }
      }

      const data = insertFeedbackSchema.parse({
        ...req.body,
        applicationId: req.params.id,
        citizenId: req.user!.id,
        officialId: targetOfficialId, // Include the official who handled the application/department
      });

      const feedback = await storage.createFeedback(data);

      // Update Official Rating
      if (targetOfficialId) {
        const official = await storage.getUser(targetOfficialId);
        if (official) {
          const allRatings = await storage.getOfficialRatings(official.id);
          if (allRatings.length > 0) {
            const totalRating = allRatings.reduce((sum, r) => sum + r.rating, 0);
            const avgRating = totalRating / allRatings.length;

            await storage.updateUserStats(
              official.id,
              avgRating,
              official.solvedCount || 0,
              official.assignedCount || 0
            );
          }
        }
      }

      res.json(feedback);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // POST /api/feedback - General feedback submission endpoint (backward compatibility)
  app.post("/api/feedback", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { applicationId, rating, comment } = req.body;

      if (!applicationId) {
        return res.status(400).json({ error: "Application ID is required" });
      }

      // Check if feedback already exists for this application
      const application = await storage.getApplication(applicationId);
      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }

      // Check if feedback already exists for this application and official
      if (application.officialId) {
        const existingFeedback = await storage.getFeedbackByApplicationAndOfficialId(applicationId, application.officialId);
        if (existingFeedback) {
          // Update existing feedback
          await storage.updateFeedback(existingFeedback.id, rating, comment);

          // Recalculate stats
          const official = await storage.getUser(application.officialId);
          if (official) {
            const allRatings = await storage.getOfficialRatings(official.id);
            const totalRating = allRatings.reduce((sum, r) => sum + r.rating, 0);
            const avgRating = totalRating / allRatings.length;

            await storage.updateUserStats(
              official.id,
              avgRating,
              official.solvedCount || 0,
              official.assignedCount || 0
            );
          }

          return res.json({ message: "Feedback updated successfully" });
        }
      }

      // Ensure application belongs to the current user
      if (application.citizenId !== req.user!.id) {
        return res.status(403).json({ error: "You can only rate your own applications" });
      }

      // Determine which official should receive this rating
      // Priority: 1. Assigned official, 2. Find official from department
      let targetOfficialId = application.officialId;

      // If no official is assigned but department exists, find an official from that department
      if (!targetOfficialId && application.department) {
        const allOfficials = await storage.getAllOfficials();
        const normalizedDept = application.department.split('–')[0].trim();

        // Find officials matching the department
        let deptOfficials = allOfficials.filter(u => {
          if (!u.department) return false;
          const uDept = u.department.split('–')[0].trim();
          return uDept === normalizedDept;
        });

        // If sub-department exists, prefer officials with matching sub-department
        if (application.subDepartment && deptOfficials.length > 0) {
          const subDeptOfficials = deptOfficials.filter(u =>
            u.subDepartment === application.subDepartment
          );
          if (subDeptOfficials.length > 0) {
            deptOfficials = subDeptOfficials;
          }
        }

        // Select the first available official from the department
        if (deptOfficials.length > 0) {
          targetOfficialId = deptOfficials[0].id;
          console.log(`Rating will be attributed to official ${deptOfficials[0].fullName} from department ${application.department}`);
        }
      }

      const data = insertFeedbackSchema.parse({
        applicationId,
        citizenId: req.user!.id,
        officialId: targetOfficialId, // Use the determined official ID
        rating,
        comment,
      });

      const feedback = await storage.createFeedback(data);

      // Update Official Rating - ensure rating goes to the official who handled this department
      if (targetOfficialId) {
        const official = await storage.getUser(targetOfficialId);
        if (official) {
          const allRatings = await storage.getOfficialRatings(official.id);
          if (allRatings.length > 0) {
            const totalRating = allRatings.reduce((sum, r) => sum + r.rating, 0);
            const avgRating = totalRating / allRatings.length;

            await storage.updateUserStats(
              official.id,
              avgRating,
              official.solvedCount || 0,
              official.assignedCount || 0
            );

            console.log(`Updated rating for official ${official.fullName}: ${avgRating.toFixed(1)}/5.0 (${allRatings.length} ratings)`);
          }
        }
      } else {
        console.warn(`Warning: No official found for application ${applicationId} in department ${application.department}. Rating saved without official attribution.`);
      }

      res.json(feedback);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get feedback by Application ID
  app.get("/api/applications/:id/feedback", async (req: Request, res: Response) => {
    try {
      const application = await storage.getApplication(req.params.id);
      let feedback;

      if (application?.officialId) {
        feedback = await storage.getFeedbackByApplicationAndOfficialId(req.params.id, application.officialId);
      }

      if (!feedback) {
        feedback = await storage.getFeedbackByApplicationId(req.params.id);
      }

      res.json(feedback || null);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get blockchain hash for an application
  app.get("/api/applications/:id/blockchain", authenticateToken, async (req: Request, res: Response) => {
    try {
      const hash = await storage.getBlockchainHash(req.params.id);
      res.json(hash);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Generate OTP endpoint - creates and sends OTP (no auth required for login/register flows)
  app.post("/api/otp/generate", async (req: Request, res: Response) => {
    try {
      console.log("[OTP Generate] Request body:", req.body);
      const data = generateOtpSchema.parse(req.body);

      // For password reset, validate that user exists
      if (data.purpose === "reset-password") {
        if (data.email) {
          const user = await storage.getUserByEmail(data.email);
          if (!user) {
            return res.status(404).json({ error: "No account found with this email address" });
          }
        } else if (data.phone) {
          const user = await storage.getUserByPhone(data.phone);
          if (!user) {
            return res.status(404).json({ error: "No account found with this phone number" });
          }
        }
      }

      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      if (data.email) {
        console.log(`[OTP Generate] Creating OTP for email: ${data.email}`);
        await storage.createOTP(data.email, "email", otp, data.purpose, expiresAt);

        try {
          await sendEmailOTP(data.email, otp, data.purpose);
          console.log(`[OTP Generate] ✅ Generated OTP for email ${data.email}: ${otp}`);
        } catch (error) {
          console.error("[OTP Generate] Failed to send email OTP:", error);
        }

        const isDev = (process.env.NODE_ENV || "development") !== "production";
        return res.json({
          message: "OTP sent to email",
          ...(isDev ? { otp } : {})
        });
      } else if (data.phone) {
        console.log(`[OTP Generate] Creating OTP for phone: ${data.phone}`);
        await storage.createOTP(data.phone, "phone", otp, data.purpose, expiresAt);

        try {
          await sendSMSOTP(data.phone, otp, data.purpose);
          console.log(`[OTP Generate] ✅ Generated OTP for phone ${data.phone}: ${otp}`);
        } catch (error) {
          console.error("[OTP Generate] Failed to send SMS OTP:", error);
        }

        const isDev = (process.env.NODE_ENV || "development") !== "production";
        return res.json({
          message: "OTP sent to phone",
          ...(isDev ? { otp } : {})
        });
      }

      console.log("[OTP Generate] ❌ No phone or email provided");
      return res.status(400).json({ error: "Phone or email is required" });
    } catch (error: any) {
      console.error("[OTP Generate] ❌ Error:", error);
      res.status(400).json({ error: error.message });
    }
  });

  // Verify OTP route
  app.post("/api/auth/verify-otp", async (req: Request, res: Response) => {
    try {
      const data = verifyOtpSchema.parse(req.body);
      let identifier = "";
      let type: "phone" | "email" = "phone";

      if (data.phone) {
        identifier = data.phone;
        type = "phone";
      } else if (data.email) {
        identifier = data.email;
        type = "email";
      } else {
        return res.status(400).json({ error: "Phone or email is required" });
      }

      console.log(`[Verify OTP] Verifying for: ${identifier} (${type}), Purpose: ${data.purpose}, OTP: ${data.otp}`);

      const record = await storage.getLatestOTPRecord(identifier, type, data.purpose || "login");

      if (!record) {
        console.log(`[Verify OTP] No record found for ${identifier} purpose=${data.purpose || "login"}`);
        // Debug: print all records for this identifier to see what's wrong
        // const allRecords = await storage.getOTP(identifier, type, data.purpose || "login"); 
        return res.status(400).json({ error: "No OTP found" });
      }

      console.log(`[Verify OTP] Found record: id=${record.id}, otp=${record.otp}, expires=${record.expiresAt}, verified=${record.verified}`);

      if (record.expiresAt < new Date()) {
        console.log(`[Verify OTP] Expired. Now: ${new Date()}, Expires: ${record.expiresAt}`);
        return res.status(400).json({ error: "OTP expired" });
      }

      if (record.otp !== data.otp.trim()) {
        console.log(`[Verify OTP] Mismatch. Expected: ${record.otp}, Got: ${data.otp.trim()}`);
        return res.status(400).json({ error: "Invalid OTP" });
      }

      await storage.verifyOTP(record.id);
      console.log(`OTP record id=${record.id} verified`);
      res.json({ message: "OTP verified successfully" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Issue JWT token after OTP verification. Client should call this after
  // receiving successful OTP verification.
  app.post("/api/auth/token", async (req: Request, res: Response) => {
    try {
      const { username, email, phone, purpose = "login" } = req.body;
      let user: User | undefined;

      if (username) {
        user = await storage.getUserByUsername(username);
      } else if (email) {
        user = await storage.getUserByEmail(email);
      } else if (phone) {
        user = await storage.getUserByPhone(phone);
      }

      if (!user) return res.status(404).json({ error: "User not found" });

      // Determine verification method based on what was passed or user data
      // If phone was passed, check phone OTP. If email/username passed, check email OTP (as per login flow).
      // However, for robustness, we should check what was actually verified.
      // The client should probably pass the identifier used for verification.

      let identifier = "";
      let type: "phone" | "email" = "phone";

      if (phone) {
        identifier = phone;
        type = "phone";
      } else if (email || username) {
        // For username login, we used email for OTP
        identifier = user.email;
        type = "email";
      }

      if (!identifier) return res.status(400).json({ error: "No verification identifier found" });

      // check latest record (may have been verified) for requested purpose
      const record = await storage.getLatestOTPRecord(identifier, type, purpose);
      if (!record || !record.verified) {
        return res.status(401).json({ error: "OTP not verified" });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      // Check if user is suspended
      const isSuspended = await storage.isUserSuspended(user.id);
      const suspendedUntil = user.suspendedUntil ? new Date(user.suspendedUntil) : null;
      const hoursRemaining = suspendedUntil && isSuspended
        ? Math.ceil((suspendedUntil.getTime() - Date.now()) / (1000 * 60 * 60))
        : 0;

      const { password, ...userWithoutPassword } = user;
      res.json({
        user: userWithoutPassword,
        token,
        suspended: isSuspended,
        suspendedUntil: user.suspendedUntil,
        hoursRemaining: hoursRemaining > 0 ? hoursRemaining : 0,
        suspensionReason: user.suspensionReason
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Password Reset endpoint - updates password after OTP verification
  app.post("/api/auth/reset-password", async (req: Request, res: Response) => {
    try {
      const { email, phone, newPassword } = req.body;

      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }

      if (!email && !phone) {
        return res.status(400).json({ error: "Email or phone number is required" });
      }

      let user: User | undefined;
      let identifier = "";
      let type: "phone" | "email" = "email";

      if (email) {
        identifier = email;
        type = "email";
        user = await storage.getUserByEmail(email);
        console.log(`[Reset Password] Looking up user by email: ${email}, found: ${user ? user.username : 'not found'}`);
      } else if (phone) {
        identifier = phone;
        type = "phone";
        user = await storage.getUserByPhone(phone);
        console.log(`[Reset Password] Looking up user by phone: ${phone}, found: ${user ? user.username : 'not found'}`);
      }

      if (!user) {
        console.log(`[Reset Password] User not found for ${type}: ${identifier}`);
        return res.status(404).json({ error: "User not found. Please verify your email or phone number." });
      }

      // Verify that OTP was verified for reset-password purpose
      const record = await storage.getLatestOTPRecord(identifier, type, "reset-password");
      if (!record || !record.verified) {
        return res.status(401).json({ error: "Please verify OTP first" });
      }

      // Hash new password and update
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateUserPassword(user.id, hashedPassword);

      res.json({
        message: "Password reset successful",
        username: user.username
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/notifications", authenticateToken, async (req: Request, res: Response) => {
    try {
      const notifications = await storage.getUserNotifications(req.user!.id);
      res.json(notifications);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/notifications/:id/read", authenticateToken, async (req: Request, res: Response) => {
    try {
      await storage.markNotificationAsRead(req.params.id);
      res.json({ message: "Notification marked as read" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- New Routes for Department & Official Management ---

  // Get all departments
  app.get("/api/departments", async (req: Request, res: Response) => {
    try {
      const departments = await storage.getAllDepartments();
      res.json(departments);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create department (Admin only - or for seeding)
  app.post("/api/departments", authenticateToken, requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const data = insertDepartmentSchema.parse(req.body);
      const department = await storage.createDepartment(data);
      res.json(department);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get officials by department
  app.get("/api/departments/:id/officials", authenticateToken, requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const department = await storage.getDepartment(req.params.id);
      if (!department) return res.status(404).json({ error: "Department not found" });

      const officials = await storage.getAllOfficials();
      const deptOfficials = officials.filter(u => {
        if (!u.department) return false;
        // Simple string match for now, assuming names match
        return u.department === department.name || u.department.startsWith(department.name);
      });

      res.json(deptOfficials);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Send warning to official
  app.post("/api/warnings", authenticateToken, requireRole("admin"), async (req: Request, res: Response) => {
    try {
      console.log("Creating warning with body:", req.body);

      // Manually extract fields to ensure no schema stripping issues
      const { officialId, message } = req.body;

      if (!officialId || !message) {
        return res.status(400).json({ error: "officialId and message are required" });
      }

      const warning = await storage.createWarning({
        officialId,
        message,
      });
      console.log("Warning created:", warning);

      // Also create a notification
      await storage.createNotification(
        officialId,
        "warning",
        "Performance Warning",
        message
      );

      res.json(warning);
    } catch (error: any) {
      console.error("Error creating warning:", error);
      res.status(400).json({ error: error.message });
    }
  });

  // Get warnings for logged-in official
  app.get("/api/warnings", authenticateToken, requireRole("official"), async (req: Request, res: Response) => {
    try {
      console.log(`Fetching warnings for official: ${req.user!.id}`);
      const warnings = await storage.getWarnings(req.user!.id);
      console.log(`Found ${warnings.length} warnings`);
      res.json(warnings);
    } catch (error: any) {
      console.error("Error fetching warnings:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Acknowledge warning
  app.post("/api/warnings/:id/acknowledge", authenticateToken, requireRole("official"), async (req: Request, res: Response) => {
    try {
      await storage.markWarningAsRead(req.params.id);
      res.json({ message: "Warning acknowledged" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Citizen marks application as solved/unsolved
  app.post("/api/applications/:id/solve", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { isSolved, rating, comment } = req.body;
      const app = await storage.getApplication(req.params.id);

      if (!app) return res.status(404).json({ error: "Application not found" });
      if (app.citizenId !== req.user!.id) return res.status(403).json({ error: "Unauthorized" });

      if (isSolved) {
        // Mark as solved
        await storage.markApplicationSolved(app.id, true);

        // Handle Rating - ensure rating goes to the official who handled this department
        if (rating) {
          // Determine which official should receive this rating
          let targetOfficialId = app.officialId;

          // If no official is assigned but department exists, find an official from that department
          if (!targetOfficialId && app.department) {
            const allOfficials = await storage.getAllOfficials();
            const normalizedDept = app.department.split('–')[0].trim();

            let deptOfficials = allOfficials.filter(u => {
              if (!u.department) return false;
              const uDept = u.department.split('–')[0].trim();
              return uDept === normalizedDept;
            });

            // If sub-department exists, prefer officials with matching sub-department
            if (app.subDepartment && deptOfficials.length > 0) {
              const subDeptOfficials = deptOfficials.filter(u =>
                u.subDepartment === app.subDepartment
              );
              if (subDeptOfficials.length > 0) {
                deptOfficials = subDeptOfficials;
              }
            }

            if (deptOfficials.length > 0) {
              targetOfficialId = deptOfficials[0].id;
            }
          }

          if (targetOfficialId) {
            // Check if already rated
            const existingFeedback = await storage.getFeedbackByApplicationAndOfficialId(app.id, targetOfficialId);
            if (existingFeedback) {
              // Update existing feedback
              await storage.updateFeedback(existingFeedback.id, rating, comment);
            } else {
              // Create new feedback
              await storage.createFeedback({
                applicationId: app.id,
                citizenId: req.user!.id,
                officialId: targetOfficialId,
                rating: rating,
                comment: comment
              });
            }

            // Update Official Rating (Recalculate for both create and update)
            const official = await storage.getUser(targetOfficialId);
            if (official) {
              const allRatings = await storage.getOfficialRatings(official.id);
              if (allRatings.length > 0) {
                const totalRating = allRatings.reduce((sum, r) => sum + r.rating, 0);
                const avgRating = totalRating / allRatings.length;

                await storage.updateUserStats(
                  official.id,
                  avgRating,
                  (official.solvedCount || 0) + 1,
                  official.assignedCount || 0
                );
              }
            }
          }
        }

        res.json({ message: "Application marked as solved" });

      } else {
        // Not Solved -> Rate previous official (if provided), then Escalate
        const currentLevel = app.escalationLevel || 0;
        const nextLevel = currentLevel + 1;

        // Handle Rating for the previous official - ensure rating goes to the official who handled this department
        let ratingSaved = false;
        if (rating) {
          try {
            // Determine which official should receive this rating
            let targetOfficialId = app.officialId;

            // If no official is assigned but department exists, find an official from that department
            if (!targetOfficialId && app.department) {
              const allOfficials = await storage.getAllOfficials();
              const normalizedDept = app.department.split('–')[0].trim();

              let deptOfficials = allOfficials.filter(u => {
                if (!u.department) return false;
                const uDept = u.department.split('–')[0].trim();
                return uDept === normalizedDept;
              });

              // If sub-department exists, prefer officials with matching sub-department
              if (app.subDepartment && deptOfficials.length > 0) {
                const subDeptOfficials = deptOfficials.filter(u =>
                  u.subDepartment === app.subDepartment
                );
                if (subDeptOfficials.length > 0) {
                  deptOfficials = subDeptOfficials;
                }
              }

              if (deptOfficials.length > 0) {
                targetOfficialId = deptOfficials[0].id;
              }
            }

            if (targetOfficialId) {
              const existingFeedback = await storage.getFeedbackByApplicationAndOfficialId(app.id, targetOfficialId);
              if (existingFeedback) {
                await storage.updateFeedback(existingFeedback.id, rating, comment);
              } else {
                await storage.createFeedback({
                  applicationId: app.id,
                  citizenId: req.user!.id,
                  officialId: targetOfficialId,
                  rating: rating,
                  comment: comment
                });
              }
              ratingSaved = true;

              // Update Official Rating
              const official = await storage.getUser(targetOfficialId);
              if (official) {
                const allRatings = await storage.getOfficialRatings(official.id);
                if (allRatings.length > 0) {
                  const totalRating = allRatings.reduce((sum, r) => sum + r.rating, 0);
                  const avgRating = totalRating / allRatings.length;

                  await storage.updateUserStats(
                    official.id,
                    avgRating,
                    official.solvedCount || 0, // Don't increment solvedCount for "Not Solved"
                    official.assignedCount || 0
                  );
                }
              }
            }
          } catch (ratingError: any) {
            console.error('Error saving rating:', ratingError);
            // Continue with escalation even if rating fails
          }
        }

        // Now escalate and reassign
        try {
          if (app.department && typeof app.department === 'string') {
            // Ensure subDepartment is a string or null
            const subDept = (app.subDepartment && typeof app.subDepartment === 'string' && app.subDepartment.trim()) ? app.subDepartment.trim() : null;
            const dept = app.department.trim();
            const newOfficial = await autoAssignApplication(app.id, dept, subDept, nextLevel);
            if (newOfficial) {
              res.json({
                message: ratingSaved ? "Your feedback has been recorded. Application escalated and reassigned" : "Application escalated and reassigned",
                official: newOfficial.officialName,
                ratingSubmitted: ratingSaved
              });
            } else {
              res.json({
                message: ratingSaved ? "Your feedback has been recorded. Application escalated but no new official found. Pending assignment." : "Application escalated but no new official found. Pending assignment.",
                ratingSubmitted: ratingSaved
              });
            }
          } else {
            // Rating was saved successfully, but escalation failed due to missing department
            res.json({
              message: ratingSaved ? "Your feedback has been recorded successfully. Application will be reviewed." : "Application will be reviewed.",
              ratingSubmitted: ratingSaved
            });
          }
        } catch (escalationError: any) {
          // Rating was saved successfully, but escalation encountered an error
          console.error('Error during escalation after rating:', escalationError);
          res.json({
            message: ratingSaved ? "Your feedback has been recorded successfully. Application escalation encountered an issue but your rating was saved." : "Application escalation encountered an issue.",
            ratingSubmitted: ratingSaved,
            warning: ratingSaved ? "Please contact support if the application status doesn't update." : undefined
          });
        }
      }

    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/users/officials", authenticateToken, requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const officials = await storage.getAllOfficials();
      res.json(officials);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get user by ID (for displaying citizen information)
  app.get("/api/users/:id", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      // Don't send password in response
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });



  // Get official's rating stats
  app.get("/api/officials/:id/rating", authenticateToken, async (req: Request, res: Response) => {
    try {
      const feedbacks = await storage.getOfficialRatings(req.params.id);

      if (feedbacks.length === 0) {
        return res.json({ averageRating: 0, totalRatings: 0 });
      }

      const totalRating = feedbacks.reduce((sum, f) => sum + f.rating, 0);
      const averageRating = totalRating / feedbacks.length;

      res.json({
        averageRating: Number(averageRating.toFixed(1)),
        totalRatings: feedbacks.length,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get official's detailed stats (for admin)
  app.get("/api/officials/:id/stats", authenticateToken, requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const official = await storage.getUser(req.params.id);
      if (!official || official.role !== "official") {
        return res.status(404).json({ error: "Official not found" });
      }

      const applications = await storage.getOfficialApplications(req.params.id);
      const warnings = await storage.getWarnings(req.params.id);

      const approved = applications.filter(app => app.status === "Approved").length;
      const rejected = applications.filter(app => app.status === "Rejected").length;
      const solved = applications.filter(app => app.isSolved).length;
      const assigned = applications.length;

      res.json({
        approved,
        rejected,
        solved,
        assigned,
        pending: applications.filter(app => ["Assigned", "In Progress"].includes(app.status)).length,
        warningsSent: warnings.length,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get department rating for admin (based on citizen feedback)
  app.get("/api/admin/department-rating", authenticateToken, requireRole("admin"), async (req: Request, res: Response) => {
    try {
      console.log("[Department Rating] Request from user:", req.user?.username);

      const admin = await storage.getUser(req.user!.id);
      console.log("[Department Rating] Admin found:", admin?.fullName, "Department:", admin?.department);

      if (!admin || !admin.department) {
        console.log("[Department Rating] No department assigned");
        return res.json({
          averageRating: 0,
          totalRatings: 0,
          officialCount: 0,
        });
      }

      // Get all officials in the admin's department
      const allOfficials = await storage.getAllOfficials();
      console.log("[Department Rating] Total officials in system:", allOfficials.length);

      const normalizedAdminDept = admin.department.split('–')[0].trim();
      console.log("[Department Rating] Normalized admin dept:", normalizedAdminDept);

      const deptOfficials = allOfficials.filter(official => {
        if (!official.department) return false;
        const officialDept = official.department.split('–')[0].trim();
        return officialDept === normalizedAdminDept;
      });

      console.log("[Department Rating] Officials in department:", deptOfficials.length);

      if (deptOfficials.length === 0) {
        console.log("[Department Rating] No officials found, returning 0");
        return res.json({
          averageRating: 0,
          totalRatings: 0,
          officialCount: 0,
        });
      }

      // Get all citizen feedback ratings for officials in this department
      let allRatings: number[] = [];
      for (const official of deptOfficials) {
        const feedbacks = await storage.getOfficialRatings(official.id);
        console.log(`[Department Rating] Official ${official.fullName}: ${feedbacks.length} ratings`);
        allRatings.push(...feedbacks.map(f => f.rating));
      }

      console.log("[Department Rating] Total ratings collected:", allRatings.length);

      // Calculate average rating
      const averageRating = allRatings.length > 0
        ? Number((allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length).toFixed(1))
        : 0;

      console.log("[Department Rating] Average rating:", averageRating);

      const result = {
        averageRating,
        totalRatings: allRatings.length,
        officialCount: deptOfficials.length,
      };

      console.log("[Department Rating] Sending response:", result);
      res.json(result);
    } catch (error: any) {
      console.error("[Department Rating] Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get department stats for admin
  app.get("/api/admin/department-stats", authenticateToken, requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const admin = await storage.getUser(req.user!.id);
      if (!admin || !admin.department) {
        return res.status(400).json({ error: "Admin has no department assigned" });
      }

      const allApps = await storage.getAllApplications();

      // Filter by department
      const normalizedDept = admin.department.split('–')[0].trim();
      const deptApps = allApps.filter(app => {
        if (!app.department) return false;
        const appDept = app.department.split('–')[0].trim();
        return appDept === normalizedDept;
      });

      // Only count first-time applications (escalationLevel === 0)
      const firstTimeApps = deptApps.filter(app => app.escalationLevel === 0);

      const assignedCount = deptApps.filter(app => app.status === "Assigned").length;
      const approvedCount = deptApps.filter(app => app.status === "Approved" || app.status === "Auto-Approved").length;
      const rejectedCount = deptApps.filter(app => app.status === "Rejected").length;
      const pendingCount = deptApps.filter(app => ["Submitted", "Assigned", "In Progress"].includes(app.status)).length;

      // Count solved and unsolved applications
      // Solved: applications that are approved/auto-approved and marked as solved
      const solvedCount = deptApps.filter(app =>
        (app.status === "Approved" || app.status === "Auto-Approved") && app.isSolved === true
      ).length;

      // Unsolved: applications that are approved/auto-approved but not marked as solved, or rejected
      const unsolvedCount = deptApps.filter(app =>
        ((app.status === "Approved" || app.status === "Auto-Approved") && (app.isSolved === false || app.isSolved === null)) ||
        app.status === "Rejected"
      ).length;

      // Count warnings sent to officials in this department
      const allOfficials = await storage.getAllOfficials();
      const deptOfficials = allOfficials.filter(o =>
        o.department &&
        o.department.split('–')[0].trim() === normalizedDept
      );

      let warningsSentCount = 0;
      for (const official of deptOfficials) {
        const warnings = await storage.getWarnings(official.id);
        warningsSentCount += warnings.length;
      }

      res.json({
        totalApplications: firstTimeApps.length,
        assignedCount,
        approvedCount,
        rejectedCount,
        pendingCount,
        solvedCount,
        unsolvedCount,
        warningsSent: warningsSentCount,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get department details (officials, applications, stats) - for admin dashboard
  app.get("/api/admin/department/:departmentName", authenticateToken, requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const departmentName = decodeURIComponent(req.params.departmentName);
      const normalizedDept = departmentName.split('–')[0].trim();

      // Get all applications for this department
      const allApps = await storage.getAllApplications();
      const deptApps = allApps.filter(app => {
        if (!app.department) return false;
        const appDept = app.department.split('–')[0].trim();
        return appDept === normalizedDept;
      });

      // Get all officials in this department
      const allOfficials = await storage.getAllOfficials();
      const deptOfficials = allOfficials.filter(o => {
        if (!o.department) return false;
        const oDept = o.department.split('–')[0].trim();
        return oDept === normalizedDept;
      });

      // Calculate stats
      const firstTimeApps = deptApps.filter(app => app.escalationLevel === 0);
      const solvedApps = deptApps.filter(app =>
        (app.status === "Approved" || app.status === "Auto-Approved") && app.isSolved === true
      );
      const pendingApps = deptApps.filter(app =>
        ["Submitted", "Assigned", "In Progress"].includes(app.status)
      );
      const approvedApps = deptApps.filter(app =>
        app.status === "Approved" || app.status === "Auto-Approved"
      );
      const rejectedApps = deptApps.filter(app => app.status === "Rejected");

      // Get officials with their stats
      const officialsWithStats = await Promise.all(
        deptOfficials.map(async (official) => {
          const officialApps = deptApps.filter(app => app.officialId === official.id);
          const solved = officialApps.filter(app =>
            (app.status === "Approved" || app.status === "Auto-Approved") && app.isSolved === true
          ).length;
          const pending = officialApps.filter(app =>
            ["Submitted", "Assigned", "In Progress"].includes(app.status)
          ).length;
          const total = officialApps.length;

          return {
            ...official,
            solvedCount: solved,
            pendingCount: pending,
            totalCount: total,
          };
        })
      );

      res.json({
        department: departmentName,
        officials: officialsWithStats,
        stats: {
          totalApplications: firstTimeApps.length,
          solved: solvedApps.length,
          pending: pendingApps.length,
          approved: approvedApps.length,
          rejected: rejectedApps.length,
        },
        applications: {
          solved: solvedApps,
          pending: pendingApps,
        },
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get department ratings and overall website rating based on citizen feedback (public endpoint)
  app.get("/api/public/ratings", async (req: Request, res: Response) => {
    try {
      // Fetch all departments from the database
      const allDepartments = await storage.getAllDepartments();
      const allOfficials = await storage.getAllOfficials();

      // Calculate ratings for each department based on citizen feedback
      const departmentRatingsArray = await Promise.all(
        allDepartments.map(async (dept) => {
          // Get all officials belonging to this department
          const deptOfficials = allOfficials.filter((official) => {
            if (!official.department) return false;
            const officialDept = official.department.trim();
            const deptName = dept.name.trim();
            return officialDept === deptName || officialDept.startsWith(deptName) || deptName.startsWith(officialDept.split('–')[0].trim());
          });

          if (deptOfficials.length === 0) {
            return {
              department_id: dept.id,
              department_name: dept.name,
              averageRating: 0,
              totalRatings: 0,
              officialCount: 0,
            };
          }

          // Get all feedback ratings for officials in this department
          let allRatings: number[] = [];
          for (const official of deptOfficials) {
            const feedbacks = await storage.getOfficialRatings(official.id);
            allRatings.push(...feedbacks.map(f => f.rating));
          }

          // Calculate average rating for the department
          const averageRating = allRatings.length > 0
            ? Number((allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length).toFixed(1))
            : 0;

          return {
            department_id: dept.id,
            department_name: dept.name,
            averageRating,
            totalRatings: allRatings.length,
            officialCount: deptOfficials.length,
          };
        })
      );

      // Sort by department_name in ascending order
      departmentRatingsArray.sort((a, b) => a.department_name.localeCompare(b.department_name));

      // Calculate overall website rating (average of all citizen ratings)
      const allRatings = departmentRatingsArray.reduce((acc, dept) => acc + dept.totalRatings, 0);
      const totalRatingSum = departmentRatingsArray.reduce((acc, dept) =>
        acc + (dept.averageRating * dept.totalRatings), 0
      );
      const websiteRating = allRatings > 0
        ? Number((totalRatingSum / allRatings).toFixed(1))
        : 0;

      res.json({
        websiteRating,
        totalRatings: allRatings,
        departments: departmentRatingsArray,
      });
    } catch (error: any) {
      console.error("Error fetching public ratings:", error);
      res.status(500).json({ error: error.message });
    }
  });

  setInterval(async () => {
    try {
      await aiService.checkDelays();
    } catch (error) {
      console.error("AI monitoring error:", error);
    }
  }, 60 * 60 * 1000);

  // Clear all data endpoint (for development/testing - use with caution!)
  app.post("/api/admin/clear-all-data", async (req: Request, res: Response) => {
    try {
      console.log("⚠️  Clearing all data as requested...");
      await storage.clearAllData();
      res.json({ message: "All data cleared successfully" });
    } catch (error: any) {
      console.error("Error clearing data:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Judiciary System Routes
  app.get("/api/judiciary/judges", async (req: Request, res: Response) => {
    try {
      const allJudges = await storage.getAllJudges();
      res.json(allJudges);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/judiciary/cases", async (req: Request, res: Response) => {
    try {
      const allCases = await storage.getAllCases();
      res.json(allCases);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/judiciary/my-cases", authenticateToken, async (req: Request, res: Response) => {
    try {
      const cases = await storage.getCasesByCitizenId(req.user!.id);
      res.json(cases);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/judiciary/allocate", async (req: Request, res: Response) => {
    try {
      // 1. Fetch pending cases and available judges
      const pendingCases = await storage.getPendingCases();
      const availableJudges = await storage.getAvailableJudges();

      if (pendingCases.length === 0) {
        return res.json({ message: "No pending cases to allocate", allocations: [] });
      }

      if (availableJudges.length === 0) {
        return res.status(400).json({ error: "No available judges for allocation" });
      }

      const allocations: any[] = [];

      // 2. AI Allocation Logic (Simulated)
      // Iterate through pending cases and assign to the best matching judge
      for (const caseItem of pendingCases) {
        // Filter judges by specialization matching case type (e.g., Criminal -> Criminal Law)
        // For simplicity, we'll assume broad matching or random assignment for now
        // In a real system, this would use ML models to match case complexity with judge expertise

        // Simple Load Balancing: Pick judge with fewest active cases (simulated by 'casesSolved' for now, or random)
        // Let's pick a random available judge for "Blind Allocation"
        const randomJudgeIndex = Math.floor(Math.random() * availableJudges.length);
        const selectedJudge = availableJudges[randomJudgeIndex];

        // Assign
        await storage.assignCaseToJudge(caseItem.id, selectedJudge.id);

        // Update local list to reflect changes (optional, for next iteration if we were tracking load locally)

        allocations.push({
          caseId: caseItem.id,
          caseTitle: caseItem.title,
          judgeId: selectedJudge.id,
          judgeName: selectedJudge.name
        });
      }

      res.json({ message: "Allocation completed", allocations });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/judiciary/file-case", authenticateToken, async (req: Request, res: Response) => {
    try {
      const data = insertCaseSchema.parse(req.body);

      // 1. Simulate Token Fee Check (Anti-Spam Cost)
      // In production: await paymentGateway.verifyTransaction(req.body.paymentId)
      // For SIH: We simulate this as always true, but in a real app, this fee prevents mass-spamming.
      const isFeePaid = true;
      if (!isFeePaid) {
        return res.status(402).json({ error: "Case filing fee not paid" });
      }

      // 2. AI Pre-Check (Enhanced Validation)
      // Check for basic requirements and context
      const wordCount = data.description.split(" ").length;
      if (wordCount < 10) {
        return res.status(400).json({ error: "Case description is too short (min 10 words). Please provide more details." });
      }

      // Basic NLP Keyword Check (Simulated)
      // Ensure the description actually sounds like a legal matter
      const legalKeywords = ["court", "judge", "claim", "dispute", "rights", "petition", "appeal", "contract", "property", "crime", "illegal", "fraud", "damage", "agreement"];
      const hasLegalContext = legalKeywords.some(keyword => data.description.toLowerCase().includes(keyword));

      if (!hasLegalContext && wordCount < 30) {
        // If it's short and has no legal keywords, flag it.
        // If it's long (>30 words), we give it the benefit of doubt in this simple check.
        return res.status(400).json({ error: "AI Validation Failed: Description does not appear to contain relevant legal context. Please verify your details." });
      }

      // 3. Faceless Scrutiny Allocation
      const citizen = await storage.getUser(req.user!.id);
      if (!citizen) return res.status(404).json({ error: "Citizen not found" });

      let scrutinyOfficialId: string | undefined = undefined;
      // If citizen has a district, find an official from a DIFFERENT district
      if (citizen.district) {
        const scrutinyOfficial = await storage.findScrutinyOfficial(citizen.district);
        if (scrutinyOfficial) {
          scrutinyOfficialId = scrutinyOfficial.id;
        }
      } else {
        // Fallback if no district: assign any official or handle as generic
        // For now, we'll try to find *any* official if district is missing
        const scrutinyOfficial = await storage.findScrutinyOfficial("NON_EXISTENT_DISTRICT");
        if (scrutinyOfficial) {
          scrutinyOfficialId = scrutinyOfficial.id;
        }
      }

      const citizenId = req.user!.id;
      const newCase = await storage.createCase(data, citizenId, {
        scrutinyOfficialId,
        filingDistrict: citizen.district || undefined
      });

      // Update official's assigned count if assigned
      if (scrutinyOfficialId) {
        const official = await storage.getUser(scrutinyOfficialId);
        if (official) {
          await storage.updateUserStats(
            official.id,
            official.rating || 0,
            official.solvedCount || 0,
            (official.assignedCount || 0) + 1
          );
        }
      }

      res.json(newCase);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Scrutiny Tasks for Officials
  app.get("/api/judiciary/scrutiny-tasks", authenticateToken, requireRole("official"), async (req: Request, res: Response) => {
    try {
      const cases = await storage.getScrutinyCasesForOfficial(req.user!.id);

      // SANITIZATION: Explicitly exclude citizenId
      const sanitizedCases = cases.map(c => ({
        id: c.id,
        title: c.title,
        description: c.description,
        type: c.type,
        status: c.status,
        priority: c.priority,
        caseNumber: c.caseNumber,
        filingDate: c.filedDate,
        filingDistrict: c.filingDistrict,
        scrutinyOfficialId: c.scrutinyOfficialId,
        isAnonymized: true
      }));

      res.json(sanitizedCases);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/judiciary/case/:id/scrutiny-decision", authenticateToken, requireRole("official"), async (req: Request, res: Response) => {
    try {
      const { status, reason } = req.body;
      const caseItem = await storage.getCase(req.params.id);

      if (!caseItem) return res.status(404).json({ error: "Case not found" });
      if (caseItem.scrutinyOfficialId !== req.user!.id) {
        return res.status(403).json({ error: "Not authorized to review this case" });
      }

      // Update case status
      const updatedCase = await storage.updateCaseStatus(req.params.id, status, reason);

      // If approved (Pending), maybe notify citizen? (Out of scope for now)
      // If rejected, maybe notify citizen?

      res.json(updatedCase);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/judiciary/auto-schedule", async (req: Request, res: Response) => {
    try {
      const { caseId } = req.body;
      if (!caseId) return res.status(400).json({ error: "Case ID is required" });

      const hearing = await storage.assignNextDate(caseId);
      res.json(hearing);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/judiciary/performance/:judgeId", async (req: Request, res: Response) => {
    try {
      const judge = await storage.getJudgePerformance(req.params.judgeId);
      res.json(judge);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  });

  app.get("/api/judiciary/hearings/:caseId", async (req: Request, res: Response) => {
    try {
      const hearings = await storage.getHearingsByCaseId(req.params.caseId);
      res.json(hearings);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/judiciary/cases/:id", authenticateToken, async (req: Request, res: Response) => {
    try {
      const caseItem = await storage.getCase(req.params.id);
      if (!caseItem) return res.status(404).json({ error: "Case not found" });
      res.json(caseItem);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Set up daily cron job for automatic priority updates
  // Runs every day at 2:00 AM
  cron.schedule("0 2 * * *", async () => {
    try {
      console.log("🔄 Running daily priority update job...");
      await storage.updateApplicationPriorities();
      console.log("✅ Daily priority update completed");
    } catch (error: any) {
      console.error("❌ Error in daily priority update job:", error);
    }
  }, {
    timezone: "Asia/Kolkata" // Adjust timezone as needed
  });

  // Also run immediately on startup to update any stale priorities
  setTimeout(async () => {
    try {
      console.log("🔄 Running initial priority update on startup...");
      await storage.updateApplicationPriorities();
      console.log("✅ Initial priority update completed");
    } catch (error: any) {
      console.error("❌ Error in initial priority update:", error);
    }
  }, 5000); // Wait 5 seconds after server starts

  // AI Investigation Engine Cron Job (Runs every 6 hours)
  cron.schedule("0 */6 * * *", async () => {
    try {
      console.log("🕵️‍♂️ Running scheduled AI Investigation scan...");
      await investigationEngine.runFullInvestigation();
    } catch (error) {
      console.error("❌ Error in AI Investigation scan:", error);
    }
  }, {
    timezone: "Asia/Kolkata"
  });

  // Manual Trigger for Investigation (Admin Only)
  app.post("/api/admin/investigation/run", authenticateToken, requireRole("admin"), async (req: Request, res: Response) => {
    try {
      // Run asynchronously to not block
      investigationEngine.runFullInvestigation().catch(err => console.error(err));
      res.json({ message: "Investigation initiated. Alerts will be generated if suspicious activity is found." });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
