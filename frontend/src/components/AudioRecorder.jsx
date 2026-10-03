import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, RotateCcw, Send, AlertTriangle, Upload, Calendar, Clock, FileAudio } from 'lucide-react';
import { api } from '../api';

export default function AudioRecorder({ onVoiceProcessed, onError }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [referenceDate, setReferenceDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [permissionError, setPermissionError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioElementRef = useRef(null);
  const fileInputRef = useRef(null);

  // Clean up audio URL on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [audioUrl]);

  // Handle recording timer
  useEffect(() => {
    if (isRecording) {
      setRecordingDuration(0);
      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    setPermissionError(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setAudioBlob(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Determine supported MIME type - Chrome/Firefox prefer audio/webm;codecs=opus
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else {
          mimeType = ''; // Let browser use default
        }
      }

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const finalType = recorder.mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: finalType });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        // Stop all audio tracks to release microphone hardware
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250); // Collect slice every 250ms
      setIsRecording(true);
    } catch (err) {
      console.error('Microphone access denied or unavailable:', err);
      setPermissionError(
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? 'Microphone access was denied. Please grant permission in your browser address bar.'
          : `Microphone error: ${err.message || 'Unable to access audio input device.'}`
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const resetRecording = () => {
    if (isRecording) {
      stopRecording();
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingDuration(0);
    setIsPlaying(false);
    setPermissionError(null);
  };

  const togglePlayback = () => {
    if (!audioElementRef.current) return;
    if (isPlaying) {
      audioElementRef.current.pause();
      setIsPlaying(false);
    } else {
      audioElementRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    setAudioBlob(file);
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    setPermissionError(null);
  };

  const handleProcessVoice = async () => {
    if (!audioBlob) return;

    setIsProcessing(true);
    try {
      const filename = audioBlob.name || 'recording.webm';
      const result = await api.processVoice(audioBlob, filename, referenceDate);
      onVoiceProcessed(result);
    } catch (err) {
      console.error('Error processing voice entry:', err);
      onError(err.message || 'Voice transcription and extraction failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header bar */}
      <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 m-0">
            Voice Ledger Dictation
          </h2>
          <p className="text-xs text-slate-500 m-0 mt-0.5">
            Record daily meal details, student headcount, and expenses naturally.
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-300 text-xs shadow-xs self-start sm:self-auto">
          <Calendar className="w-4 h-4 text-slate-500" />
          <label htmlFor="ref-date" className="text-slate-600 font-medium">
            Entry Date:
          </label>
          <input
            id="ref-date"
            type="date"
            value={referenceDate}
            onChange={(e) => setReferenceDate(e.target.value)}
            disabled={isRecording || isProcessing}
            className="border-none p-0 text-slate-800 font-semibold focus:outline-none focus:ring-0 bg-transparent cursor-pointer"
          />
        </div>
      </div>

      {/* Main recording body */}
      <div className="p-6 sm:p-8 flex flex-col items-center justify-center">
        {permissionError && (
          <div className="w-full mb-6 p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-3 text-rose-800 text-xs sm:text-sm">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold m-0">Microphone Access Error</p>
              <p className="m-0 mt-1">{permissionError}</p>
            </div>
          </div>
        )}

        {/* Recording Animation & Timer State */}
        <div className="flex flex-col items-center my-4">
          <div className="relative flex items-center justify-center">
            {isRecording && (
              <>
                <span className="absolute w-28 h-28 rounded-full bg-rose-500/20 animate-ping" />
                <span className="absolute w-36 h-36 rounded-full bg-rose-500/10 animate-pulse" />
              </>
            )}

            {!audioBlob ? (
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isProcessing}
                className={`relative z-10 w-24 h-24 rounded-full flex flex-col items-center justify-center transition-all shadow-lg active:scale-95 ${
                  isRecording
                    ? 'bg-rose-600 hover:bg-rose-700 text-white ring-4 ring-rose-300'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-emerald-200'
                }`}
                title={isRecording ? 'Click to Stop Recording' : 'Click to Start Recording'}
              >
                {isRecording ? (
                  <>
                    <Square className="w-8 h-8 fill-current mb-1" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Stop</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-8 h-8 mb-1" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Record</span>
                  </>
                )}
              </button>
            ) : (
              <div className="w-24 h-24 rounded-full bg-emerald-50 border-2 border-emerald-500 flex flex-col items-center justify-center text-emerald-700 shadow-sm">
                <FileAudio className="w-8 h-8 mb-1" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Recorded</span>
              </div>
            )}
          </div>

          {/* Timer Display */}
          <div className="mt-4 text-center">
            <span
              className={`font-mono text-2xl font-bold tracking-tight ${
                isRecording ? 'text-rose-600' : 'text-slate-700'
              }`}
            >
              {formatTimer(recordingDuration)}
            </span>
            <p className="text-xs text-slate-500 mt-0.5">
              {isRecording
                ? 'Recording in progress... Speak clearly.'
                : audioBlob
                ? 'Audio captured. Review or submit below.'
                : 'Click button to begin dictation.'}
            </p>
          </div>
        </div>

        {/* Audio Player and Actions once recorded */}
        {audioBlob && audioUrl && (
          <div className="w-full max-w-md mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-3">
            <audio
              ref={audioElementRef}
              src={audioUrl}
              onEnded={handleAudioEnded}
              className="hidden"
            />

            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={togglePlayback}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition-colors"
              >
                {isPlaying ? <Pause className="w-4 h-4 text-amber-600" /> : <Play className="w-4 h-4 text-emerald-600" />}
                <span>{isPlaying ? 'Pause Audio' : 'Play Recording'}</span>
              </button>

              <button
                type="button"
                onClick={resetRecording}
                disabled={isProcessing}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-slate-600 hover:text-rose-600 text-xs font-medium hover:bg-rose-50 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Re-record</span>
              </button>
            </div>

            {/* Submit for AI processing */}
            <button
              type="button"
              onClick={handleProcessVoice}
              disabled={isProcessing}
              className={`w-full mt-2 py-3 px-4 rounded-lg font-bold text-sm text-white flex items-center justify-center gap-2 shadow-sm transition-all ${
                isProcessing
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20 active:scale-[0.99]'
              }`}
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Transcribing & Extracting Ledger Data...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Extract Ledger from Voice</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Fallback File Upload */}
        {!isRecording && !audioBlob && (
          <div className="mt-6 pt-6 border-t border-slate-100 w-full max-w-md flex flex-col items-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,.webm,.m4a,.wav,.mp3"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1.5 transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-slate-400" />
              <span>Or upload an existing audio recording file</span>
            </button>
          </div>
        )}
      </div>

      {/* Suggested voice phrasing guide */}
      <div className="bg-slate-50/70 px-5 py-3 border-t border-slate-200 text-xs text-slate-600">
        <p className="font-semibold text-slate-700 mb-1">Dictation Example:</p>
        <p className="italic text-slate-600 m-0">
          "Today is October 3rd, 2026. Menu was khichdi and egg curry. Egg was 90 rupees, oil 220, dal 85, vegetables 60. Class 5 had 18 students, class 6 had 20, class 7 had 22, class 8 had 25. Opening rice was 45 kg, closing rice 38 kg."
        </p>
      </div>
    </div>
  );
}
