# Hospital Management System — MCA DBMS Project

A runnable academic MVP built with **React + Vite**, **Python Flask**, and **MySQL**.

## Features
- Dashboard with patient, doctor and appointment counts
- Patient management: add, list and delete
- Doctor management: add, list and delete
- Appointment management: schedule, list, change status and delete
- MySQL schema with primary keys, foreign keys, constraints and indexes
- Flask REST API using parameterized SQL queries

> This is an academic starter/MVP, not a production hospital system. It does not include authentication, authorization, audit logging, clinical-grade workflows, or regulatory compliance. Use fictional data only.

## Requirements
Windows 11, Python 3.10+, Node.js 18+, MySQL Server 8+, and optionally MySQL Workbench and VS Code.

## 1. Create the database
1. Open MySQL Workbench and connect to your local MySQL server.
2. Open `database/schema.sql`.
3. Execute the full script. It creates `hospital_db` and four sample departments.

## 2. Start the Flask backend
Open PowerShell in the project folder:

```powershell
cd backend
py -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

Edit `backend/.env` and enter your local MySQL credentials. Keep this file private.

```powershell
python app.py
```

Backend: `http://127.0.0.1:5000`

Test: `http://127.0.0.1:5000/api/health`

## 3. Start the React frontend
Open a second PowerShell terminal in the project folder:

```powershell
cd frontend
npm install
copy .env.example .env
npm run dev
```

Open the local URL Vite prints, normally `http://localhost:5173`.

## API
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | API/database health |
| GET | `/api/dashboard` | Dashboard counts |
| GET/POST | `/api/patients` | List/create patients |
| GET/PUT/DELETE | `/api/patients/<id>` | Read/update/delete patient |
| GET/POST | `/api/doctors` | List/create doctors |
| GET/PUT/DELETE | `/api/doctors/<id>` | Read/update/delete doctor |
| GET/POST | `/api/appointments` | List/create appointments |
| PUT/DELETE | `/api/appointments/<id>` | Update status/delete appointment |

## Structure
- `backend/` — Flask API and MySQL connection
- `database/` — database creation script
- `frontend/` — React user interface

## Academic DBMS concepts demonstrated
Relational schema design, primary and foreign keys, referential integrity, indexes, joins, aggregate queries, parameterized DML, and transaction commit/rollback.

## Before submission
Add your own student details to your report/PPT, take screenshots of your running application, test all flows, and document actual results. Do not describe planned features as completed. For a real deployment, implement secure authentication, role-based access, HTTPS, backups, audit trails, validation and a privacy/security review.
