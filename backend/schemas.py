from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, model_validator


class LedgerBase(BaseModel):
    date: date

    # Expenses (INR)
    egg: Decimal = Field(default=Decimal("0.00"), ge=0, decimal_places=2)
    oil: Decimal = Field(default=Decimal("0.00"), ge=0, decimal_places=2)
    dal: Decimal = Field(default=Decimal("0.00"), ge=0, decimal_places=2)
    soya_potato: Decimal = Field(default=Decimal("0.00"), ge=0, decimal_places=2)
    masala: Decimal = Field(default=Decimal("0.00"), ge=0, decimal_places=2)
    grocery: Decimal = Field(default=Decimal("0.00"), ge=0, decimal_places=2)
    veg: Decimal = Field(default=Decimal("0.00"), ge=0, decimal_places=2)
    fuel: Decimal = Field(default=Decimal("0.00"), ge=0, decimal_places=2)

    # Inventory (Rice) - Defer calculations, optional/nullable
    opening_balance_rice: Optional[Decimal] = Field(default=None, ge=0, decimal_places=2)
    daily_count: Optional[int] = Field(default=None, ge=0)
    closing_balance_rice: Optional[Decimal] = Field(default=None, decimal_places=2)

    # Attendance
    class_5: int = Field(default=0, ge=0)
    class_6: int = Field(default=0, ge=0)
    class_7: int = Field(default=0, ge=0)
    class_8: int = Field(default=0, ge=0)

    # Menu
    menu: str = Field(default="")


class LedgerCreate(LedgerBase):
    total_expense: Optional[Decimal] = Field(default=None, ge=0, decimal_places=2)
    total_attendance_6_8: Optional[int] = Field(default=None, ge=0)
    total_attendance: Optional[int] = Field(default=None, ge=0)

    @model_validator(mode="after")
    def compute_ledger_totals(self):
        # Auto-compute total expense if not supplied
        computed_expense = (
            self.egg + self.oil + self.dal + self.soya_potato +
            self.masala + self.grocery + self.veg + self.fuel
        )
        if self.total_expense is None:
            self.total_expense = computed_expense

        # Auto-compute attendance groups
        computed_6_8 = self.class_6 + self.class_7 + self.class_8
        if self.total_attendance_6_8 is None:
            self.total_attendance_6_8 = computed_6_8

        computed_total_att = self.class_5 + computed_6_8
        if self.total_attendance is None:
            self.total_attendance = computed_total_att

        return self


class LedgerUpdate(BaseModel):
    date: Optional[date] = None
    egg: Optional[Decimal] = Field(default=None, ge=0, decimal_places=2)
    oil: Optional[Decimal] = Field(default=None, ge=0, decimal_places=2)
    dal: Optional[Decimal] = Field(default=None, ge=0, decimal_places=2)
    soya_potato: Optional[Decimal] = Field(default=None, ge=0, decimal_places=2)
    masala: Optional[Decimal] = Field(default=None, ge=0, decimal_places=2)
    grocery: Optional[Decimal] = Field(default=None, ge=0, decimal_places=2)
    veg: Optional[Decimal] = Field(default=None, ge=0, decimal_places=2)
    fuel: Optional[Decimal] = Field(default=None, ge=0, decimal_places=2)
    total_expense: Optional[Decimal] = Field(default=None, ge=0, decimal_places=2)
    opening_balance_rice: Optional[Decimal] = Field(default=None, ge=0, decimal_places=2)
    daily_count: Optional[int] = Field(default=None, ge=0)
    closing_balance_rice: Optional[Decimal] = Field(default=None, decimal_places=2)
    class_5: Optional[int] = Field(default=None, ge=0)
    class_6: Optional[int] = Field(default=None, ge=0)
    class_7: Optional[int] = Field(default=None, ge=0)
    class_8: Optional[int] = Field(default=None, ge=0)
    total_attendance_6_8: Optional[int] = Field(default=None, ge=0)
    total_attendance: Optional[int] = Field(default=None, ge=0)
    menu: Optional[str] = None


class LedgerResponse(LedgerBase):
    id: int
    total_expense: Decimal
    total_attendance_6_8: int
    total_attendance: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DateRangeQuery(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class ExtractTextRequest(BaseModel):
    text: str
    reference_date: Optional[date] = None


class AdminNoteCreate(BaseModel):
    date: date
    content: str = Field(..., min_length=1, description="Content of the administrative note")


class AdminNoteResponse(BaseModel):
    id: int
    date: date
    content: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TeachingAidResponse(BaseModel):
    smart_filename: str = Field(..., description="Descriptive filename without extension e.g. Trigonometry_Teaching_Aid_Class10")
    markdown_content: str = Field(..., description="Structured teaching aid in markdown format including formula summary and 3-5 HOTS questions")
    svg_diagrams: list[str] = Field(default_factory=list, description="Array of valid, self-contained SVG diagram strings")


