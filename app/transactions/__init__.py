# app/dashboard/__init__.py
from flask import Blueprint
add_transaction_bp = Blueprint('add_transaction', __name__)
list_transactions_bp = Blueprint('list_transactions', __name__)
delete_transaction_bp = Blueprint('delete_transaction', __name__)

from . import routes  # Importujemy trasy na końcu, żeby uniknąć circular imports