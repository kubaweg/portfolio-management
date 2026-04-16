# app/portfolio/__init__.py
from flask import Blueprint
portfolio_bp = Blueprint('portfolio', __name__)

from . import routes  # Importujemy trasy na końcu, żeby uniknąć circular imports