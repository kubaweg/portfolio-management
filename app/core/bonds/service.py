from datetime import date
from flask_sqlalchemy import SQLAlchemy
from dateutil.relativedelta import relativedelta
from app.schemas.domain.bonds import BondAsset, BondRateStream, InterestPeriod
from app.schemas.domain.assets import RetailBondBenchmark
from .periods import generate_periods
from .calculator import get_nbp_rate_for_date, get_cpi_for_period

def build_bond_stream(db: SQLAlchemy, bond: BondAsset) -> BondRateStream:
    raw_periods = generate_periods(bond)
    interest_periods = []
    
    today = date.today()
    current_rate = None
    
    for p_num, p_start, p_end in raw_periods:
        is_future = p_start > today
        rate = 0.0
        benchmark_val = 0.0
        
        # 1. Pierwszy okres zazwyczaj ma sztywne oprocentowanie z listu emisyjnego
        if p_num == 1:
            rate = bond.initial_rate
        else:
            # 2. Kolejne okresy wyliczane na bazie odpowiednich wskaźników
            if bond.benchmark == RetailBondBenchmark.NBP:
                # Wymaga dopracowania o logikę dni roboczych, ale tu bierzemy dzień poprzedzający
                fixing_date = p_start - relativedelta(days=1)
                benchmark_val = get_nbp_rate_for_date(db, fixing_date)
                rate = benchmark_val + bond.margin
                
            elif bond.benchmark == RetailBondBenchmark.CPI:
                benchmark_val = get_cpi_for_period(db, p_start)
                # W obligacjach ujemna inflacja z reguły jest traktowana jako 0 (max(0, cpi))
                rate = max(0, benchmark_val) + bond.margin
                
            else:
                rate = bond.initial_rate
                
        # 3. Zbuduj obiekt okresu
        period_obj = InterestPeriod(
            period_number=p_num,
            start_date=p_start,
            end_date=p_end,
            rate=round(rate, 4),
            benchmark_value_used=benchmark_val if p_num > 1 else None,
            is_future=is_future
        )
        interest_periods.append(period_obj)
        
        # 4. Jeśli dziś przypada wewnątrz tego okresu, to jest to bieżąca stopa
        if p_start <= today < p_end:
            current_rate = rate

    return BondRateStream(
        symbol=bond.symbol,
        periods=interest_periods,
        current_rate=current_rate
    )