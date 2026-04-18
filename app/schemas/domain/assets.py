import enum

class AssetType(str, enum.Enum):
    ETF = "ETF"
    ETC = "ETC"
    BOND = "Obligacja"
    EQUITY = "Akcja"
    CRYPTO = "Kryptowaluta"

class Category1(str, enum.Enum):
    EQUITY = "Akcje"
    BOND = "Obligacje"
    COMMODITY = "Surowce/towary"
    CRYPTO = "Kryptowaluty"
    MIXED = "Mix"


class Category2(str, enum.Enum):
    EQUITY_GLOBAL = "Akcje - cały świat"
    EQUITY_REGION = "Akcje - region"
    EQUITY_COUNTRY = "Akcje - kraj"
    EQUITY_FACTOR = "Akcje - faktor"
    EQUITY_SECTOR = "Akcje - sektor"

    BOND_RETAIL_FIXED_RATE = "Obligacje skarbowe o stopie stałej"
    BOND_RETAIL_INFLATION_LINKED = "Obligacje skarbowe indeksowane inflacją"
    BOND_RETAIL_INTEREST_LINKED = "Obligacje skarbowe indeksowane stopą referencyjną"

    BOND_CORP_FIXED = "Obligacje korporacyjne o stopie stałej"
    BOND_CORP_FLOATING = "Obligacje korporacyjne zmiennoprocentowe"

    COMMODITY_GOLD = "Surowce - złoto"
    COMMODITY_SILVER = "Surowce - srebro"
    COMMODITY_BROAD = "Surowce - inne"

    CRYPTO = "Kryptowaluty"
    
    MIXED = "Mix"

# Naprawione: Tylko lokalizacje geograficzne
class GeoRegion(str, enum.Enum):
    GLOBAL = "Cały świat"
    EUROPE = "Europa"
    EUROPE_WEST = "Europa Zachodnia"
    EUROPE_EAST = "Europa Wschodnia"
    ASIA_PACIFIC = "Azja/Pacyfik"
    NORTH_AMERICA = "Ameryka Północna"
    SOUTH_AMERICA = "Ameryka Południowa"
    AFRICA = "Afryka"
    AUSTRALIA = "Australia"

class GeoCountry(str, enum.Enum):
    POLAND = "Polska"
    USA = "USA"
    GERMANY = "Niemcy"
    UK = "Wielka Brytania"
    FRANCE = "Francja"
    JAPAN = "Japonia"
    CHINA = "Chiny"

# Naprawione: Tylko status rozwoju rynku
class MarketType(str, enum.Enum):
    DEVELOPED = "Rynek rozwinięty"
    EMERGING = "Rynek wschodzący"
    FRONTIER = "Rynek nierozwinięty"
    MIXED = "Mix"

class DistributionPolicy(str, enum.Enum):
    ACCUMULATING = "Akumulujący"
    DISTRIBUTING = "Dystrybuujący"

class ReplicationMethod(str, enum.Enum):
    PHYSICAL = "Fizyczna"
    SYNTHETIC = "Syntetyczna"

class CouponFrequency(str, enum.Enum):
    MONTHLY = "Co miesiąc"
    QUARTERLY = "Co kwartał"
    SEMI_ANNUALLY = "Co pół roku"
    YEARLY = "Co roku"
    AT_THE_END = "Przy wykupie"

class InterestHandling(str, enum.Enum):
    PAYOUT = "Wypłata"
    CAPITALIZATION = "Kapitalizacja"

class RetailBondBenchmark(str, enum.Enum):
    CPI = "Inflacja CPI wg GUS"
    NBP = "Stopa referencyjna NBP"