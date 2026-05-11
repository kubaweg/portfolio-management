from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Podmień na swój adres bazy (np. PostgreSQL lub SQLite)
# Skoro baza już istnieje, FastAPI po prostu się do niej podłączy.
SQLALCHEMY_DATABASE_URL = 'sqlite:///instance/portfolio_new.db'

# Tworzymy silnik bazy danych
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Tworzymy fabrykę sesji (będzie używana przy każdym żądaniu do API)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# To jest odpowiednik Twojego `db.Model` z Flask-SQLAlchemy.
# Po tej klasie będą dziedziczyć wszystkie Twoje modele.
Base = declarative_base()

# Funkcja pomocnicza (Dependency), która zarządza życiem sesji.
# Otwiera połączenie, gdy przychodzi zapytanie, i zamyka, gdy się kończy.
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

###########################################################################

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

# (Opcjonalnie) Importujemy modele i routery, które stworzysz później
# import models
from app.portfolio.routes import dashboard_router
from app.analysis.routes import ticker_history_router
from app.assets.routes import enums_router

# Inicjalizacja aplikacji FastAPI
app = FastAPI(
    title="Portfolio Monitor API",
    description="Backend aplikacji do monitorowania inwestycji",
    version="1.0.0"
)

# Konfiguracja CORS - pozwala frontendowi (Next.js na porcie 3000) na odpytywanie API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], # Adres Twojego frontendu
    allow_credentials=True,
    allow_methods=["*"], # Zezwala na GET, POST, PUT, DELETE itd.
    allow_headers=["*"],
)

# Testowy endpoint, wstrzykujący sesję bazy danych (Depends(get_db))
@app.get("/api/health")
def health_check(db: Session = Depends(get_db)):
    # Możesz tu np. wykonać szybkie zapytanie "SELECT 1", 
    # aby sprawdzić czy baza odpowiada, ale na razie zwrócimy prosty status.
    return {"status": "ok", "message": "API i baza danych są gotowe!"}

# Tutaj w przyszłości podepniesz swoje endpointy, np.:
app.include_router(dashboard_router, prefix="/api")
app.include_router(ticker_history_router, prefix="/api")
app.include_router(enums_router, prefix="/api")