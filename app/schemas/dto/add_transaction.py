from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import Optional
from decimal import Decimal

class AddTransaction(BaseModel):
    # ID aktywa (z.coerce.number().int().positive())
    asset_id: int = Field(..., gt=0, description="ID aktywa z bazy danych")

    # Typ transakcji (z.string().min(1))
    # Tutaj warto w przyszłości użyć Enum, ale na razie trzymamy się stringa
    type: str = Field(..., min_length=1)

    # Data i godzina (z.string() z inputu datetime-local)
    # Pydantic automatycznie skonwertuje string ISO/datetime-local na obiekt datetime
    timestamp: datetime

    value_net: float = Field(..., ge=0)
    fee: float = Field(..., ge=0)
    tax: float = Field(..., ge=0)

    # Ilość (Numeric 18, 8)
    quantity: float = Field(..., ge=0, description="Ilość jednostek")

    # Cena jednostkowa (z.coerce.number().nonnegative())
    price: float = Field(..., ge=0)

    # Kurs wymiany (z.coerce.number().positive().default(1.0))
    fx_rate: float = Field(default=1.0, gt=0)

    is_exchange: bool
    is_early_redemption: bool


    # Notatki (z.string().optional().or(z.literal("")))
    notes: Optional[str] = Field(default=None)

    class Config:
        # Pozwala na mapowanie z obiektów ORM (np. SQLAlchemy)
        from_attributes = True