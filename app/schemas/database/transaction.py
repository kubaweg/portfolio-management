from sqlalchemy import Column, Integer, Numeric, String, Enum, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from app import Base # Importujemy naszą bazę

from ..domain.transactions import TransactionType

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True)

    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=False)
    asset = relationship("Asset", back_populates="transactions")

    type = Column(Enum(TransactionType), nullable=False)

    timestamp = Column(DateTime, nullable=False, index=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())

    quantity = Column(Numeric(18, 8))
    price = Column(Numeric(18, 8))

    fx_rate = Column(Numeric(18, 8))

    notes = Column(String)
    
    def __init__(self, **kwargs):
        super(Transaction, self).__init__(**kwargs)
