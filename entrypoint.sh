#!/bin/sh
set -e

echo "Starting entrypoint script..."

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL..."
until PGPASSWORD=$DB_PASSWORD psql -h myaje-postgres -U $DB_USER -d $DB_NAME -c '\q' 2>/dev/null; do
  echo "PostgreSQL is unavailable - sleeping 5s"
  sleep 5
done

echo "PostgreSQL is up - executing migrations"

# Ensure the versions directory exists
mkdir -p /app/alembic/versions
chmod 777 /app/alembic/versions

# Check if this is first run (no migrations exist)
if [ -z "$(ls -A /app/alembic/versions 2>/dev/null)" ]; then
    echo "No migrations found. Creating initial migration..."
    alembic revision --autogenerate -m "initial_migration"
fi

# Run migrations
echo "Running migrations..."
alembic upgrade head

echo "Migrations complete"
