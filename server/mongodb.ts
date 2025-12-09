import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/smart_india_project";

let isConnected = false;

export async function connectMongoDB(): Promise<void> {
  if (isConnected) {
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI);
    isConnected = true;
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    throw error;
  }
}

export async function disconnectMongoDB(): Promise<void> {
  if (!isConnected) {
    return;
  }

  try {
    await mongoose.disconnect();
    isConnected = false;
    console.log("Disconnected from MongoDB");
  } catch (error) {
    console.error("Error disconnecting from MongoDB:", error);
  }
}

// MongoDB Schemas
import type { User, Application, ApplicationHistory, Feedback, OTPRecord, BlockchainHash, Notification, Department, Warning } from "@shared/schema";

const UserSchema = new mongoose.Schema<User>({
  id: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  aadharNumber: String,
  department: String,
  subDepartment: String,
  rating: { type: Number, default: 0 },
  assignedCount: { type: Number, default: 0 },
  solvedCount: { type: Number, default: 0 },
  suspendedUntil: Date,
  suspensionReason: String,
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const ApplicationSchema = new mongoose.Schema<Application>({
  id: { type: String, required: true, unique: true },
  trackingId: { type: String, required: true, unique: true },
  applicationType: { type: String, required: true },
  department: String,
  subDepartment: String,
  description: { type: String, required: true },
  status: { type: String, required: true },
  priority: { type: String, default: "Normal" },
  remarks: String,
  currentLocation: String,
  citizenId: { type: String, required: true },
  officialId: String,
  submittedAt: { type: Date, default: Date.now },
  assignedAt: Date,
  lastUpdatedAt: { type: Date, default: Date.now },
  approvedAt: Date,
  autoApprovalDate: { type: Date, required: true },
  data: { type: String, required: true },
  image: String,
  isSolved: { type: Boolean, default: false },
  escalationLevel: { type: Number, default: 0 },
}, { _id: false });

const ApplicationHistorySchema = new mongoose.Schema<ApplicationHistory>({
  id: { type: String, required: true, unique: true },
  applicationId: { type: String, required: true },
  status: { type: String, required: true },
  comment: String,
  updatedBy: { type: String, required: true },
  updatedAt: { type: Date, default: Date.now },
}, { _id: false });

const FeedbackSchema = new mongoose.Schema<Feedback>({
  id: { type: String, required: true, unique: true },
  applicationId: { type: String, required: true },
  citizenId: { type: String, required: true },
  officialId: String,
  rating: { type: Number, required: true },
  comment: String,
  verified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const OTPRecordSchema = new mongoose.Schema<OTPRecord>({
  id: { type: String, required: true, unique: true },
  phone: String,
  email: String,
  otp: { type: String, required: true },
  purpose: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  verified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const BlockchainHashSchema = new mongoose.Schema<BlockchainHash>({
  id: { type: String, required: true, unique: true },
  applicationId: { type: String, required: true, unique: true },
  documentHash: { type: String, required: true },
  blockNumber: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
}, { _id: false });

const NotificationSchema = new mongoose.Schema<Notification>({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  type: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  applicationId: String,
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const DepartmentSchema = new mongoose.Schema<Department>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true, unique: true },
  description: String,
  image: String,
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const WarningSchema = new mongoose.Schema<Warning>({
  id: { type: String, required: true, unique: true },
  officialId: { type: String, required: true },
  message: { type: String, required: true },
  sentAt: { type: Date, default: Date.now },
  read: { type: Boolean, default: false },
}, { _id: false });

// Create indexes for better performance
// Note: unique: true already creates indexes for id, username, trackingId, etc.
UserSchema.index({ email: 1 });
UserSchema.index({ phone: 1 });
ApplicationSchema.index({ citizenId: 1 });
ApplicationSchema.index({ officialId: 1 });
ApplicationSchema.index({ department: 1 });
ApplicationSchema.index({ subDepartment: 1 });
ApplicationHistorySchema.index({ applicationId: 1 });
FeedbackSchema.index({ applicationId: 1 });
FeedbackSchema.index({ officialId: 1 });
OTPRecordSchema.index({ phone: 1, email: 1, purpose: 1 });
NotificationSchema.index({ userId: 1 });
WarningSchema.index({ officialId: 1 });

export const UserModel = mongoose.model<User>("User", UserSchema);
export const ApplicationModel = mongoose.model<Application>("Application", ApplicationSchema);
export const ApplicationHistoryModel = mongoose.model<ApplicationHistory>("ApplicationHistory", ApplicationHistorySchema);
export const FeedbackModel = mongoose.model<Feedback>("Feedback", FeedbackSchema);
export const OTPRecordModel = mongoose.model<OTPRecord>("OTPRecord", OTPRecordSchema);
export const BlockchainHashModel = mongoose.model<BlockchainHash>("BlockchainHash", BlockchainHashSchema);
export const NotificationModel = mongoose.model<Notification>("Notification", NotificationSchema);
export const DepartmentModel = mongoose.model<Department>("Department", DepartmentSchema);
export const WarningModel = mongoose.model<Warning>("Warning", WarningSchema);

