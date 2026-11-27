import React, { useState, useRef } from 'react';
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  FileCheck2,
  ChevronLeft,
  ChevronRight,
  Eye,
  RotateCcw,
  Info,
  ScanText,
  Check,
} from 'lucide-react';
import { processDocumentWorkflow, type ProcessedResult } from './services/documentService';
import type { WordSpottingResult } from './types/type';

const PROCESSING_STAGES = [
  'Uploading document',
  'Preparing document pages',
  'Detecting Khmer words (YOLOv8)',
  'Recognizing text (TrOCR)',
  'Indexing recognized words',
  'Processing completed',
];

export default function App() {
  // App States: 'idle' | 'file_selected' | 'processing' | 'completed' | 'error'
  const [appState, setAppState] = useState<'idle' | 'file_selected' | 'processing' | 'completed' | 'error'>('idle');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Processing Progression
  const [currentStage, setCurrentStage] = useState<number>(0);
  const [processedResult, setProcessedResult] = useState<ProcessedResult | null>(null);

  // Preview State
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [previewPage, setPreviewPage] = useState<number>(1);
  const [selectedWordId, setSelectedWordId] = useState<number | null>(null);

  // About Modal State
  const [isAboutOpen, setIsAboutOpen] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // File Validation
  const validateFile = (file: File): boolean => {
    const validExtensions = ['pdf', 'jpg', 'jpeg', 'png'];
    const ext = file.name.split('.').pop()?.toLowerCase();

    if (!ext || !validExtensions.includes(ext)) {
      setErrorMessage('Unsupported file format. Please upload a PDF, JPG, or PNG document.');
      setAppState('error');
      return false;
    }

    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage('File size exceeds the 25 MB limit.');
      setAppState('error');
      return false;
    }

    setErrorMessage('');
    return true;
  };

  // Drag and Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        setAppState('file_selected');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        setAppState('file_selected');
      }
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setAppState('idle');
    setErrorMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Start Processing Document
  const handleStartProcessing = async () => {
    if (!selectedFile) return;

    setAppState('processing');
    setCurrentStage(0);
    setErrorMessage('');

    try {
      const result = await processDocumentWorkflow(selectedFile, (stageIdx) => {
        setCurrentStage(stageIdx);
      });
      setProcessedResult(result);
      setAppState('completed');
      setShowPreview(false);
      setPreviewPage(1);
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during document processing.');
      setAppState('error');
    }
  };

  const handleResetAll = () => {
    setSelectedFile(null);
    setAppState('idle');
    setCurrentStage(0);
    setProcessedResult(null);
    setShowPreview(false);
    setErrorMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Active page words for preview
  const activeWords: WordSpottingResult[] =
    processedResult?.words[previewPage] || [];
  const selectedWord = activeWords.find((w) => w.id === selectedWordId);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans">
      {/* 1. Simple Top Navigation */}
      <header className="h-16 bg-white border-b border-slate-200 px-6 sm:px-12 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white">
            <ScanText className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <span className="font-semibold text-base tracking-tight text-slate-900">Zenith</span>
            <span className="hidden sm:inline-block text-xs text-slate-500 ml-2 font-normal">
              Khmer Document Processing
            </span>
          </div>
        </div>

        <button
          onClick={() => setIsAboutOpen(true)}
          className="text-xs font-medium text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-md hover:bg-slate-100 transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span>About</span>
        </button>
      </header>

      {/* 2. Main Content Area */}
      <main className="flex-1 py-10 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Header Title Section */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Make Your Khmer Documents Searchable
            </h1>
            <p className="text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
              Upload your Khmer documents and let Zenith detect and recognize text automatically.
            </p>
          </div>

          {/* ========================================================== */}
          {/* STATE A: IDLE / FILE SELECTED (Upload View)                 */}
          {/* ========================================================== */}
          {(appState === 'idle' || appState === 'file_selected') && (
            <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-2xs space-y-6">
              {/* Dropzone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-all ${
                  isDragOver
                    ? 'border-blue-600 bg-blue-50/50'
                    : 'border-slate-300 hover:border-slate-400 bg-slate-50/60 hover:bg-slate-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={handleFileSelect}
                />

                <div className="w-12 h-12 bg-white border border-slate-200 rounded-lg flex items-center justify-center mx-auto mb-3 shadow-2xs">
                  <UploadCloud className="w-6 h-6 text-blue-600" />
                </div>

                <p className="text-sm font-semibold text-slate-800">
                  Drag and drop your document here
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  or <span className="text-blue-600 font-medium underline">browse files</span> from your device
                </p>

                <div className="mt-4 pt-3 border-t border-slate-200/80 inline-block text-[11px] text-slate-400">
                  Supported formats: <strong>PDF, JPG, PNG</strong> • Maximum size: <strong>25 MB</strong>
                </div>
              </div>

              {/* Selected File Card */}
              {selectedFile && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-9 h-9 rounded bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="truncate text-left">
                      <p className="text-sm font-medium text-slate-900 truncate">{selectedFile.name}</p>
                      <p className="text-xs text-slate-500">
                        {selectedFile.name.split('.').pop()?.toUpperCase()} • {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded transition-colors cursor-pointer"
                    title="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Primary Action Button */}
              <div className="pt-2 flex justify-center">
                <button
                  type="button"
                  disabled={!selectedFile}
                  onClick={handleStartProcessing}
                  className="w-full sm:w-64 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Process Document
                </button>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* STATE B: PROCESSING (Step-by-step 6-stage view)            */}
          {/* ========================================================== */}
          {appState === 'processing' && (
            <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-2xs space-y-6">
              <div className="text-center space-y-1">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2 border border-blue-200">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
                <h3 className="text-base font-semibold text-slate-900">
                  Your document is being processed. Please wait.
                </h3>
                <p className="text-xs text-slate-500">
                  Processing file: <span className="font-medium text-slate-700">{selectedFile?.name}</span>
                </p>
              </div>

              {/* 6-Stage Vertical Step Progress Indicator */}
              <div className="max-w-md mx-auto py-2">
                <div className="space-y-4">
                  {PROCESSING_STAGES.map((stageName, idx) => {
                    const isDone = currentStage > idx;
                    const isCurrent = currentStage === idx;
                    return (
                      <div key={stageName} className="flex items-center gap-3.5">
                        {/* Step Circle */}
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-colors ${
                            isDone
                              ? 'bg-emerald-600 text-white'
                              : isCurrent
                              ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                              : 'bg-slate-100 text-slate-400 border border-slate-200'
                          }`}
                        >
                          {isDone ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                        </div>

                        {/* Step Label */}
                        <div className="flex-1">
                          <p
                            className={`text-xs font-medium ${
                              isDone
                                ? 'text-slate-800'
                                : isCurrent
                                ? 'text-blue-700 font-semibold'
                                : 'text-slate-400'
                            }`}
                          >
                            {stageName}
                          </p>
                        </div>

                        {/* Status Icon */}
                        {isCurrent && (
                          <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin shrink-0" />
                        )}
                        {isDone && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* STATE C: PROCESSING RESULTS                                */}
          {/* ========================================================== */}
          {appState === 'completed' && processedResult && (
            <div className="space-y-6">
              {/* Summary Card */}
              <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-2xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full border border-emerald-200 mb-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Completed
                    </span>
                    <h2 className="text-lg font-semibold text-slate-900">{processedResult.documentName}</h2>
                  </div>

                  {processedResult.isMock && (
                    <span className="text-[11px] text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                      Demo Mode (Backend Offline)
                    </span>
                  )}
                </div>

                {/* 4 Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/80">
                    <span className="text-xs text-slate-500 font-normal">Number of Pages</span>
                    <p className="text-lg font-bold text-slate-900 mt-0.5">{processedResult.totalPages}</p>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/80">
                    <span className="text-xs text-slate-500 font-normal">Detected Regions</span>
                    <p className="text-lg font-bold text-slate-900 mt-0.5">{processedResult.wordRegionsCount}</p>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/80">
                    <span className="text-xs text-slate-500 font-normal">Recognized Words</span>
                    <p className="text-lg font-bold text-slate-900 mt-0.5">{processedResult.recognizedWordsCount}</p>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/80">
                    <span className="text-xs text-slate-500 font-normal">Processing Time</span>
                    <p className="text-lg font-bold text-slate-900 mt-0.5">{processedResult.durationSeconds}s</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                    className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                    <span>{showPreview ? 'Hide Document Preview' : 'View Document'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetAll}
                    className="w-full sm:w-auto px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Process Another Document</span>
                  </button>
                </div>
              </div>

              {/* ========================================================== */}
              {/* SECTION 6: DOCUMENT PREVIEW (Interactive & Visual)          */}
              {/* ========================================================== */}
              {showPreview && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                  {/* Preview Toolbar */}
                  <div className="px-6 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileCheck2 className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-semibold text-slate-800">
                        Document Word Spotting Preview
                      </span>
                    </div>

                    {/* Page Navigation */}
                    {processedResult.totalPages > 1 && (
                      <div className="flex items-center gap-2 bg-white border border-slate-200 px-2 py-1 rounded-md text-xs">
                        <button
                          disabled={previewPage <= 1}
                          onClick={() => {
                            setPreviewPage((p) => Math.max(1, p - 1));
                            setSelectedWordId(null);
                          }}
                          className="p-0.5 rounded text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-[11px] font-medium text-slate-700">
                          Page {previewPage} of {processedResult.totalPages}
                        </span>
                        <button
                          disabled={previewPage >= processedResult.totalPages}
                          onClick={() => {
                            setPreviewPage((p) => Math.min(processedResult.totalPages, p + 1));
                            setSelectedWordId(null);
                          }}
                          className="p-0.5 rounded text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Two-Column Preview */}
                  <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
                    {/* Left: Document Page Canvas with Bounding Boxes */}
                    <div className="p-6 bg-slate-100 flex justify-center items-start overflow-auto select-none">
                      <div
                        style={{ width: '380px', height: '510px' }}
                        className="relative bg-white shadow-sm border border-slate-300 rounded p-6 text-[10px] leading-relaxed text-slate-800 overflow-hidden"
                      >
                        {/* Page Layout Header */}
                        <div className="text-center mb-4 border-b border-slate-200 pb-2">
                          <p className="font-bold text-[11px] text-slate-900">ព្រះរាជាណាចក្រកម្ពុជា</p>
                          <p className="text-[9px] text-slate-500">ជាតិ សាសនា ព្រះមហាក្សត្រ</p>
                        </div>

                        {/* Page Body Text representation */}
                        <div className="space-y-3 font-sans">
                          <div>
                            <p className="font-bold text-slate-900">រាជរដ្ឋាភិបាលកម្ពុជា</p>
                            <p>ក្រសួងអប់រំ យុវជន និងកីឡា</p>
                            <p>វិទ្យាស្ថានបច្ចេកវិទ្យាកម្ពុជា</p>
                          </div>

                          <div className="text-center my-2 font-bold text-slate-900 text-[11px]">
                            សេចក្តីសម្រេច
                          </div>

                          <p className="leading-snug">
                            ត្រូវបានបង្កើតប្រព័ន្ធស្វែងរកពាក្យខ្មែរដោយស្វ័យប្រវត្តិ (Word Spotting)
                            សម្រាប់ការស្រាវជ្រាវវិទ្យាសាស្ត្រ និងបច្ចេកវិទ្យាកម្រិតខ្ពស់។
                          </p>

                          <p className="leading-snug">
                            គ្រប់ស្ថាប័នរដ្ឋបាលសាធារណៈត្រូវសហការគាំទ្រ និងអនុវត្តគម្រោងស្រាវជ្រាវនេះ។
                          </p>

                          <div className="text-right text-[9px] text-slate-500 pt-6">
                            <p>រាជធានីភ្នំពេញ ថ្ងៃទី ១៥ ខែវិច្ឆិកា ឆ្នាំ២០២៤</p>
                            <p className="font-semibold text-slate-800 mt-1">រដ្ឋមន្ត្រីក្រសួងរដ្ឋបាល</p>
                          </div>
                        </div>

                        {/* Bounding Boxes Overlaid */}
                        {activeWords.map((word) => {
                          // Scale coordinates for 380x510 container
                          const scaleX = 380 / 800;
                          const scaleY = 510 / 1050;
                          const left = word.bbox_x1 * scaleX;
                          const top = word.bbox_y1 * scaleY;
                          const width = (word.bbox_x2 - word.bbox_x1) * scaleX;
                          const height = (word.bbox_y2 - word.bbox_y1) * scaleY;
                          const isSelected = selectedWordId === word.id;

                          return (
                            <div
                              key={word.id}
                              onClick={() => setSelectedWordId(word.id)}
                              style={{
                                left: `${left}px`,
                                top: `${top}px`,
                                width: `${width}px`,
                                height: `${height}px`,
                              }}
                              className={`absolute cursor-pointer rounded-2xs transition-all ${
                                isSelected
                                  ? 'border-2 border-amber-500 bg-amber-400/35 ring-2 ring-amber-300 z-20'
                                  : 'border border-blue-500/50 bg-blue-500/15 hover:bg-blue-500/30 z-10'
                              }`}
                              title={`${word.recognized_text} (${(word.confidence_score * 100).toFixed(1)}%)`}
                            />
                          );
                        })}
                      </div>
                    </div>

                    {/* Right: Recognized Words List */}
                    <div className="p-4 flex flex-col h-[510px]">
                      <div className="pb-2 mb-2 border-b border-slate-100 flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-700">
                          Recognized Text ({activeWords.length} words)
                        </span>
                        <span className="text-[10px] text-slate-400">Click a word to highlight</span>
                      </div>

                      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 pr-1">
                        {activeWords.map((word) => {
                          const isSelected = selectedWordId === word.id;
                          return (
                            <div
                              key={word.id}
                              onClick={() => setSelectedWordId(word.id)}
                              className={`p-2.5 rounded text-left cursor-pointer transition-colors ${
                                isSelected
                                  ? 'bg-blue-50 border border-blue-200'
                                  : 'hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-xs font-semibold text-slate-900 leading-snug">
                                  {word.recognized_text}
                                </span>
                                <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 shrink-0">
                                  {(word.confidence_score * 100).toFixed(0)}%
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {selectedWord && (
                        <div className="mt-3 p-2.5 bg-amber-50 rounded border border-amber-200 text-xs">
                          <span className="text-[10px] text-amber-800 font-medium block">Selected Word:</span>
                          <span className="font-bold text-slate-900">{selectedWord.recognized_text}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================== */}
          {/* STATE D: ERROR HANDLING                                    */}
          {/* ========================================================== */}
          {appState === 'error' && (
            <div className="bg-white p-6 sm:p-8 rounded-xl border border-red-200 shadow-2xs text-center space-y-4">
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto border border-red-200">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">Processing Failed</h3>
                <p className="text-xs text-red-700 mt-1 max-w-sm mx-auto leading-relaxed">
                  {errorMessage || 'Unable to process the document. Please verify the document format and resolution.'}
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleStartProcessing}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
                >
                  Retry Processing
                </button>
                <button
                  type="button"
                  onClick={handleResetAll}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                >
                  Upload Another Document
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 3. About Modal */}
      {isAboutOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">About Zenith</h3>
              <button
                onClick={() => setIsAboutOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              <strong>Zenith</strong> is a specialized Khmer Word Spotting system developed for digitizing and indexing printed Khmer documents without requiring manual OCR calibration.
            </p>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1.5 text-slate-700">
              <div className="font-semibold text-slate-900">Deep Learning Pipeline:</div>
              <div>• <strong>Detection:</strong> YOLOv8l with dynamic subscript (*coeng*) padding</div>
              <div>• <strong>Recognition:</strong> TrOCR-small-printed with NLLB Khmer Tokenizer</div>
              <div>• <strong>Normalization:</strong> Khmer Unicode canonical ordering</div>
            </div>

            <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100 text-center">
              ViLa Lab • Department of GIC • Institute of Technology of Cambodia
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="py-4 border-t border-slate-200 text-center text-xs text-slate-400">
        Zenith — Khmer Document Processing • ViLa Lab ITC
      </footer>
    </div>
  );
}
