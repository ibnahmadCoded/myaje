#!/bin/sh
set -e

# Add debug function
debug_postgres_connection() {
    echo "Debugging PostgreSQL connection..."
    echo "Current environment:"
    env | grep -E "PG|DB_"
    
    echo "\nTesting PostgreSQL connection with psql..."
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1" || true
    
    echo "\nChecking network..."
    getent hosts myaje-postgres || true
    
    echo "\nTesting raw connection..."
    nc -zv myaje-postgres 5432 || true
}

echo "Starting entrypoint script..."
echo "Waiting for PostgreSQL..."

# Increase timeout and add debugging
./wait-for-it.sh myaje-postgres:5432 --timeout=120 || {
    echo "Failed to connect to PostgreSQL. Running diagnostics..."
    debug_postgres_connection
    exit 1
}

# Ensure the versions directory exists
mkdir -p /app/alembic/versions
chmod 777 /app/alembic/versions

# Check if this is first run (no migrations exist)
if [ -z "$(ls -A /app/alembic/versions 2>/dev/null)" ]; then
    echo "No migrations found. Creating initial migration..."
    alembic revision --autogenerate -m "initial_migration"
fi

# Run migrations with verbose output
echo "Running migrations..."
alembic upgrade head --sql || {
    echo "Migration failed. Checking database status..."
    debug_postgres_connection
    exit 1
}

echo "Migrations complete, keeping container alive..."
tail -f /dev/null
