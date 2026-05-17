# Online Condominium House Management System (OCHMS)

## System Overview

The Online Condominium House Management System (OCHMS) is a comprehensive web-based platform designed for Wolaita Sodo University to manage condominium housing allocation, applications, and resident services.

## Table of Contents

1. [System Features](#system-features)
2. [User Roles](#user-roles)
3. [Technical Architecture](#technical-architecture)
4. [Getting Started](#getting-started)
5. [User Guides](#user-guides)
6. [Scoring System](#scoring-system)
7. [Business Rules](#business-rules)

---

## System Features

### Core Features

1. **User Management**
   - Role-based authentication (Applicant, Campus Admin, CHMS Admin)
   - Secure login and registration
   - Profile management

2. **Application System**
   - Online house application submission
   - Automatic score calculation
   - Application status tracking

3. **Lottery System**
   - Fair, transparent lottery draws
   - Score-based winner selection
   - Automatic notification to winners

4. **Resident Management**
   - House assignment
   - Resident tracking
   - Leave request processing

5. **Payment Management**
   - Monthly payment submission
   - Payment verification
   - Payment history tracking

6. **Notification System**
   - System-wide announcements
   - Role-based notifications
   - Real-time updates

7. **Reporting**
   - Applicant reports
   - Resident reports
   - Payment reports
   - Statistical analysis

---

## User Roles

### 1. Applicant/Resident

**Responsibilities:**
- Register and apply for housing
- View lottery results
- Submit monthly payments
- Request to leave house
- Receive notifications
- Manage profile

**Access Level:** Limited to personal data and applications

### 2. Campus Admin

**Responsibilities:**
- Manage blocks and houses
- Verify payments
- Handle resident requests
- Generate campus reports
- Manage residents within campus

**Access Level:** Campus-specific data and operations

### 3. CHMS Admin

**Responsibilities:**
- Manage all applicants
- Conduct lottery draws
- Assign houses to winners
- Verify all payments
- Send system-wide notifications
- Generate comprehensive reports
- Manage campus locations

**Access Level:** Full system access

---

## Technical Architecture

### Frontend Technology Stack

- **Framework:** React 18.3.1
- **Language:** TypeScript
- **Routing:** React Router 7.13.0
- **Styling:** Tailwind CSS 4.1.12
- **Icons:** Lucide React
- **Notifications:** Sonner
- **State Management:** React Context API



### Data Models

#### Applicant
```typescript
{
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  gender: string
  academicLevel: string
  yearsOfService: number
  maritalStatus: string
  jobResponsibility: string
  isDisabled: boolean
}
```

#### Application
```typescript
{
  id: string
  applicantId: string
  applicantName: string
  applicationDate: string
  status: 'pending' | 'approved' | 'rejected' | 'lottery'
  score: number
  academicLevel: string
  yearsOfService: number
  maritalStatus: string
  jobResponsibility: string
  isDisabled: boolean
}
```

#### Resident
```typescript
{
  id: string
  applicantId: string
  houseId: string
  residentName: string
  moveInDate: string
  residenceStatus: 'active' | 'left'
  houseNumber: string
  blockName: string
}
```

#### House
```typescript
{
  id: string
  blockId: string
  houseNumber: string
  houseType: 'studio' | 'one_bedroom' | 'two_bedroom'
  status: 'available' | 'occupied'
}
```

#### Payment
```typescript
{
  id: string
  residentId: string
  residentName: string
  amount: number
  paymentDate: string
  paymentStatus: 'pending' | 'verified' | 'rejected'
  month: string
}
```

---

## Getting Started

### Registration Process

New applicants can register by:
1. Clicking "Register" on the landing page
2. Filling out the registration form with:
   - Personal information
   - Academic credentials
   - Employment details
   - Contact information
3. Submitting the form
4. Logging in with created credentials

---

## User Guides

### For Applicants

#### Applying for Housing

1. Log in to your account
2. Navigate to "Apply for House"
3. Verify or update your information
4. Review your calculated score
5. Submit application
6. Wait for notification

#### Checking Lottery Results

1. Go to "Lottery Result" page
2. View your application status
3. If selected, proceed to placement

#### Making Payments

1. Navigate to "Payment" section
2. Click "Make New Payment"
3. Select month and enter amount (minimum 1,200 Birr)
4. Submit payment
5. Wait for admin verification

### For Campus Admins

#### Managing Blocks

1. Go to "Manage Blocks"
2. Click "Add Block" to create new block
3. Add houses to blocks
4. View block occupancy status

#### Verifying Payments

1. Navigate to "Verify Payments"
2. Review pending payment submissions
3. Click "Verify" or "Reject"
4. Payment status updates automatically

### For CHMS Admins

#### Conducting Lottery

1. Go to "Draw Lottery"
2. Set number of winners
3. Review pending applications
4. Click "Draw Lottery"
5. System selects winners based on scores
6. Winners are notified automatically

#### Assigning Houses

1. Navigate to "Manage Placement"
2. Select approved applicant
3. Choose available house
4. Click "Assign House"
5. Resident record created automatically

#### Sending Notifications

1. Go to "Send Notifications"
2. Select recipient group (All, Applicants, Residents)
3. Choose notification type
4. Write message
5. Click "Send Notification"

---

## Scoring System

### Score Calculation Formula

The system uses a weighted scoring formula to rank applicants:

**Total Score = Academic Score + Service Score + Job Score + Marital Score + Disability Bonus**

### Score Breakdown

#### 1. Academic Level (50% weight)
- Bachelor: 25 points
- Masters: 35 points
- PhD: 45 points
- Professor: 50 points

#### 2. Years of Service (25% weight)
- 2.5 points per year
- Maximum: 25 points (10+ years)

#### 3. Job Responsibility (15% weight)
- Assistant Lecturer: 8 points
- Lecturer: 10 points
- Senior Lecturer: 12 points
- Department Head: 14 points
- Dean: 15 points

#### 4. Marital Status (10% weight)
- Single: 5 points
- Married: 10 points
- Divorced: 7 points
- Widowed: 7 points

#### 5. Disability Bonus (+10%)
- Female staff with disabilities: +10 points

### Example Calculation

**Applicant Profile:**
- Academic Level: PhD
- Years of Service: 5 years
- Job Responsibility: Lecturer
- Marital Status: Married
- Disability: No

**Score Calculation:**
- Academic: 45 points
- Service: 5 × 2.5 = 12.5 points
- Job: 10 points
- Marital: 10 points
- Disability: 0 points
- **Total: 77.5 ≈ 78 points**

---

## Business Rules

### Housing Allocation

1. **Total Houses:** 225 units across 15 blocks
2. **House Types:**
   - Studio apartments
   - One bedroom units
   - Two bedroom units

3. **Monthly Payment:** 1,200 Ethiopian Birr

### Application Process

1. Applications accepted during designated periods
2. One active application per applicant
3. Automatic score calculation on submission
4. No manual score adjustments

### Lottery Rules

1. Lottery conducted by CHMS Admin only
2. Winners selected based on highest scores
3. Number of winners determined by available houses
4. Results published to all applicants

### Payment Rules

1. Monthly payment due by specific date
2. Payments require admin verification
3. Late payment notifications sent automatically
4. Payment history maintained permanently

### Residency Rules

1. Residents must maintain good standing
2. Leave requests processed within 7-14 days
3. House inspection required before leaving
4. Damages charged to resident account

---

## System Configuration

### Constants

- **Monthly Payment:** 1,200 Birr
- **Total Blocks:** 15
- **Total Houses:** 225
- **Application Period:** Configurable
- **Lottery Frequency:** As needed

### Default Settings

- Email notifications: Enabled
- Payment reminders: Enabled
- Automatic scoring: Enabled
- Score visibility: Enabled

---

## Support & Maintenance

### Contact Information

- **System Support:** support@wsu.edu
- **Technical Issues:** technical@wsu.edu
- **General Inquiries:** info@wsu.edu

### Version Information

- **Current Version:** 1.0.0
- **Last Updated:** March 16, 2026
- **Platform:** Web-based (Browser compatible)

---

## Security & Privacy

### Data Protection

- User passwords encrypted
- Role-based access control
- Secure session management
- Data validation on all inputs

### Privacy Policy

- Personal information confidential
- Data used only for housing allocation
- No third-party data sharing
- Compliance with university policies

---

## Troubleshooting

### Common Issues

**Cannot Login:**
- Verify email and password
- Check account activation status
- Clear browser cache

**Application Not Submitting:**
- Ensure all required fields filled
- Check internet connection
- Verify data validity

**Payment Not Verified:**
- Wait for admin processing (24-48 hours)
- Contact campus admin if delayed
- Ensure correct amount submitted

---

## Future Enhancements

### Planned Features

1. Mobile application
2. Email integration
3. SMS notifications
4. Document upload capability
5. Online payment gateway
6. Advanced analytics dashboard
7. Multi-language support
8. House viewing scheduling

---

**© 2026 Wolaita Sodo University**  
**Online Condominium House Management System**
