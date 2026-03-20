from flask import Flask
from flask_sqlalchemy import SQLAlchemy

# Inicjalizacja obiektu bazy danych
db = SQLAlchemy()

def create_app():
    app = Flask(__name__)

    import locale

    @app.template_filter('format_pln')
    def format_pln(value):
        if value is None:
            return "0.00"
        # Formatowanie: tysiące oddzielone spacją, 2 miejsca po przecinku
        return "{:,.2f}".format(value).replace(",", " ")
    
    @app.template_filter('format_pct')
    def format_pln(value):
        if value is None:
            return "0.00%"
        # Formatowanie: tysiące oddzielone spacją, 2 miejsca po przecinku
        return "{:,.2%}".format(value).replace(",", " ")
    
    # Konfiguracja bazy danych SQLite (plik portfolio.db powstanie w głównym folderze)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///portfolio.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    db.init_app(app)
    
    with app.app_context():
        # Tutaj importujemy routes, aby zarejestrować ścieżki
        from . import routes
    
    return app