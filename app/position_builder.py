from typing import List
from .schemas.domain.transactions import (
    TickerTransactions,
    BaseTransaction,
    BuyTransaction,
    SellTransaction,
    InterestTransaction,
    CapitalizationTransaction,
)
from .schemas.domain.positions import OpenPosition, ClosedPosition


class PositionBuilderResult:
    def __init__(
        self,
        open_positions: List[OpenPosition],
        closed_positions: List[ClosedPosition],
        realized_profit: float,
        unrealized_profit: float,
    ):
        self.open_positions = open_positions
        self.closed_positions = closed_positions
        self.realized_profit = realized_profit
        self.unrealized_profit = unrealized_profit


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

        buy_lots: List[dict] = []  # każdy lot: {"qty": float, "price": float}
        open_positions: List[OpenPosition] = []
        closed_positions: List[ClosedPosition] = []

        realized_profit = 0.0
        unrealized_profit = 0.0

        for tx in tt.transactions:
            if isinstance(tx, BuyTransaction):
                self._handle_buy(tx, buy_lots)

            elif isinstance(tx, CapitalizationTransaction):
                self._handle_capitalization(tx, buy_lots)

            elif isinstance(tx, SellTransaction):
                rp, closed = self._handle_sell(tx, buy_lots)
                realized_profit += rp
                closed_positions.extend(closed)

            elif isinstance(tx, InterestTransaction):
                # Odsetki traktujemy jako zysk zrealizowany (cashflow)
                realized_profit += tx.amount

        # Po przejściu wszystkich transakcji budujemy pozycje otwarte
        total_unrealized, open_positions = self._build_open_positions(
            tt.ticker, buy_lots, current_price
        )
        unrealized_profit += total_unrealized

        return PositionBuilderResult(
            open_positions=open_positions,
            closed_positions=closed_positions,
            realized_profit=realized_profit,
            unrealized_profit=unrealized_profit,
        )

    # --- Metody pomocnicze ---

    def _handle_buy(self, tx: BuyTransaction, buy_lots: List[dict]) -> None:
        buy_lots.append(
            {
                "qty": tx.quantity,
                "price": tx.price,  # cena w walucie instrumentu,
                "fx_rate": tx.fx_rate,      # historyczny kurs walutowy
            }
        )

    def _handle_capitalization(self, tx: CapitalizationTransaction, buy_lots: List[dict]) -> None:
        # Kapitalizacja to de facto "dokupienie" jednostek po danej cenie,
        # ale bez zewnętrznego cashflow (zysk jest wirtualny do momentu sprzedaży).
        buy_lots.append(
            {
                "qty": tx.quantity,
                "price": tx.price,
                "fx_rate": tx.fx_rate,
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
        remaining_qty = tx.quantity
        realized_profit = 0.0
        closed_positions: List[ClosedPosition] = []

        while remaining_qty > 0 and buy_lots:
            lot = buy_lots[0]
            lot_qty = lot["qty"]
            lot_price = lot["price"]

            matched_qty = min(remaining_qty, lot_qty)

            cost = matched_qty * lot_price
            proceeds = matched_qty * tx.price
            profit = proceeds - cost

            realized_profit += profit

            closed_positions.append(
                ClosedPosition(
                    ticker=tx.ticker,
                    quantity=matched_qty,
                    cost=cost,
                    proceeds=proceeds,
                    realized_profit=profit,
                )
            )

            lot["qty"] -= matched_qty
            remaining_qty -= matched_qty

            if lot["qty"] <= 0:
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
            qty = lot["qty"]
            cost = qty * lot["price"]
            current_value = qty * current_price
            unrealized = current_value - cost
            total_unrealized += unrealized

            open_positions.append(
                OpenPosition(
                    ticker=ticker,
                    quantity=qty,
                    cost=cost,
                    fx_rate=lot['fx_rate'],
                    current_value=current_value,
                    unrealized_profit=unrealized,
                )
            )

        return total_unrealized, open_positions
