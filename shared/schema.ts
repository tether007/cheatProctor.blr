import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["student", "instructor", "admin"] }).notNull(),
  name: text("name").notNull(),
});

export const assessments = pgTable("assessments", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  duration: integer("duration").notNull(), // in minutes
  instructorId: integer("instructor_id").notNull(),
  active: boolean("active").notNull().default(false),
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  assessmentId: integer("assessment_id").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  riskScore: integer("risk_score"),
  behavioralData: json("behavioral_data"),
  consentGiven: boolean("consent_given").notNull().default(false),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
  name: true,
});

export const insertAssessmentSchema = createInsertSchema(assessments).pick({
  title: true,
  description: true,
  duration: true,
});

export const insertSessionSchema = createInsertSchema(sessions).pick({
  userId: true,
  assessmentId: true,
  startTime: true,
  consentGiven: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Assessment = typeof assessments.$inferSelect;
export type InsertAssessment = z.infer<typeof insertAssessmentSchema>;
export type Session = typeof sessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;

export type BehavioralEvent = {
  type: "focus" | "blur" | "mousemove" | "tabswitch";
  timestamp: number;
  data: Record<string, any>;
};