# EduFlow — AI-Powered Learning Management System

> A full-stack AI-powered Learning Management System that enables teachers to manage classrooms, attendance, study materials, quizzes, and student performance while helping students learn more effectively through AI-generated assessments.

---

## Live Demo

**Frontend:** https://eduflow-nu-ashen.vercel.app

**GitHub Repository:** https://github.com/Harsha2oo5/eduflow

---

## Overview

EduFlow is a modern Learning Management System (LMS) built for educational institutions. The platform allows teachers to create and manage classrooms, distribute study materials, track attendance, evaluate student performance, and generate AI-powered quizzes from uploaded content.

The project demonstrates full-stack software engineering concepts including authentication, role-based access control, file uploads, REST APIs, database design, deployment, cloud infrastructure, and AI integration.

---

## Features

### Authentication & Authorization

* JWT-based authentication
* Secure password hashing using bcrypt
* Role-based access control (Teacher / Student)
* Protected routes and middleware authorization

### Classroom Management

* Create and manage classes
* Join classes using unique class codes
* Teacher and student dashboards
* Class-specific data isolation

### Attendance Management

* Mark student attendance
* View attendance records
* Attendance analytics and insights
* Historical attendance tracking

### Marks & Performance Tracking

* Record student marks
* View class-wise performance
* Student-specific score tracking
* Academic progress monitoring

### Study Materials

* Upload PDF learning resources
* Organize materials by classroom
* Centralized content management

### AI-Powered Quiz Generation

* Generate quizzes automatically from uploaded materials
* AI-assisted assessment creation
* Interactive quiz interface
* Faster content preparation for teachers

### Modern Dashboard

* Responsive user interface
* Clean teacher and student workflows
* Performance-focused design
* Mobile-friendly experience

---

## Tech Stack

| Layer            | Technology           |
| ---------------- | -------------------- |
| Frontend         | React.js             |
| Styling          | Tailwind CSS         |
| Backend          | Node.js              |
| API Framework    | Express.js           |
| Database         | PostgreSQL           |
| Cloud Database   | Neon                 |
| Authentication   | JWT + bcrypt         |
| File Uploads     | Multer               |
| AI Integration   | Anthropic Claude API |
| Backend Hosting  | Railway              |
| Frontend Hosting | Vercel               |
| Version Control  | Git & GitHub         |

---

## System Architecture

```text
React Frontend (Vercel)
          │
          ▼
Express REST API (Railway)
          │
          ▼
PostgreSQL Database (Neon)
          │
          ▼
Claude API Integration
```

---

## Project Structure

```text
eduflow
├── eduflow-frontend
│   ├── src
│   │   ├── components
│   │   ├── context
│   │   ├── pages
│   │   ├── utils
│   │   └── App.jsx
│   └── package.json
│
├── eduflowbackend
│   ├── src
│   │   ├── config
│   │   ├── controllers
│   │   ├── middleware
│   │   ├── routes
│   │   └── index.js
│   ├── uploads
│   └── package.json
│
└── README.md
```

---

## API Endpoints

### Authentication

| Method | Endpoint           |
| ------ | ------------------ |
| POST   | /api/auth/register |
| POST   | /api/auth/login    |
| GET    | /api/auth/me       |

### Classes

| Method | Endpoint          |
| ------ | ----------------- |
| GET    | /api/classes      |
| POST   | /api/classes      |
| POST   | /api/classes/join |
| GET    | /api/classes/:id  |

### Materials

| Method | Endpoint                         |
| ------ | -------------------------------- |
| POST   | /api/materials/upload            |
| GET    | /api/materials/class/:classId    |
| GET    | /api/materials/:id               |
| POST   | /api/materials/:id/generate-quiz |

### Attendance

| Method | Endpoint                 |
| ------ | ------------------------ |
| POST   | /api/attendance          |
| GET    | /api/attendance/:classId |

### Marks

| Method | Endpoint                  |
| ------ | ------------------------- |
| POST   | /api/marks                |
| GET    | /api/marks/class/:classId |
| GET    | /api/marks/student/me     |

---

## Deployment

### Frontend

* Hosted on Vercel
* Automatic CI/CD deployment from GitHub

### Backend

* Hosted on Railway
* Environment variable management
* Production-ready Express deployment

### Database

* Hosted on Neon PostgreSQL
* Secure cloud-hosted relational database

---

## Challenges Faced During Deployment

### Production Database Migration

Migrated from local PostgreSQL to Neon PostgreSQL and updated database configuration for cloud deployment.

### Railway Deployment Issues

Resolved build configuration issues and deployment failures caused by project structure and environment setup.

### Environment Variable Configuration

Diagnosed and fixed production environment variable mismatches between frontend and backend services.

### CORS Configuration

Resolved cross-origin communication issues between Vercel-hosted frontend and Railway-hosted backend.

### Git Remote Misconfiguration

Identified incorrect Git remote settings that caused deployments to track the wrong repository and restored the CI/CD workflow.

### End-to-End Cloud Deployment

Successfully integrated:

* Vercel (Frontend)
* Railway (Backend)
* Neon (Database)

into a complete production deployment pipeline.

---

## Key Software Engineering Concepts Demonstrated

* REST API Development
* JWT Authentication
* Role-Based Access Control (RBAC)
* PostgreSQL Database Design
* Connection Pooling
* Middleware Architecture
* File Upload Handling
* Cloud Deployment
* CI/CD Pipelines
* Error Handling
* AI API Integration
* Full-Stack Development

---

## Future Improvements

* Real-time notifications
* Live classroom chat
* Video lecture integration
* Advanced analytics dashboard
* Assignment submission portal
* AI-powered study recommendations
* Multi-school support

---

## Author

**K Sai Sri Harsha, KM Skanda**

Electronics and Communication Engineering
BMS College of Engineering

GitHub: https://github.com/Harsha2oo5
