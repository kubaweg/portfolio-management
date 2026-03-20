from app import create_app, db

app = create_app()

# Tworzenie tabel w bazie danych, jeśli jeszcze nie istnieją
with app.app_context():
    from app.models import Asset, Transaction
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True)