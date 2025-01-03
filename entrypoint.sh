#!/bin/bash
./wait-for-it.sh myaje-postgres:5432 -- alembic upgrade head
tail -f /dev/null
