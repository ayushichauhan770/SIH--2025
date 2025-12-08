import { storage } from "./storage";
import bcrypt from "bcryptjs";
import { getAllDepartmentNames } from "@shared/sub-departments";

export async function seedData() {
      // Check if data already exists by checking for admin user
      const adminUser = await storage.getUserByUsername("admin");
      const existingDepartments = await storage.getAllDepartments();
      
      // Only seed if no data exists (no admin user and no departments)
      if (!adminUser && existingDepartments.length === 0) {
        console.log("🌱 No existing data found. Seeding initial data...");
      } else {
        console.log("📊 Existing data found. Preserving user accounts and data.");
        if (adminUser) {
          console.log(`   Found existing admin user.`);
        }
        if (existingDepartments.length > 0) {
          console.log(`   Found ${existingDepartments.length} departments.`);
        }
        return; // Don't seed if data already exists
      }

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
            department: "Health – Ministry of Health and Family Welfare",
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
            department: "Police – State Police Department",
            aadharNumber: "000000000002"
      });
      console.log("Created police_admin user");

      // 2. Create All Departments
      const allDepartmentNames = getAllDepartmentNames();
      console.log(`Creating ${allDepartmentNames.length} departments...`);

      for (const deptName of allDepartmentNames) {
            await storage.createDepartment({
                  name: deptName,
                  description: `Government services for ${deptName.split('–')[0].trim()}`,
                  image: undefined
            });
      }
      console.log(`Created ${allDepartmentNames.length} departments`);

      // 3. Create Officials (using full department names)
      const officials = [
            { name: "Dr. Rajesh Kumar", dept: "Health – Ministry of Health and Family Welfare", email: "rajesh.health@example.com", subDept: "Hospital Negligence" },
            { name: "Mrs. Sarah Wilson", dept: "Education – Ministry of Education", email: "sarah.edu@example.com", subDept: "Scholarship Not Received" },
            { name: "Inspector Vikram Singh", dept: "Police – State Police Department", email: "vikram.police@example.com", subDept: "FIR Not Registered" },
            { name: "Mr. Amit Patel", dept: "Municipal Corporation / Urban Local Bodies (ULBs)", email: "amit.muni@example.com", subDept: "Garbage Collection Issue" },
            { name: "Ms. Priya Sharma", dept: "Revenue – Department of Revenue (Ministry of Finance)", email: "priya.rev@example.com", subDept: "Property Tax Issue" }
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
                  subDepartment: official.subDept,
                  aadharNumber: `1234${Math.floor(10000000 + Math.random() * 90000000)}`
            });
      }
      console.log("Created officials");

      console.log("✅ Seeding complete! Fresh data ready.");
}
