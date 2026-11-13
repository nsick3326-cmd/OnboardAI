# OnboardAI — AI-Powered Employee Onboarding Platform

**OnboardAI** is a modern, enterprise-ready Employee Onboarding SaaS platform built with **React + TypeScript + Vite + Tailwind CSS** on the frontend and **Java 21 + Spring Boot 3.x + PostgreSQL + Flyway** on the backend.

It features complete multi-tenant isolation, role-based access control (RBAC), end-to-end onboarding workflow automation, document verification, approval management, dynamic metrics, and an integrated AI suite with a high-fidelity demo fallback mode.

---

## 🚀 Key Features

1. **Role-Based Workflows & Dashboards**:
   - **HR Admin / HR Manager**: Complete employee lifecycle, reusable onboarding plan templates, automatic task assignment, document review, and policy management.
   - **People Manager**: Team dashboard tracking direct reports, pending approvals, and upcoming joiners.
   - **Employee**: Personalized onboarding checklist, step-by-step guidance, document uploader, progress tracking, and AI Policy Copilot.
2. **Workflow & Task Orchestration**:
   - Reusable onboarding plans automatically generate structured tasks with relative deadlines.
   - Live completion percentage calculated directly from database records.
   - Legal state transitions (`NOT_STARTED` -> `IN_PROGRESS` -> `COMPLETED` / `BLOCKED`).
3. **Secure Document Management**:
   - Upload validation (MIME-type checks, size limits, path-traversal prevention).
   - Restricted downloads with ownership verification.
   - HR verification workflow with audit log recording.
4. **AI Capabilities (with transparent Demo Fallback)**:
   - **Document Info Extraction**: Extracts structured fields (identity, dates, employer info) with side-by-side review.
   - **Personalized Checklist Generation**: Generates customized onboarding task suggestions based on role and department.
   - **Policy Assistant (RAG)**: Ingests company policies and answers questions with exact citations and section snippets.
   - **Employee Copilot**: Contextual onboarding assistant answering questions about next steps and blockers.
   - *Fallback Mode*: Automatically activates if no `AI_API_KEY` is present. Transparently labeled with UI badges so you never mistake mock data for real LLM output.

---

## 🛠 Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, TanStack Query, React Hook Form, Zod, Lucide React, Recharts, Axios
- **Backend**: Java 21, Spring Boot 3.3.x, Spring Security 6 (JWT + BCrypt), Spring Data JPA, Flyway Migrations, Jakarta Validation, Springdoc OpenAPI (Swagger), Actuator
- **Database**: PostgreSQL 16+ (or embedded H2 dev mode fallback if PostgreSQL is offline)

---

## 🔑 Demo Credentials (Local Development)

| Role | Email | Password | Description |
| :--- | :--- | :--- | :--- |
| **HR Administrator** | `admin@acme.com` | `Admin123!` | Full organization management and admin controls |
| **HR Manager** | `hrmanager@acme.com` | `Manager123!` | Onboarding plan assignment, doc verification, approvals |
| **People Manager** | `manager@acme.com` | `Manager123!` | Supervises team members and reviews progress |
| **New Employee** | `john.doe@acme.com` | `Employee123!` | Engineering hire undergoing active onboarding |
| **New Employee** | `sarah.smith@acme.com` | `Employee123!` | Product design hire undergoing active onboarding |

---

## 📦 Getting Started

### 1. Prerequisites
- **Java 21** or later
- **Maven 3.9+** (bundled wrapper `mvnw.cmd` / `mvnw` included)
- **Node.js 18+** and **npm**
- **PostgreSQL 15+** (or Docker for containerized PostgreSQL)

### 2. Database Setup
Start PostgreSQL locally or using Docker Compose:
```bash
docker-compose up -d
```
Default connection parameters in `.env`:
- Database: `onboardai`
- Username: `postgres`
- Password: `postgres`
- Port: `5432`

### 3. Backend Setup
Navigate to the `backend/` directory:
```bash
cd backend
mvn clean spring-boot:run
```
- API Base: `http://localhost:8080/api/v1`
- Swagger UI Documentation: `http://localhost:8080/swagger-ui.html`
- Health Check: `http://localhost:8080/actuator/health`

### 4. Frontend Setup
Navigate to the `frontend/` directory:
```bash
cd frontend
npm install
npm run dev
```
- Web Application: `http://localhost:5173`

---

## 🧪 Testing

### Backend Tests
```bash
cd backend
mvn test
```

### Frontend Tests & Build
```bash
cd frontend
npm run build
```

---

## 📄 License
MIT License. Built for enterprise onboarding excellence.
