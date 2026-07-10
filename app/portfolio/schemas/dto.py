from pydantic import BaseModel
from typing import List, Union, Any

from app.core.bonds.schemas.dto import DashboardBondResponse, BondData
from app.core.exchange.schemas.dto import DashboardExchangeResponse, ExchangeData

class DashboardMainPageInput(BaseModel):

    bond_response: DashboardBondResponse
    exchange_response: DashboardExchangeResponse

from pydantic import BaseModel, Field


class DashboardSummaryData(BaseModel):
    # 1. Zainwestowany kapitał
    invested_pln: float = Field(description="Całkowity zainwestowany kapitał w PLN")
    invested_pln_detailed: dict[str, float] = Field(
        default_factory=dict, description="Zainwestowany kapitał w rozbiciu"
    )

    # 2. Bieżąca wartość portfela (wycena rynkowa/nominalna)
    current_value_pln: float = Field(description="Bieżąca wartość portfela w PLN")
    current_value_pln_detailed: dict[str, float] = Field(
        default_factory=dict, description="Bieżąca wartość w rozbiciu"
    )

    # 3. NOWE: Bieżąca wartość + wszystkie wypłacone/narosłe odsetki i dywidendy
    current_value_with_interest_pln: float = Field(
        description="Bieżąca wartość portfela powiększona o sumę wszystkich odsetek i dywidend w PLN"
    )
    current_value_with_interest_pln_detailed: dict[str, float] = Field(
        default_factory=dict, description="Bieżąca wartość z odsetkami w rozbiciu"
    )

    # 4. Zysk niezrealizowany (papierowy) + ROI
    unrealized_profit_pln_gross: float = Field(description="Niezrealizowany zysk brutto w PLN")
    unrealized_profit_pln_gross_detailed: dict[str, float] = Field(default_factory=dict)
    
    unrealized_roi_gross: float = Field(description="Niezrealizowany ROI brutto")
    unrealized_roi_gross_detailed: dict[str, float] = Field(default_factory=dict)

    # 5. Zysk zrealizowany + ROI
    realized_profit_pln_gross: float = Field(description="Zrealizowany zysk brutto w PLN")
    realized_profit_pln_gross_detailed: dict[str, float] = Field(default_factory=dict)
    
    realized_roi_gross: float = Field(description="Zrealizowany ROI brutto")
    realized_roi_gross_detailed: dict[str, float] = Field(default_factory=dict)

    # 6. Zysk całkowity (Suma realized + unrealized) + ROI
    total_profit_pln_gross: float = Field(description="Całkowity zysk brutto w PLN")
    total_profit_pln_gross_detailed: dict[str, float] = Field(default_factory=dict)
    
    total_roi_gross: float = Field(description="Całkowity ROI brutto")
    total_roi_gross_detailed: dict[str, float] = Field(default_factory=dict)


class DashboardAllocationChartsData(BaseModel):
    by_type: Any
    by_category2: Any
    by_name: Any
    by_ticker: Any

class DashboardMainTableRowData(BaseModel):
    ticker: str
    name: str
    quantity: float
    current_value_pln: float
    roi_pln: float
    total_profit_gross_pln: float
    total_profit_net_pln: float

class RowDetailsBond(BaseModel):
    data: BondData

class RowDetailsExchange(BaseModel):
    data: ExchangeData

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
