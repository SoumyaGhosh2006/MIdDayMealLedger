import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  FileText, 
  Calendar, 
  Save, 
  RefreshCw, 
  Trash2, 
  Clock, 
  Copy, 
  Check, 
  AlertCircle,
  CheckCircle2,
  FileCheck2,
  Bookmark,
  Sparkles,
  UploadCloud,
  FileUp,
  Download,
  HelpCircle,
  Lightbulb,
  X,
  FileCode,
  Layers,
  GraduationCap
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { api, generateTeachingAid } from '../api';
import DocumentScanner from './DocumentScanner';


export default function AdminNotes() {
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [content, setContent] = useState('');
  const [notes, setNotes] = useState([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Teaching Aid State
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isGeneratingAid, setIsGeneratingAid] = useState(false);
  const [teachingAid, setTeachingAid] = useState(null);
  const [aidError, setAidError] = useState(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [copiedAidMarkdown, setCopiedAidMarkdown] = useState(false);
  const fileInputRef = useRef(null);

  // Load existing administrative notes
  const loadNotes = useCallback(async () => {
    setIsLoadingNotes(true);
    try {
      const data = await api.fetchNotes();
      setNotes(data);
    } catch (err) {
      console.error('Failed to load admin notes:', err);
    } finally {
      setIsLoadingNotes(false);
    }
  }, []);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  // Handle Save Note
  const handleSaveNote = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSaving(true);
    setFeedback(null);
    try {
      const created = await api.saveNote({
        date,
        content: content.trim(),
      });

      setNotes((prev) => [created, ...prev]);
      setContent('');
      setFeedback({
        type: 'success',
        message: 'Administrative note successfully saved!',
      });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err) {
      console.error('Failed to save note:', err);
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to persist note to database.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Delete Note
  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Are you sure you want to delete this administrative note?')) {
      return;
    }

    try {
      await api.deleteNote(noteId);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
    } catch (err) {
      console.error('Failed to delete note:', err);
      alert('Error deleting note: ' + (err.message || 'Unknown error'));
    }
  };

  // Copy note text to clipboard
  const handleCopyNote = async (id, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Clipboard copy failed:', err);
    }
  };

  // Quick insertion of pre-defined institutional templates
  const handleInsertTemplate = (templateText) => {
    setContent((prev) => (prev ? `${prev}\n${templateText}` : templateText));
  };

  // Handle Teaching Aid file selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setAidError(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
      setAidError(null);
    }
  };

  // Generate Teaching Aid via Groq LLM API
  const handleGenerateTeachingAid = async () => {
    if (!selectedFile) return;

    setIsGeneratingAid(true);
    setAidError(null);
    try {
      const generateFn = api?.generateTeachingAid || generateTeachingAid;
      const result = await generateFn(selectedFile);
      setTeachingAid(result);

    } catch (err) {
      console.error('Teaching aid generation failed:', err);
      setAidError(err.message || 'Failed to generate teaching aid from document.');
    } finally {
      setIsGeneratingAid(false);
    }
  };

  // Convert rendered teaching aid preview into PDF using html-to-image (toPng) & jsPDF
  const handleDownloadTeachingAidPdf = async () => {
    if (!teachingAid) return;
    const element = document.getElementById('teaching-aid-preview');
    if (!element) return;

    setIsExportingPdf(true);
    try {
      const dataUrl = await toPng(element, { backgroundColor: '#ffffff', pixelRatio: 2 });
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (element.offsetHeight * pdfWidth) / element.offsetWidth;
      const pageHeight = pdf.internal.pageSize.getHeight();

      if (pdfHeight > pageHeight) {
        let heightLeft = pdfHeight;
        let position = 0;
        pdf.addImage(dataUrl, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
        while (heightLeft > 0) {
          position -= pageHeight;
          pdf.addPage();
          pdf.addImage(dataUrl, 'PNG', 0, position, pdfWidth, pdfHeight);
          heightLeft -= pageHeight;
        }
      } else {
        pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      }

      // Strictly use smart_filename returned by the backend
      const smartFilename = teachingAid.smart_filename
        ? teachingAid.smart_filename.replace(/[^a-zA-Z0-9_-]/g, '_')
        : 'Teaching_Aid';

      pdf.save(smartFilename + '.pdf');
    } catch (err) {
      console.error("PDF Export Error:", err);
      alert("PDF Export Error: " + (err.message || 'Unknown error'));
    } finally {
      setIsExportingPdf(false);
    }
  };


  const handleCopyAidMarkdown = async () => {
    if (!teachingAid?.markdown_content) return;
    try {
      const sanitizedMarkdown = teachingAid.markdown_content.replace(/\\n/g, '\n');
      await navigator.clipboard.writeText(sanitizedMarkdown);
      setCopiedAidMarkdown(true);
      setTimeout(() => setCopiedAidMarkdown(false), 2000);
    } catch (err) {

      console.error('Failed to copy markdown:', err);
    }
  };

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        return d.toLocaleDateString('en-IN', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const formatTimestamp = (isoStr) => {
    if (!isoStr) return '';
    try {
      const dt = new Date(isoStr);
      return dt.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const sanitizedMarkdown = teachingAid ? (teachingAid.markdown_content || '').replace(/\\n/g, '\n') : '';

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-5 sm:p-6 shadow-sm border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Bookmark className="w-4 h-4" />
            <span>Administrative Office & Pedagogical Hub</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white m-0">
            Principal's Notes & AI Teaching Aid Generator
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-normal m-0">
            Record official administrative memos, digitize vouchers into multi-page PDFs, and transform curriculum chapters into structured formula guides, HOTS questions, and whiteboard SVG diagrams.
          </p>
        </div>
      </div>

      {/* SECTION 1: AI TEACHING AID GENERATOR */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-emerald-50/40">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-100 border border-emerald-200 rounded-md text-emerald-800">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-800 m-0 flex items-center gap-1.5">
                AI Teaching Aid Generator
                <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider">
                  AI Powered
                </span>
              </h3>
              <p className="text-xs text-slate-500 m-0 mt-0.5">
                Upload textbook chapters, scanned notes, or lesson plans (PDF/TXT) to extract formulas, HOTS questions, and SVG diagrams.
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5 space-y-4">
          {aidError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold m-0">{aidError}</p>
                <p className="text-[11px] text-rose-700 m-0 mt-0.5">
                  Please ensure the document contains selectable text or clear syllabus content.
                </p>
              </div>
            </div>
          )}

          {/* Upload Zone (Drag-and-Drop) */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-emerald-500 bg-emerald-50/60'
                : selectedFile
                ? 'border-emerald-300 bg-emerald-50/20'
                : 'border-slate-300 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-400'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.md,text/plain,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>

            {selectedFile ? (
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-800 shadow-2xs">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span className="truncate max-w-xs">{selectedFile.name}</span>
                  <span className="text-slate-400 text-[11px]">
                    ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="p-0.5 text-slate-400 hover:text-rose-600"
                    title="Remove file"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">Click or drop another file to replace</p>
              </div>
            ) : (
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-700 m-0">
                  Drop curriculum PDF or document here, or <span className="text-emerald-700 underline">browse</span>
                </h4>
                <p className="text-[11px] text-slate-500 mt-1 m-0">
                  Supports PDF syllabus chapters, lesson text notes, or scanned documents with text (up to 25MB).
                </p>
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <span className="text-xs text-slate-500 hidden sm:inline">
              Formulas • Higher-Order Thinking Skills • Whiteboard SVGs
            </span>

            <button
              type="button"
              onClick={handleGenerateTeachingAid}
              disabled={isGeneratingAid || !selectedFile}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-xs sm:text-sm shadow-sm transition-all ml-auto"
            >
              {isGeneratingAid ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Teaching Aid...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-emerald-200" />
                  <span>Generate Teaching Aid</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Teaching Aid Preview & Download Card */}
        {teachingAid && (
          <div className="border-t border-slate-200 bg-slate-50/40 p-4 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Target Smart Filename
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs sm:text-sm font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {teachingAid.smart_filename}.pdf
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
                <button 
                  type="button"
                  onClick={() => {
                    const markdownData = sanitizedMarkdown || (teachingAid?.markdown_content || '').replace(/\\n/g, '\n');
                    navigator.clipboard.writeText(markdownData);
                    window.open('https://docs.google.com/document/create', '_blank');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold transition-colors shadow-2xs"
                  title="Copy markdown and open new Google Doc to paste"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>Edit in Google Docs</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyAidMarkdown}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition-colors"
                >
                  {copiedAidMarkdown ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Markdown</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleDownloadTeachingAidPdf}
                  disabled={isExportingPdf}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                >
                  {isExportingPdf ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Creating PDF...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Teaching Aid</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Document Render Container (Targeted by html2canvas for PDF download) */}
            <div
              id="teaching-aid-preview"
              className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6"
            >
              {/* Document Header for Print / PDF */}
              <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-slate-900 m-0">
                    Teacher's Conceptual Guide & Pedagogical Aid
                  </h1>
                  <p className="text-xs text-slate-500 m-0 mt-0.5 font-mono">
                    Topic Reference: {teachingAid.smart_filename}
                  </p>
                </div>
                <div className="text-right text-[11px] text-slate-400">
                  Generated via SchoolDesk
                </div>
              </div>

              {/* Rendered Markdown Body with LaTeX Math */}
              <div className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-slate-800 prose-table:border-collapse prose-table:w-full prose-th:border prose-th:border-slate-300 prose-th:bg-slate-100 prose-th:p-3 prose-td:border prose-td:border-slate-300 prose-td:p-3 prose-code:text-blue-600">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm, remarkMath]} 
                  rehypePlugins={[rehypeKatex]}
                >
                  {sanitizedMarkdown}
                </ReactMarkdown>
              </div>

              {/* Rendered SVG Diagrams */}
              {teachingAid.svg_diagrams && teachingAid.svg_diagrams.length > 0 && (
                <div className="pt-4 border-t border-slate-200 space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 m-0 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-600" />
                    <span>Whiteboard & Classroom Visual Diagrams ({teachingAid.svg_diagrams.length})</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {teachingAid.svg_diagrams.map((svgString, sIdx) => (
                      <div
                        key={sIdx}
                        className="p-4 bg-slate-50/60 rounded-xl border border-slate-200 flex flex-col items-center justify-center"
                      >
                        <div className="w-full flex justify-between items-center text-[11px] font-semibold text-slate-500 mb-2">
                          <span>Diagram #{sIdx + 1}</span>
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            SVG Vector
                          </span>
                        </div>
                        <div className="w-full overflow-hidden p-2 bg-white rounded-lg border border-slate-200 shadow-2xs flex items-center justify-center">
                          <div dangerouslySetInnerHTML={{ __html: svgString }} className="w-full h-auto" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: ADMINISTRATIVE NOTE WRITING */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-700">
              <FileText className="w-4 h-4" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-800 m-0">
              Write Administrative Note
            </h3>
          </div>
        </div>

        <form onSubmit={handleSaveNote} className="p-4 sm:p-5 space-y-4">
          {feedback && (
            <div
              className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-rose-50 border-rose-300 text-rose-900'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span className="font-semibold">{feedback.message}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-full sm:w-64">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Record Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              </div>
            </div>

            <div className="w-full sm:w-auto flex-1">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Quick Template Inserts
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'BEO Inspection Visit: All registers inspected and verified.',
                  'Stock Alert: Rice stock low, replenishment requested from block coordinator.',
                  'Vegetable & Grocery Quality Check passed.',
                  'Cook-cum-Helper attendance full.',
                ].map((tpl, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleInsertTemplate(tpl)}
                    className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded border border-slate-200 transition-colors text-left"
                  >
                    + {tpl.split(':')[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Note Content / Remarks
            </label>
            <textarea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter official remarks, inspection observations, supplier delivery notes, or meal quality audits..."
              required
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white resize-y font-sans leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={isSaving || !content.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-xs sm:text-sm shadow-sm transition-all"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving to Database...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Note</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 3: CLIENT-SIDE PDF DOCUMENT SCANNER */}
      <DocumentScanner />

      {/* SECTION 4: ARCHIVED ADMINISTRATIVE NOTES */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-50 border border-amber-200 rounded-md text-amber-700">
              <FileCheck2 className="w-4 h-4" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-800 m-0">
              Archived Administrative Notes
            </h3>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 ml-1">
              {notes.length}
            </span>
          </div>

          <button
            type="button"
            onClick={loadNotes}
            disabled={isLoadingNotes}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingNotes ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="p-4 sm:p-5">
          {isLoadingNotes ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
              Loading administrative notes...
            </div>
          ) : notes.length === 0 ? (
            <div className="p-8 text-center bg-slate-50/50 border border-dashed border-slate-200 rounded-xl">
              <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <h4 className="text-xs sm:text-sm font-bold text-slate-700 m-0">No Notes Recorded Yet</h4>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-1 max-w-sm mx-auto m-0">
                Use the editor above to save your first administrative remark or inspection note.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 hover:bg-slate-50 hover:border-slate-300 transition-all flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-800 bg-white border border-slate-200 px-2 py-0.5 rounded shadow-2xs">
                        <Calendar className="w-3 h-3 text-emerald-600" />
                        {formatDateDisplay(note.date)}
                      </span>
                      {note.created_at && (
                        <span className="text-[10px] text-slate-400">
                          Recorded at {formatTimestamp(note.created_at)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleCopyNote(note.id, note.content)}
                        title="Copy note text"
                        className="p-1 text-slate-400 hover:text-slate-700 hover:bg-white rounded transition-colors"
                      >
                        {copiedId === note.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteNote(note.id)}
                        title="Delete note"
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-wrap leading-relaxed m-0 font-sans">
                    {note.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
