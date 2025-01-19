#!/bin/sh
set -e

# Function to log messages
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# First check if we can connect to the database
if ! alembic current > /dev/null 2>&1; then
    log "ERROR: Could not connect to database or alembic command failed"
    exit 1
fi

# Check if there are any migrations at all
if ! alembic history > /dev/null 2>&1; then
    log "No migration history found"
    exit 1
fi

# Check if we're at the latest revision
CURRENT=$(alembic current 2>/dev/null)
if echo "$CURRENT" | grep -q "(head)"; then
    log "Migrations are up-to-date"
    exit 0
else
    log "Migrations are not at head. Current: $CURRENT"
    exit 1
fi