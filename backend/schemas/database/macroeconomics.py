from sqlalchemy import Column, Integer, Numeric, String, Date, DateTime, func
from sqlalchemy.orm import relationship

from app import Base
from pydantic import BaseModel
from datetime import date
from typing import List

# modele na bazie danych
class Inflation(Base):
    __tablename__ = "gus_cpi_rates"

    id = Column(Integer, primary_key=True, index=True)
    month = Column(String(7), unique=True, index=True, nullable=False) # Format: 'YYYY-MM'
    value = Column(Numeric, nullable=False)
    
    created_at = Column(DateTime, server_default=func.now())

class InterestRate(Base):
    __tablename__ = "nbp_interest_rates"

    id = Column(Integer, primary_key=True, index=True)
    effective_date = Column(Date, unique=True, index=True, nullable=False) # Format: YYYY-MM-DD
    value = Column(Numeric, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

# modele Pydantic
class InflationDataPeriod(BaseModel):
    month: str # format 'YYYY-MM'
    value: float

class InflationData(BaseModel):
    data: List[InflationDataPeriod]

class InterestRateDataPeriod(BaseModel):
    effective_date: date
    value: float

class InterestRateData(BaseModel):
    data: List[InterestRateDataPeriod]