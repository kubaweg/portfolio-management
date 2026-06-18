from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import get_db

from app.schemas.database.macroeconomics import (
    Inflation, InterestRate, 
    InflationData, InflationDataPeriod,
    InterestRateData, InterestRateDataPeriod
)

get_macroeconomic_data_router = APIRouter()

@get_macroeconomic_data_router.get('/macroeconomics/cpi', response_model=InflationData)
def load_cpi(db: Session = Depends(get_db)):

    cpi_data = db.query(Inflation).all()
    cpi_data_model = InflationData(data=[])

    for el in cpi_data:
        cpi_data_model.data.append(InflationDataPeriod(month=el.month, value=el.value))

    return cpi_data_model

@get_macroeconomic_data_router.get('/macroeconomics/ref', response_model=InterestRateData)
def load_ref(db: Session = Depends(get_db)):

    ref_data = db.query(InterestRate).all()
    ref_data_model = InterestRateData(data=[])

    for el in ref_data:
        ref_data_model.data.append(InterestRateDataPeriod(effective_date=el.effective_date, value=el.value))

    return ref_data_model