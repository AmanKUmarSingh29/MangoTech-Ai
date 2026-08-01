"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
} from "lucide-react";

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setError(null);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.type === "application/pdf") {
      setFile(droppedFile);
    } else {
      setError("Please upload a PDF file");
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const selectedFile = e.target.files?.[0];
    if (selectedFile?.type === "application/pdf") {
      setFile(selectedFile);
    } else if (selectedFile) {
      setError("Please upload a PDF file");
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Upload failed");
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/documents/${data.id}`);
      }, 1500);
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="p-8 max-w-3xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Upload className="text-mango" size={32} />
          Upload PDF
        </h1>
        <p className="text-slate-400">
          Upload your study notes or documents for AI-powered analysis, summarization, and quiz generation.
        </p>
      </div>

      {success ? (
        <div className="bg-dark-card border border-green-500/30 rounded-2xl p-12 text-center animate-slide-up">
          <CheckCircle2 className="mx-auto text-green-400 mb-4" size={64} />
          <h2 className="text-2xl font-bold text-green-400 mb-2">
            Upload Successful!
          </h2>
          <p className="text-slate-400">
            Redirecting to document page...
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
              dragActive
                ? "border-mango bg-mango/5 scale-[1.02]"
                : file
                ? "border-green-500/40 bg-green-500/5"
                : "border-dark-border bg-dark-card hover:border-slate-500"
            }`}
          >
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />

            {file ? (
              <div className="space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-400/10 rounded-2xl">
                  <FileText className="text-green-400" size={32} />
                </div>
                <div>
                  <p className="font-semibold text-lg">{file.name}</p>
                  <p className="text-sm text-slate-400 mt-1">
                    {formatSize(file.size)}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                  className="inline-flex items-center gap-1 text-sm text-red-400 hover:text-red-300 transition-colors"
                >
                  <X size={14} />
                  Remove file
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-mango/10 rounded-2xl">
                  <Upload className="text-mango" size={32} />
                </div>
                <div>
                  <p className="font-semibold text-lg">
                    Drag & drop your PDF here
                  </p>
                  <p className="text-sm text-slate-400 mt-1">
                    or click to browse files
                  </p>
                </div>
                <p className="text-xs text-slate-500">
                  Supported: PDF files up to 20MB
                </p>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-400/10 border border-red-400/20 rounded-xl text-red-400 animate-slide-up">
              <AlertCircle size={20} />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className={`w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-3 transition-all duration-300 ${
              file && !uploading
                ? "gradient-mango text-black hover:opacity-90 shadow-lg shadow-mango/20"
                : "bg-dark-border text-slate-500 cursor-not-allowed"
            }`}
          >
            {uploading ? (
              <>
                <Loader2 className="animate-spin" size={22} />
                Processing PDF...
              </>
            ) : (
              <>
                <Upload size={22} />
                Upload & Analyze
              </>
            )}
          </button>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            {[
              {
                icon: "🧠",
                title: "AI Summarization",
                desc: "Get concise summaries of your material",
              },
              {
                icon: "❓",
                title: "Auto Quiz",
                desc: "Generate practice questions instantly",
              },
              {
                icon: "💬",
                title: "Smart Q&A",
                desc: "Ask questions and get intelligent answers",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="bg-dark-card border border-dark-border rounded-xl p-4 text-center"
              >
                <div className="text-2xl mb-2">{feature.icon}</div>
                <p className="font-medium text-sm mb-1">{feature.title}</p>
                <p className="text-xs text-slate-500">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
