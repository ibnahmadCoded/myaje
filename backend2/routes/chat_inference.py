from fastapi import APIRouter, HTTPException
from typing import Dict
#from app import query_parser

router = APIRouter()
query_parser = None

@router.post("/chat_inference")
async def chat_inference(query: Dict[str, str]):
    if not query.get("text"):
        raise HTTPException(status_code=400, detail="Query text is required")
    
    result = query_parser.parse_query(query["text"])
    return result