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
  private dataDir = '.data';

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

    // Persistence disabled as per user request
    // this.loadFromDisk();
  }

  // private loadFromDisk() { ... }
  // private async saveToDisk() { ... }

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
      createdAt: new Date(),
      rating: 0,
      assignedCount: 0,
      solvedCount: 0,
      id,
    };
    this.users.set(id, user);
    // await this.saveToDisk();
    return user;
  }

  async updateUserPassword(id: string, password: string): Promise<void> {
    const user = this.users.get(id);
    if (!user) throw new Error("User not found");
    this.users.set(id, { ...user, password });
    // await this.saveToDisk();
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
    // await this.saveToDisk();
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

    // await this.saveToDisk();
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
    // await this.saveToDisk();
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

    // No need to save here as it's called by other methods that save
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
    // await this.saveToDisk();
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
    // await this.saveToDisk();
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
    // await this.saveToDisk();
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
    }
  }

  async updateUserStats(userId: string, rating: number, solvedCount: number, assignedCount: number): Promise<User> {
    const user = this.users.get(userId);
    if (!user) throw new Error("User not found");
    const updated = { ...user, rating, solvedCount, assignedCount };
    this.users.set(userId, updated);
    // await this.saveToDisk();
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
    // await this.saveToDisk();
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
    // await this.saveToDisk();
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
    console.log("✅ All data cleared successfully!");
  }

  private generateHash(data: string): string {

    return createHash('sha256').update(data + Date.now()).digest('hex');
  }
}

// Use in-memory storage (data resets on server restart)
export const storage = new MemStorage();
