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
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle continue (placeholder for OCR processing in next story)
  const handleContinue = () => {
    if (selectedFile) {
      // TODO: This will be implemented in Story 1.2 - OCR Data Extraction
      console.log("Continue with OCR processing", selectedFile);
      alert("OCR processing will be implemented in Story 1.2");
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
                />
                <label
                  htmlFor="billImage"
                  className="block rounded-xl border border-dashed border-gray-300 py-8 text-sm text-center cursor-pointer hover:border-indigo-400 hover:bg-gray-50 transition-colors"
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
                <div className="rounded-xl border border-gray-200 overflow-hidden">
                  <img
                    src={previewUrl}
                    alt="Bill preview"
                    className="w-full h-auto"
                  />
                </div>

                {selectedFile && (
                  <p className="text-xs text-gray-500 truncate">
                    {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)}{" "}
                    KB)
                  </p>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-2">
                  <Button variant="outline" onClick={handleRetake}>
                    Retake
                  </Button>
                  <Button onClick={handleContinue}>Continue</Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
