# Technical Architecture & Implementation Blueprint

## 1. System Overview
This project is a decoupled web application consisting of a stateless API backend, a continuous relational database, and a mobile-first frontend client. 
* **Backend:** Python-based REST API (FastAPI) responsible for audio processing, orchestration of AI models, and database transactions.
* **Database:** Relational SQL database (PostgreSQL) acting as the single source of truth for the continuous ledger.
* **Frontend:** Component-based UI framework (React) optimized for mobile viewports.

## 2. Architectural Principles & Constraints
* **Decoupled Logic:** Route handlers must not contain business logic. Business logic must not contain database queries. Maintain strict separation: `Routers -> Services -> Repositories/Models`.
* **Data Persistence over Files:** Do not store physical `.xlsx` or `.csv` files on the server. Data is stored in SQL rows. Files are dynamically generated in-memory during the export request and immediately streamed to the client.
* **Defensive Prompting:** The extraction LLM must be strictly constrained via system prompts to return structured JSON. The backend must enforce schema validation before attempting a database insert.

## 3. Directory & Module Structure
The backend must be structured to support maintainability:
```text
backend/
├── main.py                 # FastAPI application instance and CORS setup
├── database.py             # Engine, SessionLocal, and DB connection logic
├── models.py               # SQLAlchemy ORM models (The SQL Schema)
├── schemas.py              # Pydantic models (Data validation for API and AI outputs)
├── routers/
│   ├── ingestion.py        # Endpoints for audio upload and text processing
│   └── export.py           # Endpoints for querying dates and generating Excel
├── services/
│   ├── audio_service.py    # Handles STT (Speech-to-Text) inference
│   ├── llm_service.py      # Handles Text-to-JSON extraction
│   └── excel_service.py    # Handles dynamic .xlsx file generation