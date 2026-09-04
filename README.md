# Hostel Students Mess Committee (SMC) — GEC Palanpur

**Mess Management & Centralized Inventory Management System**

A modern, responsive web application for the **Hostel Students Mess Committee (SMC) at Government Engineering College (GEC) Palanpur**.

---

## 🌟 Key Features

### 1. Role-Based Access Control (RBAC) & Dedicated Dashboards
- **Storage Committee**: Stock inventory, GRN (Goods Received Note), Stock In / Out, Minimum stock limit triggers, Procurement Requests, Purchase/Delivery status, Short Supply & Issue Reporting, Stock & GRN reports.
  - *Strict Data Privacy*: Storage Committee cannot see purchase rates, bill amounts, vendor payments, or bank details.
- **Procurement Committee**: Storage requests approval/review, Purchase order generation, Vendor database management (with contact and banking details), Bill uploads & tracking, Short Supply resolution workflows, Procurement reports.
- **Account Committee**: Bill verification (Verify, Reject, Request Correction), Multi-mode Payment disbursements (UPI, NEFT, RTGS, Cash, Cheque), Partial payment tracking, Vendor Ledger, GRN/Material Receipt inspection before payment, Financial reports.
- **Super Admin**: Full visibility & control across all entities, Committee member management, Category & Item management, Full linked transaction trace timeline, Detailed system audit logs.

### 2. Centralized Interconnected Workflow
Every transaction is connected through trace IDs:
$$\text{REQ-001} \rightarrow \text{PUR-001} \rightarrow \text{BILL-001} \rightarrow \text{PAY-001} \rightarrow \text{GRN-001} \rightarrow \text{Stock In / Out}$$

- **No Stock Increment on Order**: Stock only increases when physical goods arrive and a **GRN** is submitted by the Storage Committee.
- **Automated Short Supply Detection**: If 100 kg is ordered and 80 kg arrives:
  - GRN records received qty (+80 kg to stock)
  - System automatically creates **Short Supply (20 kg)**
  - Procurement receives a notification and can trigger **"Complete Short Supply"** to procure the remaining 20 kg under the same workflow chain.
- **Auto-Calculated Payment Statuses**: Real-time synchronization across Account and Procurement dashboards for Paid, Partially Paid, and Pending balances.

### 3. Report Exports
- Instant Export to **Excel (.xlsx)**, **CSV**, and **PDF** formats with customizable date-range filters.
- Role-specific column security (Storage exports strictly exclude financial figures).

### 4. In-App Notifications & Audit Trail
- Real-time notification drawer per role with unread badges.
- Comprehensive immutable audit logging tracking user, action, entity, previous values, and new values.

---

## 🔑 Demo Login Credentials

### Committee Login
| Committee | Name | Enrollment Number |
|---|---|---|
| **Storage Committee** | `Raj Patel` | `21CE001` |
| **Storage Committee** | `Anjali Shah` | `21CE002` |
| **Procurement Committee** | `Priya Mehta` | `21ME001` |
| **Procurement Committee** | `Vivek Sharma` | `21ME002` |
| **Account Committee** | `Karan Desai` | `21EC001` |
| **Account Committee** | `Sneha Joshi` | `21EC002` |

### Admin Login
- **Username**: `admin`
- **Password**: `admin123`

---

## 🚀 Getting Started

### Prerequisites
Make sure [Node.js](https://nodejs.org/) (version 18 or above) is installed on your machine.

### Installation & Run

1. Open a terminal in the project directory:
   ```bash
   cd "c:\Users\patel\Desktop\final project"
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser at the URL shown in the terminal (usually `http://localhost:5173`).

---

## 🏗️ Architecture & Tech Stack

- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS + Custom Institutional Blue/Slate Theme
- **Routing**: React Router v6 (Role-protected nested routing)
- **State & Persistence**: React Context API + LocalStorage data store with auto-seeding
- **Data Tables & Visuals**: TanStack Table v8, Lucide React Icons, Recharts
- **Forms & Validation**: React Hook Form + Zod validation schemas
- **Reporting & Exports**: SheetJS (`xlsx`), jsPDF + jsPDF-AutoTable
