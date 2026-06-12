# EduFlow — Smart School Platform

> AI-powered platform for teachers to manage classrooms and students to learn smarter.

---

## Tech Stack

| Layer | Tech | Why |
|---|---|---|
| Frontend | React + Tailwind | Component-based UI |
| Backend | Node.js + Express | Fast, JS everywhere |
| Database | PostgreSQL | Relational data, strong joins |
| AI | Claude API (Anthropic) | Summaries + quiz generation |
| Auth | JWT + bcrypt | Stateless auth, role-based |
| File Upload | Multer | PDF handling |

---

## Project Structure

```
eduflow/
├── backend/
│   ├── src/
│   │   ├── index.js              ← Express app entry point
│   │   ├── config/
│   │   │   ├── db.js             ← PostgreSQL connection pool
│   │   │   └── schema.sql        ← All database tables
│   │   ├── middleware/
│   │   │   └── auth.js           ← JWT verify + role-based access
│   │   ├── controllers/          ← Business logic lives here
│   │   │   ├── authController.js
│   │   │   ├── classController.js
│   │   │   ├── attendanceController.js
│   │   │   ├── marksController.js
│   │   │   └── materialsController.js
│   │   └── routes/               ← URL definitions
│   │       ├── auth.js
│   │       ├── classes.js
│   │       ├── attendance.js
│   │       ├── marks.js
│   │       └── materials.js
│   ├── uploads/                  ← PDF files stored here (gitignored)
│   ├── .env.example
│   └── package.json
└── frontend/                     ← React app (Module 2)
```

---

## Setup — Backend

### 1. Install dependencies
```bash
cd backend
npm install
```

### 2. Set up PostgreSQL
```bash
# Create the database
createdb eduflow

# Run the schema (creates all tables)
psql -U postgres -d eduflow -f src/config/schema.sql
```

### 3. Configure environment
```bash
cp .env.example .env
# Edit .env with your DB credentials and API keys
```

### 4. Start the server
```bash
npm run dev   # development (auto-restarts on file changes)
npm start     # production
```

---

## API Reference

### Auth
| Method | Route | Auth | Description |
|---|---|---|---|
| POST | /api/auth/register | ❌ | Register new user |
| POST | /api/auth/login | ❌ | Login |
| GET | /api/auth/me | ✅ | Get current user |

### Classes
| Method | Route | Role | Description |
|---|---|---|---|
| GET | /api/classes | Any | Get my classes |
| POST | /api/classes | Teacher | Create a class |
| POST | /api/classes/join | Student | Join with code |
| GET | /api/classes/:id | Any | Class details + students |

### Materials
| Method | Route | Role | Description |
|---|---|---|---|
| POST | /api/materials/upload | Teacher | Upload PDF |
| GET | /api/materials/class/:classId | Any | Class materials |
| GET | /api/materials/:id | Any | Single material |
| POST | /api/materials/:id/generate-quiz | Any | Generate quiz |

### Attendance
| Method | Route | Role | Description |
|---|---|---|---|
| POST | /api/attendance | Teacher | Mark attendance |
| GET | /api/attendance/:classId | Teacher | Get by date |

### Marks
| Method | Route | Role | Description |
|---|---|---|---|
| POST | /api/marks | Teacher | Add marks |
| GET | /api/marks/class/:classId | Teacher | Class marks |
| GET | /api/marks/student/me | Student | My marks |

---

## Key Concepts You Learn Building This

### 1. Connection Pooling (`config/db.js`)
Opening a new DB connection per request costs ~50ms. Pool keeps N connections alive and reuses them.

### 2. JWT Flow (`middleware/auth.js`)
```
Login → server signs token → client stores token
Next request → client sends token in header → server verifies → allows/denies
```

### 3. Middleware Chain (`index.js`)
```
Request → cors() → json() → authenticate() → authorize() → controller → response
```

### 4. Transactions (`attendanceController.js`)
When saving 30 attendance records, either ALL succeed or NONE do. `BEGIN → queries → COMMIT` or `ROLLBACK` on error.

### 5. Role-Based Access Control
```js
router.post('/', authorize('teacher'), createClass)
// Teacher token → allowed
// Student token → 403 Forbidden
```

---

## Interview Questions This Project Covers

- What is the event loop in Node.js?
- How does JWT authentication work?
- What is connection pooling and why is it important?
- What are database transactions? What is ACID?
- How do you handle file uploads in Express?
- What is middleware and how does the Express middleware chain work?
- How do you implement role-based access control?
- How do you prevent token theft? (HttpOnly cookies vs localStorage)
- How would you scale this to 100,000 students?
