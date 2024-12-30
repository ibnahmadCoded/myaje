"""Restock model creation

Revision ID: af70228f8a14
Revises: 6da8f48603ab
Create Date: 2024-12-24 02:12:32.699050

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'af70228f8a14'
down_revision: Union[str, None] = '6da8f48603ab'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('restock_requests',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('product_id', sa.Integer(), nullable=True),
    sa.Column('product_name', sa.String(length=100), nullable=False),
    sa.Column('quantity', sa.Integer(), nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('address', sa.Text(), nullable=False),
    sa.Column('additional_notes', sa.Text(), nullable=True),
    sa.Column('urgency', sa.Enum('NORMAL', 'HIGH', name='restockrequesturgency'), nullable=True),
    sa.Column('status', sa.Enum('PENDING', 'APPROVED', 'DELIVERED', 'CANCELLED', name='restockrequeststatus'), nullable=True),
    sa.Column('type', sa.String(length=20), nullable=False),
    sa.Column('request_date', sa.DateTime(), nullable=True),
    sa.Column('expected_delivery', sa.DateTime(), nullable=True),
    sa.Column('delivered_date', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['product_id'], ['products.id'], ),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('restock_requests')
    # ### end Alembic commands ###