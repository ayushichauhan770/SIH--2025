import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  aadharNumber: text("aadhar_number"),
  department: text("department"),
  subDepartment: text("sub_department"),
  rating: integer("rating").default(0),
  assignedCount: integer("assigned_count").default(0),
  solvedCount: integer("solved_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const departments = pgTable("departments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description"),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const warnings = pgTable("warnings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  officialId: varchar("official_id").notNull(),
  message: text("message").notNull(),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
  read: boolean("read").default(false).notNull(),
});

export const applications = pgTable("applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  trackingId: text("tracking_id").notNull().unique(),
  applicationType: text("application_type").notNull(),
  department: text("department"),
  subDepartment: text("sub_department"),
  description: text("description").notNull(),
  status: text("status").notNull(),
  priority: text("priority").default("Normal").notNull(), // High, Medium, Normal
  remarks: text("remarks"), // Notes/comments on the application
  citizenId: varchar("citizen_id").notNull(),
  officialId: varchar("official_id"),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  assignedAt: timestamp("assigned_at"),
  lastUpdatedAt: timestamp("last_updated_at").defaultNow().notNull(),
  approvedAt: timestamp("approved_at"),
  autoApprovalDate: timestamp("auto_approval_date").notNull(),
  data: text("data").notNull(),
  image: text("image"),
  isSolved: boolean("is_solved").default(false),
  escalationLevel: integer("escalation_level").default(0),
});

export const applicationHistory = pgTable("application_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  applicationId: varchar("application_id").notNull(),
  status: text("status").notNull(),
  comment: text("comment"),
  updatedBy: varchar("updated_by").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const feedback = pgTable("feedback", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  applicationId: varchar("application_id").notNull(), // Removed unique constraint to allow multiple ratings per application
  citizenId: varchar("citizen_id").notNull(),
  officialId: varchar("official_id"), // Added to track which official is being rated
  rating: integer("rating").notNull(),
  comment: text("comment"),
  verified: boolean("verified").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const otpRecords = pgTable("otp_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  phone: text("phone"),
  email: text("email"),
  otp: text("otp").notNull(),
  purpose: text("purpose").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  verified: boolean("verified").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const blockchainHashes = pgTable("blockchain_hashes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  applicationId: varchar("application_id").notNull().unique(),
  documentHash: text("document_hash").notNull(),
  blockNumber: integer("block_number").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  read: boolean("read").default(false).notNull(),
  applicationId: varchar("application_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  rating: true,
  assignedCount: true,
  solvedCount: true,
});

export const loginSchema = z.object({
  username: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  password: z.string().optional(),
  loginType: z.enum(["password", "otp"]).default("password"),
});

export const insertApplicationSchema = createInsertSchema(applications).omit({
  id: true,
  trackingId: true,
  status: true,
  submittedAt: true,
  lastUpdatedAt: true,
  assignedAt: true,
  approvedAt: true,
  autoApprovalDate: true,
  officialId: true,
  isSolved: true,
  escalationLevel: true,
});

export const updateApplicationStatusSchema = z.object({
  status: z.enum(["Submitted", "Assigned", "In Progress", "Approved", "Rejected", "Auto-Approved"]),
  comment: z.string().optional(),
});

export const insertFeedbackSchema = createInsertSchema(feedback).omit({
  id: true,
  verified: true,
  createdAt: true,
});

export const verifyOtpSchema = z.object({
  phone: z.string().optional(),
  email: z.string().email().optional(),
  otp: z.string().length(6),
  purpose: z.string(),
});

export const generateOtpSchema = z.object({
  phone: z.string().optional(),
  email: z.string().email().optional(),
  purpose: z.string(),
  // When true, attempt to deliver the OTP to the configured MAIN_OTP_TARGET instead
  // of (or in addition to) the user-provided phone.
  sendToMain: z.boolean().optional(),
});

export const insertDepartmentSchema = createInsertSchema(departments).omit({
  id: true,
  createdAt: true,
});

export const insertWarningSchema = createInsertSchema(warnings).omit({
  id: true,
  sentAt: true,
  read: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type LoginData = z.infer<typeof loginSchema>;

export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type Application = typeof applications.$inferSelect;
export type UpdateApplicationStatus = z.infer<typeof updateApplicationStatusSchema>;

export type ApplicationHistory = typeof applicationHistory.$inferSelect;

export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type Feedback = typeof feedback.$inferSelect;

export type OTPRecord = typeof otpRecords.$inferSelect;
export type VerifyOTP = z.infer<typeof verifyOtpSchema>;
export type GenerateOTP = z.infer<typeof generateOtpSchema>;

export type BlockchainHash = typeof blockchainHashes.$inferSelect;
export type Notification = typeof notifications.$inferSelect;

export type Department = typeof departments.$inferSelect;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;

export type Warning = typeof warnings.$inferSelect;
export type InsertWarning = z.infer<typeof insertWarningSchema>;

// Election Candidate Selection Types
export interface Candidate {
  id: string;
  name: string;
  party: string;
  age: number;
  education: string;
  background: string;
  criminalRecords: number;
  netWorth: string;
  manifestoSummary: string;
  votes: number;
}
