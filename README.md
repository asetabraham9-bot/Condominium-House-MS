# Online Condominium House Management System (OCHMS)

A comprehensive web-based platform for managing condominium housing allocation, applications, and resident services at Wolaita Sodo University.


## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [User Roles](#user-roles)
- [System Architecture](#system-architecture)
- [Scoring Algorithm](#scoring-algorithm)
- [Screenshots](#screenshots)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

OCHMS is designed to replace the manual condominium management process at Wolaita Sodo University with a computerized, efficient, and transparent system. The platform manages:

- 🏢 **225 housing units** across 15 blocks
- 📝 **Application processing** with automatic scoring
- 🎲 **Fair lottery system** for house allocation
- 💰 **Payment management** (1,200 Birr/month)
- 📊 **Comprehensive reporting** and analytics
- 🔔 **Notification system** for applicants and residents

## ✨ Features

### For Applicants/Residents
- ✅ Online registration and application
- 📈 Real-time score calculation
- 🎯 Lottery result viewing
- 💳 Payment submission and tracking
- 📬 Notification reception
- 🏠 Leave house requests
- ⚙️ Profile management

### For Campus Admins
- 🏗️ Block and house management
- 👥 Resident oversight
- ✔️ Payment verification
- 📋 Request handling
- 📊 Campus-level reporting

### For CHMS Admins
- 👨‍💼 Full applicant management
- 🎲 Lottery draw execution
- 🏘️ House placement control
- 💵 System-wide payment verification
- 📢 Notification broadcasting
- 📈 Comprehensive analytics
- 🌍 Multi-campus management

## 🛠️ Technology Stack

### Frontend
- **React** 18.3.1 - UI framework
- **TypeScript** - Type-safe JavaScript
- **React Router** 7.13.0 - Client-side routing
- **Tailwind CSS** 4.1.12 - Utility-first styling
- **Lucide React** - Icon library
- **Sonner** - Toast notifications
- **React Context API** - State management

### Development Tools
- **Vite** 6.3.5 - Build tool
- **ESLint** - Code linting
- **Prettier** - Code formatting

## 👥 User Roles

### 🎓 Applicant/Resident
Access to personal applications, lottery results, and payment management.

### 🏫 Campus Admin
Manages specific campus operations including blocks, residents, and local payments.

### 👑 CHMS Admin
Full system access with lottery control, placement authority, and global oversight.

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Landing Page                       │
└─────────────────────────────────────────────────────┘
                         │
            ┌────────────┼────────────┐
            │            │            │
            ▼            ▼            ▼
    ┌──────────┐  ┌──────────┐  ┌──────────┐
    │Applicant │  │  Campus  │  │   CHMS   │
    │Dashboard │  │  Admin   │  │  Admin   │
    └──────────┘  └──────────┘  └──────────┘
         │              │              │
         │              │              │
    ┌────┴────┐    ┌────┴────┐    ┌────┴────┐
    │Apply    │    │Manage   │    │Lottery  │
    │Payment  │    │Blocks   │    │Placement│
    │Lottery  │    │Verify   │    │Reports  │
    └─────────┘    └─────────┘    └─────────┘
```

### Key Components

- **AuthContext**: Manages user authentication and sessions
- **DataContext**: Centralized state management for all data
- **Layout**: Role-based navigation and layout wrapper
- **Routes**: Protected route configuration

## 📊 Scoring Algorithm

The system uses a weighted formula to rank applicants fairly:

### Score Components

| Criterion | Weight | Max Points | Calculation |
|-----------|--------|------------|-------------|
| **Academic Level** | 50% | 50 | Bachelor(25), Masters(35), PhD(45), Professor(50) |
| **Years of Service** | 25% | 25 | 2.5 points/year, max 10 years |
| **Job Responsibility** | 15% | 15 | Based on position level |
| **Marital Status** | 10% | 10 | Married(10), Single(5), Other(7) |
| **Disability Bonus** | +10% | +10 | Female staff with disabilities |

### Example Calculation

```typescript
Applicant: PhD, 5 years service, Lecturer, Married
Score = 45 + (5×2.5) + 10 + 10 = 77.5 ≈ 78 points
```

## 📸 Screenshots

### Landing Page
Modern, informative landing page with system overview and quick access to login/register.

### Applicant Dashboard
Comprehensive dashboard showing application status, lottery results, and payment history.

### Admin Dashboard
Full system overview with statistics, pending actions, and quick access to management tools.

### Lottery System
Fair, transparent lottery draw interface with score-based selection.

## 🗂️ Project Structure

```
ochms/
├── src/
│   ├── app/
│   │   ├── components/      # Reusable UI components
│   │   │   ├── ui/         # Shadcn UI components
│   │   │   ├── Layout.tsx
│   │   │   ├── StatCard.tsx
│   │   │   └── ...
│   │   ├── context/        # React Context providers
│   │   │   ├── AuthContext.tsx
│   │   │   └── DataContext.tsx
│   │   ├── pages/          # Route pages
│   │   │   ├── applicant/
│   │   │   ├── campus-admin/
│   │   │   └── chms-admin/
│   │   ├── utils/          # Utility functions
│   │   │   ├── scoreCalculator.ts
│   │   │   ├── validators.ts
│   │   │   ├── statistics.ts
│   │   │   └── exportHelpers.ts
│   │   ├── routes.tsx
│   │   └── App.tsx
│   └── styles/             # Global styles
├── public/                 # Static assets
├── SYSTEM_DOCUMENTATION.md # Full system documentation
└── README.md              # This file
```

## 🧪 Testing

### Manual Testing Checklist

- [ ] User registration and login
- [ ] Application submission
- [ ] Score calculation accuracy
- [ ] Lottery draw functionality
- [ ] Payment processing
- [ ] Notification delivery
- [ ] Report generation
- [ ] Role-based access control

## 🔐 Security Features

- ✅ Password encryption (simulated)
- ✅ Role-based access control (RBAC)
- ✅ Secure session management
- ✅ Input validation
- ✅ Protected routes
- ✅ XSS prevention

## 🌟 Key Highlights

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Real-time Updates**: Instant UI updates with state changes
- **Comprehensive**: All SRS requirements implemented
- **User-Friendly**: Intuitive interface for all user types
- **Extensible**: Easy to add features

## 📝 Business Rules

- Monthly payment: **1,200 Ethiopian Birr**
- Total housing units: **225**
- Total blocks: **15**
- Application scoring: **Automated and transparent**
- Lottery selection: **Score-based ranking**

## 🚧 Future Enhancement

- [ ] Email notification system
- [ ] SMS notifications
- [ ] Online payment gateway
- [ ] Mobile application
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
## 📄 License

This project is developed for Wolaita Sodo University.

## 👨‍💻 Development Team

Developed based on Software Requirements Specification (SRS) for the Online Condominium House Management System at Wolaita Sodo University.

## 📞 Support

For support, email asetabraham9@gmail.com, support@wsu.edu or contact the IT department (phone: +251 964 063 992).


**© 2026 Wolaita Sodo University - All Rights Reserved**

Made with ❤️ for efficient condominium management
