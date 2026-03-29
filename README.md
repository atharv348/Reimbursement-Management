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

## Deployment Guide (Vercel Only)

You can deploy both the Frontend and the Backend on **Vercel** for a unified experience.

### **1. Backend (FastAPI on Vercel)**
1.  Connect your GitHub repository to **Vercel**.
2.  Import the project from the **Root Directory** (leave it blank).
3.  Vercel will detect the `vercel.json` file automatically.
4.  Add your `.env` variables in the Vercel dashboard:
    - `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_KEY`, `GROQ_API_KEY`, `SECRET_KEY`, `ALGORITHM`.
5.  Deploy. Your backend URL will be something like `https://reimbursement-management-backend.vercel.app`. **Copy this URL.**

### **2. Frontend (Next.js on Vercel)**
1.  Connect the same GitHub repository to **Vercel** as a **New Project**.
2.  Set the **Root Directory** to `frontend/`.
3.  **Framework Preset**: Next.js.
4.  Add **Environment Variable**:
    - `NEXT_PUBLIC_API_URL`: Use the Backend URL you copied in the previous step (e.g., `https://reimbursement-management-backend.vercel.app`).
5.  Deploy.

---
*Created for Odoo x VIT Pune Hackathon 26*
