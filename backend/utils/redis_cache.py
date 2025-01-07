#utils/redis_cache.py
import redis
import json
from typing import Any, Optional, Dict
import os
from functools import wraps
from sqlalchemy.orm import class_mapper
from datetime import datetime
import enum
from models import User, Product, Order, BankAccount
from config import REDIS_CLIENT

class ModelSerializer:
    """Enhanced serializer for SQLAlchemy models with relationship handling"""
    
    @staticmethod
    def _serialize_relationship(obj: Any, relationship: str, processed: set) -> Any:
        """Serialize a relationship while avoiding circular references"""
        if not hasattr(obj, relationship):
            return None
            
        value = getattr(obj, relationship)
        if value is None:
            return None
            
        # Handle collections (lists of related objects)
        if isinstance(value, list):
            return [ModelSerializer._serialize_model(item, processed) for item in value 
                   if id(item) not in processed]
        
        # Handle single related object
        return ModelSerializer._serialize_model(value, processed) if id(value) not in processed else None

    @staticmethod
    def _serialize_model(obj: Any, processed: set = None) -> Dict:
        """Convert SQLAlchemy model to dictionary with relationship handling"""
        if processed is None:
            processed = set()
            
        # Prevent infinite recursion
        if id(obj) in processed:
            return None
        processed.add(id(obj))
        
        if not hasattr(obj, '__table__'):
            if isinstance(obj, enum.Enum):
                return obj.value
            return obj
            
        mapper = class_mapper(obj.__class__)
        data = {}
        
        # Serialize regular columns
        for column in mapper.columns:
            value = getattr(obj, column.key)
            if isinstance(value, datetime):
                data[column.key] = value.isoformat()
            elif isinstance(value, enum.Enum):
                data[column.key] = value.value
            else:
                data[column.key] = value
        
        # Handle relationships based on model type
        if isinstance(obj, User):
            relationships = {
                'products': True,  # Include full product details
                'store_settings': True,  # Include store settings
                'orders': False,  # Skip to avoid large payloads
                'bank_details': True,  # Include banking info
                'notifications': {'limit': 5},  # Only recent notifications
                'feedbacks': False,  # Skip feedback
                'restock_requests': {'limit': 5},  # Only recent requests
                'bank_accounts': True,  # Include bank accounts
                'financial_pools': True,  # Include financial pools
                'loans': False,  # Skip loans for privacy
                'automations': True,  # Include automations
            }
        elif isinstance(obj, Product):
            relationships = {
                'owner': False,  # Skip owner details
                'images': True,  # Include all images
                'restock_requests': {'limit': 1}  # Only latest restock request
            }
        elif isinstance(obj, Order):
            relationships = {
                'seller': {'fields': ['id', 'email', 'business_name']},
                'items': True,  # Include all items
                'payments': True,  # Include payment info
                'invoice_requests': True  # Include invoice info
            }
        elif isinstance(obj, BankAccount):
            relationships = {
                'user': False,  # Skip user details
                'transactions': {'limit': 10},  # Recent transactions
                'pools': True,  # Include pools
                'outgoing_payments': {'limit': 5},
                'incoming_payments': {'limit': 5}
            }
        else:
            # Default behavior for other models
            relationships = {rel.key: False for rel in mapper.relationships}
        
        # Process relationships based on configuration
        for rel_name, rel_config in relationships.items():
            if not hasattr(obj, rel_name):
                continue
                
            if isinstance(rel_config, dict):
                # Handle configured relationship
                value = getattr(obj, rel_name)
                if isinstance(value, list) and 'limit' in rel_config:
                    value = value[:rel_config['limit']]
                if isinstance(value, dict) and 'fields' in rel_config:
                    value = {k: v for k, v in value.items() if k in rel_config['fields']}
                data[rel_name] = ModelSerializer._serialize_relationship(obj, rel_name, processed)
            elif rel_config:
                # Include full relationship
                data[rel_name] = ModelSerializer._serialize_relationship(obj, rel_name, processed)
        
        return data

class RedisCache:
    def __init__(self, redis_client):
        self.redis_client = redis_client
        
    async def get(self, key: str) -> Optional[Any]:
        data = self.redis_client.get(key)
        if data:
            return json.loads(data)
        return None
        
    async def set(self, key: str, value: Any, expire: int = 3600) -> None:
        serialized = ModelSerializer._serialize_model(value) if hasattr(value, '__table__') \
                    else [ModelSerializer._serialize_model(item) for item in value] if isinstance(value, list) \
                    else value
                    
        self.redis_client.set(key, json.dumps(serialized), ex=expire)
        
    async def delete(self, key: str) -> None:
        self.redis_client.delete(key)
        
    async def delete_pattern(self, pattern: str) -> None:
        """Delete all keys matching the pattern"""
        keys = self.redis_client.keys(pattern)
        if keys:
            self.redis_client.delete(*keys)

# Initialize enhanced cache
redis_cache = RedisCache(REDIS_CLIENT)
