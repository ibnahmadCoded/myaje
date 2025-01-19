#!/bin/

# Add Alembic to PATH
export PATH=$PATH:/usr/local/lib/python3.10/site-packages/bin

# Wait for postgres
./wait-for-it.sh myaje-postgres:5432

# Check if this is first run (no migrations exist)
if [ -z "$(ls -A /app/alembic/versions 2>/dev/null)" ]; then
    echo "No migrations found. Creating initial migration..."
    alembic revision --autogenerate -m "initial_migration"
fi

# Run migrations
alembic upgrade head

# Keep container running,.
tail -f /dev/null
