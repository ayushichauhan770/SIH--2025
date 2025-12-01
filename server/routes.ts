import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { loginSchema, insertUserSchema, insertApplicationSchema, updateApplicationStatusSchema, insertFeedbackSchema, verifyOtpSchema, generateOtpSchema, insertDepartmentSchema, insertWarningSchema } from "@shared/schema";
import type { User, Application } from "@shared/schema";
import { sendEmailOTP, verifyEmailConfig } from "./email-service";
import { sendSMSOTP } from "./sms-service";

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

async function autoAssignApplication(applicationId: string, departmentName: string, escalationLevel: number = 0) {
  const officials = await storage.getAllOfficials();

  // 1. Filter by Department
  // Normalize department names (handle "Health – Ministry..." vs "Health")
  const deptOfficials = officials.filter(u => {
    if (!u.department) return false;
    const uDept = u.department.split('–')[0].trim();
    const appDept = departmentName.split('–')[0].trim();
    return uDept === appDept;
  });

  if (deptOfficials.length === 0) {
    console.log(`No officials available for department: ${departmentName}`);
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
    // 4. Assign
    await storage.assignApplication(applicationId, bestOfficial.id);

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
      officialName: bestOfficial.fullName,
      department: bestOfficial.department,
      workloadStats: {
        active: bestOfficial.activeWorkload,
        total: bestOfficial.totalAssigned
      },
      assignedAt: new Date()
    };
  }

  return null;
}

export async function registerRoutes(app: Express): Promise<Server> {
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
      const data = insertUserSchema.parse(req.body);

      // Validate role
      if (data.role && !["citizen", "official", "admin"].includes(data.role)) {
        return res.status(400).json({ error: "Invalid role selected" });
      }

      // Verify Secret Key for Official and Admin
      if (data.role === "official") {
        const { secretKey } = req.body;
        if (secretKey !== "official@2025") {
          return res.status(403).json({ error: "Invalid Secret Key for Official registration" });
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

        const { password, ...userWithoutPassword } = user;
        return res.json({
          user: userWithoutPassword,
          phone: user.phone,
          otpMethod: "phone",
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

        const { password, ...userWithoutPassword } = user;
        return res.json({
          user: userWithoutPassword,
          email: user.email,
          otpMethod: "email",
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
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/applications", authenticateToken, async (req: Request, res: Response) => {
    try {
      const data = insertApplicationSchema.parse(req.body);
      const application = await storage.createApplication({
        ...data,
        citizenId: req.user!.id,
      });

      // Auto-assignment disabled to keep applications in unassigned pool
      // Applications will remain visible to all department officials until manually assigned
      // let assignmentResult = null;
      // if (application.department) {
      //   assignmentResult = await autoAssignApplication(application.id, application.department, 0);
      //   if (assignmentResult) {
      //     console.log(`✅ Auto-assigned application ${application.id} to ${assignmentResult.officialName}`);
      //     console.log(`   Stats - Active: ${assignmentResult.workloadStats.active}, Total: ${assignmentResult.workloadStats.total}`);
      //   } else {
      //     console.warn(`⚠️ Could not auto-assign application ${application.id} - no matching officials in ${application.department}`);
      //   }
      // }

      // Return application
      res.json(application);
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
        // For officials: return both unassigned applications in their department AND their assigned applications
        const user = await storage.getUser(req.user!.id);
        if (!user || !user.department) {
          return res.status(400).json({ error: "Official has no department assigned" });
        }

        // Get unassigned applications for the department
        const unassignedApps = await storage.getUnassignedApplicationsByDepartment(user.department);

        // Get applications assigned to this official
        const assignedApps = await storage.getOfficialApplications(req.user!.id);

        // Fetch ratings for assigned applications
        const assignedAppsWithRatings = await Promise.all(assignedApps.map(async (app) => {
          const feedback = await storage.getFeedbackByApplicationAndOfficialId(app.id, req.user!.id);
          return { ...app, rating: feedback?.rating };
        }));

        // Combine both lists (remove duplicates if any)
        const appMap = new Map<string, any>();
        unassignedApps.forEach(app => appMap.set(app.id, app));
        assignedAppsWithRatings.forEach(app => appMap.set(app.id, app));

        applications = Array.from(appMap.values())
          .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
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

  app.post("/api/applications/:id/feedback", authenticateToken, async (req: Request, res: Response) => {
    try {
      const application = await storage.getApplication(req.params.id);
      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }

      const data = insertFeedbackSchema.parse(req.body);
      const feedback = await storage.createFeedback({
        ...data,
        applicationId: req.params.id,
        citizenId: req.user!.id,
        officialId: application.officialId, // Include the official who handled the application
      });
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

      const data = insertFeedbackSchema.parse({
        applicationId,
        citizenId: req.user!.id,
        officialId: application.officialId,
        rating,
        comment,
      });

      const feedback = await storage.createFeedback(data);

      // Update Official Rating
      if (application.officialId) {
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

  // Generate OTP endpoint - creates and sends OTP
  app.post("/api/otp/generate", authenticateToken, async (req: Request, res: Response) => {
    try {
      const data = generateOtpSchema.parse(req.body);
      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      if (data.email) {
        await storage.createOTP(data.email, "email", otp, data.purpose, expiresAt);

        try {
          await sendEmailOTP(data.email, otp, data.purpose);
          console.log(`Generated OTP for email ${data.email}: ${otp}`);
        } catch (error) {
          console.error("Failed to send email OTP:", error);
        }

        const isDev = (process.env.NODE_ENV || "development") !== "production";
        return res.json({
          message: "OTP sent to email",
          ...(isDev ? { otp } : {})
        });
      } else if (data.phone) {
        await storage.createOTP(data.phone, "phone", otp, data.purpose, expiresAt);

        try {
          await sendSMSOTP(data.phone, otp, data.purpose);
          console.log(`Generated OTP for phone ${data.phone}: ${otp}`);
        } catch (error) {
          console.error("Failed to send SMS OTP:", error);
        }

        const isDev = (process.env.NODE_ENV || "development") !== "production";
        return res.json({
          message: "OTP sent to phone",
          ...(isDev ? { otp } : {})
        });
      }

      return res.status(400).json({ error: "Phone or email is required" });
    } catch (error: any) {
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

      const { password, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword, token });
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

      let user: User | undefined;
      let identifier = "";
      let type: "phone" | "email" = "email";

      if (email) {
        user = await storage.getUserByEmail(email);
        identifier = email;
        type = "email";
      } else if (phone) {
        user = await storage.getUserByPhone(phone);
        identifier = phone;
        type = "phone";
      }

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Verify that OTP was verified for reset-password purpose
      const record = await storage.getLatestOTPRecord(identifier, type, "reset-password");
      if (!record || !record.verified) {
        return res.status(401).json({ error: "Please verify OTP first" });
      }

      // Hash new password and update
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateUserPassword(user.id, hashedPassword);

      res.json({ message: "Password reset successful" });
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

        // Handle Rating
        if (rating && app.officialId) {
          // Check if already rated
          // Check if already rated
          const existingFeedback = await storage.getFeedbackByApplicationAndOfficialId(app.id, app.officialId);
          if (existingFeedback) {
            // Update existing feedback
            await storage.updateFeedback(existingFeedback.id, rating, comment);
          } else {
            // Create new feedback
            await storage.createFeedback({
              applicationId: app.id,
              citizenId: req.user!.id,
              officialId: app.officialId,
              rating: rating,
              comment: comment
            });
          }

          // Update Official Rating (Recalculate for both create and update)
          const official = await storage.getUser(app.officialId);
          if (official) {
            const allRatings = await storage.getOfficialRatings(official.id);
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

        res.json({ message: "Application marked as solved" });

      } else {
        // Not Solved -> Rate previous official (if provided), then Escalate
        const currentLevel = app.escalationLevel || 0;
        const nextLevel = currentLevel + 1;

        // Handle Rating for the previous official
        // Handle Rating for the previous official
        if (rating && app.officialId) {
          const existingFeedback = await storage.getFeedbackByApplicationAndOfficialId(app.id, app.officialId);
          if (existingFeedback) {
            await storage.updateFeedback(existingFeedback.id, rating, comment);
          } else {
            await storage.createFeedback({
              applicationId: app.id,
              citizenId: req.user!.id,
              officialId: app.officialId,
              rating: rating,
              comment: comment
            });
          }

          // Update Official Rating
          const official = await storage.getUser(app.officialId);
          if (official) {
            const allRatings = await storage.getOfficialRatings(official.id);
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

        // Now escalate and reassign
        if (app.department) {
          const newOfficial = await autoAssignApplication(app.id, app.department, nextLevel);
          if (newOfficial) {
            res.json({ message: "Application escalated and reassigned", official: newOfficial.officialName });
          } else {
            res.json({ message: "Application escalated but no new official found. Pending assignment." });
          }
        } else {
          res.status(400).json({ error: "Application has no department" });
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

      res.json({
        totalApplications: firstTimeApps.length,
        assignedCount,
        approvedCount,
        rejectedCount,
        pendingCount,
      });
    } catch (error: any) {
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

  const httpServer = createServer(app);
  return httpServer;
}
