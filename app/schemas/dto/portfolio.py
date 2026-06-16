from pydantic import BaseModel
from typing import List, Union, Any

from app.core.bonds.schemas.dto import DashboardBondResponse
from app.core.exchange.schemas.dto import DashboardExchangeResponse

class DashboardMainPageInput(BaseModel):

    bond_response: DashboardBondResponse
    exchange_response: DashboardExchangeResponse

class DashboardSummaryData(BaseModel):
    invested_pln: float
    current_value_pln: float
    profit_loss_pln: float
    roi_pln: float

class DashboardAllocationChartsData(BaseModel):
    by_type: Any
    by_category2: Any
    by_name: Any
    by_ticker: Any

class DashboardMainTableRowData(BaseModel):
    ticker: str
    name: str
    quantity: str
    current_value_pln: float
    roi_pln: float
    total_profit_gross_pln: float


class RowDetailsBond(BaseModel):
    data: Any

class RowDetailsExchange(BaseModel):
    data: Any

class DashboardMainTableRowDetailsData(BaseModel):
    type: str # informacja czy pokazujemy exchange czy bond
    details: Union[RowDetailsBond, RowDetailsExchange]

#####################################################

class DashboardMainTableData(BaseModel):
    data: List[DashboardMainTableRowData]

class DashboardMainTableDetailsData(BaseModel):
    data: List[DashboardMainTableRowDetailsData]

#####################################################

class DashboardMainPageOutput(BaseModel):

    summary: DashboardSummaryData
    charts: DashboardAllocationChartsData
    main_table: DashboardMainTableData
    details: DashboardMainTableDetailsData
