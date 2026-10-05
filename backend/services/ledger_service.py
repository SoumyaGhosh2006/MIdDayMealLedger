import logging
from datetime import date
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from backend.exceptions import DuplicateLedgerError
from backend.models import DailyLedger
from backend.schemas import LedgerCreate

logger = logging.getLogger(__name__)


def get_ledger_by_date(db: Session, target_date: date) -> Optional[DailyLedger]:
    """Retrieves a single ledger entry by its unique operational date."""
    return db.query(DailyLedger).filter(DailyLedger.date == target_date).first()


def create_ledger_entry(db: Session, ledger_in: LedgerCreate) -> DailyLedger:
    """
    Inserts a new validated ledger entry.
    Raises DuplicateLedgerError if date already exists.
    Wraps commit in try...except with rollback on failure.
    """
    existing = get_ledger_by_date(db, ledger_in.date)
    if existing:
        raise DuplicateLedgerError(f"A ledger entry already exists for date {ledger_in.date}.")

    db_entry = DailyLedger(**ledger_in.model_dump())
    db.add(db_entry)
    try:
        db.commit()
        db.refresh(db_entry)
        return db_entry
    except SQLAlchemyError as e:
        db.rollback()
        logger.error("Database commit failed for ledger on date %s: %s", ledger_in.date, e)
        raise


def list_ledger_entries(
    db: Session,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    limit: int = 100,
    offset: int = 0
) -> List[DailyLedger]:
    """Retrieves ledger entries filtered by optional date range, sorted chronologically with pagination."""
    query = db.query(DailyLedger)
    if start_date:
        query = query.filter(DailyLedger.date >= start_date)
    if end_date:
        query = query.filter(DailyLedger.date <= end_date)
    return query.order_by(DailyLedger.date.asc()).offset(offset).limit(limit).all()

