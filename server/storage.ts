import { users, applications, applicationHistory, feedback, otpRecords, notifications, departments, warnings, judges, cases, hearings } from "@shared/schema";
import type {
  User,
  InsertUser,
  Application,
  InsertApplication,
  ApplicationHistory,
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
} from "@shared/schema";
import { randomUUID, createHash } from "crypto";
import fs from "fs";
import path from "path";

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
  getAllApplications(): Promise<Application[]>;
  updateApplicationStatus(id: string, status: string, updatedBy: string, comment?: string): Promise<Application>;
  assignApplication(id: string, officialId: string): Promise<Application>;
  getOfficialCurrentWorkload(officialId: string): Promise<number>;
  getLastAssignmentTime(officialId: string): Promise<Date | null>;

  addApplicationHistory(applicationId: string, status: string, updatedBy: string, comment?: string): Promise<ApplicationHistory>;
  getApplicationHistory(applicationId: string): Promise<ApplicationHistory[]>;

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
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private applications: Map<string, Application>;
  private applicationHistory: Map<string, ApplicationHistory[]>;
  private feedback: Map<string, Feedback>;
  private otpRecords: Map<string, OTPRecord>;
  private blockchainHashes: Map<string, BlockchainHash>;
  private notifications: Map<string, Notification>;
  private departments: Map<string, Department>;
  private warnings: Map<string, Warning>;
  private judges: Map<string, Judge>;
  private cases: Map<string, Case>;
  private hearings: Map<string, Hearing>;
  private dataDir = '.data';
  private dataFile = path.join(process.cwd(), '.data', 'db.json');

  constructor() {
    this.users = new Map();
    this.applications = new Map();
    this.applicationHistory = new Map();
    this.feedback = new Map();
    this.otpRecords = new Map();
    this.blockchainHashes = new Map();
    this.notifications = new Map();
    this.departments = new Map();
    this.warnings = new Map();
    this.judges = new Map();
    this.cases = new Map();
    this.hearings = new Map();

    // Ensure data directory exists
    if (!fs.existsSync(path.join(process.cwd(), this.dataDir))) {
      fs.mkdirSync(path.join(process.cwd(), this.dataDir));
    }

    // Try to load from disk first
    this.loadFromDisk();

    // If no judges (fresh install or empty db), seed data
    if (this.judges.size === 0) {
      this.seedJudiciaryData();
      this.seedJudiciaryData();
      this.saveToDisk();
    }
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(this.dataFile)) {
        const data = JSON.parse(fs.readFileSync(this.dataFile, 'utf-8'));
        
        // Helper to load map from array of values
        const loadMap = (targetMap: Map<string, any>, sourceArray: any[], keyField: string = 'id') => {
          if (Array.isArray(sourceArray)) {
            sourceArray.forEach(item => targetMap.set(item[keyField], item));
          }
        };

        loadMap(this.users, data.users);
        loadMap(this.applications, data.applications);
        
        // History is a map of arrays, handle separately
        if (data.applicationHistory) {
          Object.entries(data.applicationHistory).forEach(([key, value]) => {
            this.applicationHistory.set(key, value as ApplicationHistory[]);
          });
        }

        loadMap(this.feedback, data.feedback);
        loadMap(this.otpRecords, data.otpRecords);
        loadMap(this.blockchainHashes, data.blockchainHashes);
        loadMap(this.notifications, data.notifications);
        loadMap(this.departments, data.departments);
        loadMap(this.warnings, data.warnings);
        loadMap(this.judges, data.judges);
        loadMap(this.cases, data.cases);
        loadMap(this.hearings, data.hearings);

        console.log(`✅ Data loaded from disk: ${this.users.size} users, ${this.cases.size} cases, ${this.judges.size} judges`);
      }
    } catch (error) {
      console.error("Failed to load data from disk:", error);
      // Fallback to empty/seed data if load fails
    }
  }

  private saveToDisk() {
    try {
      const data = {
        users: Array.from(this.users.values()),
        applications: Array.from(this.applications.values()),
        applicationHistory: Object.fromEntries(this.applicationHistory),
        feedback: Array.from(this.feedback.values()),
        otpRecords: Array.from(this.otpRecords.values()),
        blockchainHashes: Array.from(this.blockchainHashes.values()),
        notifications: Array.from(this.notifications.values()),
        departments: Array.from(this.departments.values()),
        warnings: Array.from(this.warnings.values()),
        judges: Array.from(this.judges.values()),
        cases: Array.from(this.cases.values()),
        hearings: Array.from(this.hearings.values()),
      };

      fs.writeFileSync(this.dataFile, JSON.stringify(data, null, 2));
      console.log("💾 Data saved to disk");
    } catch (error) {
      console.error("Failed to save data to disk:", error);
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
      id,
    };
    this.users.set(id, user);
    this.users.set(id, user);
    this.saveToDisk();
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
      priority: insertApplication.priority ?? "Normal",
      remarks: insertApplication.remarks ?? null,
      submittedAt: now,
      lastUpdatedAt: now,
      assignedAt: null,
      approvedAt: null,
      officialId: null,
      autoApprovalDate,
      image: insertApplication.image ?? null,
      isSolved: false,
      escalationLevel: 0,
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
    if (officialId) {
      return Array.from(this.applications.values())
        .filter(app => app.officialId === officialId)
        .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    }
    return Array.from(this.applications.values());
  }

  async getUnassignedApplicationsByDepartment(department: string): Promise<Application[]> {
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
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
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

  async getAllApplications(): Promise<Application[]> {
    return Array.from(this.applications.values())
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  }

  async updateApplicationStatus(id: string, status: string, updatedBy: string, comment?: string): Promise<Application> {
    const app = this.applications.get(id);
    if (!app) throw new Error("Application not found");

    const updated: Application = {
      ...app,
      status,
      lastUpdatedAt: new Date(),
      approvedAt: ["Approved", "Auto-Approved", "Rejected"].includes(status) ? new Date() : app.approvedAt,
    };

    this.applications.set(id, updated);
    await this.addApplicationHistory(id, status, updatedBy, comment);

    if (status === "Approved" || status === "Auto-Approved") {
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
    
    // Also clear from disk
    if (fs.existsSync(this.dataFile)) {
      fs.unlinkSync(this.dataFile);
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
}

// Use in-memory storage with file persistence
export const storage = new MemStorage();
