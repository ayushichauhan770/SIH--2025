// Sub-department data structure for all departments
export interface SubDepartment {
  name: string;
  issueTypes: string[];
}

export interface DepartmentWithSubDepartments {
  department: string;
  subDepartments: SubDepartment[];
}

export const DEPARTMENTS_WITH_SUB_DEPARTMENTS: DepartmentWithSubDepartments[] = [
  {
    department: "Aadhaar – Unique Identification Authority of India (UIDAI)",
    subDepartments: [
      { name: "Aadhaar Update (Name/DOB/Address mismatch)", issueTypes: ["Name Update", "DOB Update", "Address Update", "Mismatch Issue"] },
      { name: "Aadhaar Not Generated / Rejected", issueTypes: ["Not Generated", "Rejected Application", "Processing Delay"] },
      { name: "Mobile Number Linking Issue", issueTypes: ["Linking Failed", "Number Not Updated", "Verification Issue"] },
      { name: "Biometric Update Issue", issueTypes: ["Biometric Update Failed", "Fingerprint Issue", "Iris Scan Issue"] },
      { name: "Aadhaar Authentication Failure", issueTypes: ["Authentication Failed", "OTP Issue", "Verification Problem"] },
    ],
  },
  {
    department: "Animal Husbandry & Dairying – Department of Animal Husbandry and Dairying",
    subDepartments: [
      { name: "Veterinary Hospital Service Delay", issueTypes: ["Service Delay", "Appointment Issue", "Treatment Delay"] },
      { name: "Livestock Health Certificate Issue", issueTypes: ["Certificate Not Issued", "Delay in Issue", "Documentation Problem"] },
      { name: "Dairy Subsidy / Scheme Approval Pending", issueTypes: ["Subsidy Not Received", "Approval Pending", "Scheme Application Issue"] },
      { name: "Animal Vaccine Availability Issue", issueTypes: ["Vaccine Not Available", "Supply Issue", "Distribution Problem"] },
    ],
  },
  {
    department: "Agriculture – Ministry of Agriculture and Farmers Welfare",
    subDepartments: [
      { name: "Crop Subsidy Not Received", issueTypes: ["Subsidy Delay", "Payment Issue", "Application Rejected"] },
      { name: "PM-Kisan Payment Issue", issueTypes: ["Payment Not Received", "Account Issue", "Verification Problem"] },
      { name: "Soil Health Card Issue", issueTypes: ["Card Not Received", "Delay in Issue", "Data Error"] },
      { name: "Fertilizer Availability Issue", issueTypes: ["Fertilizer Not Available", "Supply Issue", "Distribution Problem"] },
      { name: "Seed Quality Complaint", issueTypes: ["Poor Quality", "Wrong Seed", "Complaint Not Addressed"] },
    ],
  },
  {
    department: "CBSE – Central Board of Secondary Education",
    subDepartments: [
      { name: "Marksheet Correction", issueTypes: ["Name Correction", "Marks Correction", "Date Correction"] },
      { name: "Certificate Not Received", issueTypes: ["Certificate Delay", "Not Delivered", "Lost Certificate"] },
      { name: "Exam Registration Issue", issueTypes: ["Registration Failed", "Fee Payment Issue", "Form Submission Problem"] },
      { name: "School Affiliation Complaint", issueTypes: ["Affiliation Issue", "Recognition Problem", "Complaint Not Addressed"] },
    ],
  },
  {
    department: "Central Public Works Department (CPWD)",
    subDepartments: [
      { name: "Building Maintenance Issue", issueTypes: ["Maintenance Delay", "Repair Not Done", "Quality Issue"] },
      { name: "Public Infrastructure Repair", issueTypes: ["Repair Delay", "Infrastructure Damage", "Safety Concern"] },
      { name: "Water Pipeline Damage", issueTypes: ["Pipeline Leak", "Water Supply Issue", "Repair Delay"] },
      { name: "Road/Pavement Construction Issue", issueTypes: ["Construction Delay", "Quality Issue", "Safety Concern"] },
    ],
  },
  {
    department: "Consumer Affairs – Department of Consumer Affairs",
    subDepartments: [
      { name: "Consumer Fraud Complaint", issueTypes: ["Fraud Case", "Scam Complaint", "Misleading Advertisement"] },
      { name: "Price Overcharging", issueTypes: ["Overcharging", "Price Manipulation", "Billing Issue"] },
      { name: "Faulty Product Complaint", issueTypes: ["Defective Product", "Warranty Issue", "Replacement Problem"] },
      { name: "Weights & Measures Issue", issueTypes: ["Wrong Weight", "Measurement Issue", "Calibration Problem"] },
    ],
  },
  {
    department: "Corporate Affairs – Ministry of Corporate Affairs",
    subDepartments: [
      { name: "Company Registration Issue", issueTypes: ["Registration Delay", "Documentation Problem", "Rejection Issue"] },
      { name: "DIN/KYC Issue", issueTypes: ["DIN Not Generated", "KYC Verification Issue", "Update Problem"] },
      { name: "Filing/Compliance Issue", issueTypes: ["Filing Delay", "Compliance Problem", "Penalty Issue"] },
    ],
  },
  {
    department: "Education – Ministry of Education",
    subDepartments: [
      { name: "Scholarship Not Received", issueTypes: ["Payment Delay", "Application Rejected", "Verification Issue"] },
      { name: "School/College Mismanagement", issueTypes: ["Management Issue", "Administrative Problem", "Complaint Not Addressed"] },
      { name: "Admission Issue", issueTypes: ["Admission Delay", "Seat Allocation Problem", "Documentation Issue"] },
      { name: "Fee-Related Complaint", issueTypes: ["Fee Overcharging", "Refund Issue", "Payment Problem"] },
    ],
  },
  {
    department: "Electricity – Ministry of Power",
    subDepartments: [
      { name: "Power Outage", issueTypes: ["Frequent Outage", "Long Duration Outage", "Unplanned Outage"] },
      { name: "Wrong Electricity Bill", issueTypes: ["Bill Error", "Overcharging", "Meter Reading Issue"] },
      { name: "New Electricity Connection Issue", issueTypes: ["Connection Delay", "Documentation Problem", "Installation Issue"] },
      { name: "Meter Fault/Replacement", issueTypes: ["Faulty Meter", "Replacement Delay", "Reading Issue"] },
    ],
  },
  {
    department: "Election Commission of India (ECI)",
    subDepartments: [
      { name: "Voter ID Correction", issueTypes: ["Name Correction", "Address Correction", "Photo Issue"] },
      { name: "New Voter Registration Delay", issueTypes: ["Registration Delay", "Application Pending", "Verification Issue"] },
      { name: "Voter List Name Missing", issueTypes: ["Name Missing", "List Update Issue", "Correction Not Done"] },
    ],
  },
  {
    department: "Employees' Provident Fund Organisation (EPFO)",
    subDepartments: [
      { name: "PF Withdrawal Delay", issueTypes: ["Withdrawal Delay", "Payment Issue", "Verification Problem"] },
      { name: "KYC Verification Issue", issueTypes: ["KYC Pending", "Verification Failed", "Document Issue"] },
      { name: "Name Mismatch", issueTypes: ["Name Correction", "Update Issue", "Verification Problem"] },
      { name: "Pension Issue", issueTypes: ["Pension Not Received", "Payment Delay", "Calculation Error"] },
    ],
  },
  {
    department: "Employees' State Insurance Corporation (ESIC)",
    subDepartments: [
      { name: "ESI Card Issue", issueTypes: ["Card Not Received", "Card Update Issue", "Renewal Problem"] },
      { name: "Hospital Facility Issue", issueTypes: ["Treatment Denied", "Facility Not Available", "Service Quality Issue"] },
      { name: "Employer Contribution Missing", issueTypes: ["Contribution Not Paid", "Payment Delay", "Verification Issue"] },
    ],
  },
  {
    department: "Finance – Ministry of Finance",
    subDepartments: [
      { name: "Tax Refund Delay", issueTypes: ["Refund Not Received", "Processing Delay", "Verification Issue"] },
      { name: "PAN Database Mistake", issueTypes: ["PAN Correction", "Database Error", "Update Issue"] },
      { name: "GST Registration Issue", issueTypes: ["Registration Delay", "Documentation Problem", "Verification Issue"] },
    ],
  },
  {
    department: "Food & Civil Supplies – Department of Food and Public Distribution",
    subDepartments: [
      { name: "Ration Not Provided", issueTypes: ["Ration Not Received", "Supply Issue", "Distribution Problem"] },
      { name: "Ration Card Update Issue", issueTypes: ["Card Update Delay", "Information Not Updated", "Verification Issue"] },
      { name: "Wrong Quantity of Foodgrains", issueTypes: ["Quantity Mismatch", "Short Supply", "Quality Issue"] },
    ],
  },
  {
    department: "Forest – Ministry of Environment, Forest and Climate Change",
    subDepartments: [
      { name: "Forest Land Dispute", issueTypes: ["Land Dispute", "Boundary Issue", "Ownership Problem"] },
      { name: "Wildlife Complaint", issueTypes: ["Wildlife Encounter", "Conservation Issue", "Complaint Not Addressed"] },
      { name: "Timber Permit Issue", issueTypes: ["Permit Not Issued", "Delay in Issue", "Documentation Problem"] },
    ],
  },
  {
    department: "Health – Ministry of Health and Family Welfare",
    subDepartments: [
      { name: "Hospital Negligence", issueTypes: ["Medical Negligence", "Treatment Issue", "Service Quality Problem"] },
      { name: "Medicine Shortage", issueTypes: ["Medicine Not Available", "Supply Issue", "Distribution Problem"] },
      { name: "Health Card Issue", issueTypes: ["Card Not Received", "Update Issue", "Verification Problem"] },
      { name: "Vaccination Issue", issueTypes: ["Vaccination Delay", "Availability Issue", "Registration Problem"] },
    ],
  },
  {
    department: "Home Affairs – Ministry of Home Affairs",
    subDepartments: [
      { name: "Passport Police Verification Delay", issueTypes: ["Verification Delay", "Police Report Issue", "Processing Problem"] },
      { name: "Citizenship/ID Issues", issueTypes: ["Citizenship Issue", "ID Card Problem", "Documentation Issue"] },
      { name: "Security/Local Authority Delay", issueTypes: ["Security Clearance Delay", "Authority Issue", "Processing Problem"] },
    ],
  },
  {
    department: "Income Tax Department (CBDT)",
    subDepartments: [
      { name: "PAN Card Correction", issueTypes: ["Name Correction", "Date Correction", "Address Correction"] },
      { name: "Refund Not Received", issueTypes: ["Refund Delay", "Processing Issue", "Verification Problem"] },
      { name: "TDS Mismatch", issueTypes: ["TDS Error", "Mismatch Issue", "Correction Problem"] },
    ],
  },
  {
    department: "Industrial Development – Department for Promotion of Industry and Internal Trade (DPIIT)",
    subDepartments: [
      { name: "Startup India Registration Issue", issueTypes: ["Registration Delay", "Documentation Problem", "Verification Issue"] },
      { name: "Industrial License Delay", issueTypes: ["License Delay", "Approval Pending", "Documentation Issue"] },
      { name: "Trademark Complaint", issueTypes: ["Trademark Issue", "Registration Problem", "Complaint Not Addressed"] },
    ],
  },
  {
    department: "Labour – Ministry of Labour and Employment",
    subDepartments: [
      { name: "Wage Fraud Complaint", issueTypes: ["Wage Not Paid", "Payment Delay", "Fraud Case"] },
      { name: "Workplace Safety Issue", issueTypes: ["Safety Concern", "Accident Issue", "Complaint Not Addressed"] },
      { name: "Labour Card Issue", issueTypes: ["Card Not Received", "Update Issue", "Verification Problem"] },
    ],
  },
  {
    department: "Minority Affairs – Ministry of Minority Affairs",
    subDepartments: [
      { name: "Scholarship Issue", issueTypes: ["Scholarship Not Received", "Payment Delay", "Application Rejected"] },
      { name: "Documentation Problem", issueTypes: ["Document Issue", "Verification Problem", "Update Delay"] },
      { name: "Approval Delay", issueTypes: ["Approval Pending", "Processing Delay", "Verification Issue"] },
    ],
  },
  {
    department: "Municipal Corporation / Urban Local Bodies (ULBs)",
    subDepartments: [
      { name: "Garbage Collection Issue", issueTypes: ["Collection Delay", "Not Collected", "Service Quality Issue"] },
      { name: "Road Repair Request", issueTypes: ["Road Damage", "Repair Delay", "Safety Concern"] },
      { name: "Drainage/Sewer Problem", issueTypes: ["Drainage Blockage", "Sewer Issue", "Waterlogging Problem"] },
      { name: "Property Tax Issue", issueTypes: ["Tax Calculation Error", "Payment Issue", "Assessment Problem"] },
      { name: "Street Light Complaint", issueTypes: ["Light Not Working", "Installation Issue", "Maintenance Problem"] },
    ],
  },
  {
    department: "Panchayati Raj – Ministry of Panchayati Raj",
    subDepartments: [
      { name: "Gram Panchayat Certificate Delay", issueTypes: ["Certificate Delay", "Not Issued", "Verification Issue"] },
      { name: "Local Development Work Issue", issueTypes: ["Work Delay", "Quality Issue", "Complaint Not Addressed"] },
      { name: "Water Supply Issue", issueTypes: ["Water Supply Problem", "Supply Delay", "Quality Issue"] },
    ],
  },
  {
    department: "Passport – Ministry of External Affairs (Passport Seva)",
    subDepartments: [
      { name: "Passport Delay", issueTypes: ["Processing Delay", "Not Delivered", "Verification Issue"] },
      { name: "Document Verification Issue", issueTypes: ["Verification Delay", "Document Problem", "Rejection Issue"] },
      { name: "Police Verification Delay", issueTypes: ["Verification Delay", "Police Report Issue", "Processing Problem"] },
    ],
  },
  {
    department: "Personnel & Training – Department of Personnel and Training (DoPT)",
    subDepartments: [
      { name: "Government Employee Grievance", issueTypes: ["Grievance Not Addressed", "Complaint Issue", "Service Problem"] },
      { name: "Recruitment Process Delay", issueTypes: ["Recruitment Delay", "Result Delay", "Process Issue"] },
      { name: "Transfer/Posting Issue", issueTypes: ["Transfer Delay", "Posting Problem", "Request Not Processed"] },
    ],
  },
  {
    department: "Police – State Police Department",
    subDepartments: [
      { name: "FIR Not Registered", issueTypes: ["FIR Registration Denied", "Delay in Registration", "Complaint Not Addressed"] },
      { name: "Case Delay", issueTypes: ["Investigation Delay", "Case Not Progressed", "Court Issue"] },
      { name: "Verification Delay", issueTypes: ["Verification Delay", "Report Not Issued", "Processing Problem"] },
      { name: "Police Misconduct Complaint", issueTypes: ["Misconduct Issue", "Complaint Not Addressed", "Service Quality Problem"] },
    ],
  },
  {
    department: "Pollution – Central Pollution Control Board (CPCB)",
    subDepartments: [
      { name: "Air Pollution Complaint", issueTypes: ["Air Quality Issue", "Pollution Source", "Complaint Not Addressed"] },
      { name: "Water Pollution Complaint", issueTypes: ["Water Quality Issue", "Pollution Source", "Complaint Not Addressed"] },
      { name: "Industrial Waste Leak", issueTypes: ["Waste Leakage", "Environmental Hazard", "Safety Concern"] },
    ],
  },
  {
    department: "Post Office – Department of Posts",
    subDepartments: [
      { name: "Speed Post Delay", issueTypes: ["Delivery Delay", "Not Delivered", "Tracking Issue"] },
      { name: "Lost Parcel", issueTypes: ["Parcel Lost", "Delivery Issue", "Compensation Problem"] },
      { name: "Post Office Savings Issue", issueTypes: ["Savings Account Issue", "Payment Problem", "Service Issue"] },
    ],
  },
  {
    department: "Public Grievances – Department of Administrative Reforms and Public Grievances (DARPG)",
    subDepartments: [
      { name: "Service Delivery Complaint", issueTypes: ["Service Delay", "Quality Issue", "Complaint Not Addressed"] },
      { name: "Department Response Delay", issueTypes: ["Response Delay", "No Response", "Processing Issue"] },
    ],
  },
  {
    department: "Public Works – Public Works Department (PWD)",
    subDepartments: [
      { name: "Road Construction Issue", issueTypes: ["Construction Delay", "Quality Issue", "Safety Concern"] },
      { name: "Government Building Issue", issueTypes: ["Building Maintenance", "Construction Issue", "Safety Concern"] },
      { name: "Bridge Repair Issue", issueTypes: ["Repair Delay", "Safety Concern", "Quality Issue"] },
    ],
  },
  {
    department: "Railways – Ministry of Railways",
    subDepartments: [
      { name: "Ticket Refund Issue", issueTypes: ["Refund Delay", "Refund Not Received", "Processing Problem"] },
      { name: "Train Cleanliness", issueTypes: ["Cleanliness Issue", "Hygiene Problem", "Service Quality Issue"] },
      { name: "Lost Luggage", issueTypes: ["Luggage Lost", "Compensation Issue", "Tracking Problem"] },
      { name: "Train Delay Complaint", issueTypes: ["Frequent Delay", "Long Delay", "Service Issue"] },
    ],
  },
  {
    department: "Revenue – Department of Revenue (Ministry of Finance)",
    subDepartments: [
      { name: "Property Tax Issue", issueTypes: ["Tax Calculation Error", "Payment Issue", "Assessment Problem"] },
      { name: "Land Records Update", issueTypes: ["Record Update Delay", "Information Not Updated", "Verification Issue"] },
      { name: "Income Tax Issue", issueTypes: ["Tax Issue", "Refund Problem", "Verification Issue"] },
    ],
  },
  {
    department: "Road Transport – Ministry of Road Transport and Highways (MoRTH)",
    subDepartments: [
      { name: "Driving License Issue", issueTypes: ["License Delay", "Renewal Issue", "Verification Problem"] },
      { name: "RC Transfer Delay", issueTypes: ["Transfer Delay", "Documentation Issue", "Processing Problem"] },
      { name: "Vehicle Fitness Issue", issueTypes: ["Fitness Certificate Issue", "Renewal Problem", "Verification Issue"] },
    ],
  },
  {
    department: "Rural Development – Ministry of Rural Development",
    subDepartments: [
      { name: "PMAY Housing Delay", issueTypes: ["Housing Delay", "Approval Pending", "Payment Issue"] },
      { name: "MGNREGA Payment Issue", issueTypes: ["Payment Delay", "Payment Not Received", "Verification Issue"] },
      { name: "Rural Road/Water Issue", issueTypes: ["Road Issue", "Water Supply Problem", "Infrastructure Issue"] },
    ],
  },
  {
    department: "Science & Technology – Ministry of Science and Technology",
    subDepartments: [
      { name: "Research Grant Issue", issueTypes: ["Grant Not Received", "Payment Delay", "Approval Issue"] },
      { name: "Technical Approval Delay", issueTypes: ["Approval Delay", "Processing Issue", "Verification Problem"] },
    ],
  },
  {
    department: "Skills – Ministry of Skill Development and Entrepreneurship",
    subDepartments: [
      { name: "Skill Certificate Issue", issueTypes: ["Certificate Not Received", "Delay in Issue", "Verification Problem"] },
      { name: "Training Center Complaint", issueTypes: ["Training Quality Issue", "Facility Problem", "Complaint Not Addressed"] },
    ],
  },
  {
    department: "Social Justice – Ministry of Social Justice and Empowerment",
    subDepartments: [
      { name: "Pension Not Received", issueTypes: ["Pension Delay", "Payment Issue", "Verification Problem"] },
      { name: "Caste Certificate Issue", issueTypes: ["Certificate Not Issued", "Delay in Issue", "Verification Issue"] },
      { name: "Disability Certificate Issue", issueTypes: ["Certificate Not Issued", "Delay in Issue", "Medical Verification Issue"] },
    ],
  },
  {
    department: "Telecommunications – Department of Telecommunications (DoT)",
    subDepartments: [
      { name: "Network Complaint", issueTypes: ["Network Issue", "Signal Problem", "Service Quality Issue"] },
      { name: "SIM Verification Issue", issueTypes: ["Verification Delay", "KYC Problem", "Documentation Issue"] },
      { name: "Internet Service Issue", issueTypes: ["Internet Not Working", "Speed Issue", "Service Quality Problem"] },
    ],
  },
  {
    department: "Urban Development – Ministry of Housing and Urban Affairs (MoHUA)",
    subDepartments: [
      { name: "Smart City Work Issue", issueTypes: ["Work Delay", "Quality Issue", "Implementation Problem"] },
      { name: "Metro Rail Complaint", issueTypes: ["Service Issue", "Delay Problem", "Facility Issue"] },
      { name: "City Sanitation Problem", issueTypes: ["Sanitation Issue", "Waste Management Problem", "Service Quality Issue"] },
    ],
  },
  {
    department: "Water – Ministry of Jal Shakti",
    subDepartments: [
      { name: "Drinking Water Issue", issueTypes: ["Water Supply Problem", "Quality Issue", "Supply Delay"] },
      { name: "Water Pipeline Leak", issueTypes: ["Pipeline Leak", "Repair Delay", "Water Wastage"] },
      { name: "Low Water Supply", issueTypes: ["Supply Issue", "Pressure Problem", "Distribution Issue"] },
    ],
  },
  {
    department: "Women & Child Development – Ministry of Women and Child Development",
    subDepartments: [
      { name: "Anganwadi Issue", issueTypes: ["Service Issue", "Facility Problem", "Complaint Not Addressed"] },
      { name: "Child Protection Issue", issueTypes: ["Protection Concern", "Complaint Not Addressed", "Service Issue"] },
      { name: "Women Safety Complaint", issueTypes: ["Safety Concern", "Complaint Not Addressed", "Service Issue"] },
    ],
  },
];

// Helper function to get sub-departments for a department
export function getSubDepartmentsForDepartment(department: string): SubDepartment[] {
  const deptData = DEPARTMENTS_WITH_SUB_DEPARTMENTS.find(
    (d) => d.department === department
  );
  return deptData?.subDepartments || [];
}

// Helper function to get all department names
export function getAllDepartmentNames(): string[] {
  return DEPARTMENTS_WITH_SUB_DEPARTMENTS.map((d) => d.department);
}


