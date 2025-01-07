#utils/cache_manager.py
import redis
from typing import List, Optional
import os
from utils.cache_constants import CacheNamespace
from config import REDIS_CLIENT

class CacheManager:
    def __init__(self):
        self.redis_client = REDIS_CLIENT

    def invalidate_by_pattern(self, pattern: str) -> int:
        """Delete all keys matching the pattern or a list of patterns"""
        if isinstance(pattern, list):
            total_deleted = 0
            for pat in pattern:
                keys = self.redis_client.keys(pat)
                if keys:
                    total_deleted += self.redis_client.delete(*keys)
            return total_deleted
        else:
            keys = self.redis_client.keys(pattern)
            if keys:
                return self.redis_client.delete(*keys)
            return 0

    def invalidate_user_cache(self, user_id: int, namespaces: Optional[List[CacheNamespace]] = None) -> None:
        """Invalidate all cache entries for a specific user"""
        if namespaces is None:
            namespaces = list(CacheNamespace)
        
        for namespace in namespaces:
            pattern = f"{namespace}:user:{user_id}:*"
            self.invalidate_by_pattern(pattern)

    def invalidate_account_cache(self, account_id: int) -> None:
        """Invalidate all cache entries related to an account"""
        patterns = [
            f"{CacheNamespace.ACCOUNT}:*:id:{account_id}",
            f"{CacheNamespace.TRANSACTION}:account:{account_id}:*",
            f"{CacheNamespace.PAYMENT}:account:{account_id}:*"
        ]
        for pattern in patterns:
            self.invalidate_by_pattern(pattern)

    def invalidate_transaction_cache(self, transaction_id: int, account_id: int) -> None:
        """Invalidate transaction-related caches"""
        patterns = [
            f"{CacheNamespace.TRANSACTION}:id:{transaction_id}",
            f"{CacheNamespace.TRANSACTION}:account:{account_id}:*",
            f"{CacheNamespace.ACCOUNT}:*"  # Invalidate account caches as balance changes
        ]
        for pattern in patterns:
            self.invalidate_by_pattern(pattern)

    def invalidate_pool_cache(self, pool_id: int, user_id: int) -> None:
        """Invalidate pool-related caches"""
        patterns = [
            f"{CacheNamespace.POOL}:id:{pool_id}",
            f"{CacheNamespace.POOL}:user:{user_id}:*"
        ]
        for pattern in patterns:
            self.invalidate_by_pattern(pattern)

    def invalidate_product_cache(self, product_id: int, user_id: int) -> None:
        """Invalidate all cache entries related to a product"""
        patterns = [
            f"{CacheNamespace.INVENTORY}:product:{product_id}*",
            f"{CacheNamespace.INVENTORY}:user:{user_id}:products",
            f"{CacheNamespace.STOREFRONT}:user:{user_id}:products"
        ]
        for pattern in patterns:
            self.invalidate_by_pattern(pattern)

    def invalidate_order_cache(self, order_id: int, user_id: int) -> None:
        """Invalidate order-related caches"""
        patterns = [
            f"{CacheNamespace.ORDER}:id:{order_id}*",
            f"{CacheNamespace.ORDER}:user:{user_id}:list",
            f"{CacheNamespace.DASHBOARD}:user:{user_id}:*"
        ]
        for pattern in patterns:
            self.invalidate_by_pattern(pattern)

    def invalidate_invoice_cache(self, invoice_id: int, user_id: int) -> None:
        """Invalidate invoice-related caches"""
        patterns = [
            f"{CacheNamespace.INVOICE}:id:{invoice_id}*",
            f"{CacheNamespace.INVOICE}:user:{user_id}:list",
            f"{CacheNamespace.DASHBOARD}:user:{user_id}:*"
        ]
        for pattern in patterns:
            self.invalidate_by_pattern(pattern)

    def invalidate_marketplace_cache(self, order_id: Optional[int] = None) -> None:
        """Invalidate marketplace-related caches"""
        patterns = [f"{CacheNamespace.MARKETPLACE}:orders"]
        if order_id:
            patterns.append(f"{CacheNamespace.MARKETPLACE}:order:{order_id}")
        for pattern in patterns:
            self.invalidate_by_pattern(pattern)

    def invalidate_restock_cache(self, request_id: int, user_id: int) -> None:
        """Invalidate restock-related caches"""
        patterns = [
            f"{CacheNamespace.RESTOCK}:id:{request_id}",
            f"{CacheNamespace.RESTOCK}:user:{user_id}:list",
            f"{CacheNamespace.INVENTORY}:user:{user_id}:products"
        ]
        for pattern in patterns:
            self.invalidate_by_pattern(pattern)

cache_manager = CacheManager()