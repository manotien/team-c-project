"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import Image from "next/image";

interface MarkPaidDialogProps {
  isOpen: boolean;
  onClose: () => void;
  task: {
    id: string;
    status: string;
    bill: {
      vendor: string;
      amount: number;
    };
  };
}

export default function MarkPaidDialog({
  isOpen,
  onClose,
  task,
}: MarkPaidDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > 10 * 1024 * 1024) {
      alert("File too large. Maximum size is 10MB.");
      return;
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      alert("Invalid file type. Only JPG, PNG, and PDF are allowed.");
      return;
    }

    setSelectedFile(file);

    // Create preview for images
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null); // No preview for PDFs
    }
  }

  function handleRemoveFile() {
    setSelectedFile(null);
    setPreview(null);
    setUploadedUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleConfirm() {
    setLoading(true);

    try {
      let proofUrl = uploadedUrl;

      // Upload file if selected
      if (selectedFile && !uploadedUrl) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("taskId", task.id);

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) {
          const error = await uploadResponse.json();
          throw new Error(error.error || "Failed to upload file");
        }

        const uploadData = await uploadResponse.json();
        proofUrl = uploadData.url;
        setUploadedUrl(proofUrl);
      }

      // Mark task as paid
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "PAID",
          paymentProofUrl: proofUrl,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to mark task as paid");
      }

      const data = await response.json();
      alert(data.message || "Task marked as paid");

      router.refresh();
      onClose();
    } catch (error: unknown) {
      console.error("Error marking task as paid:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to mark task as paid. Please try again.";
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Dialog */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h2 className="text-xl font-bold mb-4">Mark Task as Paid</h2>

        {/* Bill Info */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <p className="font-semibold">{task.bill.vendor}</p>
          <p className="text-xl font-bold text-green-600 mt-1">
            {formatCurrency(task.bill.amount)}
          </p>
        </div>

        {/* File Upload Section */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Payment Proof (Optional)
          </label>

          {!selectedFile ? (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,application/pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-500 transition-colors"
              >
                <div className="text-gray-600">
                  <p className="font-medium">Click to choose file</p>
                  <p className="text-xs mt-1">JPG, PNG, or PDF (max 10MB)</p>
                </div>
              </button>
            </div>
          ) : (
            <div className="border rounded-lg p-4">
              {/* Image Preview */}
              {preview && (
                <div className="mb-3">
                  <Image
                    src={preview}
                    alt="Payment proof preview"
                    width={300}
                    height={200}
                    className="rounded-lg object-contain mx-auto"
                  />
                </div>
              )}

              {/* File Info */}
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="ml-3 text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  Remove
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Confirmation Message */}
        <p className="text-sm text-gray-600 mb-6">
          Are you sure you want to mark this task as paid?
        </p>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Processing..." : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
