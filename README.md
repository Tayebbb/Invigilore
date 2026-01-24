# 🎓 Invigilore

> **A Secure Digital Examination Management System**

[![Figma Design](https://img.shields.io/badge/Figma-Design-F24E1E?style=for-the-badge&logo=figma&logoColor=white)](https://www.figma.com/make/bgYK0FVOg4INMH1Qyqk1Qf/Homepage-UI-Design-for-Invigilore?t=P4Qon3if7skrdcXu-1)

---

## 👥 Team Members

| Name | Student ID | Email |
|------|------------|-------|
| Md Tanjimul Islam | 20230104041 | tanjim.cse.20230104041@aust.edu |
| Md Tayeb Ibne Sayed | 20230104027 | tayeb.cse.20230104027@aust.edu |
| Enid Hasan | 20230104047 | enid.cse.20230104047@aust.edu |
| Saidul Islam Shehab | 20230104049 | saidul.cse.20230104049@aust.edu |

---

## 📖 Introduction

Examinations are a critical part of the academic process. Traditional exam management systems are often manual, fragmented, and vulnerable to errors or security breaches. Question papers may be leaked, invigilators may face unauthorized access, and administrative oversight can be difficult.

**Invigilore** is a secure digital examination management system designed to modernize the workflow by integrating:

- ✅ Exam creation and course management
- ✅ Secure question authoring and multi-step approval
- ✅ Time-limited and role-based access control
- ✅ Live monitoring and incident reporting
- ✅ Post-exam audit reports
- ✅ Backup and emergency recovery

This ensures **integrity**, **transparency**, and **accountability** across all stages of the examination process.

---

## 🎯 Project Objectives

- 📋 Digitize the examination management workflow
- 🔐 Secure question paper creation, approval, and distribution
- 🛡️ Enforce access control based on roles and exam schedules
- 👁️ Monitor exam activity in real-time
- 📊 Provide automated post-exam audit reports
- 💾 Implement encrypted backup and emergency recovery

---

## 🌐 Website Overview

Invigilore is a web-based platform divided into multiple interconnected modules:

1. **Exam & Course Management**
2. **Secure Question Authoring**
3. **Approval Workflow**
4. **Access Control Enhancements**
5. **Monitoring Dashboard**
6. **Incident Reporting**
7. **Post-Exam Audit Reports**
8. **Notifications**
9. **User & Role Management**
10. **Backup & Recovery System**

Each module ensures security, transparency, and ease of use, while demonstrating real-world software engineering principles.

---

## ✨ Feature Highlights

### 📚 Feature 1: Exam & Course Management

- Create exams with course, semester, duration
- Assign question setters and moderators
- Define exam date/time
- Attach multiple papers (theory, MCQ, practical)



---

### ✍️ Feature 2: Secure Question Authoring

- Online editor for MCQs and short questions
- Draft/final version logic
- PDF export

---

### ✅ Feature 3: Approval Workflow

- Multi-step process: `Draft` → `Submitted` → `Reviewed` → `Approved` → `Locked`
- Setter cannot approve own paper
- Moderator can request changes
- Controller locks final paper



---

### 🔒 Feature 4: Access Control

- Exam-day time window access
- Auto-logout after exam
- Soft location/IP-based restrictions

---

### 📡 Feature 5: Monitoring Dashboard

- Live exam tracking: who opened the paper, when, from where
- Shows active viewers
- Supports audit and accountability

---

### 🚨 Feature 6: Incident Reporting

- Detects early access, multiple logins, or suspicious activity
- Admin can mark, add remarks, and export incidents

---

### 📄 Feature 7: Post-Exam Audit Reports

- Auto-generated PDF with total viewers, access summary, anomalies

---

### 🔔 Feature 8: Notifications

- Alerts for paper approval, exam start, unauthorized access, and exam end
- Email or in-app notifications

---

### 👤 Feature 9: User & Role Management

- Temporary invigilator assignment per exam
- Role auto-expires after exam
- Advanced role logic demonstration

---

### 💾 Feature 10: Backup & Recovery

- Encrypted offline backups
- One-time emergency access links
- Auto-expiry for security

---

## 🎯 Target Audience

- 🏛️ University exam controllers
- 👨‍🏫 Faculty and moderators
- 👁️ Invigilators
- 📋 Academic administrators

---

## 🛠️ Technology Stack

### Backend Technologies

| Technology | Purpose |
|------------|---------|
| **Node.js / Express.js** | REST API and server logic |
| **Laravel (PHP)** | Optional backend for secure workflows |
| **MySQL** | Relational database for exams, users, and audit logs |

### Frontend Technologies

| Technology | Purpose |
|------------|---------|
| **React.js** | Dynamic and responsive UI |
| **HTML5, CSS3, JavaScript** | Layout, styling, client-side logic |

### Rendering Method

Hybrid approach combining SSR and CSR for best performance:

#### Server-Side Rendering (SSR)
- Public dashboards (exam schedules, access logs)
- **Benefits:** Faster initial load, better SEO, low-end device performance

#### Client-Side Rendering (CSR)
- Question editor, admin dashboards
- **Benefits:** Smooth interaction, dynamic updates, enhanced UX

---

## 🔐 Security & Ethics

- 🛡️ Role-based access control
- ⏰ Time-restricted exam access
- 🔒 Encrypted backups and emergency recovery
- 📝 Logging and audit trails
- ✅ Controlled approval system to prevent fraud

---

## 📈 Expected Impact

- 🔐 Protects question papers from leaks
- ⚖️ Ensures fairness and transparency
- ⚡ Reduces manual administrative effort
- 📊 Provides audit-ready reports for university authorities
- 🚀 Modernizes exam management processes

---

## 🏁 Conclusion

**Invigilore** is a secure, reliable, and scalable examination management platform. By integrating secure workflows, monitoring, audit reporting, and emergency preparedness, it ensures academic integrity while demonstrating strong software engineering principles suitable for Software Development Lab evaluation.

---


