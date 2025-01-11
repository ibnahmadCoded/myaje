from venv import logger
import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from models import create_tables
from routes import (auth, inventory, storefront, orders, 
                    marketplace, invoice, chat_inference, 
                    notifications, dashboard, feedback, 
                    admin, restock, admin_restock, banking)
from utils.chatInferenceQueryParser import QueryIntentParser
from banking_automations.automation_processor import process_automations
from sql_database import SessionLocal
from config import FRONTEND_URL, UPLOAD_DIRECTORY, UPLOAD_PATH, BASE_API_PREFIX

# Initialize FastAPI
app = FastAPI()

# Initialize parser
query_parser = QueryIntentParser(confidence_threshold=0.15)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_URL,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount the static files
app.mount(UPLOAD_PATH, StaticFiles(directory=UPLOAD_DIRECTORY), name=UPLOAD_DIRECTORY)

# Global variable for automation task
automation_task = None

@app.on_event("startup")
async def startup_event():
    global automation_task
    await create_tables()
    logger.info("DATABASE TABLES CREATED")

    db = SessionLocal()
    try:
        await auth.create_super_admin(db)
    finally:
        db.close()
    
    # Initialize query parser
    chat_inference.query_parser = query_parser

    # Start automation processor
    logger.info("Starting automation processor as a background task.")
    automation_task = asyncio.create_task(process_automations(), name="AutomationProcessor")
    logger.info(f"Automation processor started: {automation_task.get_name()} (ID: {id(automation_task)})")

@app.on_event("shutdown")
async def shutdown_event():
    global automation_task
    if automation_task and not automation_task.done():
        logger.info("Cancelling automation processor...")
        automation_task.cancel()
        try:
            await automation_task
        except asyncio.CancelledError:
            logger.info("Automation processor task successfully cancelled.")
    logger.info("Shutdown complete.")

@app.get("/automation-status")
async def get_automation_status():
    global automation_task
    if automation_task:
        if automation_task.done():
            return {"status": "completed", "result": automation_task.result() if not automation_task.cancelled() else "Cancelled"}
        else:
            return {"status": "running", "name": automation_task.get_name()}
    return {"status": "not started"}

# Include route 
app.include_router(auth.router, prefix=BASE_API_PREFIX + "/auth", tags=["auth"])
app.include_router(inventory.router, prefix=BASE_API_PREFIX + "/inventory", tags=["inventory"])
app.include_router(storefront.router, prefix=BASE_API_PREFIX + "/storefront", tags=["inventory"])
app.include_router(orders.router, prefix=BASE_API_PREFIX + "/orders", tags=["orders"])
app.include_router(invoice.router, prefix=BASE_API_PREFIX + "/invoicing", tags=["invoicing"])
app.include_router(marketplace.router, prefix=BASE_API_PREFIX + "/marketplace", tags=["marketplace"])
app.include_router(chat_inference.router, prefix=BASE_API_PREFIX + "/chat", tags=["chat"])
app.include_router(notifications.router, prefix=BASE_API_PREFIX + "/notifications", tags=["notifications"])
app.include_router(dashboard.router, prefix=BASE_API_PREFIX + "/dashboard", tags=["dashboard"])
app.include_router(feedback.router, prefix=BASE_API_PREFIX + "/feedback", tags=["feedback"])
app.include_router(admin.router, prefix=BASE_API_PREFIX + "/admin", tags=["admin_management"])
app.include_router(restock.router, prefix=BASE_API_PREFIX + "/restock", tags=["restock"])
app.include_router(router=admin_restock.router, prefix=BASE_API_PREFIX + "/admin/restock", tags=["admin_restock"])
app.include_router(router=banking.router, prefix=BASE_API_PREFIX + "/banking", tags=["banking"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)