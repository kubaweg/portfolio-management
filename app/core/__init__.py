from enum import Enum
from typing import Type, TypeVar

T = TypeVar("T", bound=Enum)

def map_value_to_enum(enum_class: Type[T], value: str) -> T:
    # Przeszukuje Enum i zwraca klucz, którego .value odpowiada tekstowi z frontendu
    for member in enum_class:
        if member.value == value:
            return member
    # Jeśli nie znajdzie (np. literówka), Pydantic rzuci błędem walidacji
    raise ValueError(f"Nieprawidłowa wartość: {value}. Oczekiwano jednej z: {[e.value for e in enum_class]}")