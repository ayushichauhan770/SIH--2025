
import { storage } from "./storage";
import { insertUserSchema, insertApplicationSchema } from "@shared/schema";
import jwt from "jsonwebtoken";

async function runTest() {
      console.log("Starting Assignment Logic Test...");

      // 1. Create User A (Ram)
      const ram = await storage.createUser({
            username: "ram",
            password: "password",
            role: "official",
            fullName: "Ram Official",
            email: "ram@test.com",
            phone: "1234567890",
            department: "Health",
            aadharNumber: "1111"
      });
      console.log(`Created Ram: ${ram.id}`);

      // 2. Create User B (Arpit)
      const arpit = await storage.createUser({
            username: "arpit",
            password: "password",
            role: "official",
            fullName: "Arpit Tripathi",
            email: "arpit@test.com",
            phone: "0987654321",
            department: "Health",
            aadharNumber: "2222"
      });
      console.log(`Created Arpit: ${arpit.id}`);

      // 3. Create Application
      const app = await storage.createApplication({
            citizenId: "citizen-123",
            applicationType: "Health – General",
            description: "Test App",
            data: "{}",
            status: "Submitted"
      });
      console.log(`Created App: ${app.id} (Official: ${app.officialId})`);

      // 4. Simulate Arpit Accepting
      // In the real app, this happens via API which uses the token to get the ID
      // We will simulate the exact logic used in the route handler:
      // const application = await storage.assignApplication(req.params.id, req.user!.id);

      console.log("Arpit is accepting the application...");
      const updatedApp = await storage.assignApplication(app.id, arpit.id);

      console.log(`Updated App Official ID: ${updatedApp.officialId}`);

      if (updatedApp.officialId === arpit.id) {
            console.log("✅ SUCCESS: Application assigned to Arpit");
      } else if (updatedApp.officialId === ram.id) {
            console.log("❌ FAILURE: Application assigned to Ram (The Bug!)");
      } else {
            console.log(`❌ FAILURE: Application assigned to unknown: ${updatedApp.officialId}`);
      }
}

runTest().catch(console.error);
