import { users, applications, applicationHistory, applicationLocationHistory, feedback, otpRecords, notifications, departments, warnings, judges, cases, hearings } from "@shared/schema";
import type {
  User,
  InsertUser,
  Application,
  InsertApplication,
  ApplicationHistory,
  ApplicationLocationHistory,
  Feedback,
  InsertFeedback,
  OTPRecord,
  BlockchainHash,
  Notification,
  Department,
  InsertDepartment,
  Warning,
  InsertWarning,
  Judge,
  InsertJudge,
  Case,
  InsertCase,
  Hearing,
  InsertHearing,
  AiRoutingLog,
  InsertAiRoutingLog,
  FileTimeline,
  InsertFileTimeline
} from "@shared/schema";
import { randomUUID, createHash } from "crypto";
import fs from "fs";
import path from "path";
import { DatabaseStorage } from "./db_storage";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  getUserByAadhar(aadharNumber: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPassword(id: string, password: string): Promise<void>;
  createApplication(app: InsertApplication): Promise<Application>;
  getApplication(id: string): Promise<Application | undefined>;
  getApplicationByTrackingId(trackingId: string): Promise<Application | undefined>;

  getUserApplications(citizenId: string): Promise<Application[]>;
  getOfficialApplications(officialId?: string): Promise<Application[]>;
  getUnassignedApplicationsByDepartment(department: string): Promise<Application[]>;
  getAllOfficials(): Promise<User[]>;
  getAllAdmins(): Promise<User[]>;
  getAllApplications(): Promise<Application[]>;
  updateApplicationStatus(id: string, status: string, updatedBy: string, comment?: string): Promise<Application>;
  assignApplication(id: string, officialId: string): Promise<Application>;
  getOfficialCurrentWorkload(officialId: string): Promise<number>;
  getLastAssignmentTime(officialId: string): Promise<Date | null>;

  addApplicationHistory(applicationId: string, status: string, updatedBy: string, comment?: string): Promise<ApplicationHistory>;
  getApplicationHistory(applicationId: string): Promise<ApplicationHistory[]>;

  addApplicationLocation(applicationId: string, location: string, updatedBy: string): Promise<ApplicationLocationHistory>;
  getApplicationLocationHistory(applicationId: string): Promise<ApplicationLocationHistory[]>;

  createFeedback(feedback: InsertFeedback): Promise<Feedback>;
  updateFeedback(id: string, rating: number, comment?: string): Promise<Feedback>;
  getFeedbackByApplicationId(applicationId: string): Promise<Feedback | undefined>;
  getFeedbackByApplicationAndOfficialId(applicationId: string, officialId: string): Promise<Feedback | undefined>;
  getOfficialRatings(officialId: string): Promise<Feedback[]>;
  verifyFeedback(id: string): Promise<void>;


  createOTP(identifier: string, type: "phone" | "email", otp: string, purpose: string, expiresAt: Date): Promise<OTPRecord>;
  getOTP(identifier: string, type: "phone" | "email", purpose: string): Promise<OTPRecord | undefined>;
  // returns the latest OTP record for a phone/email/purpose regardless of verification state
  getLatestOTPRecord(identifier: string, type: "phone" | "email", purpose: string): Promise<OTPRecord | undefined>;
  verifyOTP(id: string): Promise<void>;

  createBlockchainHash(applicationId: string, hash: string, blockNumber: number): Promise<BlockchainHash>;
  getBlockchainHash(applicationId: string): Promise<BlockchainHash | undefined>;

  createNotification(userId: string, type: string, title: string, message: string, applicationId?: string): Promise<Notification>;
  getUserNotifications(userId: string): Promise<Notification[]>;
  markNotificationAsRead(id: string): Promise<void>;

  createDepartment(dept: InsertDepartment): Promise<Department>;
  getAllDepartments(): Promise<Department[]>;
  getDepartment(id: string): Promise<Department | undefined>;

  createWarning(warning: InsertWarning): Promise<Warning>;
  getWarnings(officialId: string): Promise<Warning[]>;
  markWarningAsRead(id: string): Promise<void>;

  updateUserStats(userId: string, rating: number, solvedCount: number, assignedCount: number): Promise<User>;
  updateApplicationEscalation(id: string, escalationLevel: number, officialId: string): Promise<Application>;
  markApplicationSolved(id: string, isSolved: boolean): Promise<Application>;
  clearAllData(): Promise<void>;

  getJudgePerformance(judgeId: string): Promise<Judge | undefined>;
  getCase(id: string): Promise<Case | undefined>;

  // AI & Timeline
  createAiRoutingLog(log: InsertAiRoutingLog): Promise<AiRoutingLog>;
  createFileTimelineEvent(event: InsertFileTimeline): Promise<FileTimeline>;
  getFileTimeline(applicationId: string): Promise<FileTimeline[]>;
  getOverdueApplications(): Promise<Application[]>; // For escalation job

  // Suspension methods
  checkOverComplaining(citizenId: string, department: string): Promise<boolean>;
  suspendUser(userId: string, reason: string, hours: number): Promise<User>;
  isUserSuspended(userId: string): Promise<boolean>;
  updateUser(userId: string, updates: Partial<User>): Promise<User>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private applications: Map<string, Application>;
  private applicationHistory: Map<string, ApplicationHistory[]>;
  private applicationLocationHistory: Map<string, ApplicationLocationHistory[]>;
  private feedback: Map<string, Feedback>;
  private otpRecords: Map<string, OTPRecord>;
  private blockchainHashes: Map<string, BlockchainHash>;
  private notifications: Map<string, Notification>;
  private departments: Map<string, Department>;
  private warnings: Map<string, Warning>;
  private judges: Map<string, Judge>;
  private cases: Map<string, Case>;

  private hearings: Map<string, Hearing>;
  private aiRoutingLogs: Map<string, AiRoutingLog>;
  private fileTimeline: Map<string, FileTimeline>;
  private dataDir = '.data';
  private dataFile = path.join(process.cwd(), '.data', 'db.json');

  constructor() {
    this.users = new Map();
    this.applications = new Map();
    this.applicationHistory = new Map();
    this.applicationLocationHistory = new Map();
    this.feedback = new Map();
    this.otpRecords = new Map();
    this.blockchainHashes = new Map();
    this.notifications = new Map();
    this.departments = new Map();
    this.warnings = new Map();
    this.judges = new Map();
    this.cases = new Map();
    this.hearings = new Map();
    this.aiRoutingLogs = new Map();
    this.fileTimeline = new Map();

    // Ensure data directory exists
    if (!fs.existsSync(path.join(process.cwd(), this.dataDir))) {
      fs.mkdirSync(path.join(process.cwd(), this.dataDir));
    }

    // Load persisted data from disk
    this.loadFromDisk();

    // If no judges (fresh install or empty db), seed data
    if (this.judges.size === 0) {
      this.seedJudiciaryData();
    }
    this.seedInvestigationData();
    this.saveToDisk();
  }

  private loadFromDisk() {
    try {
      // Ensure data directory exists
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
        console.log("📁 Created data directory");
        return;
      }

      // Load users
      const usersFile = path.join(this.dataDir, 'users.json');
      if (fs.existsSync(usersFile)) {
        const usersData = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));
        this.users = new Map(Object.entries(usersData).map(([id, user]: [string, any]) => [
          id,
          { ...user, createdAt: new Date(user.createdAt) }
        ]));
        console.log(`✅ Loaded ${this.users.size} users from disk`);
      }

      // Load applications
      const appsFile = path.join(this.dataDir, 'applications.json');
      if (fs.existsSync(appsFile)) {
        const appsData = JSON.parse(fs.readFileSync(appsFile, 'utf-8'));
        this.applications = new Map(Object.entries(appsData).map(([id, app]: [string, any]) => [
          id,
          {
            ...app,
            submittedAt: new Date(app.submittedAt),
            lastUpdatedAt: new Date(app.lastUpdatedAt),
            assignedAt: app.assignedAt ? new Date(app.assignedAt) : null,
            approvedAt: app.approvedAt ? new Date(app.approvedAt) : null,
            autoApprovalDate: new Date(app.autoApprovalDate)
          }
        ]));
        console.log(`✅ Loaded ${this.applications.size} applications from disk`);
      }

      // Load application history
      const historyFile = path.join(this.dataDir, 'applicationHistory.json');
      if (fs.existsSync(historyFile)) {
        const historyData = JSON.parse(fs.readFileSync(historyFile, 'utf-8'));
        this.applicationHistory = new Map(Object.entries(historyData).map(([appId, histories]: [string, any]) => [
          appId,
          histories.map((h: any) => ({
            ...h,
            updatedAt: new Date(h.updatedAt)
          }))
        ]));
        console.log(`✅ Loaded application history from disk`);
      }

      // Load application location history
      const locationHistoryFile = path.join(this.dataDir, 'applicationLocationHistory.json');
      if (fs.existsSync(locationHistoryFile)) {
        const locationHistoryData = JSON.parse(fs.readFileSync(locationHistoryFile, 'utf-8'));
        this.applicationLocationHistory = new Map(Object.entries(locationHistoryData).map(([appId, histories]: [string, any]) => [
          appId,
          histories.map((h: any) => ({
            ...h,
            updatedAt: new Date(h.updatedAt)
          }))
        ]));
        console.log(`✅ Loaded application location history from disk`);
      }

      // Load feedback
      const feedbackFile = path.join(this.dataDir, 'feedback.json');
      if (fs.existsSync(feedbackFile)) {
        const feedbackData = JSON.parse(fs.readFileSync(feedbackFile, 'utf-8'));
        this.feedback = new Map(Object.entries(feedbackData).map(([id, fb]: [string, any]) => [
          id,
          { ...fb, createdAt: new Date(fb.createdAt) }
        ]));
        console.log(`✅ Loaded ${this.feedback.size} feedback records from disk`);
      }

      // Load OTP records
      const otpFile = path.join(this.dataDir, 'otpRecords.json');
      if (fs.existsSync(otpFile)) {
        const otpData = JSON.parse(fs.readFileSync(otpFile, 'utf-8'));
        this.otpRecords = new Map(Object.entries(otpData).map(([id, otp]: [string, any]) => [
          id,
          {
            ...otp,
            createdAt: new Date(otp.createdAt),
            expiresAt: new Date(otp.expiresAt)
          }
        ]));
        console.log(`✅ Loaded ${this.otpRecords.size} OTP records from disk`);
      }

      // Load blockchain hashes
      const blockchainFile = path.join(this.dataDir, 'blockchainHashes.json');
      if (fs.existsSync(blockchainFile)) {
        const blockchainData = JSON.parse(fs.readFileSync(blockchainFile, 'utf-8'));
        this.blockchainHashes = new Map(Object.entries(blockchainData).map(([id, hash]: [string, any]) => [
          id,
          { ...hash, timestamp: new Date(hash.timestamp) }
        ]));
        console.log(`✅ Loaded ${this.blockchainHashes.size} blockchain hashes from disk`);
      }

      // Load notifications
      const notificationsFile = path.join(this.dataDir, 'notifications.json');
      if (fs.existsSync(notificationsFile)) {
        const notificationsData = JSON.parse(fs.readFileSync(notificationsFile, 'utf-8'));
        this.notifications = new Map(Object.entries(notificationsData).map(([id, notif]: [string, any]) => [
          id,
          { ...notif, createdAt: new Date(notif.createdAt) }
        ]));
        console.log(`✅ Loaded ${this.notifications.size} notifications from disk`);
      }

      // Load departments
      const departmentsFile = path.join(this.dataDir, 'departments.json');
      if (fs.existsSync(departmentsFile)) {
        const departmentsData = JSON.parse(fs.readFileSync(departmentsFile, 'utf-8'));
        this.departments = new Map(Object.entries(departmentsData).map(([id, dept]: [string, any]) => [
          id,
          { ...dept, createdAt: new Date(dept.createdAt) }
        ]));
        console.log(`✅ Loaded ${this.departments.size} departments from disk`);
      }

      // Load warnings
      const warningsFile = path.join(this.dataDir, 'warnings.json');
      if (fs.existsSync(warningsFile)) {
        const warningsData = JSON.parse(fs.readFileSync(warningsFile, 'utf-8'));
        this.warnings = new Map(Object.entries(warningsData).map(([id, warning]: [string, any]) => [
          id,
          { ...warning, sentAt: new Date(warning.sentAt) }
        ]));
        console.log(`✅ Loaded ${this.warnings.size} warnings from disk`);
      }

      // Load judges
      const judgesFile = path.join(this.dataDir, 'judges.json');
      if (fs.existsSync(judgesFile)) {
        const judgesData = JSON.parse(fs.readFileSync(judgesFile, 'utf-8'));
        this.judges = new Map(Object.entries(judgesData).map(([id, judge]: [string, any]) => [
          id,
          { ...judge, createdAt: new Date(judge.createdAt) }
        ]));
        console.log(`✅ Loaded ${this.judges.size} judges from disk`);
      }

      // Load cases
      const casesFile = path.join(this.dataDir, 'cases.json');
      if (fs.existsSync(casesFile)) {
        const casesData = JSON.parse(fs.readFileSync(casesFile, 'utf-8'));
        this.cases = new Map(Object.entries(casesData).map(([id, caseItem]: [string, any]) => [
          id,
          { ...caseItem, filedDate: new Date(caseItem.filedDate) }
        ]));
        console.log(`✅ Loaded ${this.cases.size} cases from disk`);
      }

      // Load hearings
      const hearingsFile = path.join(this.dataDir, 'hearings.json');
      if (fs.existsSync(hearingsFile)) {
        const hearingsData = JSON.parse(fs.readFileSync(hearingsFile, 'utf-8'));
        this.hearings = new Map(Object.entries(hearingsData).map(([id, hearing]: [string, any]) => [
          id,
          { ...hearing, scheduledDate: new Date(hearing.scheduledDate) }
        ]));
        console.log(`✅ Loaded ${this.hearings.size} hearings from disk`);
      }

      console.log("✅ Data persistence loaded successfully!");
    } catch (error) {
      console.error("❌ Error loading data from disk:", error);
      console.log("Starting with empty data...");
    }
  }

  private async saveToDisk() {
    try {
      // Ensure data directory exists
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }

      // Save users
      const usersData = Object.fromEntries(this.users);
      fs.writeFileSync(
        path.join(this.dataDir, 'users.json'),
        JSON.stringify(usersData, null, 2),
        'utf-8'
      );

      // Save applications
      const appsData = Object.fromEntries(this.applications);
      fs.writeFileSync(
        path.join(this.dataDir, 'applications.json'),
        JSON.stringify(appsData, null, 2),
        'utf-8'
      );

      // Save application history
      const historyData = Object.fromEntries(this.applicationHistory);
      fs.writeFileSync(
        path.join(this.dataDir, 'applicationHistory.json'),
        JSON.stringify(historyData, null, 2),
        'utf-8'
      );

      // Save application location history
      const locationHistoryData = Object.fromEntries(this.applicationLocationHistory);
      fs.writeFileSync(
        path.join(this.dataDir, 'applicationLocationHistory.json'),
        JSON.stringify(locationHistoryData, null, 2),
        'utf-8'
      );

      // Save feedback
      const feedbackData = Object.fromEntries(this.feedback);
      fs.writeFileSync(
        path.join(this.dataDir, 'feedback.json'),
        JSON.stringify(feedbackData, null, 2),
        'utf-8'
      );

      // Save OTP records
      const otpData = Object.fromEntries(this.otpRecords);
      fs.writeFileSync(
        path.join(this.dataDir, 'otpRecords.json'),
        JSON.stringify(otpData, null, 2),
        'utf-8'
      );

      // Save blockchain hashes
      const blockchainData = Object.fromEntries(this.blockchainHashes);
      fs.writeFileSync(
        path.join(this.dataDir, 'blockchainHashes.json'),
        JSON.stringify(blockchainData, null, 2),
        'utf-8'
      );

      // Save notifications
      const notificationsData = Object.fromEntries(this.notifications);
      fs.writeFileSync(
        path.join(this.dataDir, 'notifications.json'),
        JSON.stringify(notificationsData, null, 2),
        'utf-8'
      );

      // Save departments
      const departmentsData = Object.fromEntries(this.departments);
      fs.writeFileSync(
        path.join(this.dataDir, 'departments.json'),
        JSON.stringify(departmentsData, null, 2),
        'utf-8'
      );

      // Save warnings
      const warningsData = Object.fromEntries(this.warnings);
      fs.writeFileSync(
        path.join(this.dataDir, 'warnings.json'),
        JSON.stringify(warningsData, null, 2),
        'utf-8'
      );

      // Save judges
      const judgesData = Object.fromEntries(this.judges);
      fs.writeFileSync(
        path.join(this.dataDir, 'judges.json'),
        JSON.stringify(judgesData, null, 2),
        'utf-8'
      );

      // Save cases
      const casesData = Object.fromEntries(this.cases);
      fs.writeFileSync(
        path.join(this.dataDir, 'cases.json'),
        JSON.stringify(casesData, null, 2),
        'utf-8'
      );

      // Save hearings
      const hearingsData = Object.fromEntries(this.hearings);
      fs.writeFileSync(
        path.join(this.dataDir, 'hearings.json'),
        JSON.stringify(hearingsData, null, 2),
        'utf-8'
      );
    } catch (error) {
      console.error("❌ Error saving data to disk:", error);
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => (user.email || "").toLowerCase() === (email || "").toLowerCase(),
    );
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => (user.phone || "") === (phone || ""),
    );
  }

  async getUserByAadhar(aadharNumber: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => (user.aadharNumber || "") === (aadharNumber || ""),
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      phone: insertUser.phone ?? null,
      aadharNumber: insertUser.aadharNumber ?? null,
      department: insertUser.department ?? null,
      subDepartment: insertUser.subDepartment ?? null,
      district: insertUser.district ?? null,
      createdAt: new Date(),
      rating: 0,
      assignedCount: 0,
      solvedCount: 0,
      suspendedUntil: null,
      suspensionReason: null,
      id,
    };
    this.users.set(id, user);
    await this.saveToDisk();
    return user;
  }

  async updateUserPassword(id: string, password: string): Promise<void> {
    const user = this.users.get(id);
    if (!user) throw new Error("User not found");
    this.users.set(id, { ...user, password });
    await this.saveToDisk();
  }

  async createApplication(insertApplication: InsertApplication): Promise<Application> {
    const id = randomUUID();
    const trackingId = `APP-${new Date().getFullYear()}-${String(this.applications.size + 1).padStart(6, '0')}`;
    const now = new Date();
    const autoApprovalDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Extract department from applicationType (e.g., "Health – Ministry..." → "Health")
    let department: string | null = null;
    if (insertApplication.applicationType) {
      const match = insertApplication.applicationType.match(/^([^–]+)/);
      if (match) {
        department = match[1].trim();
      }
    }

    const application: Application = {
      ...insertApplication,
      id,
      trackingId,
      department: insertApplication.department || department,
      subDepartment: insertApplication.subDepartment || null,
      status: "Submitted",
      priority: insertApplication.priority ?? "Low", // Default to Low for unassigned applications
      remarks: insertApplication.remarks ?? null,
      currentLocation: insertApplication.currentLocation ?? null,
      submittedAt: now,
      lastUpdatedAt: now,
      assignedAt: null,
      approvedAt: null,
      officialId: null,
      autoApprovalDate,
      image: insertApplication.image ?? null,
      isSolved: false,
      escalationLevel: 0,
      slaDueAt: null,
      aiConfidence: null,
      attachments: null,
    };

    this.applications.set(id, application);
    await this.addApplicationHistory(id, "Submitted", insertApplication.citizenId, "Application submitted");
    await this.saveToDisk();
    return application;
  }

  async getApplication(id: string): Promise<Application | undefined> {
    return this.applications.get(id);
  }

  async getApplicationByTrackingId(trackingId: string): Promise<Application | undefined> {
    return Array.from(this.applications.values()).find(app => app.trackingId === trackingId);
  }

  async getUserApplications(citizenId: string): Promise<Application[]> {
    return Array.from(this.applications.values())
      .filter(app => app.citizenId === citizenId)
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  }

  async getOfficialApplications(officialId?: string): Promise<Application[]> {
    // Update priorities before returning
    await this.updateApplicationPriorities();

    if (officialId) {
      // STRICT FILTERING: Only return applications where officialId EXACTLY matches
      // This ensures each application is only visible to ONE official
      const filtered = Array.from(this.applications.values())
        .filter(app => {
          // Must have officialId set AND it must match exactly
          const matches = app.officialId !== null && app.officialId === officialId;
          if (!matches && app.officialId) {
            // Log if we see an application assigned to a different official (for debugging)
            console.log(`[getOfficialApplications] Application ${app.trackingId} assigned to ${app.officialId}, not ${officialId}`);
          }
          return matches;
        })
        .sort((a, b) => {
          // Sort by priority first (high > medium > low), then by submission date
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          const priorityDiff = (priorityOrder[(b.priority || "low").toLowerCase() as keyof typeof priorityOrder] || 0) - (priorityOrder[(a.priority || "low").toLowerCase() as keyof typeof priorityOrder] || 0);
          if (priorityDiff !== 0) return priorityDiff;
          return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
        });

      console.log(`[getOfficialApplications] Official ${officialId}: Returning ${filtered.length} applications (strictly filtered by officialId)`);
      return filtered;
    }
    return Array.from(this.applications.values());
  }

  async getUnassignedApplicationsByDepartment(department: string): Promise<Application[]> {
    // Update priorities before returning
    await this.updateApplicationPriorities();

    // Normalize department name (handle "Health – Ministry..." vs "Health")
    const normalizedDept = department.split('–')[0].trim();

    return Array.from(this.applications.values())
      .filter(app => {
        // Only unassigned applications (status is "Submitted" and no officialId)
        if (app.status !== "Submitted" || app.officialId !== null) {
          return false;
        }

        // Match department
        if (!app.department) return false;
        const appDept = app.department.split('–')[0].trim();
        return appDept === normalizedDept;
      })
      .sort((a, b) => {
        // Sort by priority first (high > medium > low), then by submission date
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const priorityDiff = (priorityOrder[(b.priority || "low").toLowerCase() as keyof typeof priorityOrder] || 0) - (priorityOrder[(a.priority || "low").toLowerCase() as keyof typeof priorityOrder] || 0);
        if (priorityDiff !== 0) return priorityDiff;
        return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
      });
  }

  async getOfficialCurrentWorkload(officialId: string): Promise<number> {
    return Array.from(this.applications.values())
      .filter(app => app.officialId === officialId && ["Assigned", "In Progress"].includes(app.status))
      .length;
  }

  async getLastAssignmentTime(officialId: string): Promise<Date | null> {
    const apps = Array.from(this.applications.values())
      .filter(app => app.officialId === officialId && app.assignedAt)
      .sort((a, b) => new Date(b.assignedAt!).getTime() - new Date(a.assignedAt!).getTime());

    return apps.length > 0 ? apps[0].assignedAt : null;
  }

  async getAllOfficials(): Promise<User[]> {
    return Array.from(this.users.values()).filter(u => u.role === "official");
  }

  async getAllAdmins(): Promise<User[]> {
    return Array.from(this.users.values()).filter(u => u.role === "admin");
  }

  /**
   * Calculate priority based on days since submission
   * - Low: 0-9 days
   * - Medium: 10-19 days
   * - High: 20+ days
   */
  /**
   * Calculate priority based on:
   * - Days since submission (if unassigned)
   * - Days since last update (if assigned but not updated)
   * Returns: "low" | "medium" | "high"
   */
  private calculatePriority(app: Application): "low" | "medium" | "high" {
    const now = new Date();
    const submittedAt = new Date(app.submittedAt);
    const lastUpdatedAt = new Date(app.lastUpdatedAt);

    // Calculate days since submission
    const daysSinceSubmission = Math.floor((now.getTime() - submittedAt.getTime()) / (1000 * 60 * 60 * 24));

    // Calculate days since last update
    const daysSinceUpdate = Math.floor((now.getTime() - lastUpdatedAt.getTime()) / (1000 * 60 * 60 * 24));

    // Check if application is not assigned to any officer
    const isUnassigned = app.status === "Submitted" && app.officialId === null;

    // Priority escalation logic based on user requirements:
    // - High: Unassigned for 20+ days OR not updated for 20+ days
    // - Medium: Not assigned OR not updated for 10+ days (but < 20 for high)
    // - Low: Default for new applications (< 10 days)
    if (isUnassigned && daysSinceSubmission >= 20) {
      // Remains unassigned for 20+ days → High
      return "high";
    } else if (daysSinceUpdate >= 20) {
      // Not updated for 20+ days → High
      return "high";
    } else if (isUnassigned && daysSinceSubmission >= 10) {
      // Not assigned for 10+ days → Medium
      return "medium";
    } else if (daysSinceUpdate >= 10) {
      // Not updated for 10+ days → Medium
      return "medium";
    } else {
      // Default: Low priority for new applications
      return "low";
    }
  }

  /**
   * Update priorities for all applications based on:
   * - Days since submission (if unassigned)
   * - Days since last update (if assigned but not updated)
   * This runs automatically via cron job daily
   */
  async updateApplicationPriorities(): Promise<void> {
    const now = new Date();
    let updated = false;
    let updatedCount = 0;

    for (const [id, app] of Array.from(this.applications.entries())) {
      // Skip completed/rejected applications
      if (["Approved", "Rejected", "Auto-Approved"].includes(app.status)) {
        continue;
      }

      // Calculate new priority based on assignment status and update time
      const newPriority = this.calculatePriority(app);

      // Normalize current priority to lowercase for comparison
      const currentPriority = (app.priority || "low").toLowerCase();

      // Only update if priority has changed
      if (currentPriority !== newPriority) {
        app.priority = newPriority;
        // Don't update lastUpdatedAt here - we want to track when the application was last updated by an official
        updated = true;
        updatedCount++;

        // Add history entry for priority change
        const daysSinceSubmission = Math.floor((now.getTime() - new Date(app.submittedAt).getTime()) / (1000 * 60 * 60 * 24));
        const daysSinceUpdate = Math.floor((now.getTime() - new Date(app.lastUpdatedAt).getTime()) / (1000 * 60 * 60 * 24));

        const reason = app.officialId === null
          ? `${daysSinceSubmission} days since submission (unassigned)`
          : `${daysSinceUpdate} days since last update`;

        await this.addApplicationHistory(
          id,
          app.status,
          "system",
          `Priority automatically updated to ${newPriority.toUpperCase()} (${reason})`
        );
      }
    }

    // Save to disk if any updates were made
    if (updated) {
      await this.saveToDisk();
      console.log(`✅ Priority update completed: ${updatedCount} application(s) updated`);
    }
  }

  async getAllApplications(): Promise<Application[]> {
    // Update priorities before returning
    await this.updateApplicationPriorities();

    // Sort by priority (high > medium > low), then by submission date
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return Array.from(this.applications.values())
      .sort((a, b) => {
        const priorityDiff = (priorityOrder[(b.priority || "low").toLowerCase() as keyof typeof priorityOrder] || 0) - (priorityOrder[(a.priority || "low").toLowerCase() as keyof typeof priorityOrder] || 0);
        if (priorityDiff !== 0) return priorityDiff;
        return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
      });
  }

  async updateApplicationStatus(id: string, status: string, updatedBy: string, comment?: string): Promise<Application> {
    const app = this.applications.get(id);
    if (!app) throw new Error("Application not found");

    const updated: Application = {
      ...app,
      status,
      lastUpdatedAt: new Date(),
      approvedAt: ["Approved", "Auto-Approved", "Auto-Approved (Documents Verified by System)", "Rejected"].includes(status) ? new Date() : app.approvedAt,
    };

    this.applications.set(id, updated);
    await this.addApplicationHistory(id, status, updatedBy, comment);

    if (status === "Approved" || status === "Auto-Approved" || status === "Auto-Approved (Documents Verified by System)") {
      const hash = this.generateHash(id);
      const blockNumber = this.blockchainHashes.size + 1;
      await this.createBlockchainHash(id, hash, blockNumber);
    }

    await this.saveToDisk();
    return updated;
  }

  async assignApplication(id: string, officialId: string): Promise<Application> {
    const app = this.applications.get(id);
    if (!app) throw new Error("Application not found");

    const updated: Application = {
      ...app,
      officialId,
      status: "Assigned",
      assignedAt: new Date(),
      lastUpdatedAt: new Date(),
    };

    this.applications.set(id, updated);
    await this.addApplicationHistory(id, "Assigned", officialId, "Application assigned to official");
    await this.saveToDisk();
    return updated;
  }

  async addApplicationHistory(applicationId: string, status: string, updatedBy: string, comment?: string): Promise<ApplicationHistory> {
    const id = randomUUID();
    const history: ApplicationHistory = {
      id,
      applicationId,
      status,
      comment: comment || null,
      updatedBy,
      updatedAt: new Date(),
    };

    const existing = this.applicationHistory.get(applicationId) || [];
    existing.push(history);
    this.applicationHistory.set(applicationId, existing);

    // No need to save here as it's called by other methods that save, 
    // BUT it might be called independently, so let's save to be safe.
    await this.saveToDisk();
    return history;
  }

  async getApplicationHistory(applicationId: string): Promise<ApplicationHistory[]> {
    return this.applicationHistory.get(applicationId) || [];
  }

  async addApplicationLocation(applicationId: string, location: string, updatedBy: string): Promise<ApplicationLocationHistory> {
    const id = randomUUID();
    const locationEntry: ApplicationLocationHistory = {
      id,
      applicationId,
      location,
      updatedBy,
      updatedAt: new Date(),
    };

    const history = this.applicationLocationHistory.get(applicationId) || [];
    history.push(locationEntry);
    // Sort by updatedAt descending (newest first)
    history.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    this.applicationLocationHistory.set(applicationId, history);

    // Update the currentLocation field on the application
    const app = this.applications.get(applicationId);
    if (app) {
      app.currentLocation = location;
      app.lastUpdatedAt = new Date();
      this.applications.set(applicationId, app);
    }

    await this.saveToDisk();
    return locationEntry;
  }

  async getApplicationLocationHistory(applicationId: string): Promise<ApplicationLocationHistory[]> {
    const history = this.applicationLocationHistory.get(applicationId) || [];
    // Return sorted by updatedAt descending (newest first)
    return [...history].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async createFeedback(insertFeedback: InsertFeedback): Promise<Feedback> {
    const id = randomUUID();
    const feedback: Feedback = {
      ...insertFeedback,
      comment: insertFeedback.comment ?? null,
      officialId: insertFeedback.officialId ?? null,
      id,
      verified: false,
      createdAt: new Date(),
    };

    this.feedback.set(id, feedback);
    await this.saveToDisk();
    return feedback;
  }

  async updateFeedback(id: string, rating: number, comment?: string): Promise<Feedback> {
    const feedback = this.feedback.get(id);
    if (!feedback) throw new Error("Feedback not found");

    const updated: Feedback = {
      ...feedback,
      rating,
      comment: comment ?? feedback.comment,
    };
    this.feedback.set(id, updated);
    await this.saveToDisk();
    return updated;
  }

  async getFeedbackByApplicationId(applicationId: string): Promise<Feedback | undefined> {
    return Array.from(this.feedback.values()).find(f => f.applicationId === applicationId);
  }

  async getFeedbackByApplicationAndOfficialId(applicationId: string, officialId: string): Promise<Feedback | undefined> {
    return Array.from(this.feedback.values()).find(f => f.applicationId === applicationId && f.officialId === officialId);
  }

  async getOfficialRatings(officialId: string): Promise<Feedback[]> {
    return Array.from(this.feedback.values()).filter(f => f.officialId === officialId);
  }

  async verifyFeedback(id: string): Promise<void> {
    const feedback = this.feedback.get(id);
    if (feedback) {
      this.feedback.set(id, { ...feedback, verified: true });
      await this.saveToDisk();
    }
  }


  async createOTP(identifier: string, type: "phone" | "email", otp: string, purpose: string, expiresAt: Date): Promise<OTPRecord> {
    const id = randomUUID();
    const record: OTPRecord = {
      id,
      phone: type === "phone" ? identifier : null,
      email: type === "email" ? identifier : null,
      otp,
      purpose,
      expiresAt,
      verified: false,
      createdAt: new Date(),
    };

    this.otpRecords.set(id, record);
    await this.saveToDisk();
    return record;
  }

  async getOTP(identifier: string, type: "phone" | "email", purpose: string): Promise<OTPRecord | undefined> {
    return Array.from(this.otpRecords.values())
      .filter(r => {
        const matchIdentifier = type === "phone" ? r.phone === identifier : r.email === identifier;
        return matchIdentifier && r.purpose === purpose && !r.verified;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  }

  async getLatestOTPRecord(identifier: string, type: "phone" | "email", purpose: string): Promise<OTPRecord | undefined> {
    return Array.from(this.otpRecords.values())
      .filter(r => {
        const matchIdentifier = type === "phone" ? r.phone === identifier : r.email === identifier;
        return matchIdentifier && r.purpose === purpose;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  }

  async verifyOTP(id: string): Promise<void> {
    const otp = this.otpRecords.get(id);
    if (otp) {
      this.otpRecords.set(id, { ...otp, verified: true });
      await this.saveToDisk();
    }
  }

  async createBlockchainHash(applicationId: string, hash: string, blockNumber: number): Promise<BlockchainHash> {
    const id = randomUUID();
    const blockchainHash: BlockchainHash = {
      id,
      applicationId,
      documentHash: hash,
      blockNumber,
      timestamp: new Date(),
    };

    this.blockchainHashes.set(id, blockchainHash);
    await this.saveToDisk();
    return blockchainHash;
  }

  async getBlockchainHash(applicationId: string): Promise<BlockchainHash | undefined> {
    return Array.from(this.blockchainHashes.values()).find(h => h.applicationId === applicationId);
  }

  async createNotification(userId: string, type: string, title: string, message: string, applicationId?: string): Promise<Notification> {
    const id = randomUUID();
    const notification: Notification = {
      id,
      userId,
      type,
      title,
      message,
      read: false,
      applicationId: applicationId || null,
      createdAt: new Date(),
    };

    this.notifications.set(id, notification);
    await this.saveToDisk();
    return notification;
  }

  async getUserNotifications(userId: string): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async markNotificationAsRead(id: string): Promise<void> {
    const notification = this.notifications.get(id);
    if (notification) {
      this.notifications.set(id, { ...notification, read: true });
      await this.saveToDisk();
    }
  }

  async createDepartment(insertDepartment: InsertDepartment): Promise<Department> {
    const id = randomUUID();
    const department: Department = {
      ...insertDepartment,
      description: insertDepartment.description ?? null,
      image: insertDepartment.image ?? null,
      id,
      createdAt: new Date(),
    };
    this.departments.set(id, department);
    await this.saveToDisk();
    return department;
  }

  async getAllDepartments(): Promise<Department[]> {
    return Array.from(this.departments.values());
  }

  async getDepartment(id: string): Promise<Department | undefined> {
    return this.departments.get(id);
  }

  async createWarning(insertWarning: InsertWarning): Promise<Warning> {
    const id = randomUUID();
    const warning: Warning = {
      ...insertWarning,
      id,
      sentAt: new Date(),
      read: false,
    };
    this.warnings.set(id, warning);
    await this.saveToDisk();
    return warning;
  }

  async getWarnings(officialId: string): Promise<Warning[]> {
    return Array.from(this.warnings.values())
      .filter(w => w.officialId === officialId)
      .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
  }

  async markWarningAsRead(id: string): Promise<void> {
    const warning = this.warnings.get(id);
    if (warning) {
      this.warnings.set(id, { ...warning, read: true });
      await this.saveToDisk();
    }
  }

  async updateUserStats(userId: string, rating: number, solvedCount: number, assignedCount: number): Promise<User> {
    const user = this.users.get(userId);
    if (!user) throw new Error("User not found");
    const updated = { ...user, rating, solvedCount, assignedCount };
    this.users.set(userId, updated);
    await this.saveToDisk();
    return updated;
  }

  async updateApplicationEscalation(id: string, escalationLevel: number, officialId: string): Promise<Application> {
    const app = this.applications.get(id);
    if (!app) throw new Error("Application not found");
    const updated = {
      ...app,
      escalationLevel,
      officialId,
      status: "Assigned",
      assignedAt: new Date(),
      lastUpdatedAt: new Date(),
    };
    this.applications.set(id, updated);
    await this.saveToDisk();
    return updated;
  }

  async markApplicationSolved(id: string, isSolved: boolean): Promise<Application> {
    const app = this.applications.get(id);
    if (!app) throw new Error("Application not found");
    const updated = {
      ...app,
      isSolved,
      lastUpdatedAt: new Date(),
    };
    this.applications.set(id, updated);
    await this.saveToDisk();
    return updated;
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const user = this.users.get(userId);
    if (!user) throw new Error("User not found");
    const updated = { ...user, ...updates };
    this.users.set(userId, updated);
    await this.saveToDisk();
    return updated;
  }

  async checkOverComplaining(citizenId: string, department: string): Promise<boolean> {
    // Get all applications by this citizen
    const citizenApps = Array.from(this.applications.values())
      .filter(app => app.citizenId === citizenId);

    // Get current time and 24 hours ago
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Filter applications submitted within the last 24 hours to the same department
    // Handle both direct department match and department extracted from applicationType
    const recentApps = citizenApps.filter(app => {
      const submittedDate = new Date(app.submittedAt);
      const isWithin24Hours = submittedDate >= twentyFourHoursAgo && submittedDate <= now;

      // Check if department matches directly
      let deptMatch = app.department === department;

      // If no direct match, try extracting department from applicationType
      if (!deptMatch && app.applicationType) {
        const match = app.applicationType.match(/^([^–]+)/);
        if (match) {
          const extractedDept = match[1].trim();
          deptMatch = extractedDept === department;
        }
      }

      return isWithin24Hours && deptMatch;
    });

    // Return true if 3 or more applications to the same department found within 24 hours
    return recentApps.length >= 3;
  }

  async suspendUser(userId: string, reason: string, hours: number = 24): Promise<User> {
    const user = this.users.get(userId);
    if (!user) throw new Error("User not found");

    const suspendedUntil = new Date(Date.now() + hours * 60 * 60 * 1000);
    const updated = {
      ...user,
      suspendedUntil,
      suspensionReason: reason
    };
    this.users.set(userId, updated);
    await this.saveToDisk();
    return updated;
  }

  async isUserSuspended(userId: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user || !user.suspendedUntil) return false;

    // Check if suspension has expired
    const now = new Date();
    if (new Date(user.suspendedUntil) <= now) {
      // Suspension expired, clear it
      const updated = { ...user, suspendedUntil: null, suspensionReason: null };
      this.users.set(userId, updated);
      await this.saveToDisk();
      return false;
    }

    return true;
  }

  async clearAllData(): Promise<void> {
    console.log("🗑️  Clearing all data from memory...");
    this.users.clear();
    this.applications.clear();
    this.applicationHistory.clear();
    this.feedback.clear();
    this.otpRecords.clear();
    this.blockchainHashes.clear();
    this.notifications.clear();
    this.departments.clear();
    this.warnings.clear();
    this.judges.clear();
    this.cases.clear();
    this.hearings.clear();

    // Also delete all data files from disk
    try {
      if (fs.existsSync(this.dataDir)) {
        const files = [
          'users.json',
          'applications.json',
          'applicationHistory.json',
          'applicationLocationHistory.json',
          'feedback.json',
          'otpRecords.json',
          'blockchainHashes.json',
          'notifications.json',
          'departments.json',
          'warnings.json',
          'judges.json',
          'cases.json',
          'hearings.json'
        ];

        for (const file of files) {
          const filePath = path.join(this.dataDir, file);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`   Deleted ${file}`);
          }
        }
        console.log("✅ All data files deleted from disk");
      }
    } catch (error) {
      console.error("❌ Error deleting data files:", error);
    }

    console.log("✅ All data cleared successfully!");
  }

  private generateHash(data: string): string {

    return createHash('sha256').update(data + Date.now()).digest('hex');
  }

  // Judiciary Implementation

  async createHearing(insertHearing: InsertHearing): Promise<Hearing> {
    const id = randomUUID();
    const hearing: Hearing = {
      ...insertHearing,
      id,
      isVideoRecorded: insertHearing.isVideoRecorded ?? null,
      videoLink: insertHearing.videoLink ?? null,
    };
    this.hearings.set(id, hearing);
    await this.saveToDisk();
    return hearing;
  }

  async getHearingsByCaseId(caseId: string): Promise<Hearing[]> {
    return Array.from(this.hearings.values())
      .filter(h => h.caseId === caseId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async assignNextDate(caseId: string): Promise<Hearing> {
    const caseItem = this.cases.get(caseId);
    if (!caseItem) throw new Error("Case not found");

    // Auto-Scheduler Logic
    // 1. Find assigned judge or assign one if missing
    let judgeId = caseItem.allocatedJudgeId;
    if (!judgeId) {
      const judges = await this.getAvailableJudges();
      if (judges.length === 0) throw new Error("No judges available");
      // Simple load balancing: pick judge with fewest pending cases
      const bestJudge = judges.reduce((prev, curr) =>
        (prev.casesPending || 0) < (curr.casesPending || 0) ? prev : curr
      );
      judgeId = bestJudge.id;

      // Update case with assigned judge
      this.cases.set(caseId, { ...caseItem, allocatedJudgeId: judgeId, status: "Allocated" });

      // Update judge pending count
      const judge = this.judges.get(judgeId);
      if (judge) {
        this.judges.set(judgeId, { ...judge, casesPending: (judge.casesPending || 0) + 1 });
      }
    }

    // 2. Calculate Date based on Priority
    const today = new Date();
    let nextDate = new Date();

    if (caseItem.priority === "High" || caseItem.priority === "Urgent") {
      // Within 7 days
      nextDate.setDate(today.getDate() + Math.floor(Math.random() * 7) + 1);
    } else {
      // Within 30 days
      nextDate.setDate(today.getDate() + Math.floor(Math.random() * 30) + 1);
    }

    // 3. Create Hearing (Locked Slot)
    const hearing: InsertHearing = {
      caseId: caseId,
      judgeId: judgeId!,
      date: nextDate,
      status: "Scheduled"
    };

    return this.createHearing(hearing);
  }

  async getJudgePerformance(judgeId: string): Promise<Judge> {
    const judge = this.judges.get(judgeId);
    if (!judge) throw new Error("Judge not found");
    return judge;
  }

  async getAllJudges(): Promise<Judge[]> {
    return Array.from(this.judges.values());
  }

  async getAllCases(): Promise<Case[]> {
    return Array.from(this.cases.values());
  }

  async getPendingCases(): Promise<Case[]> {
    return Array.from(this.cases.values()).filter(c => c.status === "Pending");
  }
  async getAvailableJudges(): Promise<Judge[]> {
    return Array.from(this.judges.values()).filter(j => j.status === "Available");
  }

  async assignCaseToJudge(caseId: string, judgeId: string): Promise<void> {
    const caseItem = this.cases.get(caseId);
    const judge = this.judges.get(judgeId);

    if (caseItem && judge) {
      this.cases.set(caseId, { ...caseItem, status: "Allocated", allocatedJudgeId: judgeId });
      // Ideally update judge stats here too
      await this.saveToDisk();
    }
  }

  async createCase(insertCase: InsertCase, citizenId?: string, scrutinyOptions?: { scrutinyOfficialId?: string | null, filingDistrict?: string | null }): Promise<Case> {
    const id = randomUUID();
    const newCase: Case = {
      ...insertCase,
      id,
      citizenId: citizenId || null,
      filedDate: new Date(),
      allocatedJudgeId: null,
      status: scrutinyOptions?.scrutinyOfficialId ? "Scrutiny" : "Pending",
      priority: insertCase.priority || "Medium",
      caseNumber: insertCase.caseNumber || `CASE-${Date.now()}`,
      scrutinyOfficialId: scrutinyOptions?.scrutinyOfficialId || null,
      isAnonymized: true,
      rejectionReason: null,
      filingDistrict: scrutinyOptions?.filingDistrict || insertCase.filingDistrict || null,
    };
    this.cases.set(id, newCase);
    this.cases.set(id, newCase);
    this.saveToDisk();
    return newCase;
  }

  async updateCaseStatus(caseId: string, status: string, rejectionReason?: string | null): Promise<Case> {
    const caseItem = this.cases.get(caseId);
    if (!caseItem) throw new Error("Case not found");

    const updatedCase = { ...caseItem, status, rejectionReason: rejectionReason || null };
    // If status is "Pending" (passed scrutiny) or "Rejected", update logic can go here (stats etc)

    this.cases.set(caseId, updatedCase);
    this.cases.set(caseId, updatedCase);
    this.saveToDisk();
    return updatedCase;
  }

  async findScrutinyOfficial(excludeDistrict: string): Promise<User | null> {
    const officials = Array.from(this.users.values()).filter(
      u => u.role === "official" &&
        u.district &&
        u.district !== excludeDistrict &&
        u.department?.startsWith("Judiciary")
    );

    if (officials.length === 0) return null;

    // Sort by workload (assignedCount) - simplified for now
    officials.sort((a, b) => (a.assignedCount || 0) - (b.assignedCount || 0));

    return officials[0];
  }

  async getScrutinyCasesForOfficial(officialId: string): Promise<Case[]> {
    return Array.from(this.cases.values()).filter(
      c => c.scrutinyOfficialId === officialId && c.status === "Scrutiny"
    );
  }

  async getCasesByCitizenId(citizenId: string): Promise<Case[]> {
    return Array.from(this.cases.values()).filter(c => c.citizenId === citizenId);
  }

  async getCase(id: string): Promise<Case | undefined> {
    return this.cases.get(id);
  }

  private seedJudiciaryData() {
    // Mock Judges
    const judgesList: Judge[] = [
      {
        id: "j1",
        name: "Justice A. Sharma",
        specialization: "Constitutional",
        experience: 25,
        reputationScore: 98,
        casesSolved: 1200,
        avgResolutionTime: 45,
        image: null,
        status: "Available",
        district: "New Delhi",
        casesPending: 12,
        casesDisposed: 1200,
        publicRating: 5,
        performanceScore: 98
      },
      {
        id: "j2",
        name: "Justice R. Iyer",
        specialization: "Criminal",
        experience: 18,
        reputationScore: 92,
        casesSolved: 850,
        avgResolutionTime: 30,
        image: null,
        status: "Available",
        district: "Mumbai",
        casesPending: 45,
        casesDisposed: 850,
        publicRating: 4,
        performanceScore: 92
      },
      {
        id: "j3",
        name: "Justice K. Singh",
        specialization: "Civil",
        experience: 20,
        reputationScore: 45, // Low score (Red Flag)
        casesSolved: 300,
        avgResolutionTime: 120, // Slow
        image: null,
        status: "Busy",
        district: "Bangalore",
        casesPending: 80, // High pending
        casesDisposed: 300,
        publicRating: 2,
        performanceScore: 40
      },
    ];
    judgesList.forEach(j => this.judges.set(j.id, j));

    // Mock Cases
    const casesList: Case[] = [
      {
        id: "c1",
        title: "State vs. XYZ Corp",
        description: "Environmental violation case.",
        type: "Civil",
        status: "Pending",
        priority: "High",
        filedDate: new Date(),
        allocatedJudgeId: null,
        caseNumber: "CV-2023-001",
        citizenId: null,
        scrutinyOfficialId: null,
        isAnonymized: true,
        rejectionReason: null,
        filingDistrict: "New Delhi"
      },
      {
        id: "c2",
        title: "Doe vs. State",
        description: "Fundamental rights violation.",
        type: "Constitutional",
        status: "Pending",
        priority: "Medium",
        filedDate: new Date(),
        allocatedJudgeId: null,
        caseNumber: "CN-2023-045",
        citizenId: null,
        scrutinyOfficialId: null,
        isAnonymized: true,
        rejectionReason: null,
        filingDistrict: "Mumbai"
      },
      {
        id: "c3",
        title: "Family Dispute #8821",
        description: "Property inheritance dispute.",
        type: "Civil",
        status: "Allocated",
        priority: "Low",
        filedDate: new Date(),
        allocatedJudgeId: "j3",
        caseNumber: "CV-2023-112",
        citizenId: null,
        scrutinyOfficialId: null,
        isAnonymized: true,
        rejectionReason: null,
        filingDistrict: "Bangalore"
      },
    ];
    casesList.forEach(c => this.cases.set(c.id, c));
  }


  async createAiRoutingLog(insertLog: InsertAiRoutingLog): Promise<AiRoutingLog> {
    const id = randomUUID();
    const log: AiRoutingLog = { 
      ...insertLog, 
      id, 
      createdAt: new Date(),
      inputText: insertLog.inputText ?? null,
      predictedDept: insertLog.predictedDept ?? null,
      predictedPriority: insertLog.predictedPriority ?? null,
      confidenceScore: insertLog.confidenceScore ?? null,
      reasoning: insertLog.reasoning ?? null,
      actionTaken: insertLog.actionTaken ?? null
    };
    this.aiRoutingLogs.set(id, log);
    return log;
  }

  async createFileTimelineEvent(insertEvent: InsertFileTimeline): Promise<FileTimeline> {
    const id = randomUUID();
    const event: FileTimeline = { 
      ...insertEvent, 
      id, 
      createdAt: new Date(),
      message: insertEvent.message ?? null,
      actorId: insertEvent.actorId ?? null,
      metadata: insertEvent.metadata ?? null
    };
    this.fileTimeline.set(id, event);
    return event;
  }

  async getFileTimeline(applicationId: string): Promise<FileTimeline[]> {
    return Array.from(this.fileTimeline.values())
      .filter(e => e.applicationId === applicationId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async getOverdueApplications(): Promise<Application[]> {
    const now = new Date();
    return Array.from(this.applications.values()).filter(app => 
        app.status !== "RESOLVED" && 
        app.status !== "REJECTED" && 
        app.status !== "CLOSED" &&
        app.slaDueAt && new Date(app.slaDueAt) < now
    );
  }

  private seedInvestigationData() {
    // Check if the example notification already exists to avoid duplicates
    const existing = Array.from(this.notifications.values()).find(n => n.type === "investigation_alert" && n.title.includes("Officer X"));
    if (!existing) {
      // Find an admin user
      const admins = Array.from(this.users.values()).filter(u => u.role === "admin");
      if (admins.length > 0) {
        const adminId = admins[0].id;
        const id = randomUUID();
        const notification: Notification = {
          id,
          userId: adminId, 
          type: "investigation_alert",
          title: "🚨 AI Investigation Alert: Officer X",
          message: `AI Engine detected suspicious behavior:\n\n` +
            `• CRITICAL: Recent rejection rate is extremely high (70.0%)\n` +
            `• Significant drop in processing speed. Averaging 8.0 files/day (Norm: 50.0/day)\n` +
            `• Possible Bias Detected: 85.0% of recent rejections are from 'Tribal Belt' district.\n\n` +
            `Recommendation: Immediate Inspection & Temporary Suspension Recommended`,
          read: false,
          applicationId: null,
          createdAt: new Date(),
        };
        this.notifications.set(id, notification);
        console.log("✅ Seeded example Investigation Alert notification");
      }
    }

  }
}


// Use file-based persistent storage (data persists across server restarts)
export const storage = process.env.DATABASE_URL ? new DatabaseStorage() : new MemStorage();
