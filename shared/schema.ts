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
  phone: text("phone"),
  aadharNumber: text("aadhar_number"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const applications = pgTable("applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  trackingId: text("tracking_id").notNull().unique(),
  applicationType: text("application_type").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull(),
  citizenId: varchar("citizen_id").notNull(),
  officialId: varchar("official_id"),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  assignedAt: timestamp("assigned_at"),
  lastUpdatedAt: timestamp("last_updated_at").defaultNow().notNull(),
  approvedAt: timestamp("approved_at"),
  autoApprovalDate: timestamp("auto_approval_date").notNull(),
  data: text("data").notNull(),
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
  applicationId: varchar("application_id").notNull().unique(),
  citizenId: varchar("citizen_id").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  verified: boolean("verified").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const otpRecords = pgTable("otp_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  phone: text("phone").notNull(),
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
});

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
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
  phone: z.string(),
  otp: z.string().length(6),
  purpose: z.string(),
});

export const generateOtpSchema = z.object({
  phone: z.string(),
  purpose: z.string(),
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
