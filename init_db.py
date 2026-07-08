from sqlalchemy import create_engine
from app import Base, SQLALCHEMY_DATABASE_URL # Zmień 'models' na nazwę swojego pliku

# echo=True wydrukuje wygenerowane zapytania SQL w konsoli
engine = create_engine(SQLALCHEMY_DATABASE_URL, echo=True)

def init_database():
    print("Tworzę tabele...")
    # Ta metoda skanuje wszystkie klasy dziedziczące po Base
    # i generuje dla nich polecenia CREATE TABLE
    Base.metadata.create_all(bind=engine)
    print("Gotowe!")

if __name__ == "__main__":
    init_database()