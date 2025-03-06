import { User, InsertUser, Assessment, InsertAssessment, Session, InsertSession, BehavioralEvent } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Assessment operations
  createAssessment(assessment: InsertAssessment): Promise<Assessment>;
  getAssessment(id: number): Promise<Assessment | undefined>;
  getAssessmentsByInstructor(instructorId: number): Promise<Assessment[]>;
  getActiveAssessments(): Promise<Assessment[]>;
  updateAssessment(id: number, data: Partial<Assessment>): Promise<Assessment>;

  // Session operations
  createSession(session: InsertSession): Promise<Session>;
  updateSession(id: number, data: Partial<Session>): Promise<Session>;
  getSession(id: number): Promise<Session | undefined>;
  addBehavioralData(sessionId: number, event: BehavioralEvent): Promise<void>;
  
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private assessments: Map<number, Assessment>;
  private sessions: Map<number, Session>;
  sessionStore: session.Store;
  private currentId: { [key: string]: number };

  constructor() {
    this.users = new Map();
    this.assessments = new Map();
    this.sessions = new Map();
    this.currentId = { users: 1, assessments: 1, sessions: 1 };
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId.users++;
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createAssessment(assessment: InsertAssessment): Promise<Assessment> {
    const id = this.currentId.assessments++;
    const newAssessment = { ...assessment, id, active: false };
    this.assessments.set(id, newAssessment);
    return newAssessment;
  }

  async getAssessment(id: number): Promise<Assessment | undefined> {
    return this.assessments.get(id);
  }

  async getAssessmentsByInstructor(instructorId: number): Promise<Assessment[]> {
    return Array.from(this.assessments.values()).filter(
      (assessment) => assessment.instructorId === instructorId,
    );
  }

  async getActiveAssessments(): Promise<Assessment[]> {
    return Array.from(this.assessments.values()).filter(
      (assessment) => assessment.active,
    );
  }

  async updateAssessment(id: number, data: Partial<Assessment>): Promise<Assessment> {
    const assessment = this.assessments.get(id);
    if (!assessment) throw new Error("Assessment not found");

    const updatedAssessment = { ...assessment, ...data };
    this.assessments.set(id, updatedAssessment);
    return updatedAssessment;
  }

  async createSession(session: InsertSession): Promise<Session> {
    const id = this.currentId.sessions++;
    const newSession: Session = { 
      ...session, 
      id,
      endTime: null,
      riskScore: 0,
      behavioralData: [],
      consentGiven: session.consentGiven || false
    };
    this.sessions.set(id, newSession);
    return newSession;
  }

  async updateSession(id: number, data: Partial<Session>): Promise<Session> {
    const session = this.sessions.get(id);
    if (!session) throw new Error("Session not found");
    
    const updatedSession = { ...session, ...data };
    this.sessions.set(id, updatedSession);
    return updatedSession;
  }

  async getSession(id: number): Promise<Session | undefined> {
    return this.sessions.get(id);
  }

  async addBehavioralData(sessionId: number, event: BehavioralEvent): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error("Session not found");

    const behavioralData = session.behavioralData as BehavioralEvent[] || [];
    behavioralData.push(event);

    // Enhanced risk score calculation
    let riskScore = session.riskScore || 0;
    const recentEvents = behavioralData.slice(-10); // Look at last 10 events

    // Calculate risk based on event frequency and patterns
    const tabSwitches = recentEvents.filter(e => e.type === "tabswitch").length;
    const blurs = recentEvents.filter(e => e.type === "blur").length;
    const mouseMoves = recentEvents.filter(e => e.type === "mousemove").length;

    // Increase risk for:
    // - Frequent tab switching (max +30)
    riskScore += tabSwitches * 3;

    // - Window blur events (max +40)
    riskScore += blurs * 4;

    // - Very low mouse movement (potential automation)
    if (mouseMoves < 3) {
      riskScore += 10;
    }

    // Normalize to 0-100 range
    riskScore = Math.min(100, Math.max(0, riskScore));

    await this.updateSession(sessionId, {
      behavioralData,
      riskScore
    });
  }
}

export const storage = new MemStorage();