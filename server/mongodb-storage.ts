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
import { randomUUID } from "crypto";
import type { IStorage } from "./storage";
import {
  UserModel,
  ApplicationModel,
  ApplicationHistoryModel,
  FeedbackModel,
  OTPRecordModel,
  BlockchainHashModel,
  NotificationModel,
  DepartmentModel,
  WarningModel,
} from "./mongodb";

export class MongoDBStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const user = await UserModel.findOne({ id }).lean();
    return user as User | undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const user = await UserModel.findOne({ username }).lean();
    return user as User | undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const user = await UserModel.findOne({ email }).lean();
    return user as User | undefined;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const user = await UserModel.findOne({ phone }).lean();
    return user as User | undefined;
  }

  async getUserByAadhar(aadharNumber: string): Promise<User | undefined> {
    const user = await UserModel.findOne({ aadharNumber }).lean();
    return user as User | undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      phone: insertUser.phone ?? null,
      aadharNumber: insertUser.aadharNumber ?? null,
      department: insertUser.department ?? null,
      subDepartment: insertUser.subDepartment ?? null,
      createdAt: new Date(),
      rating: 0,
      assignedCount: 0,
      solvedCount: 0,
      id,
    };
    await new UserModel(user).save();
    return user;
  }

  async updateUserPassword(id: string, password: string): Promise<void> {
    await UserModel.updateOne({ id }, { password });
  }

  async createApplication(insertApplication: InsertApplication): Promise<Application> {
    const id = randomUUID();
    // Generate tracking ID based on current year and count
    const year = new Date().getFullYear();
    const count = await ApplicationModel.countDocuments({ trackingId: { $regex: `^APP-${year}-` } });
    const trackingId = `APP-${year}-${String(count + 1).padStart(6, '0')}`;
    const now = new Date();
    const autoApprovalDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

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

    await new ApplicationModel(application).save();
    await this.addApplicationHistory(id, "Submitted", insertApplication.citizenId, "Application submitted");
    return application;
  }

  async getApplication(id: string): Promise<Application | undefined> {
    const app = await ApplicationModel.findOne({ id }).lean();
    return app as Application | undefined;
  }

  async getApplicationByTrackingId(trackingId: string): Promise<Application | undefined> {
    const app = await ApplicationModel.findOne({ trackingId }).lean();
    return app as Application | undefined;
  }

  async getUserApplications(citizenId: string): Promise<Application[]> {
    const apps = await ApplicationModel.find({ citizenId }).sort({ submittedAt: -1 }).lean();
    return apps as Application[];
  }

  async getOfficialApplications(officialId?: string): Promise<Application[]> {
    if (!officialId) return [];
    const apps = await ApplicationModel.find({ officialId }).sort({ submittedAt: -1 }).lean();
    return apps as Application[];
  }

  async getUnassignedApplicationsByDepartment(department: string): Promise<Application[]> {
    const normalizedDept = department.split('–')[0].trim();
    const apps = await ApplicationModel.find({
      status: "Submitted",
      officialId: null,
      department: { $regex: `^${normalizedDept}`, $options: 'i' }
    }).sort({ submittedAt: -1 }).lean();
    return apps as Application[];
  }

  async getAllOfficials(): Promise<User[]> {
    const officials = await UserModel.find({ role: "official" }).lean();
    return officials as User[];
  }

  async getAllApplications(): Promise<Application[]> {
    const apps = await ApplicationModel.find().sort({ submittedAt: -1 }).lean();
    return apps as Application[];
  }

  async updateApplicationStatus(id: string, status: string, updatedBy: string, comment?: string): Promise<Application> {
    const update: any = {
      status,
      lastUpdatedAt: new Date(),
    };

    if (status === "Approved" || status === "Auto-Approved") {
      update.approvedAt = new Date();
      update.isSolved = true;
    }

    await ApplicationModel.updateOne({ id }, update);
    await this.addApplicationHistory(id, status, updatedBy, comment);
    const app = await this.getApplication(id);
    if (!app) throw new Error("Application not found");
    return app;
  }

  async assignApplication(id: string, officialId: string): Promise<Application> {
    const now = new Date();
    await ApplicationModel.updateOne(
      { id },
      {
        officialId,
        status: "Assigned",
        assignedAt: now,
        lastUpdatedAt: now,
      }
    );
    await this.addApplicationHistory(id, "Assigned", officialId, "Application assigned to official");
    const app = await this.getApplication(id);
    if (!app) throw new Error("Application not found");
    return app;
  }

  async getOfficialCurrentWorkload(officialId: string): Promise<number> {
    const count = await ApplicationModel.countDocuments({
      officialId,
      status: { $in: ["Assigned", "In Progress"] },
    });
    return count;
  }

  async getLastAssignmentTime(officialId: string): Promise<Date | null> {
    const app = await ApplicationModel.findOne({ officialId })
      .sort({ assignedAt: -1 })
      .lean();
    return app?.assignedAt || null;
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
    await new ApplicationHistoryModel(history).save();
    return history;
  }

  async getApplicationHistory(applicationId: string): Promise<ApplicationHistory[]> {
    const history = await ApplicationHistoryModel.find({ applicationId })
      .sort({ updatedAt: 1 })
      .lean();
    return history as ApplicationHistory[];
  }

  async createFeedback(feedback: InsertFeedback): Promise<Feedback> {
    const id = randomUUID();
    const newFeedback: Feedback = {
      ...feedback,
      id,
      verified: false,
      createdAt: new Date(),
    };
    await new FeedbackModel(newFeedback).save();
    return newFeedback;
  }

  async updateFeedback(id: string, rating: number, comment?: string): Promise<Feedback> {
    await FeedbackModel.updateOne({ id }, { rating, comment: comment || null });
    const feedback = await FeedbackModel.findOne({ id }).lean();
    if (!feedback) throw new Error("Feedback not found");
    return feedback as Feedback;
  }

  async getFeedbackByApplicationId(applicationId: string): Promise<Feedback | undefined> {
    const feedback = await FeedbackModel.findOne({ applicationId }).lean();
    return feedback as Feedback | undefined;
  }

  async getFeedbackByApplicationAndOfficialId(applicationId: string, officialId: string): Promise<Feedback | undefined> {
    const feedback = await FeedbackModel.findOne({ applicationId, officialId }).lean();
    return feedback as Feedback | undefined;
  }

  async getOfficialRatings(officialId: string): Promise<Feedback[]> {
    const ratings = await FeedbackModel.find({ officialId, verified: true }).lean();
    return ratings as Feedback[];
  }

  async verifyFeedback(id: string): Promise<void> {
    await FeedbackModel.updateOne({ id }, { verified: true });
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
    await new OTPRecordModel(record).save();
    return record;
  }

  async getOTP(identifier: string, type: "phone" | "email", purpose: string): Promise<OTPRecord | undefined> {
    const query: any = { purpose, verified: false };
    if (type === "phone") {
      query.phone = identifier;
    } else {
      query.email = identifier;
    }
    const record = await OTPRecordModel.findOne(query).sort({ createdAt: -1 }).lean();
    return record as OTPRecord | undefined;
  }

  async getLatestOTPRecord(identifier: string, type: "phone" | "email", purpose: string): Promise<OTPRecord | undefined> {
    const query: any = { purpose };
    if (type === "phone") {
      query.phone = identifier;
    } else {
      query.email = identifier;
    }
    const record = await OTPRecordModel.findOne(query).sort({ createdAt: -1 }).lean();
    return record as OTPRecord | undefined;
  }

  async verifyOTP(id: string): Promise<void> {
    await OTPRecordModel.updateOne({ id }, { verified: true });
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
    await new BlockchainHashModel(blockchainHash).save();
    return blockchainHash;
  }

  async getBlockchainHash(applicationId: string): Promise<BlockchainHash | undefined> {
    const hash = await BlockchainHashModel.findOne({ applicationId }).lean();
    return hash as BlockchainHash | undefined;
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
    await new NotificationModel(notification).save();
    return notification;
  }

  async getUserNotifications(userId: string): Promise<Notification[]> {
    const notifications = await NotificationModel.find({ userId })
      .sort({ createdAt: -1 })
      .lean();
    return notifications as Notification[];
  }

  async markNotificationAsRead(id: string): Promise<void> {
    await NotificationModel.updateOne({ id }, { read: true });
  }

  async createDepartment(dept: InsertDepartment): Promise<Department> {
    const id = randomUUID();
    const department: Department = {
      ...dept,
      id,
      createdAt: new Date(),
    };
    await new DepartmentModel(department).save();
    return department;
  }

  async getAllDepartments(): Promise<Department[]> {
    const departments = await DepartmentModel.find().lean();
    return departments as Department[];
  }

  async getDepartment(id: string): Promise<Department | undefined> {
    const dept = await DepartmentModel.findOne({ id }).lean();
    return dept as Department | undefined;
  }

  async createWarning(warning: InsertWarning): Promise<Warning> {
    const id = randomUUID();
    const newWarning: Warning = {
      ...warning,
      id,
      sentAt: new Date(),
      read: false,
    };
    await new WarningModel(newWarning).save();
    return newWarning;
  }

  async getWarnings(officialId: string): Promise<Warning[]> {
    const warnings = await WarningModel.find({ officialId })
      .sort({ sentAt: -1 })
      .lean();
    return warnings as Warning[];
  }

  async markWarningAsRead(id: string): Promise<void> {
    await WarningModel.updateOne({ id }, { read: true });
  }

  async updateUserStats(userId: string, rating: number, solvedCount: number, assignedCount: number): Promise<User> {
    await UserModel.updateOne({ id: userId }, { rating, solvedCount, assignedCount });
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");
    return user;
  }

  async updateApplicationEscalation(id: string, escalationLevel: number, officialId: string): Promise<Application> {
    await ApplicationModel.updateOne({ id }, { escalationLevel, officialId });
    const app = await this.getApplication(id);
    if (!app) throw new Error("Application not found");
    return app;
  }

  async markApplicationSolved(id: string, isSolved: boolean): Promise<Application> {
    await ApplicationModel.updateOne({ id }, { isSolved });
    const app = await this.getApplication(id);
    if (!app) throw new Error("Application not found");
    return app;
  }

  async clearAllData(): Promise<void> {
    console.log("🗑️  Clearing all data from database...");
    await UserModel.deleteMany({});
    await ApplicationModel.deleteMany({});
    await ApplicationHistoryModel.deleteMany({});
    await FeedbackModel.deleteMany({});
    await OTPRecordModel.deleteMany({});
    await BlockchainHashModel.deleteMany({});
    await NotificationModel.deleteMany({});
    await DepartmentModel.deleteMany({});
    await WarningModel.deleteMany({});
    console.log("✅ All data cleared successfully!");
  }
}

