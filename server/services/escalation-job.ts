
import { storage } from "../storage";
import { timeline } from "./timeline";

export class EscalationService {
  // Configurable SLAs (in milliseconds)
  private SLAs = {
    High: 24 * 60 * 60 * 1000,      // 24 hours
    Medium: 3 * 24 * 60 * 60 * 1000, // 3 days
    Low: 7 * 24 * 60 * 60 * 1000     // 7 days
  };

  calculateDueDate(priority: "High" | "Medium" | "Low"): Date {
    const ms = this.SLAs[priority] || this.SLAs.Low;
    return new Date(Date.now() + ms);
  }

  async runEscalationCheck() {
    console.log("⏰ ESCALATION_JOB: Checking for overdue files...");
    const overdueApps = await storage.getOverdueApplications();

    for (const app of overdueApps) {
      try {
        const nextLevel = (app.escalationLevel || 0) + 1;
        
        // True Escalation: Find a superior
        // 1. Get current official to know their level
        let currentLevel = 1;
        if (app.officialId) {
           const official = await storage.getUser(app.officialId);
           if (official) currentLevel = official.hierarchyLevel || 1;
        }

        // 2. Find a supervisor in same Dept with Level > Current
        // We'll need a new storage method or filter here
        // For efficiency, we will fetch all department officials and filter
        const allOfficials = await storage.getAllOfficials();
        const supervisors = allOfficials.filter(u => 
            u.department === app.department && 
            (u.hierarchyLevel || 1) > currentLevel
        );

        // 3. Pick the best supervisor (e.g. lowest workload) or just the first one
        let newOfficialId = app.officialId; // Fallback: maintain current assignment but flag as escalated
        let newOfficialName = "System";

        if (supervisors.length > 0) {
            // Sort by level (ascending) then workload
            supervisors.sort((a, b) => (a.hierarchyLevel || 1) - (b.hierarchyLevel || 1));
            const bestSupervisor = supervisors[0];
            newOfficialId = bestSupervisor.id;
            newOfficialName = bestSupervisor.fullName;
            
            // Re-assign
            await storage.assignApplication(app.id, bestSupervisor.id);
            console.log(` Escalated App ${app.trackingId} from Level ${currentLevel} to ${bestSupervisor.fullName} (Level ${bestSupervisor.hierarchyLevel})`);
        } else {
             console.log(` Escalation warning: No higher official found for ${app.department}. Flagging only.`);
        }

        // Perform Escalation Updates
        await storage.updateApplicationEscalation(app.id, nextLevel, newOfficialId); 
        await storage.updateApplicationStatus(app.id, "ESCALATED", "system", `Auto-escalated to Level ${nextLevel}`);

        // Log Timeline
        await timeline.logEvent(
          app.id,
          "SYSTEM",
          "ESCALATED",
          `SLA Breached! Escalated to Level ${nextLevel}. Assigned to: ${newOfficialName}`,
          undefined,
          { previousLevel: app.escalationLevel, newLevel: nextLevel, newOfficialId }
        );
        
        // TODO: Send Notifications (Email/SMS)
        console.log(`🚀 Escalated App ${app.trackingId} to Level ${nextLevel}`);

      } catch (e) {
        console.error(`ESCALATION_ERROR: Failed to escalate app ${app.id}`, e);
      }
    }
  }
  

  
  async runAutoApprovalCheck() {
    console.log("⚡ AUTO_APPROVAL: Checking for high-confidence applications...");
    // We need a storage method for this, or filter all (less efficient but works for now)
    const allApps = await storage.getAllApplications();
    const now = new Date();

    const pendingAutoApprovals = allApps.filter(app => 
        app.autoApprovalDate && 
        new Date(app.autoApprovalDate) < now &&
        !["Approved", "Rejected", "Auto-Approved", "Resolved"].includes(app.status)
    );

    for (const app of pendingAutoApprovals) {
        try {
            await storage.updateApplicationStatus(
                app.id, 
                "Auto-Approved", 
                "system", 
                "High AI Confidence (>90%) - Auto-approved after 36h"
            );

            await timeline.logEvent(
                app.id,
                "SYSTEM",
                "STATUS_CHANGED",
                "Application Auto-Approved by System (90%+ Confidence Match)",
                undefined,
                { confidence: app.aiConfidence }
            );

            console.log(`✅ Auto-Approved App ${app.trackingId}`);
        } catch (e) {
            console.error(`AUTO_APPROVE_ERROR: Failed to approve ${app.id}`, e);
        }
    }
  }
  
  startJob(intervalMinutes: number = 60) {
    // Run immediately on start
    this.runEscalationCheck();
    this.runAutoApprovalCheck();
    
    // Schedule
    setInterval(() => {
      this.runEscalationCheck();
      this.runAutoApprovalCheck();
    }, intervalMinutes * 60 * 1000);
  }
}

export const escalationManager = new EscalationService();
