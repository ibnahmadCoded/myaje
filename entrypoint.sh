#!/bin/bash

# Wait for postgres
./wait-for-it.sh myaje-postgres:5432

# Check if this is first run (no migrations exist)
if [ ! -f "/app/alembic/versions/"* ]; then
    echo "No migrations found. Creating initial migration..."
    alembic revision --autogenerate -m "initial_migration"
fi

# Run migrations
alembic upgrade head

# Keep container running
tail -f /dev/null