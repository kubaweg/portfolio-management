class FXCalculator:
    @staticmethod
    def cost_pln(cost_currency, fx_buy):
        return cost_currency * fx_buy

    @staticmethod
    def value_pln(value_currency, fx_current):
        return value_currency * fx_current

    @staticmethod
    def unrealized_pln(cost_currency, fx_buy, value_currency, fx_current):
        return (value_currency * fx_current) - (cost_currency * fx_buy)

    @staticmethod
    def realized_pln(cost_currency, fx_buy, proceeds_currency, fx_sell):
        return (proceeds_currency * fx_sell) - (cost_currency * fx_buy)
