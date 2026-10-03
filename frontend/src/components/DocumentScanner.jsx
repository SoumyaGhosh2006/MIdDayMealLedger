import React, { useState, useRef, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { 
  Camera, 
  CameraOff, 
  Aperture, 
  FileDown, 
  Trash2, 
  Upload, 
  AlertCircle, 
  CheckCircle2, 
  Eye, 
  RotateCcw,
  Sparkles
} from 'lucide-react';

export default function DocumentScanner() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [capturedPages, setCapturedPages] = useState([]);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [activePreviewPage, setActivePreviewPage] = useState(null);

  // Stop camera stream safely
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  // Start camera stream using rear/environment camera
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API is not supported in this browser environment.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err) {
      console.error('Camera initialization failed:', err);
      let msg = 'Failed to access camera.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Camera permission was denied. Please allow camera permissions in your browser.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'No camera device found on this system. You can upload document images below.';
      } else if (err.message) {
        msg = err.message;
      }
      setCameraError(msg);
      setIsCameraActive(false);
    }
  };

  // Cleanup camera stream when component unmounts
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Capture frame from active video stream
  const handleSnapPage = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, width, height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedPages((prev) => [...prev, dataUrl]);
  };

  // Fallback / Supplementary image file upload
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCapturedPages((prev) => [...prev, event.target.result]);
        }
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Remove a captured page
  const handleRemovePage = (indexToRemove) => {
    setCapturedPages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    if (activePreviewPage === indexToRemove) {
      setActivePreviewPage(null);
    }
  };

  // Clear all captured pages
  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all scanned pages?')) {
      setCapturedPages([]);
      setActivePreviewPage(null);
    }
  };

  // Generate multi-page PDF using jsPDF
  const handleGeneratePDF = async () => {
    if (!capturedPages.length) return;

    setIsGeneratingPdf(true);
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth(); // 210 mm
      const pageHeight = pdf.internal.pageSize.getHeight(); // 297 mm
      const margin = 10; // 10mm margins
      const maxW = pageWidth - margin * 2;
      const maxH = pageHeight - margin * 2;

      for (let i = 0; i < capturedPages.length; i++) {
        if (i > 0) {
          pdf.addPage();
        }

        const imgData = capturedPages[i];

        // Load image into HTML Image element to determine aspect ratio
        await new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            const ratio = img.width / img.height;
            let renderW = maxW;
            let renderH = renderW / ratio;

            if (renderH > maxH) {
              renderH = maxH;
              renderW = renderH * ratio;
            }

            const posX = (pageWidth - renderW) / 2;
            const posY = (pageHeight - renderH) / 2;

            pdf.addImage(imgData, 'JPEG', posX, posY, renderW, renderH, undefined, 'FAST');
            resolve();
          };
          img.onerror = reject;
          img.src = imgData;
        });
      }

      pdf.save('scanned_document.pdf');
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      alert('Error generating PDF: ' + (err.message || 'Unknown error'));
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/50">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 border border-indigo-200 rounded-md text-indigo-700">
              <Camera className="w-4 h-4" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-800 m-0">
              Institutional Document Scanner
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1 m-0">
            Scan physical bills, grocery receipts, inspection reports, and vouchers directly into a consolidated PDF.
          </p>
        </div>

        {/* Camera Start / Stop Controls */}
        <div className="flex items-center gap-2">
          {isCameraActive ? (
            <button
              type="button"
              onClick={stopCamera}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition-colors"
            >
              <CameraOff className="w-3.5 h-3.5" />
              <span>Turn Off Camera</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={startCamera}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Activate Camera</span>
            </button>
          )}

          {/* Supplementary File Upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition-colors"
            title="Upload photo from device storage"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Upload Image</span>
          </button>
        </div>
      </div>

      {/* Camera Live View & Capture Section */}
      <div className="p-4 sm:p-5">
        {cameraError && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold m-0">{cameraError}</p>
              <p className="mt-0.5 text-amber-800 m-0">
                You can still attach documents using the <strong>Upload Image</strong> button above.
              </p>
            </div>
          </div>
        )}

        {isCameraActive ? (
          <div className="space-y-3">
            <div className="relative rounded-xl overflow-hidden bg-black border border-slate-800 aspect-video max-h-[360px] flex items-center justify-center">
              <video
                ref={videoRef}
                playsInline
                autoPlay
                muted
                className="w-full h-full object-cover"
              />

              {/* Viewfinder Overlay */}
              <div className="absolute inset-4 sm:inset-6 border-2 border-dashed border-white/40 rounded-lg pointer-events-none flex items-center justify-center">
                <span className="text-[11px] font-medium text-white/70 bg-black/40 px-2 py-0.5 rounded backdrop-blur-xs">
                  Align Document Within Frame
                </span>
              </div>
            </div>

            {/* Snap Button */}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleSnapPage}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all"
              >
                <Aperture className="w-4 h-4 animate-spin-slow" />
                <span>Snap Page #{capturedPages.length + 1}</span>
              </button>
            </div>
          </div>
        ) : (
          !cameraError && (
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center bg-slate-50/50">
              <div className="w-12 h-12 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                <Camera className="w-6 h-6" />
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-700 m-0">
                Camera is Inactive
              </h4>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-1 max-w-md mx-auto m-0">
                Click <strong>Activate Camera</strong> to scan physical receipts, vouchers, or inspection records using your phone or webcam.
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={startCamera}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Activate Camera</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-500" />
                  <span>Select from Files</span>
                </button>
              </div>
            </div>
          )
        )}

        {/* Captured Pages Gallery & Action Bar */}
        <div className="mt-6 pt-5 border-t border-slate-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Captured Pages
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                {capturedPages.length} {capturedPages.length === 1 ? 'Page' : 'Pages'}
              </span>
            </div>

            {capturedPages.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-800 px-2 py-1 rounded hover:bg-rose-50 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear All</span>
                </button>

                <button
                  type="button"
                  onClick={handleGeneratePDF}
                  disabled={isGeneratingPdf}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                >
                  {isGeneratingPdf ? (
                    <>
                      <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                      <span>Generating PDF...</span>
                    </>
                  ) : (
                    <>
                      <FileDown className="w-3.5 h-3.5" />
                      <span>Generate PDF</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {capturedPages.length === 0 ? (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center text-xs text-slate-500">
              No pages captured yet. Snap a picture with the camera or upload an image to build your document.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {capturedPages.map((pageDataUrl, idx) => (
                <div
                  key={idx}
                  className="relative group rounded-lg border border-slate-200 overflow-hidden bg-slate-100 shadow-2xs aspect-[3/4] flex flex-col"
                >
                  <img
                    src={pageDataUrl}
                    alt={`Page ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />

                  {/* Page Badge */}
                  <div className="absolute top-1.5 left-1.5 bg-slate-900/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded backdrop-blur-xs">
                    Page {idx + 1}
                  </div>

                  {/* Quick Delete Overlay Button */}
                  <button
                    type="button"
                    onClick={() => handleRemovePage(idx)}
                    title="Remove this page"
                    className="absolute top-1.5 right-1.5 bg-rose-600/90 hover:bg-rose-700 text-white p-1 rounded transition-opacity shadow-xs"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>

                  {/* Click to preview */}
                  <button
                    type="button"
                    onClick={() => setActivePreviewPage(pageDataUrl)}
                    title="Preview full size"
                    className="absolute bottom-1.5 right-1.5 bg-slate-900/70 hover:bg-slate-900 text-white p-1 rounded backdrop-blur-xs transition-opacity"
                  >
                    <Eye className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Fullsize image preview modal */}
      {activePreviewPage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setActivePreviewPage(null)}
        >
          <div
            className="max-w-3xl max-h-[90vh] bg-white rounded-xl overflow-hidden shadow-2xl p-2 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-3 py-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-700">Scanned Page Preview</span>
              <button
                type="button"
                onClick={() => setActivePreviewPage(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold px-2 py-0.5 rounded hover:bg-slate-100"
              >
                Close ✕
              </button>
            </div>
            <div className="p-2 overflow-auto max-h-[80vh] flex justify-center">
              <img
                src={activePreviewPage}
                alt="Enlarged page"
                className="max-w-full max-h-[75vh] object-contain rounded"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
