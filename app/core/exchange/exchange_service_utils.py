from typing import List
from app.core.exchange.schemas.dto import (
    PositionBuilderResult
)
from app.schemas.domain.transactions import (
    TickerTransactions,
    BuyTransaction,
    SellTransaction
)
from app.core.exchange.annualized_roi import calculate_annualized_roi
from app.schemas.domain.positions import OpenPosition, ClosedPosition


class PositionBuilder:
    """
    Buduje pozycje otwarte/zamknięte dla jednego tickera na podstawie
    listy transakcji domenowych.
    """

    def build(self, tt: TickerTransactions, current_price: float, fx_current: float) -> PositionBuilderResult:
        """
        tt: TickerTransactions (posortowane po dacie)
        current_price: bieżąca cena instrumentu (w walucie instrumentu)
        """

        buy_lots: List[dict] = []
        open_positions: List[OpenPosition] = []
        closed_positions: List[ClosedPosition] = []

        for tx in tt.transactions:
            if isinstance(tx, BuyTransaction):
                self._handle_buy(tx, buy_lots)

            elif isinstance(tx, SellTransaction):
                closed = self._build_closed_positions(tx, buy_lots)
                closed_positions.extend(closed)


        # Po przejściu wszystkich transakcji budujemy pozycje otwarte
        open_positions = self._build_open_positions(
            tt.ticker, buy_lots, current_price, fx_current
        )

        return PositionBuilderResult(
            open_positions=open_positions,
            closed_positions=closed_positions
        )

    # --- Metody pomocnicze ---

    def _handle_buy(self, tx: BuyTransaction, buy_lots: List[dict]) -> None:
        buy_lots.append(
            {
                "quantity": tx.quantity,
                "date_buy": tx.timestamp.date(),
                "price_buy": tx.price,  # cena w walucie instrumentu,
                "fx_buy": tx.fx_rate,   # historyczny kurs walutowy
            }
        )
        

    def _build_closed_positions(
        self, tx: SellTransaction, buy_lots: List[dict]
    ) -> List[ClosedPosition]:
        """
        FIFO: konsumujemy kolejne loty kupna.
        Zwracamy:
        - realized_profit z tej sprzedaży
        - listę ClosedPosition (może być kilka, jeśli sprzedaż konsumuje kilka lotów)
        """

        buy_lots.sort(key=lambda x: x["price_buy"]*x["fx_buy"])
        
        remaining_qty = tx.quantity

        closed_positions: List[ClosedPosition] = []

        while remaining_qty > 0 and buy_lots:
            lot = buy_lots[0]
            lot_qty = lot["quantity"]
            lot_price = lot["price_buy"]
            lot_fx_rate = lot["fx_buy"]
            lot_date_buy = lot["date_buy"]

            matched_qty = min(remaining_qty, lot_qty)

            value_buy = round(matched_qty * lot_price, 2)
            value_sell = round(matched_qty * tx.price, 2)

            realized_profit = round(value_sell - value_buy, 2)
            realized_profit_pln = round(value_sell * tx.fx_rate - value_buy * lot_fx_rate, 2)

            roi_realized = realized_profit / value_buy if value_buy > 0 else 0.0
            roi_realized_pln = realized_profit_pln / (value_buy * lot_fx_rate) if value_buy > 0 else 0.0

            if matched_qty > 1e-6:
                cp = ClosedPosition(
                    ticker=tx.ticker,
                    quantity=matched_qty,
                    date_buy=lot_date_buy,
                    date_sell=tx.timestamp.date(),
                    value_buy=value_buy,
                    value_sell=value_sell,
                    fx_buy=lot_fx_rate,
                    fx_sell=tx.fx_rate,
                    fx_percentage_impact=tx.fx_rate/lot_fx_rate - 1,
                    realized_profit=realized_profit,
                    roi_realized=roi_realized,
                    realized_profit_pln=realized_profit_pln,
                    roi_realized_pln=roi_realized_pln
                )

                roi_annualized = calculate_annualized_roi([], [cp])
                cp.roi_realized_pa = roi_annualized.roi_pa
                cp.roi_realized_pa_pln = roi_annualized.roi_pa_pln

                closed_positions.append(cp)


            lot["quantity"] -= matched_qty
            remaining_qty -= matched_qty

            if lot["quantity"] <= 0:
                buy_lots.pop(0)

        # Jeśli remaining_qty > 0 i nie ma lotów → dane niespójne (sprzedaż > kupno)
        # Możemy tu dodać walidację / wyjątek, ale na razie zostawiamy.

        return closed_positions

    def _build_open_positions(
        self, ticker: str, buy_lots: List[dict], current_price: float, fx_current: float
    ) -> List[OpenPosition]:
        """
        Z pozostałych lotów budujemy pozycje otwarte i liczymy zysk wirtualny.
        """
        open_positions: List[OpenPosition] = []

        for lot in buy_lots:
            qty = lot["quantity"]
            fx_buy = lot['fx_buy']

            value_buy = round(qty * lot["price_buy"], 2)
            current_value = round(qty * current_price, 2)

            unrealized_profit = round(current_value - value_buy, 2)
            unrealized_profit_pln = round(current_value * fx_current - value_buy * fx_buy, 2)

            roi_unrealized = unrealized_profit / value_buy if value_buy > 0 else 0.0
            roi_unrealized_pln = unrealized_profit_pln / (value_buy * fx_buy) if value_buy > 0 else 0.0

            if abs(qty) > 1e-6:
                
                op = OpenPosition(
                    ticker=ticker,
                    quantity=qty,
                    date_buy=lot['date_buy'],
                    value_buy=value_buy,
                    current_value=current_value,
                    fx_buy=fx_buy,
                    fx_current=fx_current,
                    fx_percentage_impact=fx_current/fx_buy - 1,
                    unrealized_profit=unrealized_profit,
                    roi_unrealized=roi_unrealized,
                    unrealized_profit_pln=unrealized_profit_pln,
                    roi_unrealized_pln=roi_unrealized_pln
                )

                roi_annualized = calculate_annualized_roi([op], [])
                op.roi_unrealized_pa = roi_annualized.roi_pa
                op.roi_unrealized_pa_pln = roi_annualized.roi_pa_pln

                open_positions.append(op)
                

        return open_positions
