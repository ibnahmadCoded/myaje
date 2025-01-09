"""money request improvements

Revision ID: 08bd32c549b6
Revises: 462d472ff05b
Create Date: 2025-01-08 13:59:05.469221

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '08bd32c549b6'
down_revision: Union[str, None] = '462d472ff05b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('money_requests', sa.Column('request_from_account_type', sa.String(), nullable=True))
    op.alter_column('money_requests', 'account_type',
               existing_type=postgresql.ENUM('PERSONAL', 'BUSINESS', name='accounttype'),
               type_=sa.String(),
               existing_nullable=False)
    op.alter_column('money_requests', 'status',
               existing_type=postgresql.ENUM('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'EXPIRED', name='moneyrequeststatus'),
               type_=sa.String(),
               existing_nullable=True)
    op.alter_column('money_requests', 'expires_at',
               existing_type=postgresql.TIMESTAMP(),
               nullable=True)
    op.add_column('notifications', sa.Column('notificaiton_metadata', sa.JSON(), nullable=True))
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('notifications', 'notificaiton_metadata')
    op.alter_column('money_requests', 'expires_at',
               existing_type=postgresql.TIMESTAMP(),
               nullable=False)
    op.alter_column('money_requests', 'status',
               existing_type=sa.String(),
               type_=postgresql.ENUM('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'EXPIRED', name='moneyrequeststatus'),
               existing_nullable=True)
    op.alter_column('money_requests', 'account_type',
               existing_type=sa.String(),
               type_=postgresql.ENUM('PERSONAL', 'BUSINESS', name='accounttype'),
               existing_nullable=False)
    op.drop_column('money_requests', 'request_from_account_type')
    # ### end Alembic commands ###
