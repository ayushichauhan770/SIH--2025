import { storage } from "./storage";
import bcrypt from "bcryptjs";

export async function seedData() {
      // Always clear all data first to ensure fresh start
      await storage.clearAllData();

      console.log("🌱 Seeding fresh initial data...");

      const hashedPassword = await bcrypt.hash("password123", 10);

      // 1. Create Admin
      await storage.createUser({
            username: "admin",
            password: hashedPassword,
            fullName: "System Admin",
            email: "admin@example.com",
            phone: "9999999999",
            role: "admin",
            department: "Administration",
            aadharNumber: "000000000000"
      });
      console.log("Created admin user");

      // 1.1 Create Department Admins
      await storage.createUser({
            username: "health_admin",
            password: hashedPassword,
            fullName: "Health Admin",
            email: "health.admin@example.com",
            phone: "9999999991",
            role: "admin",
            department: "Health",
            aadharNumber: "000000000001"
      });
      console.log("Created health_admin user");

      await storage.createUser({
            username: "police_admin",
            password: hashedPassword,
            fullName: "Police Admin",
            email: "police.admin@example.com",
            phone: "9999999992",
            role: "admin",
            department: "Police",
            aadharNumber: "000000000002"
      });
      console.log("Created police_admin user");

      // 2. Create Departments
      const departments = [
            { name: "Health", description: "Healthcare and medical services" },
            { name: "Education", description: "Schools and educational services" },
            { name: "Police", description: "Law enforcement and safety" },
            { name: "Municipal", description: "City maintenance and services" },
            { name: "Revenue", description: "Tax and land revenue" }
      ];

      for (const dept of departments) {
            await storage.createDepartment({
                  name: dept.name,
                  description: dept.description,
                  image: `https://placehold.co/600x400?text=${dept.name}`
            });
      }
      console.log("Created departments");

      // 3. Create Officials
      const officials = [
            { name: "Dr. Rajesh Kumar", dept: "Health", email: "rajesh.health@example.com" },
            { name: "Mrs. Sarah Wilson", dept: "Education", email: "sarah.edu@example.com" },
            { name: "Inspector Vikram Singh", dept: "Police", email: "vikram.police@example.com" },
            { name: "Mr. Amit Patel", dept: "Municipal", email: "amit.muni@example.com" },
            { name: "Ms. Priya Sharma", dept: "Revenue", email: "priya.rev@example.com" }
      ];

      for (const official of officials) {
            await storage.createUser({
                  username: official.email.split('@')[0],
                  password: hashedPassword,
                  fullName: official.name,
                  email: official.email,
                  phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
                  role: "official",
                  department: official.dept,
                  aadharNumber: `1234${Math.floor(10000000 + Math.random() * 90000000)}`
            });
      }
      console.log("Created officials");

      console.log("✅ Seeding complete! Fresh data ready.");
}
