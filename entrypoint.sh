#!/bin/sh
set -e

# Wait for postgres
echo "Waiting for PostgreSQL..."
./wait-for-it.sh myaje-postgres:5432 --timeout=60

# Ensure the versions directory exists
mkdir -p /app/alembic/versions

# Check if this is first run (no migrations exist)
if [ -z "$(ls -A /app/alembic/versions 2>/dev/null)" ]; then
    echo "No migrations found. Creating initial migration..."
    alembic revision --autogenerate -m "initial_migration"
fi

# Run migrations
echo "Running migrations..."
alembic upgrade head

# Keep container running
echo "Migrations complete, keeping container alive..."
tail -f /dev/null