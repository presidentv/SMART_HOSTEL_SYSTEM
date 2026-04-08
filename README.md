# 🏨 Smart Hostel Management System

A modern, high-performance maintenance and cleaning management platform for hostels. Features intelligent auto-priority detection, staff performance tracking, and role-based dashboards.

## 🚀 Key Features

### 👨‍🎓 Student Dashboard
- **Location-Locked Requests**: Raise maintenance requests tied to your specific room or select from pre-defined common areas.
- **Real-time Tracking**: Monitor the status of your requests (Pending, Assigned, In-Progress, Resolved, Completed).
- **Proof of Completion**: View "After" photos uploaded by staff before confirming a task as complete.
- **Feedback & Rating**: Rate staff performance once a task is finished.
- **Profile Management**: Update personal details and room information.

### 👷 Staff Dashboard
- **Smart Queue**: Tasks are automatically sorted by priority (**URGENT** at the top).
- **Visual Urgency**: Urgent tasks are highlighted with a glowing red border for immediate attention.
- **Task Workflow**: "Start Work" -> "Upload Proof & Resolve".
- **Specialized Trade Focus**: Staff are assigned tasks based on their trade (Cleaning, Electrical, Plumbing, Waste).

### 👑 Warden (Admin) Dashboard
- **Live Analytics**: Visual charts for total requests, daily trends, and problematic room hotspots.
- **Staff Workload Management**: Monitor tasks handled and real-time **Average Ratings** for each staff member.
- **Staff Approvals**: Screen and approve new staff applications.
- **SLA Tracking**: Automatically identifies and escalates tasks that have been pending for >24 hours.
- **User Directory**: Full audit trail of all registered students and staff.

## 🧠 Smart Intelligence
- **Auto-Priority Detection**: No manual priority selection! The system scans request categories and descriptions for keywords like *"spark"*, *"fire"*, or *"burning"* to automatically assign **URGENT** status.
- **Room-Wise Escalation**: Multiple complaints from the same room within a short window automatically boost a task's priority.
- **Common Area Priority**: Issues in shared spaces like Cafeterias or Study Halls get an automatic priority bump.
- **Secure Auth**: Direct password reset flow (email-less for local testing convenience).

## 🛠️ Technical Stack
- **Frontend**: React 18 (Vite), Lucide Icons, Recharts (Analytics).
- **Backend**: Node.js, Express, TypeScript.
- **Database**: SQLite with Prisma ORM.
- **Authentication**: JWT-based secure session management.
- **Styling**: Premium Glassmorphism UI (Vanilla CSS).

## 📦 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- npm

### 2. Installation
```bash
# Install root dependencies (simulated)
# In backend/
npm install
npx prisma generate
npx prisma db push

# In frontend/
npm install
```

### 3. Run Development Servers
```bash
# Backend (Port 5000)
cd backend && npm run dev

# Frontend (Port 5173)
cd frontend && npm run dev
```

---
*Created for efficient and transparent hostel maintenance management.*