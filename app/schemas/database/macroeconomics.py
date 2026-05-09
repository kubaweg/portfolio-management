from sqlalchemy import Column, Integer, Numeric, String, Date, DateTime, func
from sqlalchemy.orm import relationship

from app import Base

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