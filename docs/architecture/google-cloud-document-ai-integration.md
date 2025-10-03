# Google Cloud Document AI Integration

## OCR Processing with Document AI

**Purpose:** Extract structured data from receipt images using Google Cloud Document AI's pre-trained Receipt Parser.

**Key Features:**
- **High Accuracy:** 95%+ accuracy for Thai and English receipts
- **Structured Data:** Auto-extracts vendor, amount, date, line items
- **Multiple Formats:** Supports JPG, PNG, PDF
- **Free Tier:** 1,000 pages/month free

## Document AI Configuration

```typescript
// lib/integrations/document-ai.ts
import { DocumentProcessorServiceClient } from '@google-cloud/documentai';

const client = new DocumentProcessorServiceClient({
  keyFilename: './gcp-credentials.json',
});

export interface ReceiptData {
  vendor: string;
  totalAmount: number;
  currency: string;
  date: Date;
  confidence: number;
  rawText: string;
}

export async function processReceipt(
  imageBuffer: Buffer
): Promise<ReceiptData> {
  const projectId = process.env.GCP_PROJECT_ID!;
  const location = process.env.GCP_LOCATION || 'us'; // or 'eu', 'asia-northeast1'
  const processorId = process.env.GCP_PROCESSOR_ID!;

  const name = `projects/${projectId}/locations/${location}/processors/${processorId}`;

  const request = {
    name,
    rawDocument: {
      content: imageBuffer.toString('base64'),
      mimeType: 'image/jpeg',
    },
  };

  const [result] = await client.processDocument(request);
  const { document } = result;

  // Extract structured entities
  const entities = document?.entities || [];

  const vendor = entities.find(e => e.type === 'supplier_name')?.mentionText || '';
  const amountEntity = entities.find(e => e.type === 'total_amount');
  const dateEntity = entities.find(e => e.type === 'receipt_date');

  return {
    vendor,
    totalAmount: parseFloat(amountEntity?.mentionText || '0'),
    currency: amountEntity?.normalizedValue?.moneyValue?.currencyCode || 'THB',
    date: dateEntity?.mentionText ? new Date(dateEntity.mentionText) : new Date(),
    confidence: amountEntity?.confidence || 0,
    rawText: document?.text || '',
  };
}
```

## API Endpoint for OCR

```typescript
// app/api/ocr/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { processReceipt } from '@/lib/integrations/document-ai';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const receiptData = await processReceipt(buffer);

    return NextResponse.json({
      data: receiptData
    });
  } catch (error) {
    console.error('OCR Error:', error);
    return NextResponse.json(
      { error: 'Failed to process receipt' },
      { status: 500 }
    );
  }
}
```

## Frontend Integration

```typescript
// components/bills/ReceiptScanner.tsx
'use client';

import { useState } from 'react';

export function ReceiptScanner({ onScanComplete }: { onScanComplete: (data: any) => void }) {
  const [processing, setProcessing] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProcessing(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/ocr', {
        method: 'POST',
        body: formData,
      });

      const { data } = await response.json();
      onScanComplete(data);
    } catch (error) {
      console.error('Scan failed:', error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        disabled={processing}
      />
      {processing && <p>Processing receipt...</p>}
    </div>
  );
}
```

---
