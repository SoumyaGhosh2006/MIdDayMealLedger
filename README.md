# SchoolDesk
### *Dual-Purpose School Administrative Ledger & AI Pedagogical Assistant*

---

## 📖 Overview

In government and public schools, headmasters, principals, and teachers face two recurring, time-consuming administrative challenges every single day:
1. **Manual Mid-Day Meal (MDM) Ledger Bookkeeping:** Manually recording daily student attendance, calculating ingredient costs (eggs, vegetables, oil, pulses, spices, fuel), reconciling bulk rice grain stocks, and maintaining flawless handwritten inspection registers for government compliance.
2. **Time-Intensive Lesson Preparation:** Extracting formulas, drafting Higher-Order Thinking Skills (HOTS) questions, synthesizing student mistake pitfalls, and drafting whiteboard diagrams across heavy textbook chapters.

**SchoolDesk** solves both problems with a unified, voice-driven digital workspace. It allows school staff to speak their daily meal expenses into existence in seconds, generate audit-ready spreadsheets and realistic handwritten registers, digitize physical vouchers with a built-in camera document scanner, and instantly convert syllabus PDFs into structured, textbook-grade teaching aids.

---

## 🚀 Core Features & Use Cases (User Guide)

SchoolDesk is designed to be completely accessible to non-technical educators. Below is a step-by-step guide to its primary operational workflows.

```
+-----------------------------------------------------------------------------------+
|                                   SCHOOLDESK                                      |
+----------------------------------------+------------------------------------------+
|      ADMINISTRATIVE LEDGER HUB         |          AI PEDAGOGICAL HUB              |
|  - Spoken Voice Recording              |  - Textbook / Syllabus PDF Upload        |
|  - Instant Whisper Transcription       |  - Document Scanner (Camera to PDF)      |
|  - Natural Language Cost Extraction    |  - Master Formula Sheet (KaTeX)          |
|  - Re-extraction & Live Editor         |  - Prerequisite Memory Formulas          |
|  - Government Audit CSV Export         |  - HOTS Questions & Pedagogical Hints    |
|  - Analog Handwritten PNG Generator    |  - Whiteboard SVG Vector Diagrams        |
|  - Smart Date-Range File Naming        |  - Instant Google Docs & PDF Bridge      |
+----------------------------------------+------------------------------------------+
```

---

### Use Case 1: Voice-Activated Meal Ledger

> **User Persona:** Headmaster or Cook-cum-Helper recording daily midday meal meal distribution and kitchen grocery expenditures.

1. **Speak Naturally (Microphone Input):**
   - Click the **Start Recording** microphone button on the **Daily Entry** tab.
   - Speak your daily report in natural English or Hinglish.
   - *Example speech:*  
     > *"Today is 4th October. We served 95 students in Primary and 120 students in Upper Primary. Menu was Rice, Dal, and Boiled Egg. We spent 480 rupees on eggs, 120 on mustard oil, 160 on dal, 250 on vegetables, and 100 on fuel. Opening rice stock was 180 kilograms, daily consumption was 24 kilograms."*
   - Click **Stop Recording**. The audio is streamed directly to Groq's high-speed Whisper speech-to-text engine.

2. **Review & Live Editing:**
   - Within seconds, the spoken audio is transcribed into text, and the structured ledger form is automatically populated with exact itemized costs, student counts, and rice balances.
   - **Editable Transcript Box:** If an amount was spoken incorrectly or misheard (e.g., "160" instead of "180"), edit the text directly in the transcript box and click **"Re-extract Data from Text"** to re-parse the figures instantly without re-recording audio.

3. **Database Commitment:**
   - Review calculated metrics (Total Expenditure, Closing Rice Stock).
   - Click **"Save Entry to Ledger"** to securely record the record into the permanent SQLite database.

4. **Audit-Ready Exports (`Ledger History` Tab):**
   - **Government Audit CSV Export:** Click **Export CSV** to download a standardized spreadsheet formatted to official government reporting standards, with grain reconciliation (`Opening Rice`, `Daily Consumption`, `Closing Rice`) and expenditure columns.
   - **Analog Handwritten PNG Register:** Click **Download Handwritten** to generate an authentic image that looks identical to a blue ink pen on lined school notebook paper—complete with subtle handwriting jitter, cursive font styling, and ruled notebook lines for physical inspection folders.
   - **Smart Filenames:** All exported files are automatically named with ordinal date ranges (e.g., `SchoolDesk_3rdOct2026_to_4thOct2026.csv` or `SchoolDesk_4thOct2026_handwritten.png`).

---

### Use Case 2: AI Teaching Aid & Curriculum Synthesizer

> **User Persona:** Mathematics, Science, or Economics Teacher preparing chapter lesson plans, whiteboard notes, and challenge worksheets.

1. **Upload or Scan Syllabus Chapters:**
   - Navigate to the **Admin Notes** tab.
   - **Drag-and-Drop:** Drop any PDF textbook chapter, syllabus handout, or plain text notes (up to 25MB) into the upload area.
   - **Live Document Scanner:** If you have physical paper notes, use the embedded **Document Scanner** to capture pages with your device camera (`facingMode: environment`) and bundle them into an A4 PDF document.

2. **One-Click Synthesis:**
   - Click **"Generate Teaching Aid"**. The system processes the document through an advanced pedagogical pipeline powered by Meta Llama 3 70B.

3. **Structured Lesson Plan Output:**
   - **1. Master Formula Sheet (From Text):** A clean GitHub Flavored Markdown (GFM) reference table consolidating every formula, definition, and identity present in the source text.
   - **2. Essential Prerequisite Formulas (AI Knowledge Base):** The AI accesses its deep foundational memory to supply 2–3 required base equations or theorems that were *not* printed in the chapter but are essential to understand the derivations or solve the exercises.
   - **3. Hot Notes & Conceptual Pitfalls:** Highlights core conceptual fundamentals, crucial teaching tips, and common traps where students frequently lose marks.
   - **4. Higher-Order Thinking Skills (HOTS) Questions:** 3–5 multi-step, analytical questions designed to challenge students beyond rote memorization, accompanied by pedagogical hints and complete step-by-step solutions.
   - **5. Whiteboard Visual Diagrams (SVG Vector Graphics):** Generates clean, crisp chalkboard diagrams (coordinate graphs, curves, labeled axes, geometric figures, and intersection points) ready for classroom projection or board illustration.

4. **Textbook-Grade Math Rendering & Direct Exports:**
   - **KaTeX LaTeX Engine:** All mathematical variables and complex fractions are rendered cleanly with `\displaystyle` and textbook typography.
   - **Edit in Google Docs:** Click the **"Edit in Google Docs"** button to copy the sanitized Markdown to your clipboard and immediately launch Google Docs in a new browser tab for instant pasting and school handout customization.
   - **Download Teaching Aid PDF:** Click **"Download Teaching Aid"** to export the entire pedagogical guide—including rendered formulas and SVG diagrams—into a publication-ready PDF named descriptively by topic (e.g., `Elasticity_Of_Demand_Class11.pdf`).

---

### Use Case 3: Administrative Notes & School Diary

> **User Persona:** Principal or Administrative Clerk recording inspection logs, food safety audits, and stock replenishment memos.

- Enter record dates, select quick template chips (*"BEO Inspection Visit"*, *"Stock Alert"*, *"Vegetable & Grocery Quality Check passed"*), draft administrative remarks, and store them chronologically.
- Search and copy prior administrative notes to the clipboard with one click.

---

## 🛠️ Comprehensive Tech Stack

SchoolDesk is built using a modern, decoupled full-stack architecture optimized for high performance, sub-second AI inferences, and offline-capable client reliability.

### Frontend Client
| Technology | Role & Purpose |
| :--- | :--- |
| **React 19** | Modern reactive user interface with stateful hooks and zero-latency UI re-rendering. |
| **Vite 8** | High-speed frontend tooling, hot-module reloading, and optimized production asset bundler. |
| **Tailwind CSS v4** | Utility-first responsive styling with modern OKLCH color normalization and custom UI components. |
| **@tailwindcss/typography** | Textbook-grade typography styling (`prose prose-lg`) for formatted study guides and tables. |
| **React-Markdown & Remark-GFM** | Strict GitHub Flavored Markdown parser supporting tables, checklists, and code formatting. |
| **Remark-Math, Rehype-KaTeX & KaTeX** | Fast, high-fidelity LaTeX mathematical equation renderer for inline (`$`) and display (`$$`) equations. |
| **HTML-to-Image** | Vector-to-canvas rendering library bypassing modern browser color parsing constraints to produce high-DPI screenshots. |
| **jsPDF** | Client-side vector PDF generation engine for document scanning and teaching aid downloads. |
| **Lucide React** | Clean, accessible SVG iconography throughout all navigation bars and controls. |

### Backend API & Data Engine
| Technology | Role & Purpose |
| :--- | :--- |
| **FastAPI** | High-performance Python async REST API framework with native OpenAPI documentation and type safety. |
| **Python 3.12+** | Backend runtime leveraging modern typing and multi-threading threadpools. |
| **SQLAlchemy 2.0** | Robust Object-Relational Mapper (ORM) providing clean database migrations, models, and transactions. |
| **SQLite** | Zero-maintenance embedded relational database (pre-configured for PostgreSQL production migration). |
| **PyPDF2** | High-speed server-side binary text extraction from uploaded curriculum PDF documents. |
| **Pydantic v2 & Pydantic-Settings** | Strict data validation, automated schema serialization, and fail-fast environment configuration. |
| **Uvicorn** | Lightning-fast ASGI production web server. |

### AI & LLM Infrastructure
| Technology | Role & Purpose |
| :--- | :--- |
| **Meta Llama 3 70B (via Groq Cloud)** | Advanced language model powering pedagogical synthesis, formula consolidation, and SVG diagram generation. |
| **OpenAI Whisper Large v3 (via Groq Cloud)** | Low-latency speech-to-text engine transcribing diverse Indian English and regional accents accurately. |
| **Constraint-Based RAG Prompting** | Zero-hallucination system prompt architecture enforcing strict JSON output schemas, LaTeX standards, and template orders. |

---

## 💻 Getting Started (For Developers)

Follow these copy-pasteable instructions to run SchoolDesk locally on your machine.

### Prerequisites
- **Python 3.10+** (Python 3.12 recommended)
- **Node.js 18+** (Node.js 20+ recommended) and **npm**
- A free **Groq Cloud API Key** (obtainable at [console.groq.com](https://console.groq.com))

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/your-username/schooldesk.git
cd schooldesk
```

---

### Step 2: Backend Setup

1. **Create and Activate a Virtual Environment:**
   - **Windows (PowerShell):**
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```
   - **macOS / Linux (Bash):**
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

2. **Install Python Dependencies:**
   ```bash
   pip install --upgrade pip
   pip install -r backend/requirements.txt
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the project root (or inside `backend/`):
   ```ini
   # Groq Cloud API Key (Required for AI Speech Transcription & Teaching Aid Generation)
   GROQ_API_KEY=your_groq_api_key_here

   # Target LLM Model
   GROQ_LLM_MODEL=llama-3.3-70b-versatile

   # Database Connection (Defaults to local SQLite)
   DATABASE_URL=sqlite:///./middaymeal.db

   # SQL Debug Logging (Optional)
   SQL_ECHO=False
   ```

4. **Run the FastAPI Backend Server:**
   ```bash
   uvicorn backend.main:app --reload --port 8000
   ```
   *The backend API will start at `http://localhost:8000`. You can test interactive API documentation at `http://localhost:8000/docs`.*

---

### Step 3: Frontend Setup

1. **Navigate to the Frontend Directory and Install Dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Start the Frontend Development Server:**
   ```bash
   npm run dev
   ```
   *Vite will launch the application at `http://localhost:5173`. Open this URL in any modern browser.*

---

### Step 4: Building for Production

To test or bundle the optimized production frontend client:
```bash
cd frontend
npm run build
```
The compiled, minified bundle will be output to `frontend/dist/`.

---

## 🔒 Security & Data Privacy

- **On-Device PDF Compilation:** Document scanning and multi-page voucher compilation run entirely in the browser using client-side HTML5 canvas and `jsPDF`. Camera feeds never touch external servers.
- **Fail-Safe Database Transactions:** All ledger entries and administrative notes run within managed SQLAlchemy database sessions with automatic rollbacks on commit exceptions.
- **Zero Raw Document Retention:** Uploaded curriculum PDFs are processed in-memory for text extraction and immediately released from memory without permanent server-side document storage.

---

## 📄 License

This project is licensed under the **MIT License** — open-source and free for educational institutions and community schools worldwide.
