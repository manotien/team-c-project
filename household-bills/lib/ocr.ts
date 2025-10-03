import { DocumentProcessorServiceClient } from "@google-cloud/documentai";
import { promises as fs } from "fs";
import path from "path";

// Initialize Google Cloud Document AI client
let documentAIClient: DocumentProcessorServiceClient | null = null;

function getDocumentAIClient() {
  if (!documentAIClient) {
    // Check if credentials file exists
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (!credentialsPath) {
      throw new Error("GOOGLE_APPLICATION_CREDENTIALS is not set");
    }

    documentAIClient = new DocumentProcessorServiceClient({
      keyFilename: credentialsPath,
    });
  }
  return documentAIClient;
}

export interface OcrResult {
  amount: number | null;
  currency: string;
  dueDate: string | null;
  vendor: string | null;
  confidence: {
    amount: number;
    dueDate: number;
    vendor: number;
  };
}

export interface OcrApiResponse {
  success: boolean;
  data?: {
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
  };
  rawOcrData?: Record<string, unknown>;
  error?: string;
}

/**
 * Save uploaded file to receipts directory
 */
export async function saveReceiptImage(
  imageBuffer: Buffer,
  originalName: string
): Promise<string> {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 15);
  const ext = path.extname(originalName);
  const filename = `${timestamp}-${randomId}${ext}`;
  const uploadsDir = path.join(process.cwd(), "public", "uploads", "receipts");
  const filePath = path.join(uploadsDir, filename);

  // Ensure directory exists
  await fs.mkdir(uploadsDir, { recursive: true });

  // Save file
  await fs.writeFile(filePath, imageBuffer);

  return `/uploads/receipts/${filename}`;
}

/**
 * Extract data from receipt using Google Document AI
 */
export async function extractReceiptData(
  imageBuffer: Buffer
): Promise<{ result: OcrResult; rawData: Record<string, unknown> }> {
  const projectId = process.env.GCP_PROJECT_ID;
  const location = process.env.GCP_LOCATION || "us";
  const processorId = process.env.GCP_PROCESSOR_ID;
  console.log({ projectId });
  console.log({ location });
  console.log({ processorId });
  if (!projectId || !processorId) {
    throw new Error("Google Cloud Document AI credentials not configured");
  }

  const client = getDocumentAIClient();

  // Construct processor name
  const name = `projects/${projectId}/locations/${location}/processors/${processorId}`;

  // Prepare request
  const request = {
    name,
    rawDocument: {
      content: imageBuffer.toString("base64"),
      mimeType: "image/jpeg",
    },
  };

  // Process document
  const [result] = await client.processDocument(request);
  const { document } = result;

  if (!document) {
    throw new Error("No document returned from OCR");
  }

  // Extract entities with confidence scores
  const entities = document.entities || [];

  // Initialize result
  const ocrResult: OcrResult = {
    amount: null,
    currency: "THB",
    dueDate: null,
    vendor: null,
    confidence: {
      amount: 0,
      dueDate: 0,
      vendor: 0,
    },
  };

  // Parse entities
  for (const entity of entities) {
    const type = entity.type || "";
    const mentionText = entity.mentionText || "";
    const confidence = entity.confidence || 0;

    switch (type) {
      case "total_amount":
      case "line_item/amount":
        if (!ocrResult.amount || confidence > ocrResult.confidence.amount) {
          const amount = parseFloat(mentionText.replace(/[^0-9.]/g, ""));
          if (!isNaN(amount)) {
            ocrResult.amount = amount;
            ocrResult.confidence.amount = confidence;
          }
        }
        break;

      case "currency":
        if (mentionText) {
          ocrResult.currency = mentionText;
        }
        break;

      case "receipt_date":
      case "due_date":
        if (confidence > ocrResult.confidence.dueDate) {
          const parsedDate = parseDate(mentionText);
          if (parsedDate) {
            ocrResult.dueDate = parsedDate;
            ocrResult.confidence.dueDate = confidence;
          }
        }
        break;

      case "supplier_name":
      case "merchant_name":
      case "supplier":
        if (confidence > ocrResult.confidence.vendor) {
          ocrResult.vendor = mentionText;
          ocrResult.confidence.vendor = confidence;
        }
        break;
    }
  }

  // Fallback: Try to extract from text if entities are missing
  if (!ocrResult.vendor && document.text) {
    const lines = document.text.split("\n");
    if (lines.length > 0) {
      ocrResult.vendor = lines[0].trim();
      ocrResult.confidence.vendor = 0.5; // Low confidence for fallback
    }
  }

  return {
    result: ocrResult,
    rawData: document as unknown as Record<string, unknown>,
  };
}

/**
 * Parse date from various formats
 */
function parseDate(dateStr: string): string | null {
  if (!dateStr) return null;

  // Remove common Thai words
  const cleaned = dateStr.replace(/วันที่|ครบกำหนด|ชำระ/g, "").trim();

  // Try various date formats
  const formats = [
    // ISO format
    /(\d{4})-(\d{2})-(\d{2})/,
    // DD/MM/YYYY
    /(\d{2})\/(\d{2})\/(\d{4})/,
    // DD-MM-YYYY
    /(\d{2})-(\d{2})-(\d{4})/,
    // YYYY/MM/DD
    /(\d{4})\/(\d{2})\/(\d{2})/,
  ];

  for (const format of formats) {
    const match = cleaned.match(format);
    if (match) {
      // Determine format and create ISO date
      if (format === formats[0] || format === formats[3]) {
        // Already in YYYY-MM-DD or YYYY/MM/DD
        return `${match[1]}-${match[2]}-${match[3]}`;
      } else {
        // DD/MM/YYYY or DD-MM-YYYY
        return `${match[3]}-${match[2]}-${match[1]}`;
      }
    }
  }

  // Try parsing as JavaScript Date
  try {
    const date = new Date(cleaned);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split("T")[0];
    }
  } catch {
    // Ignore parsing errors
  }

  return null;
}

/**
 * Check if confidence scores meet minimum threshold
 */
export function hasMinimumConfidence(
  result: OcrResult,
  threshold: number = 0.6
): boolean {
  const { amount, vendor } = result.confidence;

  // At least amount or vendor should meet threshold
  return amount >= threshold || vendor >= threshold;
}
