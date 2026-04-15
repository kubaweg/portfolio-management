from app import create_app, db

app = create_app()

# Tworzenie tabel w bazie danych, jeśli jeszcze nie istnieją
with app.app_context():
    from app.schemas.database.asset import Asset
    from app.schemas.database.transaction import Transaction
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True)