import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, ChevronRight, Send, Bot, User } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FAQ {
  question: string;
  answer: string;
}

interface ChatMessage {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
}

const faqs: FAQ[] = [
  {
    question: "How do I login?",
    answer: "To login, click the 'Login' button in the top-right corner. First, select your role (Citizen, Official, or Admin), then enter your credentials. You can login using your mobile number, email, or username along with your password. An OTP will be sent for verification."
  },
  {
    question: "How do I submit an application?",
    answer: "To submit an application: 1) Register/Login as a Citizen, 2) Go to your dashboard, 3) Click 'Submit Application', 4) Select the department and sub-department, 5) Fill in the description and upload any supporting documents, 6) Click 'Submit'. You will receive a tracking ID to monitor your application."
  },
  {
    question: "What is the approval time?",
    answer: "Applications are typically processed within 30 days. If no action is taken within 30 days, your application will be automatically approved. You'll receive notifications at each stage of processing, and AI monitoring ensures timely action."
  },
  {
    question: "How do I track my application?",
    answer: "You can track your application by: 1) Logging into your Citizen dashboard, 2) Clicking 'Track Application' from the menu, 3) Entering your tracking ID. You'll see the current status, timeline, assigned official, and blockchain verification hash."
  },
  {
    question: "How do I update my profile?",
    answer: "Currently, profile updates are not available through the portal. For any changes to your profile information, please contact the system administrator or submit a support request through the feedback system."
  },
  {
    question: "How do I register as a Citizen?",
    answer: "Click 'Get Started' or 'Register' button, select 'Citizen' role, then fill in your details including full name, email, phone number, Aadhar number, username, and password. After registration, you can login and start submitting applications."
  },
  {
    question: "What is the blockchain verification?",
    answer: "Every approved application receives a unique blockchain hash that serves as a tamper-proof certificate. This hash is generated automatically and can be viewed in your application details. It ensures the authenticity and integrity of your approved application."
  },
  {
    question: "How do I rate an official?",
    answer: "Once your application is approved or rejected, you can rate the official who handled it. Go to your application details and you'll see a rating form. You can give a rating from 1-5 stars and optionally add comments. Ratings are verified through OTP and can only be submitted once per application."
  },
  {
    question: "What happens if my application is delayed?",
    answer: "Our AI monitoring system automatically detects delays. If an application is pending for more than 7 days without updates, both you and the assigned official will receive notifications. If no action is taken within 30 days, the application is automatically approved."
  },
  {
    question: "Can I view department ratings?",
    answer: "Yes! On the homepage, you can see the overall website rating and ratings for all departments. These ratings are calculated based on the average ratings of all officials in each department, providing transparency about service quality."
  }
];

// AI Response Generator based on keywords - Enhanced with detailed responses
function generateAIResponse(userMessage: string): string {
  const message = userMessage.toLowerCase();

  // Registration / Account creation
  if (message.includes("create account") || message.includes("register") || message.includes("sign up") || message.includes("how to register")) {
    return "**Registration Process:**\n\n**Step 1: Select Your Role**\n1. Click 'Register' or 'Get Started'\n2. You'll see three role cards: Citizen, Official, or Admin\n3. Click on your role card\n\n**Step 2: Fill Registration Form**\n\nFor Citizens:\n- Full Name, Email, Mobile Number\n- Aadhar Number (12 digits)\n- Username, Password, Confirm Password\n\nFor Officials (additional):\n- Department and Sub-Department\n- Secret Key: official@2025\n\nFor Admins (additional):\n- Department\n- Secret Key: admin@2025\n\n**Step 3: OTP Verification**\nEnter the 6-digit OTP sent to your email/phone and verify. You'll be automatically logged in.";
  }

  // Login
  if (message.includes("login") || message.includes("sign in") || message.includes("how to login")) {
    return "**Login Process:**\n\n**Step 1: Select Your Role**\n1. Click 'Login'\n2. Select your role: Citizen, Official, or Admin\n3. Click 'Continue as [Role]'\n\n**Step 2: Enter Credentials**\n\nOption 1 - Mobile Login:\n- Enter mobile number\n- Enter password (optional)\n- Click 'Send OTP'\n\nOption 2 - Email/Username Login:\n- Enter username or email\n- Enter password\n- Click 'Login'\n\n**Step 3: OTP Verification**\nEnter the 6-digit OTP and verify. You'll be redirected to your dashboard.\n\nNote: You can also use 'Continue with Google' for quick login.";
  }

  // Submit application
  if (message.includes("submit application") || message.includes("how to submit") || message.includes("create application")) {
    return "**Submitting an Application:**\n\n**Step 1: Navigate**\n- Login as Citizen\n- Click 'Submit Application' from dashboard\n\n**Step 2: Fill Application Form**\n1. Select Department (41 departments available)\n2. Select Sub-Department (specific issue type)\n3. Write detailed description of your issue\n4. Add additional information (optional)\n5. Upload image/document (optional, max 50MB)\n\n**Step 3: Submit**\n- Click 'Submit Application'\n- You'll receive a unique Tracking ID\n- Application is auto-assigned to an official\n- You'll receive notifications for updates\n\nTip: Be detailed in your description and attach relevant documents for faster processing.";
  }

  // Track application
  if (message.includes("track") || message.includes("tracking") || message.includes("check status")) {
    return "**Tracking Your Application:**\n\n**Method 1 - From Dashboard:**\n- Login to your Citizen dashboard\n- All applications are listed with status\n- Click 'View Details' on any application\n\n**Method 2 - Using Tracking ID:**\n- Go to 'Track Application' page\n- Enter your Tracking ID\n- View current status and details\n\n**What You'll See:**\n- Current status (Submitted, Assigned, In Progress, Approved, Rejected)\n- Assigned official information\n- Timeline of all status changes\n- Blockchain hash (if approved)\n- Days since submission\n- Auto-approval countdown\n\n**Application Statuses:**\n- Submitted: Waiting for assignment\n- Assigned: Official assigned\n- In Progress: Being processed\n- Approved: Completed successfully ✅\n- Rejected: Not approved ❌\n- Auto-Approved: Auto-approved after 30 days";
  }

  // Approval time / 30 days
  if (message.includes("approval time") || message.includes("how long") || message.includes("30 days") || message.includes("processing time")) {
    return "**Application Processing Time:**\n\n**Standard Processing:** Within 30 days\n\n**Auto-Approval System:**\n- If no action is taken within 30 days\n- Application is automatically approved\n- Blockchain hash is generated\n- You receive approval notification\n\n**AI Monitoring:**\n- Detects delays automatically\n- Sends alerts after 7 days without update\n- Ensures accountability\n- Guarantees timely processing\n\n**Benefits:**\n✓ Guaranteed maximum wait time\n✓ No application left pending indefinitely\n✓ Transparent timeline\n✓ Real-time notifications at each stage\n\nYou'll receive notifications throughout the process, so you're always informed!";
  }

  // Rating system
  if (message.includes("rating") || message.includes("rate official") || message.includes("feedback") || message.includes("how to rate")) {
    return "**Rating System:**\n\n**When Can You Rate?**\nAfter your application is Approved, Rejected, or Auto-Approved\n\n**How to Rate:**\n1. Open your application details\n2. Scroll to 'Rate Official' section\n3. Select stars (1-5)\n4. Add optional comment\n5. Click 'Submit Rating'\n6. Verify with OTP\n7. Rating is saved (cannot be changed)\n\n**Important Rules:**\n- One rating per application (permanent)\n- OTP-verified for authenticity\n- Ratings help improve service quality\n- Visible to officials and admins\n\n**Rating Impact:**\n- Affects official's average rating\n- Influences auto-assignment (lower-rated officials get fewer applications)\n- Contributes to department rating\n- Visible on public dashboard\n\n**Department Ratings:**\nCalculated as average of all officials' ratings in that department. View them on the homepage!";
  }

  // Blockchain
  if (message.includes("blockchain") || message.includes("hash") || message.includes("certificate") || message.includes("verification")) {
    return "**Blockchain Verification:**\n\n**What is it?**\nEvery approved application receives a unique blockchain hash - a tamper-proof digital certificate.\n\n**How to View:**\n1. Open your approved application details\n2. Scroll to 'Blockchain Verification' section\n3. You'll see:\n   - Document Hash (unique identifier)\n   - Block Number (position in blockchain)\n   - Timestamp (when created)\n   - 'Copy Hash' button\n\n**Benefits:**\n✓ Tamper-proof certificate\n✓ Permanent record\n✓ Cryptographic security\n✓ Cannot be altered or faked\n✓ Proof of approval\n\n**How to Use:**\n- Copy hash for your records\n- Use as proof of approval\n- Share for verification\n- Keep it safe as your digital certificate\n\nThis ensures the authenticity and integrity of your approved application!";
  }

  // Department information
  if (message.includes("department") && (message.includes("list") || message.includes("available") || message.includes("which") || message.includes("how many"))) {
    return "**Available Departments:**\n\n41 departments are available:\n\n1. Aadhaar (UIDAI)\n2. Animal Husbandry & Dairying\n3. Agriculture\n4. CBSE\n5. CPWD\n6. Consumer Affairs\n7. Corporate Affairs\n8. Education\n9. Electricity\n10. Election Commission (ECI)\n11. EPFO\n12. ESIC\n13. Finance\n14. Food & Civil Supplies\n15. Forest\n16. Health\n17. Home Affairs\n18. Income Tax (CBDT)\n19. Industrial Development\n20. Labour\n21. Minority Affairs\n22. Municipal Corporation\n23. Panchayati Raj\n24. Passport\n25. Personnel & Training\n26. Police\n27. Pollution (CPCB)\n28. Post Office\n29. Public Grievances\n30. Public Works\n31. Railways\n32. Revenue\n33. Road Transport\n34. Rural Development\n35. Science & Technology\n36. Skills\n37. Social Justice\n38. Telecommunications\n39. Urban Development\n40. Water (Jal Shakti)\n41. Women & Child Development\n\nEach department has multiple sub-departments for specific issues!";
  }

  // Sub-departments
  if (message.includes("sub-department") || message.includes("sub department") || message.includes("issue type")) {
    return "**Sub-Departments:**\n\nEach department has specific sub-departments (issue types). Examples:\n\n**Health:**\n- Hospital Negligence\n- Medicine Shortage\n- Health Card Issue\n- Vaccination Issue\n\n**Police:**\n- FIR Not Registered\n- Case Delay\n- Verification Delay\n- Police Misconduct\n\n**Passport:**\n- Passport Delay\n- Document Verification Issue\n- Police Verification Delay\n\n**EPFO:**\n- PF Withdrawal Delay\n- KYC Verification Issue\n- Name Mismatch\n- Pension Issue\n\nWhen submitting an application, first select your department, then choose the specific sub-department that matches your issue. This ensures your application reaches the right official!";
  }

  // Officials / How officials work
  if (message.includes("official") && (message.includes("how") || message.includes("work") || message.includes("process"))) {
    return "**How Officials Work:**\n\n**Dashboard Features:**\n- View available applications in their department/sub-department\n- Accept assignments\n- Process applications\n- Update status and add remarks\n- View performance metrics\n\n**Processing Applications:**\n1. Official sees available applications\n2. Accepts assignment\n3. Reviews application details\n4. Updates status (In Progress → Approved/Rejected)\n5. Adds comments and remarks\n6. Citizen receives notification\n\n**Performance Tracking:**\n- Average rating from citizens\n- Total assigned, approved, rejected\n- Solved and not solved counts\n- Delay alerts if pending >7 days\n\n**Assignment Algorithm:**\nApplications are auto-assigned based on:\n- Department/sub-department match\n- Current workload (active applications)\n- Rating (lower-rated get fewer)\n- Assignment history\n\nThis ensures fair distribution and quality service!";
  }

  // Admin features
  if (message.includes("admin") && (message.includes("how") || message.includes("monitor") || message.includes("dashboard"))) {
    return "**Admin Features:**\n\n**Dashboard Overview:**\n- Department statistics (Total, Assigned, Approved, Rejected)\n- Applications with Solved/Unsolved tabs\n- Officials list with performance metrics\n- Search and filter capabilities\n\n**Monitoring Officials:**\n- View all officials in department\n- See ratings, solved/not solved counts\n- Identify officials with 3+ pending (red alert)\n- Send warnings to underperforming officials\n- View detailed performance stats\n\n**Application Management:**\n- Unsolved Tab: Shows rejected/unresolved applications\n- Solved Tab: Shows approved applications\n- All Tab: Complete overview with solved badges\n- Click any application to view full details\n\n**Official Details:**\nClick on any official to see:\n- Basic information\n- Performance summary (7 cards with colors)\n- All applications handled\n- Send warning option\n\nAdmins ensure accountability and service quality across the department!";
  }

  // Delay / Escalation
  if (message.includes("delay") || message.includes("escalate") || message.includes("pending") || message.includes("stuck")) {
    return "**Delay Management & Escalation:**\n\n**AI Monitoring:**\n- System checks all applications continuously\n- Detects delays automatically\n\n**Delay Alerts:**\n- 7 days without update: Notifications sent to citizen and official\n- 30 days without action: Auto-approval triggered\n\n**Escalation Process:**\nIf you mark application as 'Not Solved':\n1. Application is reassigned to another official\n2. Escalation level increases\n3. You can rate the previous official\n4. New official receives the application\n5. You receive notification of reassignment\n\n**Benefits:**\n✓ No application gets stuck\n✓ Multiple chances for resolution\n✓ Accountability for officials\n✓ Guaranteed processing\n\n**Auto-Approval:**\nAfter 30 days, if no action is taken:\n- Application automatically approved\n- Blockchain hash generated\n- You receive approval notification\n- No further action needed";
  }

  // Roles explanation
  if (message.includes("role") || message.includes("difference between") || message.includes("citizen vs") || message.includes("what is")) {
    return "**User Roles Explained:**\n\n**1. CITIZEN**\nPurpose: Submit and track applications\nAccess:\n- Submit applications\n- Track status in real-time\n- View assigned officials\n- Rate officials after completion\n- Receive notifications\n- View blockchain certificates\n\n**2. OFFICIAL**\nPurpose: Process applications\nAccess:\n- View assigned applications\n- Accept/reject assignments\n- Update application status\n- Add remarks and comments\n- View performance metrics\n- Receive delay alerts\nRequires: Department, Sub-department, Secret key (official@2025)\n\n**3. ADMIN**\nPurpose: Monitor system\nAccess:\n- View all department applications\n- Monitor official performance\n- Send warnings\n- View detailed statistics\n- Access analytics\n- View solved/unsolved lists\nRequires: Department, Secret key (admin@2025)\n\nEach role has a separate dashboard with role-specific features!";
  }

  // OTP
  if (message.includes("otp") || message.includes("verification code") || message.includes("not received")) {
    return "**OTP Verification:**\n\n**What is OTP?**\nOne-Time Password - a 6-digit code sent to your phone/email for security.\n\n**When is OTP Used?**\n- Login verification\n- Registration verification\n- Rating submission\n- Password reset\n\n**OTP Details:**\n- Valid for 10 minutes\n- Sent via SMS or Email\n- 6 digits\n- Single use only\n\n**Troubleshooting:**\nIf OTP not received:\n1. Check spam/junk folder (email)\n2. Wait 1-2 minutes\n3. Check browser console (F12 → Console) for testing\n4. Request new OTP\n5. Contact support: +91 1800-123-4567\n\n**For Testing:**\nOTP is displayed in browser console for development/testing purposes.\n\n**Security:**\n- Never share your OTP\n- OTP expires after 10 minutes\n- Each OTP is unique and single-use";
  }

  // Notifications
  if (message.includes("notification") || message.includes("alert") || message.includes("bell icon")) {
    return "**Notifications System:**\n\n**For Citizens:**\n- Application submitted confirmation\n- Application assigned to official\n- Status updates (In Progress, Approved, Rejected)\n- Delay alerts (pending >7 days)\n- Auto-approval notification (after 30 days)\n\n**For Officials:**\n- New application assigned\n- Delay alerts (pending >7 days)\n- Warning from admin\n- Performance alerts\n\n**For Admins:**\n- System alerts\n- Official performance issues\n- Department statistics updates\n\n**How to View:**\n1. Click bell icon (🔔) in header\n2. Unread notifications show red badge with count\n3. Click notification to mark as read\n4. Click to view related application\n5. Sorted by date (newest first)\n\n**Real-time Updates:**\nNotifications appear instantly when events occur, keeping you informed at every step!";
  }

  // Department ratings
  if (message.includes("department rating") || message.includes("view rating") || message.includes("public dashboard")) {
    return "**Department Ratings:**\n\n**Where to View:**\nHomepage → Public Dashboard section\n\n**What You'll See:**\n1. Overall Website Rating (top)\n   - Average of all officials' ratings\n   - Based on total ratings count\n\n2. Department Ratings List (scrollable)\n   - All 41 departments displayed\n   - Sorted by rating (highest first)\n   - Shows: Star icon, Rating (X.X/5.0), Department name, Officials count\n\n**How Ratings are Calculated:**\n- Department Rating = Average of all officials' ratings in that department\n- Website Rating = Average of all officials across all departments\n\n**Benefits:**\n✓ Transparency in service quality\n✓ Helps citizens choose departments\n✓ Encourages officials to perform better\n✓ Shows 0.0/5.0 for departments without ratings\n\n**Rating Updates:**\nRatings update in real-time as citizens submit feedback!";
  }

  // Solved/Unsolved
  if (message.includes("solved") || message.includes("unsolved") || message.includes("mark as solved") || message.includes("not solved")) {
    return "**Solved/Unsolved System:**\n\n**After Application is Completed:**\nYou can mark it as Solved or Not Solved\n\n**Mark as SOLVED:**\n- Issue resolved satisfactorily\n- Rate the official\n- Application moves to solved list\n- Official's solvedCount increases\n\n**Mark as NOT SOLVED:**\n- Issue not resolved\n- Application is escalated\n- Reassigned to another official\n- You can rate previous official\n- Escalation level increases\n\n**For Rejected Applications:**\n- Status = 'Rejected'\n- Solved = false\n- Official's notSolvedCount increases by 1\n- Appears in admin's 'Unsolved' tab\n\n**If Later Approved:**\n- Status = 'Approved'\n- Solved = true\n- notSolvedCount decreases by 1\n- solvedCount increases by 1\n- Moves to 'Solved' tab\n\n**Admin View:**\nAdmins can see Solved/Unsolved tabs to monitor resolution rates and official performance.";
  }

  // Aadhar
  if (message.includes("aadhar") || message.includes("aadhaar") || message.includes("12 digit")) {
    return "**Aadhar Number Requirement:**\n\n**Required For:**\n- All user registrations (Citizen, Official, Admin)\n- Must be 12 digits\n- Used for identity verification\n\n**How to Enter:**\n- Enter 12-digit Aadhar number in registration form\n- Only numbers allowed (no spaces or dashes)\n- System validates the format\n\n**Privacy:**\n- Aadhar is stored securely\n- Only visible to authorized users\n- Used for identity verification only\n\n**Note:** If you don't have an Aadhar number, contact support for alternative verification methods.";
  }

  // Secret keys
  if (message.includes("secret key") || message.includes("official key") || message.includes("admin key")) {
    return "**Secret Keys for Registration:**\n\n**For Officials:**\nSecret Key: `official@2025`\n- Required during official registration\n- Enter in 'Secret Key' field\n- Validates you're authorized to be an official\n\n**For Admins:**\nSecret Key: `admin@2025`\n- Required during admin registration\n- Enter in 'Secret Key' field\n- Validates you're authorized to be an admin\n\n**For Citizens:**\nNo secret key required - open registration\n\n**Important:**\n- Keys are case-sensitive\n- Must be entered exactly as shown\n- Contact system administrator if you need access\n- Keys ensure only authorized personnel can register as officials/admins\n\n**Security:**\nSecret keys prevent unauthorized access to official and admin roles.";
  }

  // Forgot password
  if (message.includes("forgot password") || message.includes("reset password") || message.includes("change password")) {
    return "**Password Recovery:**\n\n**Steps:**\n1. Go to Login page\n2. Select 'Email/User' tab\n3. Click 'Forgot Password?' link\n4. Enter your email or username\n5. You'll receive a password reset link\n6. Click the link and set new password\n7. Verify with OTP\n8. Login with new password\n\n**Alternative:**\nContact support if you cannot access your email:\n- Phone: +91 1800-123-4567\n- Email: support@digitalgovernance.gov.in\n\n**Security Tips:**\n- Use strong passwords (mix of letters, numbers, symbols)\n- Don't share your password\n- Change password regularly\n- Never use the same password on multiple sites";
  }

  // Priority
  if (message.includes("priority") || message.includes("urgent") || message.includes("high priority")) {
    return "**Application Priority System:**\n\n**Three Priority Levels:**\n\n1. **High Priority** (Red badge)\n   - Urgent applications\n   - Processed first\n   - Requires immediate attention\n\n2. **Medium Priority** (Orange badge)\n   - Important applications\n   - Processed after high priority\n   - Standard timeline\n\n3. **Normal Priority** (Gray badge)\n   - Regular applications\n   - Standard processing\n   - Default priority\n\n**Who Sets Priority?**\n- Officials can set/change priority\n- Admins can adjust priority\n- Citizens cannot set priority (assigned automatically)\n\n**How it Affects Processing:**\n- High priority applications are visible at top\n- Officials see priority badges\n- Helps manage workload efficiently\n\n**Note:** All applications are processed within 30 days regardless of priority!";
  }

  // Warnings
  if (message.includes("warning") || message.includes("admin warning")) {
    return "**Warning System (Admin Feature):**\n\n**Purpose:**\nAdmins can send warnings to underperforming officials\n\n**When to Send:**\n- Official has 3+ pending applications\n- Applications delayed >7 days\n- Low performance metrics\n- Poor ratings from citizens\n\n**How to Send:**\n1. Admin opens official details\n2. Clicks 'Send Warning' button\n3. Types warning message\n4. Clicks 'Send Warning'\n5. Official receives notification\n\n**Warning Tracking:**\n- Warnings count is visible in official's performance summary\n- Shows in orange card\n- Tracked for performance evaluation\n\n**For Officials:**\nIf you receive a warning:\n- Check your pending applications\n- Process them promptly\n- Update statuses regularly\n- Improve response time\n\nWarnings help maintain service quality and accountability!";
  }

  // Google login
  if (message.includes("google") || message.includes("google login") || message.includes("oauth")) {
    return "**Google Login:**\n\n**How to Use:**\n1. Go to Login page\n2. Select your role first\n3. Click 'Continue with Google' button\n4. You'll be redirected to Google authentication\n5. Login with your Google account\n6. Grant permissions\n7. You'll be redirected back and logged in\n\n**Benefits:**\n✓ Quick login (no password needed)\n✓ Secure (Google authentication)\n✓ One-click access\n\n**Note:**\nThis feature requires backend Google OAuth configuration. If not configured, you'll need to use standard login with username/password.\n\n**Alternative:**\nUse mobile or email/username login with OTP verification for secure access.";
  }

  // Image upload
  if (message.includes("upload") || message.includes("image") || message.includes("document") || message.includes("photo")) {
    return "**Image/Document Upload:**\n\n**When Submitting Application:**\n- Optional field for supporting documents\n- Helps officials understand your issue better\n\n**Supported:**\n- Images (JPG, PNG, GIF, WebP)\n- Photos of documents\n- Screenshots\n- Evidence/proof\n\n**Limits:**\n- Maximum file size: 50MB\n- One image per application\n- Automatically compressed to 1920x1920 pixels\n- 70% JPEG quality for optimization\n\n**How to Upload:**\n1. Click 'Upload Image' in application form\n2. Select file from your device\n3. Image is compressed automatically\n4. Preview appears\n5. Click 'Remove Image' to change\n6. Submit application with image\n\n**Tips:**\n- Upload clear, readable images\n- Ensure important details are visible\n- Compress large files before upload\n- Use relevant images only";
  }

  // Chatbot itself
  if (message.includes("chatbot") || message.includes("help") || message.includes("support") || message.includes("how to use")) {
    return "**Help & Support Features:**\n\n**Chatbot Widget:**\nFixed at top-right corner of every page (💬 icon)\n\n**Two Tabs:**\n\n1. **Quick Help:**\n   - 10 most asked questions\n   - Instant answers\n   - Click any question to see answer\n   - 'Back to Questions' button\n\n2. **Chat With AI Agent:**\n   - Type custom questions\n   - AI responds instantly\n   - Two-way messaging\n   - Auto-scrolls to latest\n   - Typing indicator\n   - Message timestamps\n\n**What AI Can Help With:**\n- Account creation and login\n- Submitting and tracking applications\n- Approval process and timelines\n- Rating and feedback system\n- Blockchain verification\n- Department information\n- Official and admin features\n- Troubleshooting\n\n**Contact Support:**\n- Phone: +91 1800-123-4567\n- Email: support@digitalgovernance.gov.in\n\nI'm here to help 24/7!";
  }

  // Dashboard
  if (message.includes("dashboard") || message.includes("after login") || message.includes("what do i see")) {
    return "**Dashboard Overview:**\n\n**Citizen Dashboard:**\n- Welcome message with your name\n- Quick stats (Total, Pending, Approved, Rejected)\n- 'Submit Application' button\n- List of all your applications\n- Status badges and tracking IDs\n- Notification bell icon\n\n**Official Dashboard:**\n- Welcome with department badge\n- Your average rating display\n- Quick stats (Assigned, In Progress, Approved, Rejected)\n- Two tabs: 'Available Applications' and 'My Applications'\n- Accept/Process applications\n- Performance metrics\n\n**Admin Dashboard:**\n- Department name badge\n- Department statistics (4 colored cards)\n- Applications tabs (Unsolved, Solved, All)\n- Officials list with performance data\n- Search and filter options\n- Warning system\n\n**Common Features:**\n- Notification bell (top-right)\n- Theme toggle (light/dark mode)\n- Logout button\n- Real-time data updates\n\nYour dashboard is your command center for all activities!";
  }

  // Timeline / History
  if (message.includes("timeline") || message.includes("history") || message.includes("status history")) {
    return "**Application Timeline & History:**\n\n**What is Timeline?**\nA chronological record of all status changes and updates for your application.\n\n**What You'll See:**\n- Each status change with date/time\n- Comments from officials\n- Who made the update\n- Visual timeline with icons\n- Latest update at top\n\n**Status Flow:**\n1. Submitted → Application created\n2. Assigned → Official assigned\n3. In Progress → Being processed\n4. Approved/Rejected → Final decision\n\n**Additional Info:**\n- Time elapsed since submission\n- Days until auto-approval\n- Escalation level (if reassigned)\n- Priority changes\n\n**How to View:**\n1. Open application details\n2. Scroll to 'Status History' section\n3. See complete timeline\n\n**Benefits:**\n✓ Complete transparency\n✓ Track every update\n✓ See official comments\n✓ Understand processing flow\n\nThe timeline ensures you're always informed about your application's journey!";
  }

  // Tracking ID
  if (message.includes("tracking id") || message.includes("application id") || message.includes("track number")) {
    return "**Tracking ID:**\n\n**What is it?**\nA unique identifier assigned to each application (e.g., APP-ABC123)\n\n**When You Get It:**\n- Immediately after submitting an application\n- Displayed on confirmation screen\n- Visible in your dashboard\n- Included in notifications\n\n**How to Use:**\n1. Save your tracking ID\n2. Go to 'Track Application' page\n3. Enter tracking ID\n4. View application status and details\n\n**Benefits:**\n✓ Track without logging in\n✓ Share with others for reference\n✓ Quick access to application\n✓ Unique for each application\n\n**Format:**\nAPP-[6 random characters]\nExample: APP-XYZ789\n\n**Important:**\n- Keep tracking ID safe\n- Use it for all inquiries\n- Each application has unique ID\n- Cannot be changed or duplicated\n\nYour tracking ID is your application's permanent reference number!";
  }

  // Workload
  if (message.includes("workload") || message.includes("how many applications") || message.includes("assignment")) {
    return "**Application Assignment & Workload:**\n\n**Auto-Assignment Algorithm:**\nApplications are assigned based on:\n\n1. **Department Match:**\n   - Official's department must match application\n   - Sub-department preference considered\n\n2. **Current Workload (Primary):**\n   - Active applications (Assigned + In Progress)\n   - Officials with lower workload get priority\n\n3. **Rating (Secondary):**\n   - Lower-rated officials get fewer assignments\n   - Encourages quality service\n\n4. **Assignment History (Tertiary):**\n   - Total applications ever assigned\n   - Distributes fairly over time\n\n5. **Seniority (Tie-breaker):**\n   - Earlier registration date\n\n**Workload Management:**\n- System balances load automatically\n- Prevents overloading single official\n- Ensures fair distribution\n- Considers official availability\n\n**For Officials:**\nYour workload affects:\n- New assignments received\n- Priority in assignment queue\n- Performance evaluation\n\nProcess applications promptly to maintain balanced workload!";
  }

  // Security
  if (message.includes("security") || message.includes("secure") || message.includes("safe") || message.includes("privacy")) {
    return "**Security & Privacy:**\n\n**Data Protection:**\n- All passwords encrypted (bcrypt hashing)\n- JWT tokens for authentication\n- Session-based security\n- OTP verification for sensitive actions\n- HTTPS encryption (in production)\n\n**Privacy Measures:**\n- Personal data stored securely\n- Only authorized users access your data\n- Admins can view for monitoring only\n- Ratings linked to applications (not public)\n\n**Best Practices:**\n1. Never share your password\n2. Logout after use (shared computers)\n3. Keep OTP private\n4. Use strong passwords\n5. Report suspicious activity\n\n**Blockchain Security:**\n- Approved applications get blockchain hash\n- Tamper-proof certificates\n- Cannot be altered\n- Permanent verification\n\n**Contact Security:**\nReport security concerns:\n- Email: support@digitalgovernance.gov.in\n- Phone: +91 1800-123-4567\n\nYour data security is our top priority!";
  }

  // Mobile / Responsive
  if (message.includes("mobile") || message.includes("phone") || message.includes("responsive") || message.includes("tablet")) {
    return "**Mobile & Device Support:**\n\n**Fully Responsive:**\n- Works on all screen sizes\n- Optimized for mobile, tablet, desktop\n- Touch-friendly interface\n- Adaptive layouts\n\n**Supported Devices:**\n- iOS (iPhone, iPad)\n- Android (phones, tablets)\n- Desktop (Windows, Mac, Linux)\n- Laptops\n\n**Mobile Features:**\n- Full functionality on mobile\n- Easy navigation\n- Readable text sizes\n- Touch-optimized buttons\n- Swipe gestures supported\n\n**Recommended:**\n- Screen: 375px width minimum\n- Browser: Chrome, Safari, Firefox (latest)\n- Internet: Stable connection\n\n**Mobile Tips:**\n- Use portrait mode for forms\n- Landscape mode for tables/lists\n- Pinch to zoom if needed\n- Chatbot works perfectly on mobile\n\n**Performance:**\nOptimized for fast loading even on slower connections!";
  }

  // Test credentials
  if (message.includes("test") || message.includes("demo") || message.includes("sample") || message.includes("default credentials")) {
    return "**Test Credentials (If Database is Seeded):**\n\n**Admin Accounts:**\n- Username: `admin`\n  Password: `password123`\n  Department: Administration\n\n- Username: `health_admin`\n  Password: `password123`\n  Department: Health\n\n- Username: `police_admin`\n  Password: `password123`\n  Department: Police\n\n**Test Officials:**\n- Dr. Rajesh Kumar (Health)\n- Mrs. Sarah Wilson (Education)\n- Inspector Vikram Singh (Police)\n- Mr. Amit Patel (Municipal)\n- Ms. Priya Sharma (Revenue)\n\nAll officials: Password: `password123`\n\n**For Testing:**\n- OTP displayed in browser console (F12)\n- Use any 6-digit code for OTP\n- Secret keys: official@2025, admin@2025\n\n**Note:**\nThese are test accounts for development. In production, create your own secure accounts!";
  }

  // Contact support
  if (message.includes("contact") || message.includes("support") || message.includes("help desk") || message.includes("phone number")) {
    return "**Contact Support:**\n\n**Phone Support:**\n📞 +91 1800-123-4567\n- Available 24/7\n- Toll-free number\n- For urgent issues\n\n**Email Support:**\n📧 support@digitalgovernance.gov.in\n- Response within 24 hours\n- For detailed queries\n- Attach screenshots if needed\n\n**Chatbot Support:**\n💬 Click chatbot icon (top-right)\n- Instant answers\n- Available 24/7\n- AI-powered assistance\n\n**Footer Links:**\nCheck footer for:\n- FAQs\n- Help documentation\n- Terms & Conditions\n- Privacy Policy\n\n**When Contacting Support:**\nInclude:\n- Your username (not password!)\n- Issue description\n- Steps to reproduce\n- Screenshots (if applicable)\n- Browser and device info\n\nWe're here to help!";
  }

  // Default response with suggestions
  if (message.length < 3) {
    return "Please ask a complete question. I can help you with topics like: registration, login, submitting applications, tracking, ratings, departments, officials, admin features, or any other platform feature!";
  }

  // Default response
  return "I'm your Digital Governance Assistant! I can help with:\n\n✓ Creating accounts & Registration\n✓ Login process\n✓ Submitting applications\n✓ Tracking applications\n✓ Approval time & process\n✓ Rating system\n✓ Blockchain verification\n✓ Department & sub-department info\n✓ Official features\n✓ Admin features\n✓ Solved/Unsolved tracking\n✓ Notifications\n✓ OTP verification\n✓ Security & privacy\n✓ Troubleshooting\n\nPlease ask a specific question about any of these topics, and I'll provide detailed information!\n\nExample questions:\n- 'How do I submit an application?'\n- 'What is the approval time?'\n- 'How does rating work?'\n- 'Which departments are available?'";
}

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFAQ, setSelectedFAQ] = useState<FAQ | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      text: "Hello! I'm your Digital Governance Assistant. How can I help you today?",
      sender: "ai",
      timestamp: new Date(),
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isTyping]);

  const handleQuestionClick = (faq: FAQ) => {
    setSelectedFAQ(faq);
  };

  const handleBack = () => {
    setSelectedFAQ(null);
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    // Add user message
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: "user",
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, userMsg]);
    setInputMessage("");
    setIsTyping(true);

    // Simulate AI typing delay
    setTimeout(() => {
      const aiResponse = generateAIResponse(inputMessage);
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        sender: "ai",
        timestamp: new Date(),
      };

      setChatMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Chatbot Icon */}
      <div className="fixed top-20 right-6 z-50">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="h-14 w-14 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all"
          size="icon"
        >
          {isOpen ? (
            <X className="h-6 w-6 text-white" />
          ) : (
            <MessageCircle className="h-6 w-6 text-white" />
          )}
        </Button>
      </div>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed top-36 right-6 z-40 w-96 max-w-[calc(100vw-3rem)]">
          <Card className="shadow-2xl border-2 border-gray-200 dark:border-gray-700">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white pb-3">
              <CardTitle className="text-lg font-semibold">
                Help & Support
              </CardTitle>
              <CardDescription className="text-white/90 text-sm">
                Digital Governance Assistant
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs defaultValue="faq" className="w-full">
                <TabsList className="grid w-full grid-cols-2 rounded-none border-b">
                  <TabsTrigger value="faq">Quick Help</TabsTrigger>
                  <TabsTrigger value="chat">Chat With AI Agent</TabsTrigger>
                </TabsList>

                {/* FAQ Tab */}
                <TabsContent value="faq" className="m-0">
                  <ScrollArea className="h-[400px]">
                    {selectedFAQ ? (
                      /* Answer View */
                      <div className="p-4 space-y-4">
                        <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                          {selectedFAQ.answer}
                        </p>
                        <Button
                          variant="outline"
                          onClick={handleBack}
                          className="w-full"
                        >
                          Back to Questions
                        </Button>
                      </div>
                    ) : (
                      /* Questions List */
                      <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {faqs.map((faq, index) => (
                          <button
                            key={index}
                            onClick={() => handleQuestionClick(faq)}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-between group"
                          >
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 pr-2">
                              {faq.question}
                            </span>
                            <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 flex-shrink-0" />
                          </button>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>

                {/* AI Chat Tab */}
                <TabsContent value="chat" className="m-0">
                  <div className="flex flex-col h-[400px]">
                    {/* Messages Area */}
                    <ScrollArea className="flex-1 p-4">
                      <div className="space-y-4">
                        {chatMessages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                          >
                            <div className={`flex gap-2 max-w-[85%] ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}>
                              {/* Avatar */}
                              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                                msg.sender === "user" 
                                  ? "bg-blue-600" 
                                  : "bg-gradient-to-r from-purple-600 to-blue-600"
                              }`}>
                                {msg.sender === "user" ? (
                                  <User className="h-4 w-4 text-white" />
                                ) : (
                                  <Bot className="h-4 w-4 text-white" />
                                )}
                              </div>
                              {/* Message Bubble */}
                              <div className={`rounded-lg px-4 py-2 ${
                                msg.sender === "user"
                                  ? "bg-blue-600 text-white"
                                  : "bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-gray-100"
                              }`}>
                                <p className="text-sm leading-relaxed">{msg.text}</p>
                                <span className="text-xs opacity-70 mt-1 block">
                                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {/* Typing Indicator */}
                        {isTyping && (
                          <div className="flex justify-start">
                            <div className="flex gap-2 max-w-[85%]">
                              <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-r from-purple-600 to-blue-600">
                                <Bot className="h-4 w-4 text-white" />
                              </div>
                              <div className="rounded-lg px-4 py-2 bg-gray-100 dark:bg-slate-800">
                                <div className="flex gap-1">
                                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <div ref={messagesEndRef} />
                      </div>
                    </ScrollArea>

                    {/* Input Area */}
                    <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Type your question..."
                          value={inputMessage}
                          onChange={(e) => setInputMessage(e.target.value)}
                          onKeyPress={handleKeyPress}
                          className="flex-1"
                        />
                        <Button
                          onClick={handleSendMessage}
                          disabled={!inputMessage.trim() || isTyping}
                          size="icon"
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Ask me anything about the platform
                      </p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

