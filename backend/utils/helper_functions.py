from datetime import datetime
from enum import Enum

def serialize_datetime(obj):
    """Helper function to serialize datetime objects"""
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError(f'Object of type {obj.__class__.__name__} is not JSON serializable')

def serialize_sqlalchemy_obj(obj):
    """Helper function to serialize SQLAlchemy objects with datetime and enum handling"""
    if isinstance(obj, dict):
        return {k: serialize_sqlalchemy_obj(v) for k, v in obj.items()}
    elif isinstance(obj, Enum):
        return obj.value  # Convert enum to its string value
    elif hasattr(obj, '__dict__'):
        # Convert SQLAlchemy object to dict, excluding SQLAlchemy internal attributes
        obj_dict = {}
        for key, value in obj.__dict__.items():
            if not key.startswith('_'):
                # Special handling for enum attributes
                if isinstance(value, Enum):
                    obj_dict[key] = value.value
                else:
                    obj_dict[key] = serialize_sqlalchemy_obj(value)
        return obj_dict
    elif isinstance(obj, datetime):
        return obj.isoformat()
    elif isinstance(obj, (list, tuple)):
        return [serialize_sqlalchemy_obj(item) for item in obj]
    return obj
