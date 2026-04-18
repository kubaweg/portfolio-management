import enum

class AssetType(str, enum.Enum):
    ETF = "ETF"
    ETC = "ETC"
    BOND = "Obligacja"
    EQUITY = "Akcja"

class Category1(str, enum.Enum):
    EQUITY = "Akcje"
    MIXED = "Mix"
    BOND = "Obligacje"
    COMMODITY = "Surowce/towary"
    CASH = "Cash"

class Category2(str, enum.Enum):
    EQUITY_GLOBAL = "Akcje ogólnoświatowe"
    EQUITY_REGION = "Akcje regionalne"
    EQUITY_COUNTRY = "Akcje krajowe"
    EQUITY_FACTOR = "Akcje faktorowe"
    EQUITY_SECTOR = "Akcje sektorowe"
    BOND_RETAIL_FIXED_RATE = "Obligacje skarbowe o stopie stałej"
    BOND_RETAIL_INFLATION_LINKED = "Obligacje skarbowe indeksowane inflacją"
    BOND_RETAIL_INTEREST_LINKED = "Obligacje skarbowe indeksowane stopą referencyjną"
    BOND_CORP_FIXED = "Obligacje korporacyjne o stopie stałej"
    BOND_CORP_FLOATING = "Obligacje skarbowe zmiennoprocentowe"
    COMMODITY_GOLD = "Surowce - złoto"
    COMMODITY_SILVER = "Surowce - srebro"
    COMMODITY_BROAD = "Surowce - inne"

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