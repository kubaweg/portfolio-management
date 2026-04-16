from flask import render_template, request, redirect, url_for
from datetime import datetime
import pytz

from app import db
from app.schemas.database.asset import Asset

from . import add_asset_bp

@add_asset_bp.route('/', methods=['GET', 'POST'])
def add_asset():
    if request.method == 'POST':
        new_asset = Asset(
            ticker=request.form.get('ticker', '').upper().strip(),
            name=request.form.get('name', '').strip(),
            asset_type=request.form.get('asset_type', ''),
            currency=request.form.get('currency', '').upper().strip()
        )
        db.session.add(new_asset)
        db.session.commit()
        return redirect(url_for('dashboard.dashboard'))

    return render_template('add_asset/add_asset.html')