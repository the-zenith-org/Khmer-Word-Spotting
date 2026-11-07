from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import os
import shutil

from app.db.db import get_db, engine, Base
from app.models.model import Document, WordSpottingResult
from app.schemas.schema import (
    DocumentResponse,
    WordSpottingResultResponse,
    SearchResultItem,
    BBox,
)

router = APIRouter()

# Auto-create tables if they don't exist
Base.metadata.create_all(bind=engine)

UPLOAD_DIR = os.path.join(os.getcwd(), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.get("/documents", response_model=List[DocumentResponse])
def get_documents(db: Session = Depends(get_db)):
    """List all uploaded documents."""
    return db.query(Document).order_by(Document.created_at.desc()).all()


@router.post("/documents/upload", response_model=DocumentResponse)
async def upload_document(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Upload a new PDF or image document for word spotting processing."""
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    doc = Document(
        filename=file.filename,
        file_path=file_path,
        total_pages=1,
        status="pending",
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


@router.get("/documents/{document_id}", response_model=DocumentResponse)
def get_document(document_id: int, db: Session = Depends(get_db)):
    """Retrieve document by ID."""
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


@router.get("/documents/{document_id}/words", response_model=List[WordSpottingResultResponse])
def get_document_words(
    document_id: int,
    page: Optional[int] = Query(None, description="Filter by page number"),
    db: Session = Depends(get_db),
):
    """Retrieve recognized word spots for a given document."""
    query = db.query(WordSpottingResult).filter(WordSpottingResult.document_id == document_id)
    if page is not None:
        query = query.filter(WordSpottingResult.page_number == page)
    return query.all()


@router.get("/search", response_model=List[SearchResultItem])
def search_keywords(
    q: str = Query(..., description="Khmer keyword or character to search for"),
    min_confidence: float = Query(0.5, ge=0.0, le=1.0, description="Minimum confidence threshold"),
    document_id: Optional[int] = Query(None, description="Optional document filter"),
    db: Session = Depends(get_db),
):
    """Search for words matching a query text across documents."""
    query = (
        db.query(WordSpottingResult, Document)
        .join(Document, WordSpottingResult.document_id == Document.id)
        .filter(WordSpottingResult.recognized_text.ilike(f"%{q}%"))
        .filter(WordSpottingResult.confidence_score >= min_confidence)
    )
    
    if document_id:
        query = query.filter(WordSpottingResult.document_id == document_id)
        
    results = query.all()
    
    output = []
    for word, doc in results:
        output.append(
            SearchResultItem(
                document_id=doc.id,
                filename=doc.filename,
                page_number=word.page_number,
                bbox=BBox(
                    x1=word.bbox_x1,
                    y1=word.bbox_y1,
                    x2=word.bbox_x2,
                    y2=word.bbox_y2,
                ),
                recognized_text=word.recognized_text,
                confidence_score=word.confidence_score,
            )
        )
    return output

