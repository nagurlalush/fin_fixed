# CreatorVerse AI — Full-Stack Enterprise Platform

**CreatorVerse AI** is a full-stack generative AI creative marketplace engineered with Python (Flask), SQLite, and a human-crafted Obsidian/Slate UI/UX design system. It seamlessly bridges premier generative AI directors with global enterprises.

---

## ⚡ Key Architectural Features

1. **Standalone Title Page & Multi-Role Authentication**
   - **AI Creator Portal**, **Brand / Agency Portal**, and **Platform Admin Portal** with strict Role-Based Access Control (RBAC).
   - Cross-portal logins are blocked with **HTTP 403 Forbidden** security shields.
   - Built-in interactive **Forgot Password** recovery workflow.
   - **1-Click Instant Demo Access** pills for Aarav (Creator), Apex Media (Brand), and Admin.

2. **AI-Assisted Creative Brief Builder**
   - Natural Language rule-based NLP engine converts rough campaign ideas into production-ready briefs.
   - Automatic suggestion of content types, visual styles, aspect ratios (16:9, 9:16), resolutions (4K UHD), deliverables, and AI toolchains.
   - **Missing Information Detector** alerts brands if budget, target audience, brand color palette, or audio requirements are omitted.

3. **6-Factor Algorithmic AI Matching Engine**
   - Multi-factor compatibility scoring (0–100%):
     - Specialization match (25%)
     - AI Tools & Models match (20%)
     - Skills match (20%)
     - Budget / Day-rate match (15%)
     - Verification status match (10%)
     - Availability match (10%)
   - Transparent, explainable match cards with positive reasons, unmet criteria, and commercial compatibility indicators.

4. **Audited ComfyUI & Workflow Verification Heuristic Analyzer**
   - Creators submit ComfyUI node graphs (JSON/PNG), tool license receipts, and past client links.
   - Heuristic integrity checks compute an authenticity confidence score (0–100%) and recommendation (`AUTO_APPROVE` / `MANUAL_REVIEW`).
   - Administrative review queue allows platform admins to audit submissions and grant verified credentials.

5. **Versioned Production Workspaces**
   - Versioned deliverable handoffs (`v1.0`, `v1.1`, master export).
   - Interactive review workflow supporting **timecoded feedback markers** (e.g. `00:14 - Fix artifact; 00:38 - Color grading`).
   - Milestone progress tracker (`Concept & Storyboard` -> `Draft Iteration` -> `Final Polish & Master`).
   - Commercial IP terms repository (Global buyout, exclusivity, training opt-out, source graph handoff).
   - Real-time project messaging stream.

---

## 🚀 Quick Start (1-Click Launch)

### Option 1: Automatic Setup via Batch Files (Recommended)
Double-click `run.bat` in the project root:
- Automatically verifies Python is installed.
- Installs dependencies from `requirements.txt`.
- Seeds demo database (`creatorverse.db`).
- Launches the Flask web server on `http://127.0.0.1:5000`.
- Automatically opens your default web browser.

Alternatively, run `install.bat` once to install dependencies and seed the database.

### Option 2: Manual Terminal Execution
```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Seed database
python seed.py

# 3. Launch application
python app.py
```
Open **`http://127.0.0.1:5000`** in your browser.

---

## 🧪 Automated Verification Suite (`test_giri`)

To run the complete automated test suite verifying all 15 core architectural requirements:
```bash
# Double-click test_giri.bat, or run:
python test_giri.py
```
Detailed test results and audit metrics are saved to `TEST_GIRI_VERIFICATION.txt`.

---

## 🔑 Pre-Seeded Demo Credentials

| Role | Email | Password | Pre-Configured Assets |
| :--- | :--- | :--- | :--- |
| **AI Creator** | `aarav@creatorverse.ai` | `creator123` | Aarav Sharma (Mumbai) — Verified ComfyUI Director, 4K portfolio showcases, day rate \$950 |
| **Brand / Agency** | `apex@brands.com` | `brand123` | Apex Media Studios (Mumbai) — Published briefs, active campaign workspace |
| **Platform Admin** | `admin@creatorverse.ai` | `admin123` | Rajesh Kumar (Bengaluru) — Governance access, verification audit queue, user directory |

*Additional Indian creators pre-seeded: Vikram Malhotra (`vikram@creatorverse.ai`), Priya Sengupta (`priya@creatorverse.ai`), Kabir Reddy (`kabir@creatorverse.ai`).*

---

## Latest changes
- Title Page button and top-left logo act as "title" buttons **only on the Title Page**.
- All animations removed (keyframes, transitions, floating orbs, particle background, custom cursor, smooth scrolling).
- Fixed the missing Workspace **Milestone Progress** container (milestones now render).
- Verified with `test_all_connections.py`, `test_giri.py` (18/18) and a headless-browser click test of every button for Creator, Brand and Admin.
