from flask import render_template, request, redirect, url_for, jsonify
from datetime import datetime
import pytz

from app import db
from app.schemas.database.asset import (
    Asset, ETF, ETC, Bond, AssetType, Category1, Category2, 
    GeoRegion, MarketType, DistributionPolicy, ReplicationMethod, 
    CouponFrequency, InterestHandling
)

from . import add_asset_bp

@add_asset_bp.route('/', methods=['GET'])
def add_asset():
    """Renderuje stronę formularza, przekazując słowniki Enum i listę aktywów."""
    # Pobieramy obecne aktywa do tabeli "Zarządzaj / Usuń"
    assets = Asset.query.order_by(Asset.id.desc()).all()

    return render_template(
        'add_asset/add_asset.html',
        assets=assets,
        # Przekazujemy wszystkie Enumy, żeby Jinja wygenerowała opcje (listy stringów)
        AssetType=[e.name for e in AssetType],
        Category1=[e.name for e in Category1],
        Category2=[e.name for e in Category2],
        GeoRegion=[e.name for e in GeoRegion],
        MarketType=[e.name for e in MarketType],
        DistributionPolicy=[e.name for e in DistributionPolicy],
        ReplicationMethod=[e.name for e in ReplicationMethod],
        CouponFrequency=[e.name for e in CouponFrequency],
        InterestHandling=[e.name for e in InterestHandling]
    )

@add_asset_bp.route('/api/add', methods=['POST'])
def api_add_asset():
    """Przyjmuje payload JSON z JS i tworzy odpowiedni obiekt."""
    data = request.get_json()
    
    # Funkcja pomocnicza: puste stringi zamienia na None, żeby baza nie płakała
    def get_val(key):
        val = data.get(key)
        return val if val and str(val).strip() != "" else None

    try:
        asset_type_str = get_val('asset_type')
        if not asset_type_str:
            return jsonify({"status": "error", "message": "Typ aktywa jest wymagany"}), 400

        # --- POLA WSPÓLNE (BASE) ---
        base_kwargs = {
            "ticker": get_val('ticker'),
            "name": get_val('name'),
            "isin": get_val('isin'),
            "category1": get_val('category1'),
            "category2": get_val('category2'),
            "geo_region": get_val('geo_region'),
            "market_type": get_val('market_type'),
            "currency": get_val('currency') or "USD",
            "spread": get_val('spread') or 0.0,
            "active": data.get('active', True),
            "notes": get_val('notes')
        }

        # --- POLA GIEŁDOWE (Mixin) ---
        mixin_kwargs = {
            "issuer": get_val('issuer'),
            "ter": get_val('ter'),
            "listing_venue": get_val('listing_venue'),
            "domicile": get_val('domicile')
        }

        # ROZGAŁĘZIENIE NA PODSTAWIE TYPU
        if asset_type_str == AssetType.ETF.name:
            new_asset = ETF(
                **base_kwargs, **mixin_kwargs,
                benchmark=get_val('benchmark'),
                distribution_policy=get_val('distribution_policy'),
                replication_method=get_val('replication_method')
            )
        
        elif asset_type_str == AssetType.ETC.name:
            new_asset = ETC(
                **base_kwargs, **mixin_kwargs,
                multiplier=get_val('multiplier') or 1.0,
                physical_backing=data.get('physical_backing', True)
            )
        
        elif asset_type_str == AssetType.BOND.name:
            new_asset = Bond(
                **base_kwargs,
                issue_date=get_val('issue_date'),
                maturity_date=get_val('maturity_date'),
                nominal_value=get_val('nominal_value'),
                interest_handling=get_val('interest_handling'),
                coupon_frequency=get_val('coupon_frequency'),
                is_indexed=data.get('is_indexed', False),
                initial_rate=get_val('initial_rate'),
                margin=get_val('margin'),
                inflation_index=get_val('inflation_index'),
                retail_series_code=get_val('retail_series_code'),
                early_redemption_penalty=get_val('early_redemption_penalty'),
                rating=get_val('rating'),
                seniority=get_val('seniority'),
                secured=data.get('secured', True)
            )
        else:
            return jsonify({"status": "error", "message": "Nieznany typ aktywa"}), 400

        db.session.add(new_asset)
        db.session.commit()
        return jsonify({"status": "success", "message": f"Dodano {base_kwargs['ticker']}"}), 201

    except Exception as e:
        db.session.rollback()
        print(f"Błąd DB: {e}")
        return jsonify({"status": "error", "message": f"Błąd bazy danych: {str(e)}"}), 500


@add_asset_bp.route('/api/delete/<int:asset_id>', methods=['DELETE'])
def api_delete_asset(asset_id):
    """Usuwa aktywo po ID."""
    try:
        asset = Asset.query.get(asset_id)
        if not asset:
            return jsonify({"status": "error", "message": "Nie znaleziono aktywa"}), 404
        
        # SQLAlchemy załatwi usunięcie z tabel zależnych (etfs, etcs, bonds) dzięki polimorfizmowi
        db.session.delete(asset)
        db.session.commit()
        return jsonify({"status": "success", "message": "Usunięto pomyślnie"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500