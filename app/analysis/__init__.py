# app/analysis/__init__.py
from flask import Blueprint
analysis_bp = Blueprint('analysis', __name__)

from . import routes  # Importujemy trasy na końcu, żeby uniknąć circular imports