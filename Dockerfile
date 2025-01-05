# Dockerfile for alembic
FROM python:3.10-slim

COPY backend/requirements.txt .

# Install dependencies
#RUN pip install --no-cache-dir -r requirements.txt #for production only, to reduce build time as it will redwonload the dependencies with -no-cache flag, also add --production flag 
RUN pip install -r requirements.txt

# Set the working directory for Alembic files
WORKDIR /app

COPY alembic.ini .
COPY alembic/ /app/alembic/
COPY backend/ /app/backend/

# Copy the wait-for-it script
COPY wait-for-it.sh /app/wait-for-it.sh
COPY entrypoint.sh /app/entrypoint.sh

# Make sure the wait-for-it script is executable
RUN chmod +x /app/wait-for-it.sh /app/entrypoint.sh

COPY check_migrations.sh /usr/local/bin/check_migrations.sh
RUN chmod +x /usr/local/bin/check_migrations.sh