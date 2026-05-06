# 🎓 Exit Exam Platform

A full-stack exit exam platform built with **React + Vite**, **Express**, **MongoDB**, and **Tailwind CSS**.

## Features

- **Student Portal** — Register, login, take timed exams, view results with answer review
- **Countdown Timer** — Visual timer with color warnings (yellow at 25%, red + pulse at 10%)
- **Auto-submit** — Exam submits automatically when time runs out
- **Admin Dashboard** — Create/edit/delete exams, view all student results, manage students
- **JWT Auth** — Secure token-based authentication
- **MongoDB** — Persistent storage for users, exams, and results

## Project Structure

```
ExitExam/
├── client/          # React + Vite + Tailwind frontend
└── server/          # Express + Mongoose backend
```

## Getting Started

### 1. Start the backend
```bash
cd server
npm run dev
```

### 2. Start the frontend
```bash
cd client
npm run dev
```

### 3. Open the app
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## Default Accounts

| Role    | Email                  | Password   |
|---------|------------------------|------------|
| Admin   | admin@exitexam.com     | admin123   |
| Student | Register at /register  | your choice|

## Admin: Seed Sample Exam

After logging in as admin, click **"🌱 Seed Sample Exam"** on the dashboard to add a 10-question sample exam.

## API Endpoints

| Method | Endpoint                  | Description              |
|--------|---------------------------|--------------------------|
| POST   | /api/auth/register        | Register student         |
| POST   | /api/auth/login           | Login                    |
| GET    | /api/exams                | List active exams        |
| GET    | /api/exams/:id            | Get exam questions       |
| POST   | /api/exams/:id/submit     | Submit answers           |
| GET    | /api/results              | Student's results        |
| GET    | /api/results/:id          | Result detail + review   |
| GET    | /api/admin/exams          | Admin: all exams         |
| POST   | /api/admin/exams          | Admin: create exam       |
| PUT    | /api/admin/exams/:id      | Admin: update exam       |
| DELETE | /api/admin/exams/:id      | Admin: delete exam       |
| GET    | /api/admin/results        | Admin: all results       |
| GET    | /api/admin/students       | Admin: all students      |
| POST   | /api/admin/seed           | Admin: seed sample exam  |
