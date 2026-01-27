# University Group Assignment Application

A Dockerized web application to automate the process of assigning students to university projects/groups based on their preferences using an optimization algorithm. This tool replaces error-prone manual Google Forms with a secure, dedicated platform.

## 🎯 Goal
To eliminate the risk of mistakes in manual student-project assignment by providing:
1.  **Immutability**: Once a form is live/student submission starts, it ensures data consistency.
2.  **Validation**: Ensures valid student IDs and unique project codes.
3.  **Optimization**: Uses a mathematical algorithm (Linear Sum Assignment / Min-Cost Flow) to maximize overall student satisfaction subject to option capacities.
4.  **Professional UI**: A modern, responsive interface for both students and administrators.

## 🚀 Features

### 🎓 Student Portal
- **Simple Access**: Login with a unique Project Code and valid Student ID (starts with 'i').
- **Interactive Ranking**: Drag-and-drop interface to rank project choices from most to least desired.
- **Detailed Views**: View full details, requirements, and supervisors for each project option.
- **Confirmation**: Review summary before final submission.

### 🏫 Admin/Teacher Dashboard
- **Secure Authentication**: Register/Login with Department, Email, and a secret `REGISTER_SECRET`.
- **Project Management**: 
    - Create new project forms with multiple options.
    - **Capacity Control**: Define min/max students per option (default 50).
    - Save drafts or Finalise to go live.
    - **One-Click Sharing**: Copy student invite codes and link.
    - Close forms to stop submissions.
- **Algorithm & Results**:
    - Trigger the optimization algorithm with one click.
    - View assignments (Student -> Project).
    - **Export**: Download results as a clean JSON file.

## 🛠 Tech Stack

- **Infrastructure**: Docker & Docker Compose (Dev & Prod environments).
- **Backend**: Python **FastAPI** with **SQLite**.
    - Type-safe Pydantic schemas.
    - JWT Authentication (BCrypt + Salt + Pepper).
    - SQLAlchemy models.
- **Frontend**: **React** (Vite) + TypeScript.
    - **Vanilla CSS** (Variables-based) for a premium, custom "Shadcn-like" look.
    - `@dnd-kit` for accessible drag-and-drop interactions.
    - Responsive design.

## 🔧 Setup & Installation

### Prerequisites
- Docker & Docker Compose installed.

### Environment Variables
Create a `.env` file in the root directory (see `.env.example` or use the template below):

```env
# Backend Security
REGISTER_SECRET=change_me_in_production
PASSWORD_PEPPER=secure_pepper_value_here
SECRET_KEY=generate_a_secure_key_here
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### Running the App

**Development Mode**:
```bash
docker compose up --build -d
```
*   **Frontend**: http://localhost:5173
*   **Backend API**: http://localhost:8000/docs

**Production Mode**:
```bash
docker compose -f docker-compose.prod.yml up --build -d
```
*   **App**: http://localhost:5173 (Served via Vite Preview in this demo setup)

## 📂 Project Structure

```
├── backend/
│   ├── app/
│   │   ├── routers/       # API endpoints (admin, projects, students)
│   │   ├── algorithm.py   # Optimization logic
│   │   ├── auth.py        # Security & JWT
│   │   ├── models.py      # Database Schema
│   │   └── main.py        # App Entrypoint
│   └── Dockerfile
├── frontend_app/
│   ├── src/
│   │   ├── components/    # Reusable UI (Card, Button, Input)
│   │   ├── pages/         # Views (Landing, Dashboard, Preference, etc.)
│   │   └── index.css      # Global Design System
│   └── Dockerfile
└── docker-compose.yml
```

## 🔒 Security Measures
- **Password Hashing**: Bcrypt with unique salts and an additional server-side pepper.
- **Auth**: JWT (JSON Web Tokens) for protected admin routes.
- **Validation**: Strict Pydantic v2 validation for all inputs.
- **Isolation**: Docker containers run with limited context.
