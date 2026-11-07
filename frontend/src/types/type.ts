export interface BBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface WordSpottingResult {
  id: number;
  document_id: number;
  page_number: number;
  bbox_x1: number;
  bbox_y1: number;
  bbox_x2: number;
  bbox_y2: number;
  recognized_text: str;
  normalized_text?: string;
  confidence_score: number;
  created_at: string;
}

export interface DocumentItem {
  id: number;
  filename: string;
  file_path: string;
  total_pages: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
}

export interface SearchResultItem {
  document_id: number;
  filename: string;
  page_number: number;
  bbox: BBox;
  recognized_text: string;
  confidence_score: number;
}

