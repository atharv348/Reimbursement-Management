# ReimburseX - Smart Expense Management System

ReimburseX is a robust, AI-powered enterprise solution designed to modernize and secure the corporate reimbursement lifecycle. Built with a high-performance stack, it automates expense tracking, receipt scanning, and multi-tier approval workflows.

## 🚀 Key Features

### 1. AI-Powered OCR Scanning
- **Llama 4 Scout Integration**: Automatically scans and extracts data from receipts (Amount, Vendor, Date, Category).
- **Frictionless Submission**: Reduces manual data entry by 90%, allowing employees to submit claims in seconds.

### 2. Tiered Sequential Approval Workflow
Strict financial controls enforced by automated thresholds:
- **Small Claims (< ₹10,000)**: Single-tier approval (Manager).
- **Mid-Tier Claims (₹10,000 - ₹50,000)**: Two-tier approval (Manager → Finance Officer).
- **High-Value Claims (> ₹50,000)**: Three-tier approval (Manager → Finance Officer → Director).

### 3. Role-Based Dashboards
- **High-Visibility Alerts**: "Action Required" section prominently displays pending approvals for Managers, Finance, and Directors.
- **One-by-One Notifications**: Real-time alerts ensure the next person in the sequence is notified only after the previous approval is granted.

### 4. Admin & Financial Reporting
- **Company Directory**: Manage users, assign managers, and maintain organizational hierarchy.
- **Excel Reporting**: One-click export of the entire reimbursement history for audits and accounting.

---

## 🛠️ Tech Stack
- **Frontend**: [Next.js 15](https://nextjs.org/), Tailwind CSS, Lucide React, Axios.
- **Backend**: [FastAPI](https://fastapi.tiangolo.com/) (Python), SQLAlchemy.
- **Database/Storage**: [Supabase](https://supabase.com/) (PostgreSQL & Storage).
- **AI/OCR**: Groq (Llama 4 Scout 17b).

---

## 👥 Team - Odoo x VIT Pune Hackathon 26
- **Team Leader**: ATHARV JOSHI
- **Team Members**:
  - Pratik Bugade
  - Vaishnavi Sambahji Patil
  - Jui Prashant Inamdar

---

## 💻 Setup & Installation

### Backend Setup
1. Clone the repository and navigate to the root directory.
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Configure your `.env` file with Supabase and Groq credentials.
4. Run the backend:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

### Frontend Setup
1. Navigate to the `frontend/` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

---

## 📂 Project Structure
- `/app`: Backend logic, models, and API endpoints.
- `/frontend`: Next.js application, components, and dashboard UI.
- `vercel.json`: Deployment configuration for Vercel.

---

## 🔑 Access Directory (Test Credentials)
| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@gmail.com` | `admin123` |
| **Manager** | `manager@gmail.com` | `manager123` |
| **Employee** | `employee@gmail.com` | `employee123` |
| **Finance** | `Dixit345@abc.com` | `finance123` |
| **Director** | `Manish32@abc.com` | `director123` |

---
*Created for Odoo x VIT Pune Hackathon 26*
