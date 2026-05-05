// Mock data for the OCHMS system

export interface User {
  id: string;
  email: string;
  password: string;
  role: "applicant" | "campus_admin" | "chms_admin";
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface Applicant extends User {
  role: "applicant";
  gender: "Male" | "Female";
  academicLevel: string;
  yearsOfService: number;
  maritalStatus: "Single" | "Married" | "Divorced" | "Widowed";
  jobResponsibility: string;
  hasDisability?: boolean;
  applicationStatus?: "pending" | "approved" | "rejected" | "winner";
  score?: number;
}

export interface Application {
  id: string;
  applicantId: string;
  applicationDate: string;
  status: "pending" | "approved" | "rejected" | "winner";
  score: number;
}

export interface Block {
  id: string;
  blockName: string;
  totalHouses: number;
  campus: string;
}

export interface House {
  id: string;
  blockId: string;
  houseNumber: string;
  houseType: "Studio" | "One Bedroom" | "Two Bedroom";
  status: "available" | "occupied" | "maintenance";
  residentId?: string;
}

export interface Resident {
  id: string;
  applicantId: string;
  houseId: string;
  moveInDate: string;
  residenceStatus: "active" | "leaving" | "left";
}

export interface Payment {
  id: string;
  residentId: string;
  amount: number;
  paymentDate: string;
  paymentStatus: "pending" | "verified" | "rejected";
  month: string;
  year: number;
}

export interface Notification {
  id: string;
  message: string;
  dateSent: string;
  senderId: string;
  type: "announcement" | "lottery" | "payment" | "general";
  recipients: "all" | "applicants" | "residents";
}

export interface Feedback {
  id: string;
  userId: string;
  message: string;
  date: string;
  status: "pending" | "reviewed";
}

// Mock Users
export const mockUsers: User[] = [
  {
    id: "1",
    email: "applicant@wsu.edu",
    password: "password",
    role: "applicant",
    firstName: "Abebe",
    lastName: "Kebede",
    phone: "+251911234567",
  },
  {
    id: "2",
    email: "campus@wsu.edu",
    password: "password",
    role: "campus_admin",
    firstName: "Tigist",
    lastName: "Alemayehu",
    phone: "+251922345678",
  },
  {
    id: "3",
    email: "admin@wsu.edu",
    password: "password",
    role: "chms_admin",
    firstName: "Dawit",
    lastName: "Tesfaye",
    phone: "+251933456789",
  },
];

// Mock Applicants
export const mockApplicants: Applicant[] = [
  {
    id: "1",
    email: "applicant@wsu.edu",
    password: "password",
    role: "applicant",
    firstName: "Abebe",
    lastName: "Kebede",
    phone: "+251911234567",
    gender: "Male",
    academicLevel: "PhD",
    yearsOfService: 8,
    maritalStatus: "Married",
    jobResponsibility: "Department Head",
    applicationStatus: "winner",
    score: 85,
  },
  {
    id: "4",
    email: "sara.haile@wsu.edu",
    password: "password",
    role: "applicant",
    firstName: "Sara",
    lastName: "Haile",
    phone: "+251944567890",
    gender: "Female",
    academicLevel: "Masters",
    yearsOfService: 5,
    maritalStatus: "Single",
    jobResponsibility: "Lecturer",
    hasDisability: true,
    applicationStatus: "pending",
    score: 72,
  },
  {
    id: "5",
    email: "daniel.mulugeta@wsu.edu",
    password: "password",
    role: "applicant",
    firstName: "Daniel",
    lastName: "Mulugeta",
    phone: "+251955678901",
    gender: "Male",
    academicLevel: "Masters",
    yearsOfService: 3,
    maritalStatus: "Married",
    jobResponsibility: "Assistant Lecturer",
    applicationStatus: "pending",
    score: 58,
  },
];

// Mock Applications
export const mockApplications: Application[] = [
  {
    id: "1",
    applicantId: "1",
    applicationDate: "2026-01-15",
    status: "winner",
    score: 85,
  },
  {
    id: "2",
    applicantId: "4",
    applicationDate: "2026-01-20",
    status: "pending",
    score: 72,
  },
  {
    id: "3",
    applicantId: "5",
    applicationDate: "2026-02-01",
    status: "pending",
    score: 58,
  },
];

// Mock Blocks
export const mockBlocks: Block[] = [
  { id: "1", blockName: "Block A", totalHouses: 15, campus: "Main Campus" },
  { id: "2", blockName: "Block B", totalHouses: 15, campus: "Main Campus" },
  { id: "3", blockName: "Block C", totalHouses: 15, campus: "Main Campus" },
  { id: "4", blockName: "Block D", totalHouses: 15, campus: "South Campus" },
  { id: "5", blockName: "Block E", totalHouses: 15, campus: "South Campus" },
];

// Mock Houses
export const mockHouses: House[] = [
  {
    id: "1",
    blockId: "1",
    houseNumber: "A-101",
    houseType: "Two Bedroom",
    status: "occupied",
    residentId: "1",
  },
  {
    id: "2",
    blockId: "1",
    houseNumber: "A-102",
    houseType: "One Bedroom",
    status: "available",
  },
  {
    id: "3",
    blockId: "1",
    houseNumber: "A-103",
    houseType: "Studio",
    status: "available",
  },
  {
    id: "4",
    blockId: "2",
    houseNumber: "B-101",
    houseType: "Two Bedroom",
    status: "available",
  },
  {
    id: "5",
    blockId: "2",
    houseNumber: "B-102",
    houseType: "One Bedroom",
    status: "occupied",
    residentId: "2",
  },
];

// Mock Residents
export const mockResidents: Resident[] = [
  {
    id: "1",
    applicantId: "1",
    houseId: "1",
    moveInDate: "2026-02-01",
    residenceStatus: "active",
  },
];

// Mock Payments
export const mockPayments: Payment[] = [
  {
    id: "1",
    residentId: "1",
    amount: 1200,
    paymentDate: "2026-02-05",
    paymentStatus: "verified",
    month: "February",
    year: 2026,
  },
  {
    id: "2",
    residentId: "1",
    amount: 1200,
    paymentDate: "2026-03-05",
    paymentStatus: "pending",
    month: "March",
    year: 2026,
  },
];

// Mock Notifications
export const mockNotifications: Notification[] = [
  {
    id: "1",
    message: "Condominium application period is now open. Apply before March 31, 2026.",
    dateSent: "2026-03-01",
    senderId: "3",
    type: "announcement",
    recipients: "all",
  },
  {
    id: "2",
    message: "Lottery results are now available. Check your dashboard.",
    dateSent: "2026-02-15",
    senderId: "3",
    type: "lottery",
    recipients: "applicants",
  },
  {
    id: "3",
    message: "Monthly payment for March 2026 is due on March 5th.",
    dateSent: "2026-02-25",
    senderId: "3",
    type: "payment",
    recipients: "residents",
  },
];

// Mock Feedback
export const mockFeedback: Feedback[] = [
  {
    id: "1",
    userId: "1",
    message: "The application process was smooth and easy to follow.",
    date: "2026-02-20",
    status: "reviewed",
  },
  {
    id: "2",
    userId: "4",
    message: "Could you please add more information about the lottery process?",
    date: "2026-03-10",
    status: "pending",
  },
];

// Calculate applicant score based on criteria
export function calculateApplicantScore(applicant: {
  academicLevel: string;
  yearsOfService: number;
  jobResponsibility: string;
  maritalStatus: string;
  gender?: string;
  hasDisability?: boolean;
}): number {
  let score = 0;

  // Academic Level (50%)
  const academicScores: { [key: string]: number } = {
    "PhD": 50,
    "Masters": 40,
    "Bachelors": 30,
    "Diploma": 20,
  };
  score += academicScores[applicant.academicLevel] || 0;

  // Years of Service (25%)
  if (applicant.yearsOfService >= 10) score += 25;
  else if (applicant.yearsOfService >= 7) score += 20;
  else if (applicant.yearsOfService >= 5) score += 15;
  else if (applicant.yearsOfService >= 3) score += 10;
  else score += 5;

  // Job Responsibility (15%)
  const jobScores: { [key: string]: number } = {
    "Department Head": 15,
    "Senior Lecturer": 12,
    "Lecturer": 9,
    "Assistant Lecturer": 6,
    "Other": 3,
  };
  score += jobScores[applicant.jobResponsibility] || 0;

  // Marital Status (10%)
  const maritalScores: { [key: string]: number } = {
    "Married": 10,
    "Divorced": 7,
    "Widowed": 7,
    "Single": 5,
  };
  score += maritalScores[applicant.maritalStatus] || 0;

  // Disability bonus for female staff (10%)
  if (applicant.gender === "Female" && applicant.hasDisability) {
    score += 10;
  }

  return score;
}
