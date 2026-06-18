# app/dashboard/__init__.py
from flask import Blueprint
add_asset_bp = Blueprint('add_asset', __name__)

from . import routes  # Importujemy trasy na końcu, żeby uniknąć circular imports