#utils/cache_decorators.py
from functools import wraps
from typing import List, Optional, Callable
from utils.cache_constants import CacheNamespace
from utils.cache_manager import cache_manager
from utils.redis_cache import redis_cache

def cache_response(expire: int = 3600, include_user_id: bool = True):
    """Enhanced caching decorator with user isolation"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract user_id from current_user if present
            user_id = None
            if include_user_id:
                current_user = kwargs.get('current_user')
                if current_user:
                    user_id = getattr(current_user, 'id', None)
            
            # Generate cache key
            base_key = f"{func.__name__}:{str(args)}:{str(kwargs)}"
            cache_key = f"user:{user_id}:{base_key}" if user_id else base_key
            
            # Try to get cached response
            cached_response = await redis_cache.get(cache_key)
            if cached_response is not None:
                return cached_response
            
            # Execute function and cache response
            response = await func(*args, **kwargs)
            await redis_cache.set(cache_key, response, expire)
            
            return response
            
        return wrapper
    return decorator

def invalidate_cache(namespaces: List[CacheNamespace], 
                    user_id_arg: str = 'current_user',
                    custom_keys: Optional[List[Callable]] = None):
    """
    Decorator to invalidate cache after modification operations
    
    Args:
        namespaces: List of cache namespaces to invalidate
        user_id_arg: Name of the argument that contains the user ID/object
        custom_keys: Optional list of functions that generate additional cache keys to invalidate
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Execute the original function
            result = await func(*args, **kwargs)
            
            # Get user_id from kwargs or args
            user_id = None
            if user_id_arg in kwargs:
                user = kwargs[user_id_arg]
                user_id = user.id if hasattr(user, 'id') else user
            
            # Invalidate cache for specified namespaces
            if user_id:
                cache_manager.invalidate_user_cache(user_id, namespaces)
            
            # Invalidate any custom cache keys
            if custom_keys:
                for key_func in custom_keys:
                    key = key_func(result) if result else None
                    if key:
                        cache_manager.invalidate_by_pattern(key)
            
            return result
        return wrapper
    return decorator