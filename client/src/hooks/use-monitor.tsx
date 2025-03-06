import { useEffect, useRef } from "react";
import type { BehavioralEvent } from "@shared/schema";

export function useMonitor(sessionId: number) {
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/ws`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connection established");
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    const sendEvent = (event: BehavioralEvent) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ sessionId, event }));
      }
    };

    // Window focus monitoring
    const handleFocus = () => {
      sendEvent({
        type: "focus",
        timestamp: Date.now(),
        data: { focused: true }
      });
    };

    const handleBlur = () => {
      sendEvent({
        type: "blur",
        timestamp: Date.now(),
        data: { focused: false }
      });
    };

    // Mouse movement monitoring
    let lastMove = 0;
    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastMove > 1000) { // Throttle to once per second
        lastMove = now;
        sendEvent({
          type: "mousemove",
          timestamp: now,
          data: { x: e.clientX, y: e.clientY }
        });
      }
    };

    // Tab switching monitoring
    const handleVisibilityChange = () => {
      sendEvent({
        type: "tabswitch",
        timestamp: Date.now(),
        data: { hidden: document.hidden }
      });
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [sessionId]);
}