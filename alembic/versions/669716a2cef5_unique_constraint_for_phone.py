"""unique constraint for phone

Revision ID: 669716a2cef5
Revises: 8d2aa9f1fe89
Create Date: 2025-01-02 17:39:19.555309

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '669716a2cef5'
down_revision: Union[str, None] = '8d2aa9f1fe89'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    pass
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    pass
    # ### end Alembic commands ###
