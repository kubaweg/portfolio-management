from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend import get_db
from backend.schemas.dto.add_transaction import AddTransaction
from backend.schemas.database.asset import Asset
from backend.schemas.database.transaction import Transaction
from backend.schemas.domain.transactions import TransactionType

add_transaction_router = APIRouter()
@add_transaction_router.post("/transactions/add")
async def create_transaction(transaction: AddTransaction, db: Session = Depends(get_db)):

    transaction = Transaction(**transaction.model_dump())

    # Tutaj 'asset' jest już konkretnym obiektem, np. ETFAsset
    print(f"Dodaję {transaction.type}: {transaction.timestamp}")

    try:
        db.add(transaction)
        db.commit()
        db.refresh(transaction)
        
        return {"status": "success", "type": transaction.type, "timestamp": transaction.timestamp, "message": "Aktywo dodane!"}
        
    except Exception as e:
        db.rollback()
        # Warto zalogować błąd: print(f"Error: {e}")
        raise HTTPException(status_code=400, detail=f"Błąd zapisu: {str(e)}")
    
list_assets_router = APIRouter()
@list_assets_router.get('/transactions/meta/list_assets')
def list_assets(db: Session = Depends(get_db)):
    assets = db.query(Asset).all()
    return assets

transaction_enums_router = APIRouter()
@transaction_enums_router.get('/transactions/meta/enums')
def get_transactions_metadata():
    # Zwracamy słowniki z wartościami Enum, aby frontend mógł zbudować selecty
    return {
        "transaction_type": [e.value for e in TransactionType],
    }
