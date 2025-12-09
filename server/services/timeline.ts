
import { storage } from "../storage";

export class TimelineService {
  async logEvent(
    applicationId: string, 
    actorType: "CITIZEN" | "OFFICER" | "SYSTEM" | "AI" | "ADMIN",
    eventType: "CREATED" | "AI_ROUTED" | "ASSIGNED" | "STATUS_CHANGED" | "ESCALATED" | "COMMENT_ADDED" | "RESOLVED",
    message: string,
    actorId?: string,
    metadata?: Record<string, any>
  ) {
    try {
      await storage.createFileTimelineEvent({
        applicationId,
        actorType,
        actorId,
        eventType,
        message,
        metadata: metadata ? JSON.stringify(metadata) : null
      });
    } catch (error) {
      console.error(`TIMELINE_ERROR: Failed to log event for app ${applicationId}:`, error);
    }
  }
}

export const timeline = new TimelineService();
