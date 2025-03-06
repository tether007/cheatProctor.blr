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
  createAssessment(assessment: InsertAssessment & { instructorId: number }): Promise<Assessment>;
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

  async createAssessment(assessment: InsertAssessment & { instructorId: number }): Promise<Assessment> {
    const id = this.currentId.assessments++;
    const newAssessment: Assessment = { 
      ...assessment, 
      id, 
      active: false 
    };
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
      (assessment) => assessment.active
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

    try {
      // Call Python ML service for risk analysis
      const response = await fetch('http://localhost:5001/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ behavioral_data: behavioralData }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze behavioral data');
      }

      const analysisResult = await response.json();

      await this.updateSession(sessionId, {
        behavioralData,
        riskScore: analysisResult.risk_score
      });
    } catch (error) {
      console.error('Error analyzing behavioral data:', error);
      // Fallback to basic risk scoring if ML service fails
      let riskScore = session.riskScore || 0;
      const recentEvents = behavioralData.slice(-10);

      const tabSwitches = recentEvents.filter(e => e.type === "tabswitch").length;
      const blurs = recentEvents.filter(e => e.type === "blur").length;

      riskScore += tabSwitches * 3;
      riskScore += blurs * 4;

      riskScore = Math.min(100, Math.max(0, riskScore));

      await this.updateSession(sessionId, {
        behavioralData,
        riskScore
      });
    }
  }
}

export const storage = new MemStorage();