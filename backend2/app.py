from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from models import create_tables
from routes import auth, inventory

# Initialize FastAPI
app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount the static files
app.mount("/uploaded_images", StaticFiles(directory="uploaded_images"), name="uploaded_images")

@app.on_event("startup")
async def startup_event():
    # Logic for startup, such as creating tables or connecting to databases
    await create_tables() 

# Include route modules
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(inventory.router, prefix="/inventory", tags=["inventory"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)