from typing import Dict, Any, List, Tuple, Optional
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
import re
from enum import Enum
from dataclasses import dataclass
from datetime import datetime

class SortOrder(Enum):
    """Enumeration for sort orders"""
    ASCENDING = "asc"
    DESCENDING = "desc"

@dataclass
class PriceRange:
    """Data class for price range validation"""
    min_price: Optional[float] = None
    max_price: Optional[float] = None

    def validate(self) -> bool:
        """Validate price range logic"""
        if self.min_price is not None and self.max_price is not None:
            return self.min_price <= self.max_price
        return True

class QueryIntentParser:
    def __init__(self, confidence_threshold: float = 0.1):
        self.confidence_threshold = confidence_threshold
        
        # Define intent patterns with sample queries
        self.intent_patterns = {
            'greeting': [
                'hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening',
                'hi there', 'hello there', 'greetings', 'howdy', 'welcome', 'hiya',
                'morning', 'afternoon', 'evening', 'yo', 'sup', "what's up",
                'hey there', 'hi everyone', 'hello everybody', 'good day'
            ],
            'find_products': [
                'find me a shoe under $50', 'get me shoes less than 50 dollars',
                'show products under 100', 'find items within 200 dollars',
                'search for products below 150', 'find products more than 50 dollars',
                'get items above 100', 'show me products higher than 75',
                'find products between 50 and 100', 'search items from 20 to 50 dollars',
                'get products around 50 dollars', 'find items approximately 100 dollars',
                'get me shirt costing less than 3000', 'i need products under 75',
                'looking for items below 200', 'search for things under 150',
                'find me something around 100', 'show me stuff below 50',
                'get products in the 100 dollar range', 'find items costing about 75',
                'search for products in 50-100 range', 'need things under 200 dollars',
                'show me options below 150', 'find affordable items under 100',
                'get me budget-friendly products', 'search for premium items above 500',
                'find luxury products over 1000', 'show me high-end items',
                'get me cheap products', 'find inexpensive options'
            ],
            'filter_products': [
                'show electronics under 1000 dollars in blue',
                'filter shoes by color red and price below 80',
                'find products in category electronics price less than 500',
                'show items in green or blue under 300',
                'filter by color black price range 50 to 100',
                'show electronics more expensive than 500',
                'find shoes above 100 dollars in red',
                'sort products by price high to low',
                'order items by price from lowest',
                'show newest products first',
                'filter by rating above 4 stars',
                'show items with free shipping',
                'display products sorted by popularity',
                'filter by brand nike',
                'show items on sale',
                'filter by discount percentage',
                'show items with next day delivery',
                'filter by size large',
                'show products with best reviews',
                'filter by material leather',
                'show items in stock only',
                'filter by warranty period',
                'show products with fastest shipping',
                'filter by customer rating',
                'show eco-friendly products',
                'filter by local availability',
                'show products with video reviews',
                'filter by release date',
                'show bestsellers first',
                'filter by trending items'
            ],
            'add_to_cart': [
                'add this to cart', 'add the third item to cart',
                'put this product in my cart', 'add the second product to basket',
                'add to cart', 'buy this now', 'purchase this item',
                'add two of these to cart', 'add 3 items to basket',
                'put it in my cart', 'add to my basket',
                'i want to buy this', 'purchase now',
                'add multiple items to cart', 'put these in my basket',
                'add all selected items', 'buy selected products',
                'add this to my shopping list', 'put aside for purchase',
                'add to shopping bag', 'save in cart',
                'place in basket', 'queue for purchase',
                'mark for buying', 'prepare for checkout',
                'ready to purchase this', 'add to my order'
            ],
            'show_cart': [
                'show my cart', 'view cart', 'what is in my cart',
                'display cart contents', 'show basket', 'view my shopping cart',
                'check cart items', 'review my cart', 'see my basket',
                'show shopping bag', 'display my items',
                'what have i selected', 'show my selections',
                'view my shopping list', 'check my basket',
                "show what i'm buying", 'view purchase list',
                'display shopping items', 'show current order',
                'review selected items', 'check shopping bag',
                'view saved items', 'show my picks',
                'display cart summary', 'check my choices'
            ],
            'checkout': [
                'checkout now', 'proceed to checkout', 'start checkout',
                "let's checkout", 'complete purchase', 'buy items in cart',
                'finish order', 'pay now', 'process my order',
                'complete my purchase', 'finalize order',
                'proceed to payment', 'ready to pay',
                'complete transaction', 'confirm purchase',
                'submit my order', 'process payment',
                'finish transaction', 'conclude purchase',
                'execute order', 'complete checkout process',
                'validate my cart', 'confirm my order',
                'proceed with purchase', 'complete buying process'
            ],
            'remove_from_cart': [
                'remove this from cart', 'delete item from cart',
                'remove the second item', 'take this out of my cart',
                'remove all items', 'clear my cart',
                'delete everything', 'empty the basket',
                'remove selected items', 'clear selection',
                'take these out', 'delete from basket',
                'remove from order', 'clear shopping list',
                'delete these items', 'remove from bag',
                'clear cart contents', 'empty my selections',
                'remove all products', 'delete my choices',
                'clear entire cart', 'remove everything',
                'delete all selections', 'clear shopping bag'
            ],
            'save_for_later': [
                'save for later', 'add to wishlist', 'save to favorites',
                'bookmark this item', 'add to my list', 'save this product',
                'keep for later', 'add to saved items',
                'bookmark for later', 'save in wishlist',
                'add to favorites', 'save product details',
                'keep in my list', 'save to view later',
                'add to saved products', 'bookmark this product',
                'save in my favorites', 'add to watch list',
                'save item details', 'keep product info',
                'add to saved list', 'save for future',
                'bookmark for purchase', 'save product info'
            ]
        }
        
        # Initialize TF-IDF vectorizer
        self.vectorizer = TfidfVectorizer(
            stop_words='english',
            ngram_range=(1, 3),  # Include phrases up to 3 words
            max_features=1000
        )
        
        # Prepare vectorizer with all sample queries
        all_queries = []
        for queries in self.intent_patterns.values():
            all_queries.extend(queries)
        self.vectorizer.fit(all_queries)
        
        # Define common product attributes
        self.common_colors = {
            'red', 'blue', 'green', 'black', 'white', 'yellow', 'purple', 
            'orange', 'pink', 'brown', 'gray', 'grey', 'silver', 'gold', 
            'navy', 'maroon', 'violet', 'indigo', 'bronze', 'platinum'
        }
        
        # usually fixed
        self.common_categories = {
            'electronics', 'shoes', 'clothing', 'accessories', 'furniture',
            'books', 'toys', 'sports', 'beauty', 'health', 'food', 'jewelry',
            'home', 'garden', 'automotive', 'tools', 'office', 'pet supplies'
        }
        
        self.size_patterns = {
            'clothing': r'(?:size\s+)?(?:xx?s|xx?l|[sml])',
            'shoes': r'size\s+(\d+(?:\.\d+)?)',
            'general': r'(?:small|medium|large|extra\s+(?:small|large))'
        }

        # Add common product types (names) for better name extraction. // get from db instead
        self.product_types = {
            'shoe', 'shoes', 'sneaker', 'sneakers', 'boot', 'boots', 'sandal', 'sandals',
            'laptop', 'computer', 'phone', 'smartphone', 'tablet', 'watch', 'smartwatch',
            'shirt', 't-shirt', 'pants', 'jeans', 'dress', 'skirt', 'jacket', 'coat',
            'bag', 'backpack', 'purse', 'wallet', 'headphones', 'earbuds', 'speaker',
            'camera', 'tv', 'television', 'monitor', 'keyboard', 'mouse', 'printer',
            'sofa', 'chair', 'table', 'desk', 'bed', 'mattress', 'lamp', 'rug',
        }
        
        # Add common brands for product name extraction, get from db
        self.common_brands = {
            'nike', 'adidas', 'puma', 'reebok', 'new balance', 'asics',
            'apple', 'samsung', 'sony', 'lg', 'dell', 'hp', 'lenovo', 'asus',
            'levis', 'gap', 'zara', 'hm', 'uniqlo', 'gucci', 'prada', 'coach',
            'ikea', 'ashley', 'wayfair', 'pottery barn', 'west elm',
        }
        
        # Add product attributes for name extraction
        self.product_attributes = {
            'wireless', 'bluetooth', 'leather', 'cotton', 'wool', 'silk',
            'running', 'gaming', 'casual', 'formal', 'sports', 'athletic',
            'smart', 'portable', 'wooden', 'metal', 'plastic', 'glass',
            'waterproof', 'lightweight', 'heavy-duty', 'ergonomic',
        }

    def get_cosine_similarity(self, query1: str, query2: str) -> float:
        """Calculate cosine similarity between two queries."""
        try:
            tfidf_matrix = self.vectorizer.transform([query1, query2])
            return float(np.dot(tfidf_matrix.toarray()[0], tfidf_matrix.toarray()[1]))
        except Exception as e:
            print(f"Error calculating similarity: {e}")
            return 0.0
        
    def extract_product_name(self, query: str) -> Optional[Dict[str, str]]:
        """
        Extract product name and its attributes from the query.
        Returns a dictionary with product type, brand, and attributes if found.
        """
        query_lower = query.lower()
        result = {}
        
        # Extract product type
        found_types = []
        for product_type in self.product_types:
            if product_type in query_lower:
                found_types.append(product_type)
        
        if found_types:
            # Get the longest matching product type (e.g., "running shoes" over "shoes")
            result['product_type'] = max(found_types, key=len)
            
            # Extract position of product type for context
            type_pos = query_lower.find(result['product_type'])
            
            # Look for brand names before the product type
            for brand in self.common_brands:
                if brand in query_lower[:type_pos]:
                    result['brand'] = brand
                    break
            
            # Extract attributes
            attributes = []
            for attr in self.product_attributes:
                if attr in query_lower[:type_pos] or attr in query_lower[type_pos:]:
                    attributes.append(attr)
            
            if attributes:
                result['attributes'] = attributes
            
            # Try to construct a complete product name
            product_name_parts = []
            
            # Add brand if found
            if 'brand' in result:
                product_name_parts.append(result['brand'].title())
            
            # Add attributes
            if attributes:
                product_name_parts.extend([attr.title() for attr in attributes])
            
            # Add product type
            product_name_parts.append(result['product_type'].title())
            
            result['product_name'] = ' '.join(product_name_parts)
            
            return result
        
        return None

    def extract_price(self, query: str) -> Dict[str, float]:
        """Extract price parameters from the query."""
        price_params = {}
        query_lower = query.lower()
        
        # Price patterns
        patterns = {
            'max_price': [
                r'under \$?(\d+(?:\.\d{1,2})?)',
                r'less than \$?(\d+(?:\.\d{1,2})?)',
                r'below \$?(\d+(?:\.\d{1,2})?)',
                r'within \$?(\d+(?:\.\d{1,2})?)',
                r'max(?:imum)? (?:price |)\$?(\d+(?:\.\d{1,2})?)',
                r'no more than \$?(\d+(?:\.\d{1,2})?)'
            ],
            'min_price': [
                r'more than \$?(\d+(?:\.\d{1,2})?)',
                r'above \$?(\d+(?:\.\d{1,2})?)',
                r'higher than \$?(\d+(?:\.\d{1,2})?)',
                r'over \$?(\d+(?:\.\d{1,2})?)',
                r'at least \$?(\d+(?:\.\d{1,2})?)',
                r'min(?:imum)? (?:price |)\$?(\d+(?:\.\d{1,2})?)',
                r'starting (?:at|from) \$?(\d+(?:\.\d{1,2})?)'
            ],
            'exact_price': [
                r'exactly \$?(\d+(?:\.\d{1,2})?)',
                r'price of \$?(\d+(?:\.\d{1,2})?)',
                r'costs? \$?(\d+(?:\.\d{1,2})?)',
                r'around \$?(\d+(?:\.\d{1,2})?)',
                r'approximately \$?(\d+(?:\.\d{1,2})?)',
                r'about \$?(\d+(?:\.\d{1,2})?)'
            ]
        }
        
        # Range patterns
        range_patterns = [
            r'between \$?(\d+(?:\.\d{1,2})?) and \$?(\d+(?:\.\d{1,2})?)',
            r'from \$?(\d+(?:\.\d{1,2})?) to \$?(\d+(?:\.\d{1,2})?)',
            r'price range \$?(\d+(?:\.\d{1,2})?) to \$?(\d+(?:\.\d{1,2})?)',
            r'\$?(\d+(?:\.\d{1,2})?)\s*-\s*\$?(\d+(?:\.\d{1,2})?)',
            r'\$?(\d+(?:\.\d{1,2})?)(?:\s+dollars?)?\s+to\s+\$?(\d+(?:\.\d{1,2})?)'
        ]
        
        # Check range patterns first
        for pattern in range_patterns:
            match = re.search(pattern, query_lower)
            if match:
                price_range = PriceRange(
                    min_price=float(match.group(1)),
                    max_price=float(match.group(2))
                )
                if price_range.validate():
                    price_params['min_price'] = price_range.min_price
                    price_params['max_price'] = price_range.max_price
                    return price_params
        
        # Check individual price patterns
        for price_type, price_patterns in patterns.items():
            for pattern in price_patterns:
                match = re.search(pattern, query_lower)
                if match:
                    price = float(match.group(1))
                    if price_type == 'exact_price':
                        margin = price * 0.1  # 10% margin for approximate prices
                        price_params['min_price'] = price - margin
                        price_params['max_price'] = price + margin
                    else:
                        price_params[price_type] = price
                    break
        
        return price_params

    def extract_colors(self, query: str) -> List[str]:
        """Extract color parameters from the query."""
        found_colors = set()
        query_lower = query.lower()
        
        # Look for direct color mentions
        for color in self.common_colors:
            if color in query_lower:
                found_colors.add(color)
        
        # Look for combined colors (e.g., "dark blue", "light green")
        color_modifiers = ['dark', 'light', 'bright', 'pale', 'deep']
        for modifier in color_modifiers:
            for color in self.common_colors:
                if f"{modifier} {color}" in query_lower:
                    found_colors.add(f"{modifier} {color}")
        
        # Look for connected colors
        color_patterns = [
            r'(?:in|color) ((?:\w+ (?:or|and|,) )*\w+)',
            r'colors?: ((?:\w+ (?:or|and|,) )*\w+)'
        ]
        
        for pattern in color_patterns:
            match = re.search(pattern, query_lower)
            if match:
                color_phrase = match.group(1)
                colors = re.split(r' (?:or|and|,) ', color_phrase)
                for color in colors:
                    color = color.strip().strip(',')
                    if color in self.common_colors:
                        found_colors.add(color)
        
        return list(found_colors)

    def extract_category(self, query: str) -> Optional[str]:
        """Extract category from the query."""
        query_lower = query.lower()
        
        # Direct category mention
        for category in self.common_categories:
            if category in query_lower:
                return category
        
        # Category patterns
        category_patterns = [
            r'in (?:the )?category (\w+)',
            r'(?:show|find|get) (\w+)',
            r'(?:department|section) (\w+)'
        ]
        
        for pattern in category_patterns:
            match = re.search(pattern, query_lower)
            if match and match.group(1) in self.common_categories:
                return match.group(1)
        
        return None

    def extract_position(self, query: str) -> Optional[int]:
        """Extract position reference from the query."""
        query_lower = query.lower()
        
        # Word to number mapping
        position_words = {
            'first': 1, 'second': 2, 'third': 3, 'fourth': 4, 'fifth': 5,
            'sixth': 6, 'seventh': 7, 'eighth': 8, 'ninth': 9, 'tenth': 10,
            '1st': 1, '2nd': 2, '3rd': 3, '4th': 4, '5th': 5,
            '6th': 6, '7th': 7, '8th': 8, '9th': 9, '10th': 10
        }
        
        # Check for word-based positions
        for word, position in position_words.items():
            pattern = fr'\b{word}\b'
            if re.search(pattern, query_lower):
                return position
        
        # Check for numeric positions
        match = re.search(r'(?:number|#)\s*(\d+)', query_lower)
        if match:
            return int(match.group(1))
        
        return None

    def extract_quantity(self, query: str) -> Optional[int]:
        """Extract quantity from the query."""
        query_lower = query.lower()
        
        # Word to number mapping
        quantity_words = {
            'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
            'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
        }
        
        # Check for word-based quantities
        for word, number in quantity_words.items():
            if word in query_lower:
                return number
        
        # Check for numeric quantities
        match = re.search(r'(\d+)\s+(?:items?|pieces?|products?)', query_lower)
        if match:
            return int(match.group(1))
        
        return None

    def extract_sort_options(self, query: str) -> Dict[str, Any]:
        """Extract sorting preferences from the query."""
        query_lower = query.lower()
        sort_options = {}
        
        # Price sorting
        price_patterns = {
            'price_asc': [
                r'(?:sort|order).*price.*(?:low to high|lowest|ascending)',
                r'cheapest first',
                r'least expensive'
            ],
            'price_desc': [
                r'(?:sort|order).*price.*(?:high to low|highest|descending)',
                r'most expensive',
                r'highest price'
            ]
        }
        
        for sort_type, patterns in price_patterns.items():
            for pattern in patterns:
                if re.search(pattern, query_lower):
                    sort_options['sort_by'] = 'price'
                    sort_options['order'] = (
                        SortOrder.ASCENDING if 'asc' in sort_type 
                        else SortOrder.DESCENDING
                    )
                    return sort_options
        
        # Date sorting
        date_patterns = {
            'date_desc': [
                r'newest|latest|recent',
                r'new arrivals',
                r'just added'
            ],
            'date_asc': [
                r'oldest|earliest'
            ]
        }
        
        for sort_type, patterns in date_patterns.items():
            for pattern in patterns:
                if re.search(pattern, query_lower):
                    sort_options['sort_by'] = 'date'
                    sort_options['order'] = (
                        SortOrder.DESCENDING if 'desc' in sort_type 
                        else SortOrder.ASCENDING
                    )
                    return sort_options
        
        # Rating sorting
        rating_patterns = [
            r'(?:best|highest|top) rated',
            r'highest review',
            r'best reviews'
        ]
        
        for pattern in rating_patterns:
            if re.search(pattern, query_lower):
                sort_options['sort_by'] = 'rating'
                sort_options['order'] = SortOrder.DESCENDING
                return sort_options
        
        return sort_options

    def extract_filters(self, query: str) -> Dict[str, Any]:
        """Extract additional filter parameters from the query."""
        query_lower = query.lower()
        filters = {}
        
        # Shipping filters
        if re.search(r'free shipping|ships free', query_lower):
            filters['free_shipping'] = True
        
        # Rating filters
        rating_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:stars?|rating)', query_lower)
        if rating_match:
            filters['min_rating'] = float(rating_match.group(1))
        
        # Availability filters
        if re.search(r'in stock|available|ready to ship', query_lower):
            filters['in_stock'] = True
        
        # Brand filters
        brand_match = re.search(r'(?:brand|by|from)\s+([A-Za-z]+)', query_lower)
        if brand_match:
            filters['brand'] = brand_match.group(1).title()
        
        # Size filters
        for category, pattern in self.size_patterns.items():
            size_match = re.search(pattern, query_lower)
            if size_match:
                filters['size'] = size_match.group(0)
                filters['size_category'] = category
                break
        
        return filters

    def parse_query(self, query: str) -> Dict[str, Any]:
        """
        Parse user query to identify intent and extract parameters.
        Returns a dictionary with intent, confidence score, and relevant parameters.
        """
        try:
            # Find the best matching intent
            best_similarity = -1
            best_intent = None
            
            for intent, patterns in self.intent_patterns.items():
                for pattern in patterns:
                    similarity = self.get_cosine_similarity(query, pattern)
                    if similarity > best_similarity:
                        best_similarity = similarity
                        best_intent = intent

            # If similarity is too low, return unknown intent
            if best_similarity < self.confidence_threshold:
                return {
                    'intent': 'unknown',
                    'confidence': best_similarity,
                    'error': 'Low confidence in intent detection'
                }

            # Initialize result with intent and confidence
            result = {
                'intent': best_intent,
                'confidence': best_similarity,
                'timestamp': datetime.now().isoformat()
            }
            
            # Extract parameters based on intent
            if best_intent in ['find_products', 'filter_products']:
                # Extract price parameters
                product_info = self.extract_product_name(query)
                if product_info:
                    result['product'] = product_info
                    
                price_params = self.extract_price(query)
                if price_params:
                    result.update(price_params)
                
                # Extract sorting options
                sort_options = self.extract_sort_options(query)
                if sort_options:
                    result.update(sort_options)
                
                # Extract additional filters
                filters = self.extract_filters(query)
                if filters:
                    result['filters'] = filters
                
                if best_intent == 'filter_products':
                    # Extract colors
                    colors = self.extract_colors(query)
                    if colors:
                        result['colors'] = colors
                    
                    # Extract category
                    category = self.extract_category(query)
                    if category:
                        result['category'] = category
                    
            elif best_intent == 'greeting':
                return result
            elif best_intent == 'add_to_cart':
                # Extract position
                position = self.extract_position(query)
                if position:
                    result['position'] = position
                
                # Extract quantity
                quantity = self.extract_quantity(query)
                if quantity:
                    result['quantity'] = quantity
                else:
                    result['quantity'] = 1  # Default quantity
            
            elif best_intent == 'remove_from_cart':
                position = self.extract_position(query)
                if position:
                    result['position'] = position
                if 'all' in query.lower():
                    result['remove_all'] = True
            
            return result

        except Exception as e:
            return {
                'intent': 'error',
                'error': str(e),
                'error_type': type(e).__name__
            }
