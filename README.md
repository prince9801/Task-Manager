# TaskFlow — Team Task Manager

A production-ready full-stack team task management application with role-based access control.

## 📁 Folder Structure

```
team-task-manager/
├── backend/
│   ├── config/
│   │   └── db.js                    # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js        # Auth logic (register/login/me)
│   │   ├── projectController.js     # Project CRUD + member management
│   │   ├── taskController.js        # Task CRUD
│   │   └── dashboardController.js   # Stats aggregation
│   ├── middleware/
│   │   ├── auth.js                  # JWT protect, adminOnly, adminOrAssigned
│   │   ├── errorHandler.js          # Global error handler
│   │   └── validate.js              # express-validator middleware
│   ├── models/
│   │   ├── User.js                  # User schema (bcrypt, JWT)
│   │   ├── Project.js               # Project schema (members, owner)
│   │   └── Task.js                  # Task schema (status, priority, dueDate)
│   ├── routes/
│   │   ├── auth.js                  # /api/auth/*
│   │   ├── projects.js              # /api/projects/*
│   │   ├── tasks.js                 # /api/tasks/*
│   │   └── dashboard.js             # /api/dashboard/*
│   ├── .env.example
│   ├── package.json
│   ├── railway.json                 # Railway deployment config
│   └── server.js                   # Express app entry point
│
└── frontend/
    ├── public/
    ├── src/
    │   ├── api/
    │   │   ├── axios.js             # Axios instance with interceptors
    │   │   ├── auth.js              # Auth API calls
    │   │   ├── projects.js          # Project API calls
    │   │   ├── tasks.js             # Task API calls
    │   │   └── dashboard.js         # Dashboard API calls
    │   ├── components/
    │   │   ├── common/
    │   │   │   ├── ErrorAlert.jsx
    │   │   │   ├── LoadingSpinner.jsx
    │   │   │   ├── Modal.jsx
    │   │   │   └── StatusBadge.jsx
    │   │   └── layout/
    │   │       ├── Navbar.jsx
    │   │       └── ProtectedRoute.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx      # JWT auth state
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── Projects.jsx
    │   │   └── Tasks.jsx
    │   ├── utils/
    │   │   └── helpers.js           # Date, badge, initials utils
    │   ├── App.jsx
    │   ├── index.css
    │   └── main.jsx
    ├── .env.example
    ├── index.html
    ├── package.json
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── vercel.json                  # Vercel SPA config
    └── vite.config.js
```

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js 18+ installed
- MongoDB Atlas account (free tier works)
- Git

---

### 1. Clone & Install

```bash
# Clone or unzip the project
cd team-task-manager

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

---

### 2. Configure Environment Variables

**Backend** — create `backend/.env`:
```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/team-task-manager?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_minimum_32_chars
JWT_EXPIRE=7d
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

> 🔑 Get MONGO_URI from MongoDB Atlas → Connect → Drivers → Copy connection string

**Frontend** — create `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

---

### 3. Run the App

```bash
# Terminal 1 — Start backend
cd backend
npm run dev

# Terminal 2 — Start frontend
cd frontend
npm run dev
```

Open: **http://localhost:5173**

---

### 4. Create First Admin User

Register at `/register` and select "Admin" role. The first admin can then:
- Create projects
- Add members
- Create and assign tasks

---

## 🚀 Deployment

### Backend → Railway

1. Push backend folder to a GitHub repo
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Set environment variables in Railway dashboard:
   - `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRE`, `NODE_ENV=production`
   - `CLIENT_URL=https://your-vercel-app.vercel.app`
4. Railway auto-detects Node.js and runs `node server.js`

### Frontend → Vercel

1. Push frontend folder to GitHub repo
2. Go to [vercel.com](https://vercel.com) → New Project → Import repo
3. Set environment variable: `VITE_API_URL=https://your-railway-app.railway.app/api`
4. Deploy — Vercel handles the build with Vite automatically

---

## 📡 API Documentation

### Authentication

| Method | Endpoint | Access | Body | Description |
|--------|----------|--------|------|-------------|
| POST | `/api/auth/register` | Public | `{name, email, password, role}` | Register user |
| POST | `/api/auth/login` | Public | `{email, password}` | Login, returns JWT |
| GET | `/api/auth/me` | Private | — | Get current user |
| GET | `/api/auth/users` | Admin | — | Get all users |

### Projects

| Method | Endpoint | Access | Body | Description |
|--------|----------|--------|------|-------------|
| GET | `/api/projects` | Private | — | Get projects (admin: all, member: own) |
| GET | `/api/projects/:id` | Private | — | Get single project |
| POST | `/api/projects` | Admin | `{name, description?, color?, members?}` | Create project |
| PUT | `/api/projects/:id` | Admin | `{name?, description?, color?, status?}` | Update project |
| DELETE | `/api/projects/:id` | Admin | — | Delete project + tasks |
| POST | `/api/projects/:id/members` | Admin | `{userId}` | Add member |
| DELETE | `/api/projects/:id/members/:userId` | Admin | — | Remove member |

### Tasks

| Method | Endpoint | Access | Body / Query | Description |
|--------|----------|--------|------|-------------|
| GET | `/api/tasks` | Private | `?status&priority&project&search&overdue` | Get tasks with filters |
| GET | `/api/tasks/:id` | Private | — | Get single task |
| POST | `/api/tasks` | Admin | `{title, dueDate, project, description?, status?, priority?, assignedTo?}` | Create task |
| PUT | `/api/tasks/:id` | Admin or Assigned | `{...fields}` (member: `status` only) | Update task |
| DELETE | `/api/tasks/:id` | Admin | — | Delete task |

### Dashboard

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/dashboard/stats` | Private | Get stats: total/completed/pending/overdue tasks, projects, users |

---

## 🔐 Role-Based Access

| Feature | Admin | Member |
|---------|-------|--------|
| See all projects | ✅ | ❌ (own only) |
| Create/delete project | ✅ | ❌ |
| Add/remove project members | ✅ | ❌ |
| Create/delete tasks | ✅ | ❌ |
| Assign tasks | ✅ | ❌ |
| Update task status | ✅ | ✅ (assigned only) |
| See all users | ✅ | ❌ |
| Dashboard stats | ✅ (full) | ✅ (own data) |

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS |
| HTTP Client | Axios |
| Routing | React Router v6 |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcryptjs |
| Validation | express-validator |
| Deployment (BE) | Railway |
| Deployment (FE) | Vercel |

