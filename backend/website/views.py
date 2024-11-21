from flask import Blueprint, request, jsonify, make_response
from .models import Product, TokenBlacklist
from .utils import token_required
from . import db

views = Blueprint('views', __name__)

@views.route('/inventory', methods=['GET'])
@token_required
def get_inventory(current_user):
    products = Product.query.filter_by(user_id=current_user.id).all()
    return jsonify([{
        'id': p.id,
        'name': p.name,
        'sku': p.sku,
        'quantity': p.quantity,
        'price': p.price,
        'category': p.category,
        'description': p.description,
        'low_stock_threshold': p.low_stock_threshold
    } for p in products])

@views.route('/inventory', methods=['POST'])
@token_required
def add_product_to_inventory(current_user):
    data = request.json
    product = Product(
        user_id=current_user.id,
        name=data['name'],
        sku=data['sku'],
        quantity=data['quantity'],
        price=data['price'],
        category=data.get('category'),
        description=data.get('description'),
        low_stock_threshold=data.get('low_stock_threshold', 10)
    )
    db.session.add(product)
    try:
        db.session.commit()
        return jsonify({'message': 'Product added successfully'})
    except:
        db.session.rollback()
        return jsonify({'message': 'SKU must be unique'}), 400
    
@views.route('/inventory/<int:product_id>', methods=['DELETE'])
@token_required
def delete_product_from_inventory(current_user, product_id):
    if request.method == 'OPTIONS':
        response = make_response()
        response.status_code = 200
        response.headers['Access-Control-Allow-Origin'] = 'http://localhost:3000'
        response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Authorization, Content-Type'
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        
        return response
    
    product = Product.query.filter_by(id=product_id, user_id=current_user.id).first()
    if not product:
        return jsonify({'message': 'Product not found'}), 404
    
    db.session.delete(product)
    db.session.commit()
    return jsonify({'message': 'Product deleted successfully'})

@views.route('/inventory/low-stock', methods=['GET'])
@token_required
def get_low_stock(current_user):
    low_stock_products = Product.query\
        .filter_by(user_id=current_user.id)\
        .filter(Product.quantity <= Product.low_stock_threshold)\
        .all()
    
    return jsonify([{
        'id': p.id,
        'name': p.name,
        'sku': p.sku,
        'quantity': p.quantity,
        'low_stock_threshold': p.low_stock_threshold
    } for p in low_stock_products])