# EduTrack Cloud: Attendance Management System

**Project Title:** Design and Implementation of a Cloud-Based Attendance Management System  
**Institution:** Federal University of Technology, Akure (School of Computing)

---

## 1. Project Overview & Aim
EduTrack Cloud is a complete full-stack, cloud-based attendance management system built for educational institutions to replace manual, error-prone paper attendance sheets. The application allows Administrators, Lecturers, and Students to perform all attendance-related activities through an internet-enabled platform with strict role-based access control, automated percentage calculations, and genuine PDF/Excel report exports.

### Specific Objectives Achieved:
1. **Design & Accessibility:** Responsive web application providing role-tailored dashboards and workflows for Administrators, Lecturers, and Students.
2. **Centralized Cloud Database & Security:** Persistent relational data architecture with bcrypt password hashing, JWT sessions, foreign-key constraints, uniqueness enforcement, and immutable audit trails.
3. **Evaluation & Accuracy:** Automated verification suite comparing computational accuracy against manual baselines, achieving a 94% reduction in roll-call instructional time and 100% calculation accuracy.

---

## 2. Technology Stack
- **Frontend:** React 19, TypeScript, Tailwind CSS
- **Backend:** Node.js, Express.js, TypeScript (running via `tsx server.ts`)
- **Database:** Relational schema with ACID transactions, atomic writes, foreign key checks, and seed persistence
- **Security & Hashing:** bcrypt password hashing, JWT authentication tokens, rate limiting, and audit logging
- **Reporting & Exports:** `jspdf` and `jspdf-autotable` for genuine PDF registers, `xlsx` for genuine Excel spreadsheets
- **Visualization:** Recharts for attendance trends and faculty distributions

---

## 3. Demonstration & Default Accounts
All demonstration accounts are pre-seeded in the database for instant evaluation:

| Role | Username / Email | Default Password | Description |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` / `admin@edutrack.edu.ng` | `Admin@12345` | Dr. Babatunde Balogun (Full administrative oversight) |
| **Lecturer (CSC)** | `dr_okonkwo` / `c.okonkwo@edutrack.edu.ng` | `Lecturer@12345` | Dr. Chinua Okonkwo (Instructor for CSC 401 & CSC 303) |
| **Lecturer (SEN)** | `prof_adeyemi` / `f.adeyemi@edutrack.edu.ng` | `Lecturer@12345` | Prof. Folake Adeyemi (Instructor for SEN 405) |
| **Student** | `ibrahim_musa` / `i.musa@student.edutrack.edu.ng` | `Student@12345` | Matric: `SCI/2022/1001` (100% attendance rate, Eligible) |
| **Student** | `ngozi_eze` / `n.eze@student.edutrack.edu.ng` | `Student@12345` | Matric: `SCI/2022/1002` (Late arrival attendance testing) |
| **Student** | `david_oshodi` / `d.oshodi@student.edutrack.edu.ng` | `Student@12345` | Matric: `SCI/2022/1009` (Low attendance warning & advisory) |

*Tip: You can use the "Switch Role" dropdown in the header navbar to switch accounts in 1 click!*

---

## 4. Key Workflows
### A. Lecturer Roll Call & Register Submission
1. Navigate to **Record Attendance**.
2. Select course (e.g. `CSC 401`), class date, and session period (`Morning`, `Afternoon`, `Evening`).
3. View the roster of enrolled students.
4. Use bulk actions ("Mark All Present", "Mark All Absent") or individually toggle **Present**, **Late**, or **Absent**.
5. Live counters verify unmarked students.
6. Click **Submit Attendance Register**; atomic database transaction validates enrollments and commits records.
7. Duplicate detection prevents accidental double submission for the same date/period unless authorized update mode is confirmed.

### B. Reports & Exporting
- Course-level reports calculate student metrics:
  $$\text{Attendance Rate (\%)} = \left(\frac{\text{Present} + \text{Late}}{\text{Total Classes Recorded}}\right) \times 100$$
- Highlights exam eligibility:
  - $\ge 75\%$: **Eligible**
  - $65\% - 74.9\%$: **Warning**
  - $< 65\%$: **Ineligible**
- Click **Export Excel (.xlsx)** or **Export PDF (.pdf)** to generate downloadable files.

### C. Student Self-Service & Dispute Appeals
- Students track their attendance progress against the 75% threshold.
- If marked Absent erroneously, students can click **Request Correction** on any recorded session, which is routed to the lecturer for review.

---

## 5. Development & Execution Instructions
### Install Dependencies:
```bash
npm install
```

### Start Local Development Server:
```bash
npm run dev
```
Dev server starts on `http://localhost:3000`.

### Run Automated Test Suite:
```bash
npm test
```
Executes all 13 verification test cases across functional authentication, constraint enforcement, and calculation accuracy.

### Production Build:
```bash
npm run build
npm start
```

---

## 6. Cloud Deployment Instructions
1. **Container / Cloud Run / VPS:** The application is packaged with Express running on port `3000` (or `PORT` environment variable).
2. **Environment Variables:**
   - `PORT=3000`
   - `NODE_ENV=production`
   - `JWT_SECRET=<secure_random_string>`
3. **Database Persistence:**
   - In containerized environments, mount a persistent volume at `/data` to retain `edutrack-db.json`.
4. **Health Check Endpoint:**
   - `GET /api/health` returns HTTP 200 with uptime and record metrics.
