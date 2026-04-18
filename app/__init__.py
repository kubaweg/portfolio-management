from flask import Flask
from flask_sqlalchemy import SQLAlchemy

# Inicjalizacja obiektu bazy danych
db = SQLAlchemy()

def create_app():
    app = Flask(__name__)

    import locale

    @app.template_filter('format_quantity')
    def format_quantity(value):
        if value is None:
            return "0.0000"
        # Formatowanie: tysiące oddzielone spacją, 2 miejsca po przecinku
        return "{:,.4f}".format(value).replace(",", " ")
    
    @app.template_filter('format_fx')
    def format_fx(value):
        if value is None:
            return "0.0000"
        # Formatowanie: tysiące oddzielone spacją, 2 miejsca po przecinku
        return "{:,.4f}".format(value).replace(",", " ")
    
    @app.template_filter('format_pln')
    def format_pln(value):
        if value is None:
            return "0.00"
        # Formatowanie: tysiące oddzielone spacją, 2 miejsca po przecinku
        return "{:,.2f}".format(value).replace(",", " ")
    
    @app.template_filter('format_pct')
    def format_pct(value):
        if value is None:
            return "0.000%"
        # Formatowanie: tysiące oddzielone spacją, 2 miejsca po przecinku
        return "{:,.2%}".format(value).replace(",", " ")
    
    # Konfiguracja bazy danych SQLite (plik portfolio.db powstanie w głównym folderze)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///portfolio_new.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    db.init_app(app)

    with app.app_context():

        # Tutaj importujemy blueprinty
        from app.dashboard import dashboard_bp
        from app.analysis import analysis_bp
        from app.portfolio import portfolio_bp
        from app.assets import add_asset_bp
        from app.transactions import add_transaction_bp, list_transactions_bp, delete_transaction_bp

        app.register_blueprint(dashboard_bp, url_prefix='/dashboard')
        app.register_blueprint(analysis_bp, url_prefix='/analysis')
        app.register_blueprint(portfolio_bp, url_prefix='/portfolio')
        app.register_blueprint(add_asset_bp, url_prefix='/add_asset')
        app.register_blueprint(add_transaction_bp, url_prefix='/add_transaction')
        app.register_blueprint(list_transactions_bp, url_prefix='/list_transactions')
        app.register_blueprint(delete_transaction_bp, url_prefix='/delete_transaction')
    
    return app