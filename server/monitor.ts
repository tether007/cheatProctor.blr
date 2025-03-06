import type { Server } from "http";
import { WebSocket, WebSocketServer } from "ws";
import { storage } from "./storage";
import type { BehavioralEvent } from "@shared/schema";

export function setupMonitoring(server: Server) {
  const wss = new WebSocketServer({ 
    server,
    path: "/ws", // Explicit WebSocket path
    clientTracking: true // Track connected clients
  });

  wss.on("error", (error) => {
    console.error("WebSocket server error:", error);
  });

  wss.on("connection", (ws: WebSocket) => {
    console.log("New WebSocket connection established");

    ws.on("error", (error) => {
      console.error("WebSocket connection error:", error);
    });

    ws.on("message", async (data: string) => {
      try {
        const event: { sessionId: number, event: BehavioralEvent } = JSON.parse(data);
        await storage.addBehavioralData(event.sessionId, event.event);
      } catch (err) {
        console.error("Error processing behavioral event:", err);
      }
    });

    ws.on("close", () => {
      console.log("WebSocket connection closed");
    });
  });
}