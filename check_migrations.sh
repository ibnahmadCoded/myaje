#!/bin/bash
set -e

# Check if alembic migrations are up-to-date
alembic current | grep -q "head"
if [ $? -eq 0 ]; then
    echo "Migrations are up-to-date."
    exit 0
else
    echo "Migrations are not up-to-date."
    exit 1
fi
