import logging
from datetime import date
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from backend.models import AdminNote
from backend.schemas import AdminNoteCreate

logger = logging.getLogger(__name__)


def create_admin_note(db: Session, note_in: AdminNoteCreate) -> AdminNote:
    """
    Inserts a new admin note.
    Wraps commit in try...except with rollback on failure.
    """
    db_entry = AdminNote(
        date=note_in.date,
        content=note_in.content.strip()
    )
    db.add(db_entry)
    try:
        db.commit()
        db.refresh(db_entry)
        return db_entry
    except SQLAlchemyError as e:
        db.rollback()
        logger.error("Database commit failed for admin note on date %s: %s", note_in.date, e)
        raise


def list_admin_notes(
    db: Session,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    limit: int = 100,
    offset: int = 0
) -> List[AdminNote]:
    """
    Retrieves administrative notes, sorted chronologically descending (latest first).
    """
    query = db.query(AdminNote)
    if start_date:
        query = query.filter(AdminNote.date >= start_date)
    if end_date:
        query = query.filter(AdminNote.date <= end_date)
    return query.order_by(AdminNote.date.desc(), AdminNote.created_at.desc()).offset(offset).limit(limit).all()


def delete_admin_note(db: Session, note_id: int) -> bool:
    """Deletes an admin note by ID."""
    note = db.query(AdminNote).filter(AdminNote.id == note_id).first()
    if not note:
        return False
    db.delete(note)
    try:
        db.commit()
        return True
    except SQLAlchemyError as e:
        db.rollback()
        logger.error("Failed to delete admin note %s: %s", note_id, e)
        raise

