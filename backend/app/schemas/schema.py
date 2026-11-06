from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# Bounding box schema
class BBox(BaseModel):
    x1: float
    y1: float
    x2: float
    y2: float

# Word spotting schemas
class WordSpottingResultBase(BaseModel):
    page_number: int
    bbox_x1: float
    bbox_y1: float
    bbox_x2: float
    bbox_y2: float
    recognized_text: str
    normalized_text: Optional[str] = None
    confidence_score: float

class WordSpottingResultCreate(WordSpottingResultBase):
    document_id: int

class WordSpottingResultResponse(WordSpottingResultBase):
    id: int
    document_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Document schemas
class DocumentBase(BaseModel):
    filename: str

class DocumentCreate(DocumentBase):
    file_path: str
    total_pages: Optional[int] = 1

class DocumentResponse(DocumentBase):
    id: int
    file_path: str
    total_pages: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# Search schemas
class SearchQuery(BaseModel):
    query: str
    min_confidence: Optional[float] = 0.5
    document_id: Optional[int] = None
    page_number: Optional[int] = None

class SearchResultItem(BaseModel):
    document_id: int
    filename: str
    page_number: int
    bbox: BBox
    recognized_text: str
    confidence_score: float

