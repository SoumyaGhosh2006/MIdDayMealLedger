import io
import json
import logging
import re
from datetime import date
from typing import List, Optional
import PyPDF2
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status

from pydantic import ValidationError
from sqlalchemy.orm import Session

from backend.config import settings
from backend.database import get_db
from backend.exceptions import ConfigurationError, ExtractionError
from backend.schemas import AdminNoteCreate, AdminNoteResponse, TeachingAidResponse
from backend.services.llm_service import get_groq_client
from backend.services.note_service import create_admin_note, delete_admin_note, list_admin_notes

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "/",
    response_model=AdminNoteResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new administrative note"
)
def save_admin_note(
    note_in: AdminNoteCreate,
    db: Session = Depends(get_db)
):
    """
    Saves an administrative note or remark from the school principal/headmaster.
    """
    try:
        return create_admin_note(db=db, note_in=note_in)
    except Exception as e:
        logger.error("Failed to save admin note: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save admin note: {e}"
        )


@router.get(
    "/",
    response_model=List[AdminNoteResponse],
    status_code=status.HTTP_200_OK,
    summary="List administrative notes with date filtering"
)
def get_admin_notes(
    start_date: Optional[date] = Query(None, description="Optional filter: Earliest date (inclusive)"),
    end_date: Optional[date] = Query(None, description="Optional filter: Latest date (inclusive)"),
    limit: int = Query(100, ge=1, le=500, description="Pagination limit"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    db: Session = Depends(get_db)
):
    """
    Returns administrative notes ordered chronologically descending (latest first).
    """
    if start_date and end_date and start_date > end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"start_date ({start_date}) cannot be later than end_date ({end_date})."
        )
    return list_admin_notes(
        db=db,
        start_date=start_date,
        end_date=end_date,
        limit=limit,
        offset=offset
    )


@router.delete(
    "/{note_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete an administrative note"
)
def remove_admin_note(
    note_id: int,
    db: Session = Depends(get_db)
):
    """
    Deletes an administrative note by ID.
    """
    deleted = delete_admin_note(db=db, note_id=note_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Admin note with ID {note_id} not found."
        )
    return {"status": "success", "message": f"Note {note_id} deleted."}


@router.post(
    "/generate-teaching-aid",
    response_model=TeachingAidResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate AI teaching aid, formula summary, HOTS questions, and SVG diagrams from document"
)
def generate_teaching_aid(
    file: UploadFile = File(..., description="Document file (PDF, TXT, or Markdown)")
):
    """
    Extracts text from uploaded PDF or document and generates structured pedagogical teaching aid:
    - Smart descriptive topic filename
    - Consolidated formula summary
    - 3-5 Higher-Order Thinking Skills (HOTS) questions with pedagogical solutions
    - High-quality SVG whiteboard diagrams
    """
    filename = (file.filename or "").lower()
    try:
        contents = file.file.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unable to read uploaded file: {e}"
        )

    if not contents:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty."
        )

    # 1. Extract text
    extracted_text = ""
    if filename.endswith(".pdf") or file.content_type == "application/pdf":
        try:
            reader = PyPDF2.PdfReader(io.BytesIO(contents))
            pages_text = []
            for idx, page in enumerate(reader.pages):
                page_str = page.extract_text() or ""
                if page_str.strip():
                    pages_text.append(page_str)
            extracted_text = "\n\n".join(pages_text)
        except Exception as e:
            logger.error("PyPDF2 extraction error: %s", e)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to extract text from PDF: {e}"
            )
    else:
        # Fallback for plain text, markdown, or other UTF-8 text documents
        try:
            extracted_text = contents.decode("utf-8", errors="ignore")
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to decode text document: {e}"
            )

    if not extracted_text or not extracted_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not extract any readable text from the document. Please ensure the document contains selectable text or clear print."
        )

    # 2. Build LLM prompt with strictly typed JSON schema
    system_prompt = r"""
You are an expert university textbook author and pedagogical assistant. 
Your job is to extract educational content and return it strictly as a JSON object.

CRITICAL MATH & JSON RULES:
1. Output valid, parseable JSON. Do not wrap the JSON in markdown code blocks.
2. DO NOT manually double-escape backslashes. Write standard LaTeX (e.g., \frac, \Delta). Let the JSON encoder handle escaping.
3. Use standard $ for inline math and $$ for display math. Do not escape the dollar signs.

Your JSON Schema must be exactly:
{
  "smart_filename": "Descriptive_Name_ClassLevel",
  "markdown_content": "The formatted study guide exactly following the STRICT TEMPLATE below.",
  "svg_diagrams": ["<svg>...</svg>"]
}

STRICT TEMPLATE RULES FOR `markdown_content`:
You MUST structure your markdown exactly using these headings in this exact order:

# [Topic / Chapter Name]

## 1. Master Formula Sheet (From Text)
(Extract only the formulas explicitly present in the provided text. GFM table format).

## 2. Essential Prerequisite Formulas (AI Knowledge Base)
(Tap into your internal memory to provide 2-3 foundational formulas or base models that are NOT in the text, but are absolutely required to solve the problems or understand the derivations in this chapter).

## 3. Hot Notes & Conceptual Pitfalls
(Core concepts and common student mistakes).

## 4. Higher-Order Thinking (HOTS) Questions
(3-5 challenging analytical questions with Hints/Solutions).

## 5. Visual Diagrams & Graphs
(Briefly describe the accompanying SVG diagrams).

LATEX SPACING RULES:
- Use \displaystyle for complex fractions.
- Add explicit small spaces (\, or \;) between variables so they do not overlap.

SVG RULES:
- Every SVG MUST contain: At least 10 SVG elements, 2 graph lines/curves, 3 text labels, and 1 highlighted intersection point. NEVER return an empty grid.
"""



    client = get_groq_client()
    target_model = settings.GROQ_LLM_MODEL

    # Cap text length to prevent context explosion while giving ample depth
    truncated_input = extracted_text[:12000]

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"Extract teaching aid from this document:\n\n{truncated_input}"}
    ]

    try:
        response = client.chat.completions.create(
            model=target_model,
            messages=messages,
            temperature=0.2,
            response_format={"type": "json_object"}
        )
    except Exception as e:
        logger.error("Groq API teaching aid generation error: %s", e)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to generate teaching aid from AI service: {e}"
        )

    raw_json_str = response.choices[0].message.content or "{}"

    try:
        return TeachingAidResponse.model_validate_json(raw_json_str)
    except (ValidationError, json.JSONDecodeError) as err:
        logger.warning("Teaching aid JSON validation failed on first attempt: %s. Attempting escape repair and fallback parse.", err)
        # Attempt repair for invalid backslashes (e.g. \frac, \alpha, \text, \left, \right)
        repaired_json = re.sub(r'\\(?![/"\\bfnrtu]|u[0-9a-fA-F]{4})', r'\\\\', raw_json_str)
        try:
            return TeachingAidResponse.model_validate_json(repaired_json)
        except Exception:
            try:
                parsed = json.loads(repaired_json)
                return TeachingAidResponse(
                    smart_filename=parsed.get("smart_filename") or "Teaching_Aid_Document",
                    markdown_content=parsed.get("markdown_content") or "Failed to format markdown content.",
                    svg_diagrams=parsed.get("svg_diagrams") or []
                )
            except Exception:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="AI service returned invalid structured output. Please retry."
                )


