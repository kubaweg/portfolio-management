from flask import render_template, request, redirect, url_for
from datetime import datetime
import pytz
import yfinance as yf
from pyxirr import xirr

from app import db
from app.models import Asset, Transaction

# Importujemy 'current_app', aby mieć dostęp do instancji Flaska
from flask import current_app as app


@app.route('/')
def dashboard():
    assets = Asset.query.all()
    portfolio_data = []
    
    total_invested_pln = 0
    total_current_value_pln = 0
    total_cash_interest_pln = 0 
    
    warsaw_tz = pytz.timezone('Europe/Warsaw')
    last_refresh = datetime.now(warsaw_tz).strftime('%Y-%m-%d %H:%M:%S')
    
    # Cache dla kursów walut
    current_fx_rates = {'PLN': 1.0}
    CONVERSION_FEE = 0.005 # 0.5% prowizji na kursie przy wyjściu

    for asset in assets:
        transactions = Transaction.query.filter_by(asset_id=asset.id).all()
        
        total_qty = 0
        total_cost_pln = 0
        total_cost_currency = 0
        accrued_capitalization_pln = 0 
        paid_interest_pln = 0          
        
        for t in transactions:
            if t.transaction_type == 'KUPNO':
                total_qty += t.quantity
                total_cost_currency += (t.quantity * t.price_per_unit)
                total_cost_pln += (t.quantity * t.price_per_unit * t.exchange_rate)
            elif t.transaction_type == 'SPRZEDAZ':
                if total_qty > 0:
                    avg_c_curr = total_cost_currency / total_qty
                    avg_c_pln = total_cost_pln / total_qty
                    total_qty -= t.quantity
                    total_cost_currency -= t.quantity * avg_c_curr
                    total_cost_pln -= t.quantity * avg_c_pln
            elif t.transaction_type == 'KAPITALIZACJA':
                accrued_capitalization_pln += (t.quantity * t.price_per_unit * t.exchange_rate)
            elif t.transaction_type == 'ODSETKI':
                paid_interest_pln += (t.quantity * t.price_per_unit * t.exchange_rate)

        # Pobieranie danych rynkowych
        current_price = 0
        
        if total_qty > 0 or accrued_capitalization_pln > 0:
            if asset.asset_type == 'Obligacja':
                current_price = 100.0 # Nominał obligacji skarbowych
            else:
                try:
                    ticker_yf = yf.Ticker(asset.ticker)
                    current_price = ticker_yf.fast_info['lastPrice']
                except:
                    current_price = (total_cost_currency / total_qty) if total_qty > 0 else 0

            # Pobieranie kursu waluty jeśli potrzeba
            if asset.currency not in current_fx_rates:
                try:
                    fx_yf = yf.Ticker(f"{asset.currency}PLN=X")
                    current_fx_rates[asset.currency] = fx_yf.fast_info['lastPrice']
                except:
                    current_fx_rates[asset.currency] = 1.0
            
            current_rate = current_fx_rates[asset.currency]
            # Efektywny kurs po uwzględnieniu 0.5% spreadu
            effective_rate = current_rate * (1 - CONVERSION_FEE) if asset.currency != 'PLN' else 1.0

            # Obliczenia wartości
            market_value_pln = (total_qty * current_price * effective_rate) + accrued_capitalization_pln
            profit_loss_pln = (market_value_pln + paid_interest_pln) - total_cost_pln
            roi_percent = (profit_loss_pln / total_cost_pln) if total_cost_pln > 0 else 0

            cash_flows_amounts = []
            cash_flows_dates = []

            # 1. Budujemy listę przepływów
            for t in transactions:
                # Wartość transakcji w PLN
                val_pln = t.quantity * t.price_per_unit * t.exchange_rate
                
                if t.transaction_type == 'KUPNO':
                    # Pieniądze wychodzą z portfela = minus
                    cash_flows_amounts.append(-val_pln)
                    cash_flows_dates.append(t.date)
                elif t.transaction_type == 'ODSETKI':
                    # Gotówka wypłacona do ręki = plus
                    cash_flows_amounts.append(val_pln)
                    cash_flows_dates.append(t.date)
                # KAPITALIZACJI nie dodajemy - ona zwiększa market_value_pln, 
                # który dodamy na samym końcu jako "wyjście" z inwestycji.

            # 2. Dodajemy stan obecny jako "wirtualną sprzedaż dzisiaj"
            if total_qty > 0:
                cash_flows_amounts.append(market_value_pln)
                cash_flows_dates.append(datetime.now())

            # 3. Obliczamy XIRR
            annualized_roi = 0
            if len(cash_flows_amounts) >= 2:
                try:
                    # pyxirr.xirr przyjmuje dwa parametry: listę dat i listę kwot
                    annualized_roi = xirr(cash_flows_dates, cash_flows_amounts)
                    
                    # Zabezpieczenie przed błędami konwergencji lub dziwnymi wynikami
                    if annualized_roi is None or abs(annualized_roi) > 100:
                        annualized_roi = 0
                except Exception as e:
                    print(f"Błąd XIRR dla {asset.ticker}: {e}")
                    annualized_roi = 0

            portfolio_data.append({
                'asset': asset,
                'quantity': total_qty,
                'avg_price_currency': (total_cost_currency / total_qty) if total_qty > 0 else 0,
                'avg_price_pln': (total_cost_pln / total_qty) if total_qty > 0 else 0,
                'current_price': current_price,
                'current_value_pln': market_value_pln,
                'profit_loss_pln': profit_loss_pln,
                'fx_rate': current_rate,  # <--- DODAJEMY TĘ LINIĘ (surowy kurs rynkowy)
                'fx_effective_rate': effective_rate,
                'roi_percent': roi_percent*100,
                'annualized_roi': annualized_roi*100, # <--- NOWE POLE
                'transactions': transactions
            })
            
            total_invested_pln += total_cost_pln
            total_current_value_pln += market_value_pln
            total_cash_interest_pln += paid_interest_pln

    total_profit_pln = (total_current_value_pln + total_cash_interest_pln) - total_invested_pln
    total_roi = (total_profit_pln / total_invested_pln * 100) if total_invested_pln > 0 else 0

    return render_template(
        'dashboard.html', 
        portfolio=portfolio_data, 
        total_invested=total_invested_pln,
        total_current=total_current_value_pln,
        total_cash_interest=total_cash_interest_pln,
        total_profit=total_profit_pln,
        total_roi=total_roi
    )


@app.route('/add_transaction', methods=['GET', 'POST'])
def add_transaction():
    assets = Asset.query.all()
    if request.method == 'POST':
        asset_id = request.form.get('asset_id')
        t_type = request.form.get('type')
        quantity = float(request.form.get('quantity'))
        price = float(request.form.get('price'))
        ex_rate = float(request.form.get('exchange_rate'))
        
        # Pobieramy datę i godzinę z pola 'datetime-local'
        date_str = request.form.get('date') # Format: YYYY-MM-DDTHH:MM
        
        # Obsługa strefy czasowej Warszawy
        warsaw_tz = pytz.timezone('Europe/Warsaw')
        naive_dt = datetime.strptime(date_str, '%Y-%m-%dT%H:%M')
        localized_dt = warsaw_tz.localize(naive_dt)

        new_trans = Transaction(
            asset_id=asset_id,
            transaction_type=t_type,
            quantity=quantity,
            price_per_unit=price,
            exchange_rate=ex_rate,
            date=localized_dt
        )
        
        db.session.add(new_trans)
        db.session.commit()
        return redirect(url_for('dashboard'))

    return render_template('add_transaction.html', assets=assets)


@app.route('/transactions')
def list_transactions():
    # Pobieramy wszystkie transakcje, sortując od najnowszej daty
    transactions = Transaction.query.order_by(Transaction.date.desc()).all()
    return render_template('list_transactions.html', transactions=transactions)


@app.route('/delete_transaction/<int:id>', methods=['POST'])
def delete_transaction(id):
    transaction = Transaction.query.get_or_404(id)
    try:
        db.session.delete(transaction)
        db.session.commit()
    except Exception as e:
        return f"Błąd podczas usuwania: {e}"
    
    return redirect(url_for('list_transactions'))


@app.route('/add_asset', methods=['GET', 'POST'])
def add_asset():
    if request.method == 'POST':
        ticker = request.form.get('ticker').upper().strip()
        name = request.form.get('name').strip()
        asset_type = request.form.get('asset_type')
        currency = request.form.get('currency').upper().strip()

        # Sprawdzamy, czy ticker już istnieje
        existing = Asset.query.filter_by(ticker=ticker).first()
        if existing:
            return "Błąd: Aktywo z tym tickerem już istnieje w bazie!"

        new_asset = Asset(
            ticker=ticker,
            name=name,
            asset_type=asset_type,
            currency=currency
        )
        
        try:
            db.session.add(new_asset)
            db.session.commit()
            return redirect(url_for('dashboard'))
        except Exception as e:
            return f"Wystąpił błąd podczas zapisywania: {e}"

    return render_template('add_asset.html')