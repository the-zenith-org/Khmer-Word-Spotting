from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Index, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.db import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(512), nullable=False)
    total_pages = Column(Integer, default=1)
    status = Column(String(50), default="pending", index=True)  # pending, processing, completed, failed
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    words = relationship("WordSpottingResult", back_populates="document", cascade="all, delete-orphan")


class WordSpottingResult(Base):
    __tablename__ = "word_spotting_results"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    page_number = Column(Integer, nullable=False, default=1)
    
    # Bounding box coordinates normalized or pixel (x1, y1, x2, y2)
    bbox_x1 = Column(Float, nullable=False)
    bbox_y1 = Column(Float, nullable=False)
    bbox_x2 = Column(Float, nullable=False)
    bbox_y2 = Column(Float, nullable=False)
    
    recognized_text = Column(String(255), nullable=False, index=True)
    normalized_text = Column(String(255), nullable=True, index=True)
    confidence_score = Column(Float, nullable=False, default=1.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    document = relationship("Document", back_populates="words")

    __table_args__ = (
        Index("idx_doc_page", "document_id", "page_number"),
        Index("idx_recognized_text", "recognized_text"),
    )

