from flask import Blueprint, request, jsonify
from .models import Product
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
def add_product(current_user):
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
