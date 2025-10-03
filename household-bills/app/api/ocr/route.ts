import { NextRequest, NextResponse } from "next/server";
import {
  extractReceiptData,
  saveReceiptImage,
  hasMinimumConfidence,
  type OcrApiResponse,
} from "@/lib/ocr";

export const runtime = "nodejs";
export const maxDuration = 30; // 30 seconds timeout

/**
 * POST /api/ocr
 * Process receipt image and extract data using Google Document AI
 */
export async function POST(request: NextRequest) {
  try {
    // Get form data
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json<OcrApiResponse>(
        {
          success: false,
          error: "No file provided",
        },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json<OcrApiResponse>(
        {
          success: false,
          error: "Invalid file type. Only images are allowed.",
        },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json<OcrApiResponse>(
        {
          success: false,
          error: "File size exceeds 10MB limit",
        },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Check if Google Cloud Document AI is configured
    const isConfigured =
      process.env.GCP_PROJECT_ID &&
      process.env.GCP_PROCESSOR_ID &&
      process.env.GOOGLE_APPLICATION_CREDENTIALS;

    let ocrResult = null;
    let rawData = null;

    if (isConfigured) {
      try {
        // Extract data from receipt
        const extraction = await extractReceiptData(buffer);
        ocrResult = extraction.result;
        rawData = extraction.rawData;

        // Check confidence threshold
        if (!hasMinimumConfidence(ocrResult, 0.6)) {
          console.warn("OCR confidence below threshold", ocrResult.confidence);
        }
      } catch (ocrError) {
        console.error("OCR extraction failed:", ocrError);
        // Continue to save image even if OCR fails
      }
    } else {
      console.warn(
        "Google Cloud Document AI not configured. Skipping OCR processing."
      );
    }

    // Save image
    const imagePath = await saveReceiptImage(buffer, file.name);

    // Return response
    const response: OcrApiResponse = {
      success: true,
      data: {
        amount: ocrResult?.amount || null,
        currency: ocrResult?.currency || "THB",
        dueDate: ocrResult?.dueDate || null,
        vendor: ocrResult?.vendor || null,
        confidence: ocrResult?.confidence || {
          amount: 0,
          dueDate: 0,
          vendor: 0,
        },
        imagePath,
      },
      rawOcrData: rawData || undefined,
    };

    return NextResponse.json<OcrApiResponse>(response);
  } catch (error) {
    console.error("OCR API error:", error);

    return NextResponse.json<OcrApiResponse>(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to process receipt",
      },
      { status: 500 }
    );
  }
}
