# Reimbursement Management System

## Problem Statement
Companies often struggle with manual expense reimbursement processes that are time-consuming, error-prone, and lack transparency. There is no simple way to:
- Define approval flows based on thresholds.
- Manage multi-level approvals.
- Support flexible approval rules.

## Solution
A robust, professional expense reimbursement system with a tiered approval workflow and AI-powered OCR capabilities. The system automates the entire process from expense submission to final approval and financial reporting.

### Core Features
- **Authentication & User Management**: Role-based access for Employees, Managers, Finance, and Directors.
- **AI-Powered OCR**: Automatic receipt scanning and form pre-filling using Llama 4 Scout.
- **Tiered Sequential Workflow**:
  - **< 10,000**: Manager only.
  - **10,000 - 30,000**: Manager then Finance.
  - **> 30,000**: Manager, Finance, then Director.
- **Conditional Approval Rules**: Supports multi-level sequential approvals.
- **Real-time Notifications**: Alerts for approval/rejection status.
- **Financial Reporting**: Comprehensive Excel export with multi-tier status tracking.
- **Premium UI/UX**: Modern dashboard with role-specific themes and a pop-up review system.

## Team - Odoo x VIT Pune Hackathon 26
- **Team Leader**: ATHARV JOSHI
- **Team Members**:
  - Pratik Bugade
  - Vaishnavi Sambahji Patil
  - Jui Prashant Inamdar

## Tech Stack
- **Frontend**: Next.js 15, Tailwind CSS, Lucide React, Axios.
- **Backend**: FastAPI (Python), SQLAlchemy, PostgreSQL (Supabase).
- **AI/OCR**: Groq (Llama 4 Scout 17b).
- **Database/Storage**: Supabase PostgreSQL & Storage.

## Deployment Guide

### Backend (Render)
1.  Connect your GitHub repository to **Render**.
2.  Create a new **Web Service**.
3.  Set the **Root Directory** to the project root.
4.  **Runtime**: Python 3.x
5.  **Build Command**: `pip install -r requirements.txt`
6.  **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
7.  Add your `.env` variables (SUPABASE_URL, SUPABASE_KEY, GROQ_API_KEY, etc.) in the Render dashboard.

### Frontend (Vercel)
1.  Connect your GitHub repository to **Vercel**.
2.  Set the **Root Directory** to `frontend/`.
3.  **Framework Preset**: Next.js
4.  Add **Environment Variable**:
    - `NEXT_PUBLIC_API_URL`: Your Render backend URL (e.g., `https://reimbursement-api.onrender.com`)
5.  Deploy.

---
*Created for Odoo x VIT Pune Hackathon 26*
