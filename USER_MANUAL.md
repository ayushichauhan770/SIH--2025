# Digital Governance Platform - Complete User Manual

## Table of Contents
1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [User Roles](#user-roles)
4. [Registration](#registration)
5. [Login](#login)
6. [Citizen Features](#citizen-features)
7. [Official Features](#official-features)
8. [Admin Features](#admin-features)
9. [Rating System](#rating-system)
10. [Notifications](#notifications)
11. [Blockchain Verification](#blockchain-verification)
12. [AI Monitoring](#ai-monitoring)
13. [Help & Support](#help--support)
14. [FAQ](#faq)

---

## Introduction

The Digital Governance Platform is a smart, transparent system for submitting, tracking, and managing government applications. It features:
- AI-powered monitoring
- Blockchain verification
- 30-day auto-approval guarantee
- Real-time tracking
- OTP-verified feedback system
- Department and official ratings

---

## Getting Started

### Accessing the Platform
1. Open your web browser
2. Navigate to the platform URL (e.g., http://localhost:5000)
3. You'll see the landing page with options to Login or Register

### First Time Users
1. Click "Get Started" or "Register"
2. Select your role (Citizen, Official, or Admin)
3. Fill in your details
4. Verify your account with OTP
5. Start using the platform

---

## User Roles

### 1. Citizen
**Purpose:** Submit and track applications

**Access:** 
- Submit applications
- Track application status
- View assigned officials
- Rate officials after completion
- Receive notifications
- View blockchain verification

### 2. Official
**Purpose:** Process and manage applications

**Access:**
- View assigned applications
- Accept/reject assignments
- Update application status
- Add remarks and comments
- View performance metrics
- Receive delay alerts

**Requirements:**
- Must belong to a specific department
- Must have a sub-department assigned
- Needs secret key for registration: `official@2025`

### 3. Admin
**Purpose:** Monitor system and officials

**Access:**
- View all department applications
- Monitor official performance
- Send warnings to officials
- View detailed statistics
- Access department analytics
- View solved/unsolved applications

**Requirements:**
- Must belong to a department
- Needs secret key for registration: `admin@2025`

---

## Registration

### Step 1: Select Your Role
1. Click "Register" or "Get Started"
2. You'll see three role cards:
   - **Citizen** - For submitting applications
   - **Official** - For processing applications
   - **Admin** - For monitoring the system
3. Click on your role card

### Step 2: Fill Registration Form

#### For Citizens:
**Required Fields:**
- Full Name
- Email
- Mobile Number
- Aadhar Number (12 digits)
- Username
- Password
- Confirm Password

#### For Officials:
**Additional Required Fields:**
- Department (select from dropdown)
- Sub-Department (select based on department)
- Secret Key: `official@2025`

#### For Admins:
**Additional Required Fields:**
- Department (select from dropdown)
- Secret Key: `admin@2025`

### Step 3: OTP Verification
1. After submitting the form, an OTP is sent to your email/phone
2. Enter the 6-digit OTP in the popup
3. Click "Verify"
4. You'll be automatically logged in and redirected to your dashboard

**Note:** For testing, the OTP is displayed in the browser console (F12 → Console)

---

## Login

### Step 1: Select Your Role
1. Click "Login"
2. Select your role: Citizen, Official, or Admin
3. Click "Continue as [Role]"

### Step 2: Enter Credentials

#### Option 1: Mobile Login
1. Select "Mobile" tab
2. Enter your mobile number
3. Enter your password (optional for OTP-only login)
4. Click "Send OTP"

#### Option 2: Email/Username Login
1. Select "Email/User" tab
2. Enter your username or email
3. Enter your password
4. Click "Login"

### Step 3: OTP Verification
1. Enter the 6-digit OTP sent to your phone/email
2. Click "Verify"
3. You'll be redirected to your dashboard

### Alternative Login Methods
- **Google Login:** Click "Continue with Google" (requires backend configuration)
- **Forgot Password:** Click "Forgot Password?" link on the email/user tab

---

## Citizen Features

### Dashboard Overview
When you login as a citizen, you'll see:
- Welcome message with your name
- Quick stats (Total Applications, Pending, Approved, Rejected)
- "Submit Application" button
- List of your applications with status
- Notification bell icon

### Submitting an Application

**Step 1: Navigate**
- Click "Submit Application" from dashboard
- Or click "Submit Application" on the landing page (redirects to login if not logged in)

**Step 2: Fill Application Form**
1. **Department:** Select from dropdown (41 departments available)
2. **Sub-Department:** Select based on your chosen department
3. **Description:** Describe your issue in detail
4. **Additional Information:** Add any extra details (optional)
5. **Upload Image:** Attach supporting documents/photos (optional, max 50MB)

**Step 3: Submit**
- Click "Submit Application"
- You'll receive a unique **Tracking ID**
- Application is automatically assigned to an available official
- You'll be redirected to your dashboard

### Tracking Applications

**From Dashboard:**
- All your applications are listed with:
  - Tracking ID
  - Status badge
  - Department
  - Submission date
  - "View Details" button

**Application Statuses:**
- **Submitted:** Application received, waiting for assignment
- **Assigned:** Assigned to an official
- **In Progress:** Official is working on it
- **Approved:** Application approved ✅
- **Rejected:** Application rejected ❌
- **Auto-Approved:** Automatically approved after 30 days

**View Application Details:**
1. Click on any application or "View Details"
2. You'll see:
   - Full application information
   - Current status
   - Assigned official (if any)
   - Timeline/history of status changes
   - Blockchain hash (if approved)
   - Rating form (if completed)

### Rating Officials

**When Can You Rate?**
- After your application is Approved, Rejected, or Auto-Approved

**How to Rate:**
1. Open your application details
2. Scroll to the "Rate Official" section
3. Select stars (1-5)
4. Add optional comment
5. Click "Submit Rating"
6. Verify with OTP
7. Rating is saved (cannot be changed)

**Important:**
- You can only rate once per application
- Ratings are OTP-verified for authenticity
- Ratings help improve service quality
- Ratings are visible on department ratings page

### Marking Application as Solved/Unsolved

After an application is completed, you can mark it:
- **Solved:** Issue resolved satisfactorily
- **Not Solved:** Issue not resolved, will be escalated

**To Mark as Solved:**
1. Open application details
2. Click "Mark as Solved"
3. Rate the official
4. Application moves to solved list

**To Mark as Not Solved:**
1. Open application details
2. Click "Mark as Not Solved"
3. Optionally rate the official
4. Application is escalated to another official

### Viewing Blockchain Hash

**For Approved Applications:**
1. Open application details
2. Scroll to "Blockchain Verification" section
3. You'll see:
   - Document Hash
   - Block Number
   - Timestamp
   - "Copy Hash" button

This hash serves as a tamper-proof certificate of approval.

---

## Official Features

### Dashboard Overview
When you login as an official, you'll see:
- Welcome message with your name
- Department badge
- Your average rating and total ratings
- Quick stats (Assigned, In Progress, Approved, Rejected)
- Tabs: "Available Applications" and "My Applications"
- Notification bell icon

### Accepting Applications

**Available Applications Tab:**
- Shows unassigned applications in your department/sub-department
- Each application shows:
  - Tracking ID
  - Citizen name
  - Description preview
  - Submission date
  - Priority badge
  - "Accept" button

**To Accept:**
1. Review the application details
2. Click "Accept Assignment"
3. Application moves to "My Applications" tab
4. Citizen receives notification

### Processing Applications

**My Applications Tab:**
- Shows all applications assigned to you
- Filter by status: All, Pending, Completed

**To Update Status:**
1. Click on an application to view details
2. Click "Update Status" button
3. Select new status:
   - **In Progress:** You're working on it
   - **Approved:** Issue resolved, approve the application
   - **Rejected:** Cannot be approved, reject with reason
4. Add comment explaining the update
5. Set priority (High, Medium, Normal)
6. Add remarks (visible to citizen)
7. Click "Update Application"

**Status Change Effects:**
- Citizen receives notification
- Timeline is updated
- If approved: Blockchain hash is generated
- If rejected: Application marked as unsolved
- If approved after rejection: Counts are adjusted

### Performance Metrics

**Your Dashboard Shows:**
- Average rating (from citizen feedback)
- Total applications assigned
- Applications in progress
- Approved count
- Rejected count
- Solved count
- Not solved count

**Delay Alerts:**
- If an application is pending for >7 days, you receive a notification
- Applications >30 days are auto-approved

---

## Admin Features

### Dashboard Overview
When you login as an admin, you'll see:
- Department name badge
- Department statistics
- Applications list with Solved/Unsolved tabs
- Department officials list
- Notification bell icon

### Department Statistics

**Overview Cards (with colors):**
- **Total Applications** (Blue)
- **Assigned** (Purple)
- **Approved** (Green)
- **Rejected** (Red)

### Viewing Applications

**Three Tabs:**

**1. Unsolved Tab (solved = false):**
- Shows applications not yet resolved
- Includes rejected applications
- Shows tracking ID, citizen name, status, department, date
- Click to view full details

**2. Solved Tab (solved = true):**
- Shows approved applications
- Applications marked as solved by citizens
- Click to view full details

**3. All Applications Tab:**
- Shows all department applications
- Includes "Solved" badge column
- Complete overview

### Monitoring Officials

**Officials Table Shows:**
- Name (clickable for details)
- Official ID
- Email and Phone
- Average Rating (⭐)
- Total Handled
- Solved count
- Not Solved count (red if >0)
- Actions (Details, Warning)

**Alert System:**
- Officials with 3+ pending applications are highlighted in red
- "3+ Pending" badge appears

### Viewing Official Details

**Click on any official name to see:**

**Basic Information:**
- Profile avatar
- Full name
- Department
- Email and phone

**Performance Summary (6 cards):**
1. **Total Assigned** (Purple)
2. **Approved** (Green)
3. **Rejected** (Red)
4. **Solved** (Blue)
5. **Not Solved** (Red) - NEW
6. **Average Rating** (Yellow)
7. **Warnings Sent** (Orange)

**Applications Handled:**
- Table of all applications
- Shows citizen name, status, rating
- Click to view full application details

**Send Warning:**
- Text area to compose warning message
- "Send Warning" button
- Official receives notification

### Application Details from Admin View

**When admin clicks on an application, they see:**
- Citizen information (name, email, phone, Aadhar)
- Application details (type, department, description)
- Status history timeline
- Attached images
- Current status and priority
- Remarks

---

## Rating System

### How Ratings Work

**For Citizens:**
1. After application is completed (Approved/Rejected/Auto-Approved)
2. Rating form appears in application details
3. Select 1-5 stars
4. Add optional comment
5. Verify with OTP
6. Rating is saved permanently (cannot be changed)

**For Officials:**
- Ratings are visible on their dashboard
- Average rating is calculated from all feedback
- Ratings affect auto-assignment algorithm (lower-rated officials get fewer assignments)

**For Departments:**
- Department rating = average of all officials' ratings in that department
- Visible on landing page "Public Dashboard"
- Shows transparency and service quality

**Website Rating:**
- Overall rating = average of all officials' ratings across all departments
- Displayed prominently on landing page

### Rating Impact

**On Officials:**
- Affects assignment priority
- Visible to admins
- Influences performance evaluation

**On Departments:**
- Public visibility on homepage
- Shows service quality
- Helps citizens choose departments

---

## Notifications

### Types of Notifications

**For Citizens:**
- Application submitted confirmation
- Application assigned to official
- Status updates (In Progress, Approved, Rejected)
- Delay alerts (if pending >7 days)
- Auto-approval notification (after 30 days)

**For Officials:**
- New application assigned
- Delay alerts (application pending >7 days)
- Warning from admin
- Performance alerts

**For Admins:**
- System alerts
- Official performance issues
- Department statistics updates

### Viewing Notifications
1. Click the bell icon (🔔) in the header
2. Unread notifications show a red badge with count
3. Click on a notification to:
   - Mark it as read
   - View related application (if applicable)
4. Notifications are sorted by date (newest first)

---

## Blockchain Verification

### What is Blockchain Verification?

Every approved application receives a unique blockchain hash that serves as:
- Tamper-proof certificate
- Proof of approval
- Permanent record
- Verification tool

### Viewing Blockchain Hash

**For Citizens:**
1. Open your approved application details
2. Scroll to "Blockchain Verification" section
3. You'll see:
   - **Document Hash:** Unique identifier
   - **Block Number:** Position in blockchain
   - **Timestamp:** When it was created
   - **Copy Hash** button

**How to Use:**
- Copy the hash for your records
- Use it as proof of approval
- Share it for verification purposes
- It cannot be altered or faked

---

## AI Monitoring

### Automatic Delay Detection

**The AI system monitors:**
- All pending applications
- Time since submission
- Time since last update
- Official workload

**Actions Taken:**
- **7 days without update:** Delay notification sent to citizen and official
- **30 days without approval:** Application is automatically approved
- **High workload detected:** Applications redistributed

### Auto-Approval System

**How it Works:**
1. Application submitted
2. 30-day countdown starts
3. If no action taken within 30 days
4. System automatically approves the application
5. Citizen receives approval notification
6. Blockchain hash is generated

**Benefits:**
- Guaranteed processing time
- No application left pending indefinitely
- Accountability for officials

### Escalation System

**When Application is Marked "Not Solved":**
1. Application is reassigned to another official
2. Escalation level increases
3. Previous official can be rated
4. New official receives the application
5. Citizen is notified of reassignment

---

## Help & Support

### Chatbot Widget

**Location:** Fixed at top-right corner of every page

**Features:**
1. **Quick Help Tab:**
   - 10 most asked questions
   - Instant answers
   - Click any question to see answer
   - "Back to Questions" button

2. **Chat With AI Agent Tab:**
   - Type your questions
   - AI responds with relevant information
   - Two-way messaging
   - Auto-scrolls to latest message
   - Typing indicator
   - Message timestamps

**AI Agent Can Help With:**
- Account creation
- Login process
- Submitting applications
- Tracking applications
- Approval process
- Rating system
- Blockchain verification
- Department information
- Delays and escalation
- User roles
- OTP verification
- Notifications

**How to Use:**
1. Click the chatbot icon (💬) at top-right
2. Choose "Quick Help" for instant answers
3. Or choose "Chat With AI Agent" to ask custom questions
4. Type your question and press Enter or click Send
5. AI responds within 1 second
6. Click X to close the chatbot

### Contact Information

**Phone:** +91 1800-123-4567
**Email:** support@digitalgovernance.gov.in

Located at the bottom of the homepage in the footer.

---

## FAQ

### General Questions

**Q: How long does it take to process an application?**
A: Applications are typically processed within 30 days. If no action is taken within 30 days, your application is automatically approved.

**Q: Can I track my application without logging in?**
A: Yes, go to "Track Application" page and enter your tracking ID.

**Q: What if I forget my password?**
A: Click "Forgot Password?" on the login page (email/user tab) and follow the instructions.

**Q: Can I submit multiple applications?**
A: Yes, you can submit as many applications as needed. Each gets a unique tracking ID.

**Q: What happens if my application is rejected?**
A: You can mark it as "Not Solved" and it will be escalated to another official. You can also rate the official who rejected it.

### Account Questions

**Q: Do I need an Aadhar number to register?**
A: Yes, Aadhar number is required for all users (12 digits).

**Q: Can I change my role after registration?**
A: No, roles are permanent. You need to create a new account for a different role.

**Q: What if my email/phone is already registered?**
A: Each email and phone can only be used once. Use a different email/phone or recover your existing account.

**Q: How do I become an official?**
A: Register with the "Official" role, select your department and sub-department, and enter the secret key: `official@2025`

### Application Questions

**Q: Which departments are available?**
A: 41 departments are available, including:
- Aadhaar (UIDAI)
- Health
- Education
- Police
- Passport
- EPFO
- Income Tax
- Railways
- And 33 more...

**Q: Can I edit my application after submission?**
A: No, applications cannot be edited after submission. Submit a new application if needed.

**Q: What is a sub-department?**
A: Sub-departments are specific issue types within a department. For example, under "Health" you can select "Hospital Negligence", "Medicine Shortage", etc.

**Q: Can I upload documents?**
A: Yes, you can upload one image (photo/document) per application. Images are automatically compressed to max 1920x1920 pixels.

**Q: What if no official accepts my application?**
A: Applications are automatically assigned to available officials based on workload and rating. If not manually accepted, the system ensures assignment.

### Rating Questions

**Q: When can I rate an official?**
A: After your application is Approved, Rejected, or Auto-Approved.

**Q: Can I change my rating?**
A: No, ratings are permanent and cannot be changed once submitted.

**Q: Is rating mandatory?**
A: No, rating is optional but encouraged to help improve service quality.

**Q: Are ratings anonymous?**
A: Ratings are linked to your application but only visible to the official and admins, not to other citizens.

**Q: How are department ratings calculated?**
A: Department rating = average of all officials' ratings in that department.

### Technical Questions

**Q: What browsers are supported?**
A: Chrome, Firefox, Safari, Edge (latest versions recommended).

**Q: Is my data secure?**
A: Yes, all data is encrypted, OTP-verified, and blockchain-verified for approved applications.

**Q: Can I use this on mobile?**
A: Yes, the platform is fully responsive and works on all devices.

**Q: What if I don't receive OTP?**
A: Check your spam folder. For testing, OTP is shown in browser console (F12 → Console). Contact support if issues persist.

---

## Department List

### All 41 Departments with Sub-Departments

1. **Aadhaar – UIDAI**
   - Aadhaar Update (Name/DOB/Address mismatch)
   - Aadhaar Not Generated / Rejected
   - Mobile Number Linking Issue
   - Biometric Update Issue
   - Aadhaar Authentication Failure

2. **Animal Husbandry & Dairying**
   - Veterinary Hospital Service Delay
   - Livestock Health Certificate Issue
   - Dairy Subsidy / Scheme Approval Pending
   - Animal Vaccine Availability Issue

3. **Agriculture – Ministry of Agriculture**
   - Crop Subsidy Not Received
   - PM-Kisan Payment Issue
   - Soil Health Card Issue
   - Fertilizer Availability Issue
   - Seed Quality Complaint

4. **CBSE – Central Board of Secondary Education**
   - Marksheet Correction
   - Certificate Not Received
   - Exam Registration Issue
   - School Affiliation Complaint

5. **Central Public Works Department (CPWD)**
   - Building Maintenance Issue
   - Public Infrastructure Repair
   - Water Pipeline Damage
   - Road/Pavement Construction Issue

6. **Consumer Affairs**
   - Consumer Fraud Complaint
   - Price Overcharging
   - Faulty Product Complaint
   - Weights & Measures Issue

7. **Corporate Affairs**
   - Company Registration Issue
   - DIN/KYC Issue
   - Filing/Compliance Issue

8. **Education – Ministry of Education**
   - Scholarship Not Received
   - School/College Mismanagement
   - Admission Issue
   - Fee-Related Complaint

9. **Electricity – Ministry of Power**
   - Power Outage
   - Wrong Electricity Bill
   - New Electricity Connection Issue
   - Meter Fault/Replacement

10. **Election Commission of India (ECI)**
    - Voter ID Correction
    - New Voter Registration Delay
    - Voter List Name Missing

11. **EPFO – Employees' Provident Fund**
    - PF Withdrawal Delay
    - KYC Verification Issue
    - Name Mismatch
    - Pension Issue

12. **ESIC – Employees' State Insurance**
    - ESI Card Issue
    - Hospital Facility Issue
    - Employer Contribution Missing

13. **Finance – Ministry of Finance**
    - Tax Refund Delay
    - PAN Database Mistake
    - GST Registration Issue

14. **Food & Civil Supplies**
    - Ration Not Provided
    - Ration Card Update Issue
    - Wrong Quantity of Foodgrains

15. **Forest – Ministry of Environment**
    - Forest Land Dispute
    - Wildlife Complaint
    - Timber Permit Issue

16. **Health – Ministry of Health**
    - Hospital Negligence
    - Medicine Shortage
    - Health Card Issue
    - Vaccination Issue

17. **Home Affairs**
    - Passport Police Verification Delay
    - Citizenship/ID Issues
    - Security/Local Authority Delay

18. **Income Tax Department (CBDT)**
    - PAN Card Correction
    - Refund Not Received
    - TDS Mismatch

19. **Industrial Development (DPIIT)**
    - Startup India Registration Issue
    - Industrial License Delay
    - Trademark Complaint

20. **Labour – Ministry of Labour**
    - Wage Fraud Complaint
    - Workplace Safety Issue
    - Labour Card Issue

21. **Minority Affairs**
    - Scholarship Issue
    - Documentation Problem
    - Approval Delay

22. **Municipal Corporation / ULBs**
    - Garbage Collection Issue
    - Road Repair Request
    - Drainage/Sewer Problem
    - Property Tax Issue
    - Street Light Complaint

23. **Panchayati Raj**
    - Gram Panchayat Certificate Delay
    - Local Development Work Issue
    - Water Supply Issue

24. **Passport – Ministry of External Affairs**
    - Passport Delay
    - Document Verification Issue
    - Police Verification Delay

25. **Personnel & Training (DoPT)**
    - Government Employee Grievance
    - Recruitment Process Delay
    - Transfer/Posting Issue

26. **Police – State Police Department**
    - FIR Not Registered
    - Case Delay
    - Verification Delay
    - Police Misconduct Complaint

27. **Pollution – CPCB**
    - Air Pollution Complaint
    - Water Pollution Complaint
    - Industrial Waste Leak

28. **Post Office – Department of Posts**
    - Speed Post Delay
    - Lost Parcel
    - Post Office Savings Issue

29. **Public Grievances (DARPG)**
    - Service Delivery Complaint
    - Department Response Delay

30. **Public Works (PWD)**
    - Road Construction Issue
    - Government Building Issue
    - Bridge Repair Issue

31. **Railways – Ministry of Railways**
    - Ticket Refund Issue
    - Train Cleanliness
    - Lost Luggage
    - Train Delay Complaint

32. **Revenue – Department of Revenue**
    - Property Tax Issue
    - Land Records Update
    - Income Tax Issue

33. **Road Transport (MoRTH)**
    - Driving License Issue
    - RC Transfer Delay
    - Vehicle Fitness Issue

34. **Rural Development**
    - PMAY Housing Delay
    - MGNREGA Payment Issue
    - Rural Road/Water Issue

35. **Science & Technology**
    - Research Grant Issue
    - Technical Approval Delay

36. **Skills – Ministry of Skill Development**
    - Skill Certificate Issue
    - Training Center Complaint

37. **Social Justice**
    - Pension Not Received
    - Caste Certificate Issue
    - Disability Certificate Issue

38. **Telecommunications (DoT)**
    - Network Complaint
    - SIM Verification Issue
    - Internet Service Issue

39. **Urban Development (MoHUA)**
    - Smart City Work Issue
    - Metro Rail Complaint
    - City Sanitation Problem

40. **Water – Ministry of Jal Shakti**
    - Drinking Water Issue
    - Water Pipeline Leak
    - Low Water Supply

41. **Women & Child Development**
    - Anganwadi Issue
    - Child Protection Issue
    - Women Safety Complaint

---

## Key Features Explained

### 1. Real-time Tracking
- Track application status at every step
- Detailed timeline showing all updates
- Push notifications for status changes
- View assigned official information

### 2. AI Monitoring
- Automatic delay detection
- Smart workload distribution
- Performance analytics
- Escalation management

### 3. Blockchain Verification
- Tamper-proof certificates
- Permanent record of approvals
- Cryptographic security
- Public verifiability

### 4. OTP Verification
- Secure login
- Rating verification
- Account creation
- Prevents fraud

### 5. Auto-Assignment Algorithm
**Factors Considered:**
- Department and sub-department match
- Official's current workload (active applications)
- Official's rating (lower-rated get fewer assignments)
- Official's total assigned count (history)
- Official's availability

**Assignment Priority:**
1. Lowest active workload
2. Lowest total assigned (history)
3. Earliest registration date

### 6. Solved/Unsolved Tracking
**When Application is Rejected:**
- Status = "Rejected"
- Solved = false
- Official's notSolvedCount increases by 1
- Appears in admin's "Unsolved" tab

**When Rejected Application is Later Approved:**
- Status = "Approved"
- Solved = true
- Official's notSolvedCount decreases by 1
- Official's solvedCount increases by 1
- Moves to admin's "Solved" tab

**No Double Counting:**
- System tracks previous status
- Counts are adjusted correctly
- Real-time updates in dashboard

---

## Tips for Best Experience

### For Citizens:
1. **Be Detailed:** Provide clear descriptions in applications
2. **Upload Evidence:** Attach photos/documents when relevant
3. **Track Regularly:** Check your dashboard for updates
4. **Rate Fairly:** Give honest feedback to improve service
5. **Use Tracking ID:** Save your tracking ID for reference

### For Officials:
1. **Accept Promptly:** Accept applications quickly to avoid delays
2. **Update Regularly:** Update status to keep citizens informed
3. **Add Comments:** Explain your decisions clearly
4. **Prioritize:** Use priority flags for urgent applications
5. **Avoid Delays:** Process within 7 days to avoid alerts

### For Admins:
1. **Monitor Daily:** Check dashboard regularly
2. **Watch Alerts:** Address officials with 3+ pending applications
3. **Send Warnings:** Use warning system for underperforming officials
4. **Review Ratings:** Check official ratings and feedback
5. **Track Trends:** Monitor department statistics

---

## Troubleshooting

### Login Issues
**Problem:** Cannot login
**Solutions:**
- Check username/email spelling
- Verify password is correct
- Ensure you selected the correct role
- Check if OTP was received
- Clear browser cache and try again

### OTP Issues
**Problem:** OTP not received
**Solutions:**
- Check spam/junk folder (for email OTP)
- Wait 1-2 minutes
- Check browser console (F12 → Console) for testing
- Request new OTP
- Contact support

### Application Submission Issues
**Problem:** Cannot submit application
**Solutions:**
- Ensure all required fields are filled
- Check department and sub-department are selected
- Verify image size is under 50MB
- Try refreshing the page
- Check internet connection

### Performance Issues
**Problem:** Page loading slowly
**Solutions:**
- Clear browser cache
- Check internet connection
- Try different browser
- Disable browser extensions
- Contact support if issue persists

---

## Security & Privacy

### Data Protection
- All passwords are encrypted (bcrypt hashing)
- JWT tokens for secure authentication
- Session-based security
- OTP verification for sensitive actions

### Privacy Policy
- Personal data is stored securely
- Only authorized users can access your data
- Admins can view application details for monitoring
- Ratings are linked to applications but not publicly visible

### Best Practices
1. **Never share your password**
2. **Logout after use** (especially on shared computers)
3. **Keep your OTP private**
4. **Use strong passwords** (mix of letters, numbers, symbols)
5. **Report suspicious activity** to support

---

## System Requirements

### Minimum Requirements
- **Browser:** Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Internet:** Stable connection (minimum 1 Mbps)
- **Screen:** 1024x768 or higher
- **JavaScript:** Must be enabled

### Recommended
- **Browser:** Latest version of Chrome or Firefox
- **Internet:** 5 Mbps or higher
- **Screen:** 1920x1080 or higher
- **Device:** Desktop or laptop for best experience

### Mobile Support
- Fully responsive design
- Works on iOS and Android
- Touch-friendly interface
- Optimized for mobile screens

---

## Glossary

**Application:** A request submitted by a citizen for a government service

**Tracking ID:** Unique identifier for each application (e.g., APP-ABC123)

**OTP:** One-Time Password sent via SMS or email for verification

**Blockchain Hash:** Unique cryptographic identifier for approved applications

**Escalation:** Reassigning an application to another official

**Sub-Department:** Specific issue type within a department

**Auto-Approval:** Automatic approval after 30 days of no action

**Solved:** Application marked as resolved by citizen

**Not Solved:** Application marked as unresolved, triggers escalation

**Official:** Government employee who processes applications

**Admin:** System administrator who monitors officials and departments

**Citizen:** User who submits and tracks applications

**Rating:** 1-5 star feedback given by citizens to officials

**Workload:** Number of active (pending) applications assigned to an official

---

## Quick Reference

### Important URLs
- **Homepage:** `/`
- **Login:** `/login`
- **Register:** `/register`
- **Citizen Dashboard:** `/citizen/dashboard`
- **Submit Application:** `/citizen/submit`
- **Track Application:** `/track` or `/citizen/track`
- **Official Dashboard:** `/official/dashboard`
- **Admin Dashboard:** `/admin/dashboard`

### Secret Keys
- **Official Registration:** `official@2025`
- **Admin Registration:** `admin@2025`

### Default Test Credentials (if seeded)
- **Admin:** username: `admin`, password: `password123`
- **Health Admin:** username: `health_admin`, password: `password123`
- **Police Admin:** username: `police_admin`, password: `password123`

### Status Colors
- **Submitted:** Blue
- **Assigned:** Purple
- **In Progress:** Yellow
- **Approved:** Green
- **Rejected:** Red
- **Auto-Approved:** Emerald

### Priority Levels
- **High:** Red badge
- **Medium:** Orange badge
- **Normal:** Gray badge

---

## Support & Feedback

### Getting Help
1. Use the chatbot widget (top-right corner)
2. Email: support@digitalgovernance.gov.in
3. Phone: +91 1800-123-4567
4. Check this user manual
5. Review FAQ section

### Providing Feedback
- Rate officials after application completion
- Use the feedback form (link in footer)
- Contact support with suggestions
- Report bugs or issues

### Reporting Issues
**Include:**
- Your username (don't share password)
- Page/feature where issue occurred
- Steps to reproduce
- Screenshots (if applicable)
- Browser and device information

---

## Version Information

**Platform Version:** 1.0.0
**Last Updated:** December 2025
**Manual Version:** 1.0

---

## Conclusion

The Digital Governance Platform is designed to make government services transparent, efficient, and citizen-friendly. With features like AI monitoring, blockchain verification, and guaranteed 30-day processing, we ensure your applications are handled promptly and fairly.

For any questions or assistance, use the chatbot widget or contact our support team.

**Thank you for using the Digital Governance Platform!**

---

## Appendix: Technical Details

### Application Lifecycle
1. **Submitted** → Citizen submits application
2. **Assigned** → Auto-assigned to official
3. **In Progress** → Official working on it
4. **Approved/Rejected** → Official makes decision
5. **Rating** → Citizen rates official
6. **Solved/Not Solved** → Citizen marks resolution status
7. **Escalation** (if not solved) → Reassigned to another official

### Count Tracking System
**For Officials:**
- `assignedCount`: Total applications ever assigned
- `solvedCount`: Applications marked as solved
- `notSolvedCount`: Applications rejected (not yet approved)

**Count Updates:**
- Reject: `notSolvedCount` +1
- Approve after reject: `notSolvedCount` -1, `solvedCount` +1
- Approve (first time): `solvedCount` +1

### API Endpoints (for developers)
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/verify-otp` - Verify OTP
- `GET /api/applications` - Get applications
- `POST /api/applications` - Submit application
- `PATCH /api/applications/:id/status` - Update status
- `POST /api/feedback` - Submit rating
- `GET /api/public/ratings` - Get department ratings
- `GET /api/notifications` - Get notifications

---

**End of User Manual**

