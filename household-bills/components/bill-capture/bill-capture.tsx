"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";

export function BillCapture() {
  const [open, setOpen] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file");
        return;
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      if (file.size > maxSize) {
        alert("File size must be less than 10MB");
        return;
      }

      setSelectedFile(file);

      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  // Handle retake
  const handleRetake = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle continue - Process OCR
  const handleContinue = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Create form data
      const formData = new FormData();
      formData.append("file", selectedFile);

      // Call OCR API
      const response = await fetch("/api/ocr", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to process receipt");
      }

      // TODO: Story 1.3 will implement the edit form
      // For now, show the extracted data in an alert
      const { amount, currency, dueDate, vendor, confidence } = result.data;
      const confidenceInfo = `Confidence: Amount=${(confidence.amount * 100).toFixed(0)}%, Vendor=${(confidence.vendor * 100).toFixed(0)}%`;

      alert(
        `OCR Processing Complete!\n\n` +
        `Vendor: ${vendor || "Not detected"}\n` +
        `Amount: ${amount ? `${currency} ${amount}` : "Not detected"}\n` +
        `Due Date: ${dueDate || "Not detected"}\n\n` +
        `${confidenceInfo}\n\n` +
        `Story 1.3 will add an editable form for these values.`
      );

      console.log("OCR Result:", result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to process receipt";
      setError(errorMessage);
      console.error("OCR error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Cleanup preview URL on unmount or when file changes
  React.useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Reset state when dialog closes
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      handleRetake();
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>Add Bill</Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Bill</DialogTitle>
            <DialogClose asChild>
              <Button variant="outline" size="sm">
                Close
              </Button>
            </DialogClose>
          </DialogHeader>

          <div className="space-y-4">
            {/* File Upload / Camera Capture */}
            {!previewUrl && (
              <div>
                <input
                  ref={fileInputRef}
                  id="billImage"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={isProcessing}
                />
                <label
                  htmlFor="billImage"
                  className={`block rounded-xl border border-dashed border-gray-300 py-8 text-sm text-center transition-colors ${
                    isProcessing
                      ? "cursor-not-allowed opacity-50"
                      : "cursor-pointer hover:border-indigo-400 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <svg
                      className="w-8 h-8 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span className="font-medium">Upload or Take Photo</span>
                    <span className="text-xs text-gray-500">
                      JPEG, PNG (max 10MB)
                    </span>
                  </div>
                </label>
              </div>
            )}

            {/* Image Preview */}
            {previewUrl && (
              <div className="space-y-3">
                <div className="rounded-xl border border-gray-200 overflow-hidden relative">
                  <img
                    src={previewUrl}
                    alt="Bill preview"
                    className="w-full h-auto"
                  />
                  {isProcessing && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="bg-white rounded-xl p-4 flex flex-col items-center gap-2">
                        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-sm font-medium">Processing receipt...</p>
                      </div>
                    </div>
                  )}
                </div>

                {selectedFile && (
                  <p className="text-xs text-gray-500 truncate">
                    {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)}{" "}
                    KB)
                  </p>
                )}

                {/* Error Message */}
                {error && (
                  <div className="rounded-xl bg-red-50 border border-red-200 p-3">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={handleRetake}
                    disabled={isProcessing}
                  >
                    Retake
                  </Button>
                  <Button onClick={handleContinue} disabled={isProcessing}>
                    {isProcessing ? "Processing..." : "Continue"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
