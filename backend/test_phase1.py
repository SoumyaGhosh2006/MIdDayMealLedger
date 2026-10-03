import os
import sys
from datetime import date
from decimal import Decimal

# Ensure project root directory is in python module search path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from pydantic import ValidationError
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import IntegrityError

from backend.database import Base
from backend.models import DailyLedger
from backend.schemas import LedgerCreate, LedgerResponse, LedgerUpdate, DateRangeQuery


def test_pydantic_auto_calculation_and_domain():
    print("-> Testing Pydantic auto-calculation of totals and optional rice fields...")
    raw_data = {
        "date": "2026-07-02",
        "egg": Decimal("90.00"),
        "oil": Decimal("220.00"),
        "dal": Decimal("150.50"),
        "soya_potato": Decimal("80.00"),
        "masala": Decimal("35.00"),
        "grocery": Decimal("50.00"),
        "veg": Decimal("120.00"),
        "fuel": Decimal("75.00"),
        "opening_balance_rice": Decimal("100.00"),
        "daily_count": 145,  # Student headcount
        "closing_balance_rice": Decimal("81.50"),
        "class_5": 31,
        "class_6": 48,
        "class_7": 42,
        "class_8": 39,
        "menu": "Mixveg, Soya, and Dal"
    }

    entry = LedgerCreate(**raw_data)

    # 1. Total expense auto-calculation
    expected_expense = Decimal("90.00") + Decimal("220.00") + Decimal("150.50") + Decimal("80.00") + \
                       Decimal("35.00") + Decimal("50.00") + Decimal("120.00") + Decimal("75.00")
    assert entry.total_expense == expected_expense, f"Expected {expected_expense}, got {entry.total_expense}"
    assert entry.total_expense == Decimal("820.50")

    # 2. Daily count (Integer headcount)
    assert isinstance(entry.daily_count, int)
    assert entry.daily_count == 145

    # 3. Rice fields (optional/deferred)
    assert entry.closing_balance_rice == Decimal("81.50")

    # 4. Attendance auto-calculation
    assert entry.total_attendance_6_8 == 48 + 42 + 39 == 129
    assert entry.total_attendance == 31 + 129 == 160

    print("   [PASS] Pydantic auto-calculation and daily_count verified.")


def test_optional_rice_inventory():
    print("-> Testing optional/nullable rice inventory fields...")
    entry = LedgerCreate(date="2026-07-03")
    assert entry.opening_balance_rice is None
    assert entry.daily_count is None
    assert entry.closing_balance_rice is None
    assert entry.total_expense == Decimal("0.00")
    assert entry.total_attendance == 0
    print("   [PASS] Rice inventory fields correctly default to None.")


def test_pydantic_negative_expense_validation():
    print("-> Testing Pydantic negative expense rejection...")
    try:
        LedgerCreate(
            date="2026-07-02",
            egg=Decimal("-10.00")
        )
        assert False, "Should have failed on negative egg expense"
    except ValidationError:
        print("   [PASS] Negative expense properly rejected.")


def test_database_operations_and_constraints():
    print("-> Testing SQLAlchemy schema creation with nullable rice fields...")
    test_engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=test_engine)
    TestSession = sessionmaker(bind=test_engine)
    session = TestSession()

    try:
        # Create and insert record with None rice fields
        create_schema = LedgerCreate(
            date=date(2026, 7, 2),
            egg=Decimal("90.00"),
            oil=Decimal("220.00"),
            dal=Decimal("150.50"),
            soya_potato=Decimal("80.00"),
            masala=Decimal("35.00"),
            grocery=Decimal("50.00"),
            veg=Decimal("120.00"),
            fuel=Decimal("75.00"),
            opening_balance_rice=None,
            daily_count=None,
            closing_balance_rice=None,
            class_5=31,
            class_6=48,
            class_7=42,
            class_8=39,
            menu="Mixveg, Soya, and Dal"
        )

        db_entry = DailyLedger(**create_schema.model_dump())
        session.add(db_entry)
        session.commit()
        session.refresh(db_entry)

        assert db_entry.id is not None
        assert db_entry.total_expense == Decimal("820.50")
        assert db_entry.opening_balance_rice is None
        assert db_entry.daily_count is None
        assert db_entry.closing_balance_rice is None
        assert db_entry.total_attendance == 160

        # Test ORM to LedgerResponse conversion
        response_schema = LedgerResponse.model_validate(db_entry)
        assert response_schema.id == db_entry.id
        assert response_schema.daily_count is None
        assert response_schema.closing_balance_rice is None
        assert response_schema.menu == "Mixveg, Soya, and Dal"
        print("   [PASS] Nullable rice fields inserted and serialized to LedgerResponse successfully.")

        # Test Unique Constraint on Date
        print("-> Testing unique date constraint enforcement...")
        duplicate_entry = DailyLedger(
            date=date(2026, 7, 2),
            egg=Decimal("50.00")
        )
        session.add(duplicate_entry)
        try:
            session.commit()
            assert False, "Should have failed due to duplicate date"
        except IntegrityError:
            session.rollback()
            print("   [PASS] Duplicate date constraint enforced.")

    finally:
        session.close()


if __name__ == "__main__":
    print("=== Running Phase 1 (Updated Schema) Verification Suite ===")
    test_pydantic_auto_calculation_and_domain()
    test_optional_rice_inventory()
    test_pydantic_negative_expense_validation()
    test_database_operations_and_constraints()
    print("=== All Phase 1 Tests Passed Successfully! ===")
