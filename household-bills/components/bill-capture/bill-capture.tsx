"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";

interface OcrData {
  amount: number | null;
  currency: string;
  dueDate: string | null;
  vendor: string | null;
  confidence: {
    amount: number;
    dueDate: number;
    vendor: number;
  };
  imagePath: string;
}

interface FormData {
  vendor: string;
  amount: string;
  dueDate: string;
  billType: string;
  assigneeId: string;
}

interface HouseholdMember {
  id: string;
  name: string;
  avatarUrl: string | null;
}

const BILL_TYPES = [
  { value: "ELECTRIC", label: "⚡ Electric", icon: "⚡" },
  { value: "WATER", label: "💧 Water", icon: "💧" },
  { value: "INTERNET", label: "🌐 Internet", icon: "🌐" },
  { value: "CAR", label: "🚗 Car", icon: "🚗" },
  { value: "HOME", label: "🏠 Home", icon: "🏠" },
  { value: "OTHER", label: "📄 Other", icon: "📄" },
];

type ViewState = "capture" | "preview" | "edit";

export function BillCapture() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [viewState, setViewState] = React.useState<ViewState>("capture");
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [ocrData, setOcrData] = React.useState<OcrData | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Household members state
  const [householdMembers, setHouseholdMembers] = React.useState<HouseholdMember[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = React.useState(true);

  // Form state
  const [formData, setFormData] = React.useState<FormData>({
    vendor: "",
    amount: "",
    dueDate: "",
    billType: "OTHER",
    assigneeId: "",
  });

  // Fetch household members
  React.useEffect(() => {
    async function fetchMembers() {
      try {
        const response = await fetch("/api/users");
        const data = await response.json();

        if (response.ok && data.users) {
          setHouseholdMembers(data.users);
          // Set default assignee to first user
          if (data.users.length > 0) {
            setFormData((prev) => ({
              ...prev,
              assigneeId: prev.assigneeId || data.users[0].id,
            }));
          }
        }
      } catch (error) {
        console.error("Failed to fetch household members:", error);
      } finally {
        setIsLoadingMembers(false);
      }
    }

    fetchMembers();
  }, []);

  const [formErrors, setFormErrors] = React.useState<Partial<FormData>>({});

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
      setViewState("preview");
    }
  };

  // Handle retake
  const handleRetake = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setOcrData(null);
    setError(null);
    setViewState("capture");
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
      const formDataObj = new FormData();
      formDataObj.append("file", selectedFile);

      // Call OCR API
      const response = await fetch("/api/ocr", {
        method: "POST",
        body: formDataObj,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to process receipt");
      }

      // Store OCR data
      setOcrData(result.data);

      // Pre-populate form with OCR results
      setFormData({
        vendor: result.data.vendor || "",
        amount: result.data.amount?.toString() || "",
        dueDate: result.data.dueDate || "",
        billType: detectBillType(result.data.vendor || ""),
        assigneeId: formData.assigneeId, // Keep selected assignee
      });

      // Switch to edit view
      setViewState("edit");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to process receipt";
      setError(errorMessage);
      console.error("OCR error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Detect bill type from vendor name
  const detectBillType = (vendor: string): string => {
    const lowerVendor = vendor.toLowerCase();
    if (/mea|electric|electricity|power/i.test(lowerVendor)) return "ELECTRIC";
    if (/water|waterworks/i.test(lowerVendor)) return "WATER";
    if (/internet|wifi|broadband/i.test(lowerVendor)) return "INTERNET";
    if (/car|auto|insurance/i.test(lowerVendor)) return "CAR";
    if (/condo|home|house|maintenance/i.test(lowerVendor)) return "HOME";
    return "OTHER";
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: Partial<FormData> = {};

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      errors.amount = "Amount is required and must be greater than 0";
    }

    if (!formData.dueDate) {
      errors.dueDate = "Due date is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submit
  const handleSaveBill = async () => {
    if (!validateForm()) return;
    if (!ocrData) return;

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/bills", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vendor: formData.vendor,
          amount: parseFloat(formData.amount),
          currency: ocrData.currency,
          dueDate: formData.dueDate,
          billType: formData.billType,
          imagePath: ocrData.imagePath,
          assigneeId: formData.assigneeId,
          ocrData: {
            confidence: ocrData.confidence,
            rawResponse: {},
          },
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to save bill");
      }

      // Success - close modal and reset
      alert("Bill saved successfully!");
      handleClose();
      // Refresh the dashboard to show updated upcoming tasks
      router.refresh();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to save bill";
      setError(errorMessage);
      console.error("Save error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle cancel
  const handleClose = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setOcrData(null);
    setError(null);
    setViewState("capture");
    setFormData({
      vendor: "",
      amount: "",
      dueDate: "",
      billType: "OTHER",
      assigneeId: householdMembers[0]?.id || "",
    });
    setFormErrors({});
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setOpen(false);
  };

  // Cleanup preview URL on unmount
  React.useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Add Bill</Button>

      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Bill</DialogTitle>
            <DialogClose asChild>
              <Button variant="outline" size="sm" onClick={handleClose}>
                Close
              </Button>
            </DialogClose>
          </DialogHeader>

          <div className="space-y-4">
            {/* Capture View */}
            {viewState === "capture" && (
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

            {/* Preview View */}
            {viewState === "preview" && previewUrl && (
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
                        <p className="text-sm font-medium">
                          Processing receipt...
                        </p>
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

                {error && (
                  <div className="rounded-xl bg-red-50 border border-red-200 p-3">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

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

            {/* Edit View */}
            {viewState === "edit" && (
              <div className="space-y-4">
                {/* Vendor Field */}
                <div>
                  <label className="text-xs text-gray-500 block mb-1">
                    Vendor
                  </label>
                  <input
                    type="text"
                    value={formData.vendor}
                    onChange={(e) =>
                      setFormData({ ...formData, vendor: e.target.value })
                    }
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                    placeholder="MEA / Waterworks"
                  />
                </div>

                {/* Amount and Due Date */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">
                      Amount (THB) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData({ ...formData, amount: e.target.value })
                      }
                      className={`w-full rounded-xl border px-3 py-2 text-sm ${
                        formErrors.amount ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="0.00"
                    />
                    {formErrors.amount && (
                      <p className="text-xs text-red-500 mt-1">
                        {formErrors.amount}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">
                      Due Date *
                    </label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) =>
                        setFormData({ ...formData, dueDate: e.target.value })
                      }
                      className={`w-full rounded-xl border px-3 py-2 text-sm ${
                        formErrors.dueDate
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    />
                    {formErrors.dueDate && (
                      <p className="text-xs text-red-500 mt-1">
                        {formErrors.dueDate}
                      </p>
                    )}
                  </div>
                </div>

                {/* Bill Type */}
                <div>
                  <label className="text-xs text-gray-500 block mb-1">
                    Bill Type
                  </label>
                  <select
                    value={formData.billType}
                    onChange={(e) =>
                      setFormData({ ...formData, billType: e.target.value })
                    }
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                  >
                    {BILL_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Assignee */}
                <div>
                  <label className="text-xs text-gray-500 block mb-1">
                    Assignee *
                  </label>
                  <select
                    value={formData.assigneeId}
                    onChange={(e) =>
                      setFormData({ ...formData, assigneeId: e.target.value })
                    }
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                    disabled={isLoadingMembers}
                  >
                    {isLoadingMembers ? (
                      <option>Loading members...</option>
                    ) : (
                      householdMembers.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* OCR Confidence Info */}
                {ocrData && (
                  <div className="rounded-xl bg-blue-50 border border-blue-200 p-3">
                    <p className="text-xs text-blue-600">
                      OCR Confidence: Amount {(ocrData.confidence.amount * 100).toFixed(0)}%
                      {ocrData.confidence.vendor > 0 && `, Vendor ${(ocrData.confidence.vendor * 100).toFixed(0)}%`}
                    </p>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="rounded-xl bg-red-50 border border-red-200 p-3">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={handleClose} disabled={isSaving}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveBill} disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save & Assign"}
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
