# Enhancing Khmer Word Spotting through Model Improvement, Dataset Expansion, and Use-Case Adaptation

> **Technical & Scientific Specification**
>
> **Institution:** Institute of Technology of Cambodia (ITC) — Department of Information and Communication Engineering (GIC)
>
> **Laboratories:** ViLa Lab (ITC) & ISIA Lab (UMONS, Belgium)
>
> **Baseline Reference:** Em, H., Valy, D., Gosselin, B., & Kong, P. (2025). Word Spotting on Khmer Printed Documents. *Techno-Science Research Journal*, 13(2), 33–40.

## 📋 Table of Contents

 1. [Project Overview](#-project-overview)

 2. [Published Baseline Foundation](#-published-baseline-foundation)

 3. [System Architecture & Pipeline](#-system-architecture--pipeline)

 4. [Core Technical Components](#-core-technical-components)

 5. [Technical Deliverables](#-technical-deliverables)

 6. [Quantitative Evaluation Metrics & Benchmarks](#-quantitative-evaluation-metrics--benchmarks)

 7. [Repository Structure](#-repository-structure)

---

## 🔍 Project Overview

Word spotting—the task of localizing and identifying specific target words within scanned documents or images without requiring full-page optical character recognition (OCR)—is critical for indexing and searching large historical and administrative document archives.

In Khmer printed documents, word spotting presents severe technical challenges:
* **Complex Visual Structures & Subscripts:** Khmer script features vertically stacked consonant subscripts (*coeng*) and dependent vowels attached above, below, or around base characters.
* **Absence of Word Spaces:** Unlike Latin scripts, Khmer text contains no explicit spaces between words, rendering traditional rule-based text segmentation impractical.
* **Diverse Fonts & Archive Noise:** Documents exhibit high typographic variance across digital fonts, compounded by real-world degradation such as low-resolution scans, skew, table gridlines, and overlapping red/blue official ministry stamps.

This project extends published master's research to build a production-ready, full-stack searchable document archive portal for Khmer text.

---

## 📊 Published Baseline Foundation

The project builds directly upon established research benchmarks:
* **Text Detection Module:** Adapted `YOLOv8l` on a custom detection dataset of **10,050 synthetic printed PNG document pages** across 10 standard Khmer fonts (*Hanuman*, *Khmer OS Siemreap*, *Khmer OS Battambang*, *Khmer MEF1/MEF2 Regular*, *Khmer Busra*, *Khmer OS Moul*, *Khmer Mondulkiri*, *NIDA Sowanaphum*, and *Khmer M1*), achieving:
  * **Precision:** $0.989$
  * **Recall:** $0.986$
  * **F1-score:** $0.987$
* **Text Recognition Module:** Fine-tuned `TrOCR-small-printed` using the `NllbTokenizer` (`facebook/nllb-200-distilled-600M`) on **28,208 cropped word JPG images** (22,567 training words), achieving a Character Error Rate (CER) of **8.41%**.

---

## ⚙️ System Architecture & Pipeline

To solve the latency limitations of sequential unbatched inference on multi-page PDFs, the system utilizes a **6-stage decoupled asynchronous pipeline**:

```
[ Multi-Page PDF / Scanned Image ] 
       │
       ▼ (PyMuPDF / pdf2image @ ≥200 DPI)
[ 1. Ingestion & Preprocessing ] ──(HSV Color Mask: Remove Stamps)──► [ Deskew & Denoise ]
                                                                             │
       ┌─────────────────────────────────────────────────────────────────────┘
       ▼
[ 2. Text Detection Module ] ──(YOLOv8l / YOLOv11 @ 640×640 + Dynamic BBox Pad)
       │
       ▼ (Extract Bounding Box Crops)
[ 3. Text Recognition Module ] ──(Batched TrOCR + NLLB Inference @ 384×384)
       │
       ▼
[ 4. Post-Processing Module ] ──(Khmer Dictionary Lexicon / Levenshtein Distance & Unicode Normalization)
       │
       ▼
[ 5. Database Indexing ] ──(PostgreSQL / FTS storing Doc ID, Page, BBox, Text, Confidence)
       │
       ▼
[ 6. Web Search Portal UI ] ──(Keyword Query & Interactive SVG/Canvas Bounding-Box Highlighting)
```

---

## 🛠️ Core Technical Components

### 1. Document Preprocessing & Ingestion Engine
* Rasterizes multi-page PDF files into high-resolution images ($\ge 200\text{ DPI}$).
* Applies OpenCV-based Hough transforms for automated page deskewing and adaptive Gaussian thresholding for background noise removal.
* Implements HSV color-space masking to filter out and remove intersecting red/blue official ministry stamps and table gridlines before region detection.

### 2. Text Detection Module (YOLO Variant)
* Employs Ultralytics YOLO architectures (`YOLOv8l` baseline and newer variants like YOLOv11) operating at $640 \times 640$ input resolution.
* Utilizes Complete Intersection over Union (CIoU) and Distribution Focal Loss (DFL) bounding-box regression loss combined with Binary Cross-Entropy (BCE) classification loss.
* Applies dynamic bounding-box expansion (padding ratios) to prevent the clipping of deep subscripts (*coeng*) and tall vowel diacritics.

### 3. Text Recognition Module (TrOCR + NLLB)
* Utilizes a Transformer-based VisionEncoderDecoder architecture (`TrOCR`) initialized with pre-trained image encoders and text decoders.
* Integrates the `NllbTokenizer` (`facebook/nllb-200-distilled-600M`) to correctly process Khmer Unicode tokenizations.
* Employs batched tensor inference (batch size 32/64) on GPU to parallelize recognition across word crops extracted from a document page.

### 4. Post-Processing & Normalization
* Enforces deterministic Khmer Unicode canonical ordering to resolve typing ambiguities across visually identical strings.
* Integrates a Khmer dictionary lexicon ($\ge 30,000$ words) and Levenshtein edit-distance spell-correction algorithms to resolve character substitutions, deletions, and insertions.

### 5. Indexing Database & Search Portal
* Implements an asynchronous backend (FastAPI / Flask) coupled with Celery/Redis worker queues for non-blocking batch document processing.
* Stores normalized structured records—`[document_id, page_number, bounding_box_coords, recognized_text, confidence_score]`—in a PostgreSQL database.
* Features a responsive frontend interface supporting exact/fuzzy keyword querying, confidence threshold filtering, and interactive SVG/Canvas bounding-box highlighting over original document pages.

---

## 📦 Technical Deliverables

1. **Expanded Khmer Dataset:** 
   * **Detection Set:** $\ge 2,500$ annotated document page images in YOLO format (`&lt;class&gt; &lt;x_center&gt; &lt;y_center&gt; &lt;width&gt; &lt;height&gt;`) featuring complex layouts, tables, stamps, and $\ge 5$ new font styles.
   * **Recognition Set:** $\ge 15,000$ new cropped word images mapped to normalized UTF-8 Khmer text labels, covering mixed Latin-Khmer strings and numbers.
2. **Model Weights & Codebase:** Fine-tuned detector and recognizer checkpoints, OpenCV preprocessing scripts, and Khmer lexicon post-processor.
3. **Full-Stack Searchable Web Application:** Asynchronous PDF ingestion engine, PostgreSQL metadata search index, and interactive highlighting viewer.
4. **Benchmark Suite & Technical Report:** Reproducible training scripts, containerized Docker configuration, and a 4-stage ablation study report.

---

## 🎯 Quantitative Evaluation Metrics & Benchmarks

* **Text Detection ($\text{IoU} \ge 0.5$):**
  $$\text{Precision} = \frac{TP}{TP + FP}, \quad \text{Recall} = \frac{TP}{TP + FN}, \quad F1 = \frac{2 \times \text{Precision} \times \text{Recall}}{\text{Precision} + \text{Recall}}$$
  * *Clean Test Set:* Maintain or exceed baseline **F1 $\ge 0.987$** (Precision $\ge 0.989$, Recall $\ge 0.986$).
  * *Noisy/Complex Test Set:* Achieve **F1 $\ge 0.920$** on degraded and stamped documents.

* **Text Recognition (Character Error Rate & Word Error Rate):**
  $$\text{CER} = \frac{\text{Substitutions} + \text{Deletions} + \text{Insertions}}{\text{Total Characters}} \times 100\%$$
  * *Clean Test Set:* Reduce CER from baseline $8.41\%$ to **$< 6.0\%$**.
  * *Real-World Test Set:* Achieve **CER $< 12.0\%$** and **WER $< 18.0\%$** on degraded crops.

* **Information Retrieval & System Throughput:**
  * Achieve **Retrieval F1 $\ge 0.90$** across multi-page PDF archives.
  * Complete page indexing at **$\le 3.0\text{ sec/page}$** (GPU inference) with database keyword queries returning in **$< 200\text{ ms}$**.

---

## 📂 Repository Structure

```
khmer-word-spotting/
├── data/                  # Dataset storage and annotation splits
├── models/                # Saved YOLO and TrOCR model checkpoints
├── preprocessing/         # PDF rasterization, deskewing, denoising, and HSV stamp removal
├── detection/             # YOLO training, validation, and inference modules
├── recognition/           # TrOCR fine-tuning, NLLB tokenizer setup, and batched inference
├── postprocessing/        # Khmer lexicon dictionary, Levenshtein spell-checker, and Unicode normalizer
├── backend/               # FastAPI / Flask REST API and Celery asynchronous task queues
├── frontend/              # Web application interface and SVG/Canvas bounding-box viewer
├── notebooks/             # Exploratory R&D and ablation study Jupyter notebooks
├── scripts/               # End-to-end pipeline execution scripts
├── Dockerfile             # Containerization configuration
├── docker-compose.yml     # Multi-container orchestration (App + DB + Redis)
├── requirements.txt       # Python dependencies
└── README.md              # Project documentation
```

*© 2026 Department of Information and Communication Engineering (GIC), Institute of Technology of Cambodia (ITC).*