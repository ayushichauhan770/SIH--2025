import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { loginSchema, insertUserSchema, insertApplicationSchema, updateApplicationStatusSchema, insertFeedbackSchema, verifyOtpSchema, generateOtpSchema } from "@shared/schema";
import type { User } from "@shared/schema";
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
  app.post("/api/applications", authenticateToken, async (req: Request, res: Response) => {
    try {
      const data = insertApplicationSchema.parse(req.body);
      const application = await storage.createApplication({
        ...data,
        citizenId: req.user!.id,
      });
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
        applications = await storage.getOfficialApplications(req.user!.id);
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

  app.post("/api/applications/:id/assign", authenticateToken, requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { officialId } = req.body;
      const application = await storage.assignApplication(req.params.id, officialId);
      res.json(application);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/applications/:id/feedback", authenticateToken, async (req: Request, res: Response) => {
    try {
      const data = insertFeedbackSchema.parse(req.body);
      const feedback = await storage.createFeedback({
        ...data,
        applicationId: req.params.id,
        citizenId: req.user!.id,
      });
      res.json(feedback);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/applications/:id/feedback", async (req: Request, res: Response) => {
    try {
      const feedback = await storage.getFeedbackByApplicationId(req.params.id);
      res.json(feedback);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
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

      const record = await storage.getLatestOTPRecord(identifier, type, data.purpose);
      if (!record) {
        return res.status(400).json({ error: "No OTP record found" });
      }


      if (record.expiresAt < new Date()) {
        return res.status(400).json({ error: "OTP expired" });
      }

      if (record.otp !== data.otp.trim()) {
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

  app.get("/api/users/officials", authenticateToken, requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const officials = await storage.getAllOfficials();
      res.json(officials);
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
