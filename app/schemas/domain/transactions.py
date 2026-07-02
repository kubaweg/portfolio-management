from datetime import datetime
from enum import Enum
from typing import Any, Dict, Literal, Optional, Union
from pydantic import BaseModel, Field, model_validator
from typing_extensions import Annotated

class TransactionType(str, Enum):
    BUY = "BUY"
    SELL = "SELL"
    DEPOSIT = "DEPOSIT"
    WITHDRAWAL = "WITHDRAWAL"
    DIVIDEND = "DIVIDEND"
    FEE = "FEE"
    TAX = "TAX"


class BaseTransaction(BaseModel):
    """
    Klasa bazowa dla wszystkich transakcji.
    """
    timestamp: datetime = Field(
        ..., 
        description="Data i godzina zawarcia transakcji w strefie czasowej UTC"
    )
    value_net: float = Field(
        ..., 
        description="Absolutny, ostateczny wpływ gotówkowy na saldo portfela. Zawsze wartość dodatnia."
    )
    fee: float = Field(
        default=0.0, 
        description="Opłaty i prowizje transakcyjne pobrane przez brokera. Domyślnie 0.0."
    )
    tax: float = Field(
        default=0.0, 
        description="Podatek potrącony przy transakcji (np. Belki lub u źródła). Domyślnie 0.0."
    )
    notes: Optional[str] = Field(
        default=None, 
        description="Opcjonalne uwagi, notatki lub komentarz użytkownika do transakcji"
    )
    metadata_json: Optional[Dict[str, Any]] = Field(
        default=None, 
        description="Dowolny słownik metadanych (np. surowy payload z API brokera, ID paczki importowej)"
    )

    @model_validator(mode="after")
    def validate_base_finance_constraints(self) -> "BaseTransaction":
        """Wspólna walidacja biznesowa dla absolutnie każdego typu transakcji."""
        if self.value_net <= 0.0:
            raise ValueError("Wartość transakcji (value_net) musi być ściśle większa od zera.")
        if self.fee < 0.0:
            raise ValueError("Prowizja (fee) nie może być wartością ujemną.")
        if self.tax < 0.0:
            raise ValueError("Podatek (tax) nie może być wartością ujemną.")
        return self


class BuyTransaction(BaseTransaction):
    type: Literal[TransactionType.BUY] = TransactionType.BUY
    ticker: str = Field(
        ..., 
        min_length=1, 
        max_length=50, 
        description="Ticker zakupionego aktywa"
    )
    quantity: float = Field(
        ..., 
        description="Liczba zakupionych jednostek instrumentu"
    )
    price: float = Field(
        ..., 
        description="Cena zakupu za pojedynczą jednostkę aktywa"
    )
    fx_rate: float = Field(
        default=1.0, 
        description="Kurs wymiany walutowej, jeśli zakup nastąpił w innej walucie niż bazowa portfela"
    )
    is_exchange: bool = Field(
        default=False, 
        description="Flaga oznaczająca, czy transakcja wiąże się z bezpośrednią wymianą walut u brokera"
    )

    @model_validator(mode="after")
    def validate_buy_metrics(self) -> "BuyTransaction":
        if self.quantity <= 0.0:
            raise ValueError("Ilość (quantity) przy zakupie musi być większa od zera.")
        if self.price <= 0.0:
            raise ValueError("Cena (price) przy zakupie musi być większa od zera.")
        return self


class SellTransaction(BaseTransaction):
    type: Literal[TransactionType.SELL] = TransactionType.SELL
    ticker: str = Field(
        ..., 
        min_length=1, 
        max_length=50, 
        description="Ticker sprzedawanego / umarzanego aktywa"
    )
    quantity: float = Field(
        ..., 
        description="Liczba sprzedanych jednostek instrumentu"
    )
    price: float = Field(
        ..., 
        description="Cena uzyskana za pojedynczą jednostkę aktywa"
    )
    fx_rate: float = Field(
        default=1.0, 
        description="Kurs wymiany walutowej dla transakcji zagranicznych"
    )
    is_early_redemption: bool = Field(
        default=False, 
        description="Flaga oznaczająca operację przedterminowego wykupu (wyzwala logikę kar w silniku)"
    )

    @model_validator(mode="after")
    def validate_sell_metrics(self) -> "SellTransaction":
        if self.quantity <= 0.0:
            raise ValueError("Ilość (quantity) przy sprzedaży musi być większa od zera.")
        if self.price <= 0.0:
            raise ValueError("Cena (price) przy sprzedaży musi być większa od zera.")
        return self


class DepositTransaction(BaseTransaction):
    type: Literal[TransactionType.DEPOSIT] = TransactionType.DEPOSIT


class WithdrawalTransaction(BaseTransaction):
    type: Literal[TransactionType.WITHDRAWAL] = TransactionType.WITHDRAWAL


class DividendTransaction(BaseTransaction):
    type: Literal[TransactionType.DIVIDEND] = TransactionType.DIVIDEND
    ticker: str = Field(
        ..., 
        min_length=1, 
        max_length=50, 
        description="Ticker aktywa, z którego pochodzi wypłata (dywidenda / odsetki)"
    )


class FeeTransaction(BaseTransaction):
    type: Literal[TransactionType.FEE] = TransactionType.FEE
    ticker: Optional[str] = Field(
        default=None, 
        description="Opcjonalne powiązanie opłaty z konkretnym aktywem"
    )


class TaxTransaction(BaseTransaction):
    type: Literal[TransactionType.TAX] = TransactionType.TAX
    ticker: Optional[str] = Field(
        default=None, 
        description="Opcjonalne powiązanie podatku z konkretnym aktywem"
    )


# Polimorficzny, zunifikowany parser obiektów transakcji
Transaction = Annotated[
    Union[
        BuyTransaction, 
        SellTransaction, 
        DepositTransaction, 
        WithdrawalTransaction, 
        DividendTransaction, 
        FeeTransaction, 
        TaxTransaction
    ],
    Field(discriminator="type")
]

class TickerTransactions(BaseModel):
    ticker: str
    transactions: list[Transaction]
