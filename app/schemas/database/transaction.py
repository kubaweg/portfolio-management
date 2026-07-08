from sqlalchemy import Column, Integer, Numeric, Boolean, String, Enum, JSON, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app import Base # Importujemy naszą bazę

from app.schemas.domain.transactions import TransactionType

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, autoincrement=True)

    # Relacja z aktywem (nullable=True dla wpłat i wypłat)
    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=True, index=True)
    asset = relationship("Asset", back_populates="transactions")

    type = Column(Enum(TransactionType), nullable=False, index=True)

    timestamp = Column(DateTime, nullable=False, index=True)

    # Rzeczywisty wpływ na saldo i koszty uboczne z domyślnym zerem
    value_net = Column(Numeric(18, 2), nullable=False)
    fee = Column(Numeric(18, 2), default=0, nullable=False)
    tax = Column(Numeric(18, 2), default=0, nullable=False)

    # Parametry wolumenowe i cenowe
    quantity = Column(Numeric(18, 8), nullable=True)
    price = Column(Numeric(18, 8), nullable=True)
    fx_rate = Column(Numeric(18, 8), nullable=True)

    # Flagi operacyjne
    is_exchange = Column(Boolean, default=False, nullable=False)
    is_early_redemption = Column(Boolean, default=False, nullable=False)

    notes = Column(String, nullable=True)
    metadata_json = Column(JSON, nullable=True)

    created_at = Column(DateTime, nullable=False, server_default=func.now())
    
    def __init__(self, **kwargs):
        super(Transaction, self).__init__(**kwargs)
