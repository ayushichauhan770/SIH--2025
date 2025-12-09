
import { storage } from "./storage";
import { User, Application } from "@shared/schema";

interface InvestigationResult {
  officialId: string;
  officialName: string;
  flags: string[];
  score: number; // 0 to 100, where 100 is highly suspicious
  details: string;
  recommendation: string;
}

export class AutonomousInvestigationEngine {


  // Calculate rejection rate for a set of applications
  private calculateRejectionRate(apps: Application[]): number {
    if (apps.length === 0) return 0;
    const rejected = apps.filter(a => a.status === 'Rejected').length;
    return rejected / apps.length;
  }

  // Calculate average processed per day
  private calculateDailyProcessingRate(apps: Application[], days: number): number {
    if (days <= 0) return 0;
    const processed = apps.filter(a => 
      ['Approved', 'Rejected'].includes(a.status)
    ).length;
    return processed / days;
  }

  async analyzeOfficial(official: User): Promise<InvestigationResult | null> {
    const apps = await storage.getOfficialApplications(official.id);
    
    // Timeframes
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Filter apps by timeframe
    const recentApps = apps.filter(a => new Date(a.lastUpdatedAt) >= threeDaysAgo);
    const historicalApps = apps.filter(a => {
      const d = new Date(a.lastUpdatedAt);
      return d >= thirtyDaysAgo && d < threeDaysAgo;
    });

    const flags: string[] = [];
    let score = 0;

    // 1. Check for Sudden Spike in Rejections
    const recentRejectionRate = this.calculateRejectionRate(recentApps);
    const historicalRejectionRate = this.calculateRejectionRate(historicalApps);

    // If historical is 0, assume a baseline of 10% for sensitivity, unless they had 0 apps.
    const baselineRate = historicalRejectionRate || 0.1;
    
    if (recentApps.length >= 5) { // Minimum sample size
        if (recentRejectionRate > 0.60) { // Absolute high threshold
            flags.push(`CRITICAL: Recent rejection rate is extremely high (${(recentRejectionRate * 100).toFixed(1)}%)`);
            score += 40;
        } else if (recentRejectionRate > baselineRate * 2) { // 2x increase
            flags.push(`Abnormal spike in rejections detected (Recent: ${(recentRejectionRate * 100).toFixed(1)}% vs Normal: ${(historicalRejectionRate * 100).toFixed(1)}%)`);
            score += 30;
        }
    }

    // 2. Check for Processing Delays / Drop in Performance
    // "Officer X normally processes 50 DL renewals/day. Suddenly he processes only 8/day"
    const recentDailyRate = this.calculateDailyProcessingRate(recentApps, 3);
    const historicalDailyRate = this.calculateDailyProcessingRate(historicalApps, 27); // Remaining 27 days

    if (historicalDailyRate > 5 && recentDailyRate < historicalDailyRate * 0.3) { // < 30% of normal speed
        flags.push(`Significant drop in processing speed. Averaging ${recentDailyRate.toFixed(1)} files/day (Norm: ${historicalDailyRate.toFixed(1)}/day)`);
        score += 30;
    }

    // 3. Geographic/Demographic Bias (Simulated via District)
    // "All rejections from tribal belt area"
    // We analyze the rejected applications in the recent batch
    const rejectedRecent = recentApps.filter(a => a.status === 'Rejected');
    if (rejectedRecent.length >= 3) {
      const districtCounts = new Map<string, number>();
      for (const app of rejectedRecent) {
        // Need to fetch citizen to get district
        // Note: checking citizen district for every app might be slow, but ok for a specialized engine run periodically
        const citizen = await storage.getUser(app.citizenId);
        if (citizen && citizen.district) {
           const count = districtCounts.get(citizen.district) || 0;
           districtCounts.set(citizen.district, count + 1);
        }
      }

      // If one district accounts for > 80% of rejections
      for (const [district, count] of Array.from(districtCounts.entries())) {
          if (count / rejectedRecent.length > 0.8) {
              flags.push(`Possible Bias Detected: ${((count / rejectedRecent.length) * 100).toFixed(1)}% of recent rejections are from '${district}' district.`);
              score += 50;
          }
      }
    }

    // 4. Duplicate/Spam Check (User applying across many schemes)
    // This looks for patterns in the apps assigned to this official where the same user is applying repeatedly
    // (This might arguably be a flag on the Citizen, but if an Official is approving duplicates, that's also bad. 
    // The prompt says "User applies across many schemes incorrectly" -> Triggers investigation.
    // If the investigation is ON THE OFFICIAL, this might imply the official is colluding or failing to reject duplicates.
    // If the investigation is ON THE USER, that's a separate entity. 
    // The prompt focuses on "Officer X...". So I will focus on Officer Performance.
    
    // However, I'll add a check: Is the official approving multiple apps from same user in short time?
    const approvedRecent = recentApps.filter(a => a.status === 'Approved');
    const userApprovalCounts = new Map<string, number>();
    for (const app of approvedRecent) {
        const count = userApprovalCounts.get(app.citizenId) || 0;
        userApprovalCounts.set(app.citizenId, count + 1);
    }
    for (const [userId, count] of Array.from(userApprovalCounts.entries())) {
        if (count >= 4) {
             flags.push(`Suspicious Activity: Approved ${count} applications for a single citizen (ID: ${userId}) in the last 3 days.`);
             score += 20;
        }
    }


    if (score >= 30) {
        return {
            officialId: official.id,
            officialName: official.fullName,
            flags,
            score,
            details: flags.join('\n'),
            recommendation: score > 60 ? "Immediate Inspection & Temporary Suspension Recommended" : "Warning & Performance Review Recommended"
        };
    }

    return null;
  }

  async runFullInvestigation() {
    console.log("🕵️‍♂️ [AI Investigation Engine] Starting autonomous scan...");
    const officials = await storage.getAllOfficials();
    let suspiciousCount = 0;

    for (const official of officials) {
        const result = await this.analyzeOfficial(official);
        if (result) {
            console.log(`⚠️ TRIGGERED: Suspicious activity detected for ${official.fullName} (Score: ${result.score})`);
            suspiciousCount++;
            
            // Generate notification for Admins
            // Since we don't have an easy "getAdmins", checking if we can notify a generic system channel or similar.
            // For now, I'll use a hack to notify the official themselves (as a warning) OR 
            // Better: Store a global notification or find a way to notify admin.
            // I'll create a notification for the Official informing them of the investigation (Transparency?) 
            // OR strictly for Admin.
            // The prompt says: "Every details will be showen to the admin a notification popup"
            
            // Strategy: I will try to find users with role 'admin'.
            // Accessing internal storage is not clean, but I can add a method to storage.ts.
            // For this step I will assume there is a method `storage.getAdmins()`. 
            // I will implement that method in the next tool call.
            
            const admins = await storage.getAllAdmins();
            for (const admin of admins) {
                await storage.createNotification(
                    admin.id,
                    "investigation_alert",
                    `🚨 AI Investigation Alert: ${official.fullName}`,
                    `AI Engine detected suspicious behavior:\n${result.details}\n\nRecommendation: ${result.recommendation}`,
                    undefined // No specific app ID, general alert
                );
            }
        }
    }
    console.log(`🕵️‍♂️ [AI Investigation Engine] Scan complete. ${suspiciousCount} officers flagged.`);
  }
}

export const investigationEngine = new AutonomousInvestigationEngine();
