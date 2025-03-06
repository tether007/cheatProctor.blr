import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { setupMonitoring } from "./monitor";
import { storage } from "./storage";
import { insertAssessmentSchema, insertSessionSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  const httpServer = createServer(app);
  setupMonitoring(httpServer);

  // Assessment routes
  app.post("/api/assessments", async (req, res) => {
    if (req.user?.role !== "instructor") {
      return res.status(403).send("Only instructors can create assessments");
    }

    const parsedBody = insertAssessmentSchema.safeParse(req.body);
    if (!parsedBody.success) {
      return res.status(400).json(parsedBody.error);
    }

    const assessment = await storage.createAssessment({
      ...parsedBody.data,
      instructorId: req.user.id,
    });
    res.status(201).json(assessment);
  });

  app.get("/api/assessments/active", async (req, res) => {
    if (req.user?.role !== "student") {
      return res.status(403).send("Only students can view active assessments");
    }
    const assessments = await storage.getActiveAssessments();
    res.json(assessments);
  });

  app.get("/api/assessments/instructor", async (req, res) => {
    if (req.user?.role !== "instructor") {
      return res.status(403).send("Access denied");
    }
    const assessments = await storage.getAssessmentsByInstructor(req.user.id);
    res.json(assessments);
  });

  app.patch("/api/assessments/:id", async (req, res) => {
    if (req.user?.role !== "instructor") {
      return res.status(403).send("Only instructors can modify assessments");
    }

    const assessment = await storage.getAssessment(parseInt(req.params.id));
    if (!assessment) {
      return res.status(404).send("Assessment not found");
    }

    if (assessment.instructorId !== req.user.id) {
      return res.status(403).send("Access denied");
    }

    const updatedAssessment = await storage.updateAssessment(assessment.id, req.body);
    res.json(updatedAssessment);
  });


  // Session routes
  app.post("/api/sessions", async (req, res) => {
    if (req.user?.role !== "student") {
      return res.status(403).send("Only students can start assessment sessions");
    }

    const parsedBody = insertSessionSchema.safeParse(req.body);
    if (!parsedBody.success) {
      return res.status(400).json(parsedBody.error);
    }

    const session = await storage.createSession({
      ...parsedBody.data,
      userId: req.user.id,
    });
    res.status(201).json(session);
  });

  app.patch("/api/sessions/:id", async (req, res) => {
    const session = await storage.getSession(parseInt(req.params.id));
    if (!session) {
      return res.status(404).send("Session not found");
    }

    if (session.userId !== req.user?.id) {
      return res.status(403).send("Access denied");
    }

    const updatedSession = await storage.updateSession(session.id, req.body);
    res.json(updatedSession);
  });

  return httpServer;
}