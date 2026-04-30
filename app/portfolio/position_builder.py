from typing import List
from ..schemas.domain.transactions import (
    TickerTransactions,
    BuyTransaction,
    SellTransaction,
    InterestTransaction,
    CapitalizationTransaction,
)
from ..schemas.domain.positions import OpenPosition, ClosedPosition
# from ..schemas.domain.types import MoneyAmount, AssetQuantity, FXRate


class PositionBuilderResult:
    def __init__(
        self,
        open_positions: List[OpenPosition],
        closed_positions: List[ClosedPosition],
        realized_profit: float,
        unrealized_profit: float,
        interest_profit: float = 0.0

    ):
        self.open_positions = open_positions
        self.closed_positions = closed_positions
        self.realized_profit = realized_profit
        self.unrealized_profit = unrealized_profit
        self.interest_profit = interest_profit


class PositionBuilder:
    """
    Buduje pozycje otwarte/zamknięte dla jednego tickera na podstawie
    listy transakcji domenowych (FIFO).
    """

    def build(self, tt: TickerTransactions, current_price: float) -> PositionBuilderResult:
        """
        tt: TickerTransactions (posortowane po dacie)
        current_price: bieżąca cena instrumentu (w walucie instrumentu)
        """

        buy_lots: List[dict] = []  # każdy lot: {"qty": AssetQuantity, "price": MoneyAmount}
        open_positions: List[OpenPosition] = []
        closed_positions: List[ClosedPosition] = []

        realized_profit = 0.0
        unrealized_profit = 0.0
        interest_profit = 0.0

        for tx in tt.transactions:
            if isinstance(tx, BuyTransaction):
                self._handle_buy(tx, buy_lots)

            elif isinstance(tx, SellTransaction):
                rp, closed = self._handle_sell(tx, buy_lots)
                realized_profit += rp
                closed_positions.extend(closed)

            elif isinstance(tx, InterestTransaction):
                # Odsetki traktujemy jako zysk zrealizowany (cashflow)
                interest_profit += tx.value

        # Po przejściu wszystkich transakcji budujemy pozycje otwarte
        total_unrealized, open_positions = self._build_open_positions(
            tt.ticker, buy_lots, current_price
        )
        unrealized_profit += (total_unrealized + interest_profit)

        return PositionBuilderResult(
            open_positions=open_positions,
            closed_positions=closed_positions,
            realized_profit=realized_profit,
            unrealized_profit=unrealized_profit,
            interest_profit=interest_profit
        )

    # --- Metody pomocnicze ---

    def _handle_buy(self, tx: BuyTransaction, buy_lots: List[dict]) -> None:
        buy_lots.append(
            {
                "quantity": tx.quantity,
                "value_buy": tx.price,  # cena w walucie instrumentu,
                "fx_buy": tx.fx_rate,      # historyczny kurs walutowy
            }
        )
        

    def _handle_sell(
        self, tx: SellTransaction, buy_lots: List[dict]
    ) -> tuple[float, List[ClosedPosition]]:
        """
        FIFO: konsumujemy kolejne loty kupna.
        Zwracamy:
        - realized_profit z tej sprzedaży
        - listę ClosedPosition (może być kilka, jeśli sprzedaż konsumuje kilka lotów)
        """

        buy_lots.sort(key=lambda x: x["value_buy"])
        
        remaining_qty = tx.quantity
        realized_profit = 0.0
        closed_positions: List[ClosedPosition] = []

        while remaining_qty > 0 and buy_lots:
            lot = buy_lots[0]
            lot_qty = lot["quantity"]
            lot_price = lot["value_buy"]
            lot_fx_rate = lot["fx_buy"]

            matched_qty = min(remaining_qty, lot_qty)

            cost = matched_qty * lot_price
            proceeds = matched_qty * tx.price
            profit = proceeds - cost

            realized_profit += profit

            closed_positions.append(
                ClosedPosition(
                    ticker=tx.ticker,
                    quantity=matched_qty,
                    value_buy=cost,
                    value_sell=proceeds,
                    fx_buy=lot_fx_rate,
                    fx_sell=tx.fx_rate,
                    realized_profit=profit, # w walucie obcej
                    realized_profit_pln=0.0 # na razie
                )
            )

            lot["quantity"] -= matched_qty
            remaining_qty -= matched_qty

            if lot["quantity"] <= 0:
                buy_lots.pop(0)

        # Jeśli remaining_qty > 0 i nie ma lotów → dane niespójne (sprzedaż > kupno)
        # Możemy tu dodać walidację / wyjątek, ale na razie zostawiamy.

        return realized_profit, closed_positions

    def _build_open_positions(
        self, ticker: str, buy_lots: List[dict], current_price: float
    ) -> tuple[float, List[OpenPosition]]:
        """
        Z pozostałych lotów budujemy pozycje otwarte i liczymy zysk wirtualny.
        """
        open_positions: List[OpenPosition] = []
        total_unrealized = 0.0

        for lot in buy_lots:
            qty = lot["quantity"]
            cost = qty * lot["value_buy"]
            current_value = qty * current_price
            unrealized = current_value - cost
            total_unrealized += unrealized

            open_positions.append(
                OpenPosition(
                    ticker=ticker,
                    quantity=qty,
                    value_buy=cost,
                    fx_buy=lot['fx_buy'],
                    current_value=current_value,
                    unrealized_profit=unrealized, # w walucie instrumentu
                    unrealized_profit_pln=0.0 # na razie
                )
            )

        return total_unrealized, open_positions
