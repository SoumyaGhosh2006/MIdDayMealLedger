export const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const API_ROOT = BASE_URL.replace(/\/+$/, '').replace(/\/api\/(ledger|notes)$/, '');
export const LEDGER_URL = `${API_ROOT}/api/ledger`;
export const NOTES_URL = `${API_ROOT}/api/notes`;
export const HEALTH_URL = `${API_ROOT}/health`;

/**
 * Re-extracts structured ledger data from edited or raw text via POST /api/ledger/extract-text.
 * Sends JSON body: { text, reference_date: referenceDate }
 * Returns: LedgerCreate
 */
export async function extractText(text, referenceDate = null) {
  const payload = { text };
  if (referenceDate) payload.reference_date = referenceDate;

  const res = await fetch(`${LEDGER_URL}/extract-text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.detail || body.error || `Extraction failed (HTTP ${res.status})`);
  }
  return body;
}

/**
 * Uploads a document (PDF, TXT, MD) to POST /api/notes/generate-teaching-aid.
 * Returns: { smart_filename: string, markdown_content: string, svg_diagrams: string[] }
 */
export async function generateTeachingAid(file) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${NOTES_URL}/generate-teaching-aid`, {
    method: 'POST',
    body: formData,
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.detail || body.error || `Failed to generate teaching aid (HTTP ${res.status})`);
  }
  return body;
}


export const api = {
  /**
   * Health check probe to verify backend & DB connectivity.
   */
  async checkHealth() {
    const res = await fetch(HEALTH_URL);
    if (!res.ok) throw new Error(`Health check failed: HTTP ${res.status}`);
    return res.json();
  },

  /**
   * Uploads recorded audio to POST /api/ledger/process-voice.
   * Sends multipart/form-data with recording.webm payload and optional reference_date.
   * Returns: { transcription: string, data: LedgerCreate }
   */
  async processVoice(audioBlob, filename = 'recording.webm', referenceDate = null) {
    const formData = new FormData();
    formData.append('file', audioBlob, filename);
    if (referenceDate) {
      formData.append('reference_date', referenceDate);
    }

    const res = await fetch(`${LEDGER_URL}/process-voice`, {
      method: 'POST',
      body: formData,
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      const errorMsg = body.detail || body.error || `Voice processing failed (HTTP ${res.status})`;
      throw new Error(errorMsg);
    }
    return body;
  },

  /**
   * Re-extracts structured ledger data from edited or raw text.
   * Exported on the api object as api.extractText.
   */
  extractText,

  /**
   * Persists a verified LedgerCreate payload into the relational database.
   * Handles 409 DuplicateLedgerError cleanly.
   */
  async saveLedger(ledgerData) {
    const res = await fetch(`${LEDGER_URL}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ledgerData),
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 409) {
        throw new Error(`Duplicate entry: A ledger record for date ${ledgerData.date} already exists.`);
      }
      throw new Error(body.detail || body.error || `Failed to save ledger (HTTP ${res.status})`);
    }
    return body;
  },

  /**
   * Retrieves ledger entries with optional date range bounds and pagination.
   */
  async fetchLedgers(startDate = null, endDate = null, limit = 100, offset = 0) {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    params.append('limit', limit);
    params.append('offset', offset);

    const res = await fetch(`${LEDGER_URL}/?${params.toString()}`);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(body.detail || body.error || `Failed to fetch ledgers (HTTP ${res.status})`);
    }
    return body;
  },

  /**
   * Persists an administrative note to POST /api/notes/.
   * Payload: { date: 'YYYY-MM-DD', content: string }
   */
  async saveNote(noteData) {
    const res = await fetch(`${NOTES_URL}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(noteData),
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(body.detail || body.error || `Failed to save admin note (HTTP ${res.status})`);
    }
    return body;
  },

  /**
   * Retrieves administrative notes from GET /api/notes/.
   */
  async fetchNotes(startDate = null, endDate = null, limit = 100, offset = 0) {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    params.append('limit', limit);
    params.append('offset', offset);

    const res = await fetch(`${NOTES_URL}/?${params.toString()}`);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(body.detail || body.error || `Failed to fetch admin notes (HTTP ${res.status})`);
    }
    return body;
  },

  /**
   * Deletes an administrative note by ID.
   */
  async deleteNote(noteId) {
    const res = await fetch(`${NOTES_URL}/${noteId}`, {
      method: 'DELETE',
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(body.detail || body.error || `Failed to delete note (HTTP ${res.status})`);
    }
    return body;
  },

  /**
   * Uploads a document (PDF, TXT, MD) to POST /api/notes/generate-teaching-aid.
   * Generates formulas, HOTS questions, SVG whiteboard diagrams, and smart filename.
   */
  generateTeachingAid,
};

export default api;



