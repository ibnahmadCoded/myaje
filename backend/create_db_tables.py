#create_db_tables.py
from starlette.concurrency import run_in_threadpool
from sql_database import Base, engine
from config import logger

# Create tables function
async def create_tables():
    await run_in_threadpool(Base.metadata.create_all, bind=engine)
    logger.info("Skipping table creation - handled by Alembic migrations")