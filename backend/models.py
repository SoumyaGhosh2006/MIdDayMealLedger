from datetime import date, datetime
from decimal import Decimal
from sqlalchemy import Date, DateTime, Integer, Numeric, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from backend.database import Base


class DailyLedger(Base):
    __tablename__ = "daily_ledgers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, index=True)
    date: Mapped[date] = mapped_column(Date, unique=True, index=True, nullable=False)

    # Expenses (INR)
    egg: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0.00"), nullable=False)
    oil: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0.00"), nullable=False)
    dal: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0.00"), nullable=False)
    soya_potato: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0.00"), nullable=False)
    masala: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0.00"), nullable=False)
    grocery: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0.00"), nullable=False)
    veg: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0.00"), nullable=False)
    fuel: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0.00"), nullable=False)
    total_expense: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0.00"), nullable=False)

    # Inventory
    opening_balance_rice: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0.00"), nullable=False)
    daily_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    closing_balance_rice: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0.00"), nullable=False)

    # Attendance (Student counts)
    class_5: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    class_6: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    class_7: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    class_8: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_attendance_6_8: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_attendance: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Text Menu
    menu: Mapped[str] = mapped_column(Text, default="", nullable=False)

    # Audit Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

