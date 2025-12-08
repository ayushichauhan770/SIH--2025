import Tesseract from 'tesseract.js';

interface ScanResult {
    isTextDocument: boolean;
    isGovtDocument: boolean;
    confidence: number;
    textLength: number;
    detectedText: string;
    documentType: 'govt_document' | 'text_document' | 'photo' | 'diagram' | 'mixed' | 'empty';
}

// Common government document keywords and patterns
const GOVT_KEYWORDS = [
    'government of india',
    'ministry',
    'department',
    'aadhaar',
    'passport',
    'pan',
    'certificate',
    'license',
    'permit',
    'registration',
    'official',
    'seal',
    'signature',
    'issued',
    'authority',
    'voter id',
    'driving license',
    'birth certificate',
    'death certificate',
    'marriage certificate',
    'education certificate',
    'income certificate',
    'caste certificate',
    'domicile',
    'property document',
    'deed',
    'stamp',
    'valid till',
    'validity',
    'reference number',
    'application number',
    'admitted',
    'approved',
    'rejected',
    'status',
    'file number',
    'case number',
    'government',
    'state',
    'district',
    'tehsil',
    'taluk',
];

function isGovtDocument(text: string): { isGovt: boolean; matchedKeywords: string[] } {
    const lowerText = text.toLowerCase();
    const matchedKeywords = GOVT_KEYWORDS.filter(keyword => lowerText.includes(keyword));
    // If at least 2 government keywords are found, it's likely a government document
    const isGovt = matchedKeywords.length >= 2;
    return { isGovt, matchedKeywords };
}

/**
 * Scans an image to detect if it contains a text document using OCR
 * @param imageData - Base64 image data or File
 * @returns Promise<ScanResult> - Result containing whether the image is a text document
 */
export async function scanImageForText(imageData: string | File, onProgress?: (progress: number) => void): Promise<ScanResult> {
    try {
        const worker = await Tesseract.createWorker();

        let imageSource: string | File = imageData;

        // If it's a File object, convert to base64
        if (imageData instanceof File) {
            const arrayBuffer = await imageData.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            const binaryString = String.fromCharCode(...uint8Array);
            imageSource = `data:${imageData.type};base64,${btoa(binaryString)}`;
        }

        // Recognize text in the image
        const result = await worker.recognize(imageSource as string);

        await worker.terminate();

        // Extract text and analyze
        const detectedText = result.data.text;
        const confidence = result.data.confidence;
        const textLength = detectedText.trim().length;

        // Check if it's a government document
        const { isGovt, matchedKeywords } = isGovtDocument(detectedText);

        // Determine if it's a text document based on heuristics
        let documentType: ScanResult['documentType'] = 'photo';
        let isTextDocument = false;

        // Minimum text length threshold (at least 20 characters detected)
        const MIN_TEXT_LENGTH = 20;

        // If significant text is detected, it's likely a document
        if (textLength > MIN_TEXT_LENGTH && confidence > 40) {
            // Count words to further validate
            const words = detectedText.trim().split(/\s+/).filter(word => word.length > 0);

            if (words.length > 5) {
                // Multiple words detected - likely a document
                isTextDocument = true;
                documentType = isGovt ? 'govt_document' : 'text_document';
            } else if (textLength > 50) {
                // Enough characters even with few words
                isTextDocument = true;
                documentType = isGovt ? 'govt_document' : 'text_document';
            }
        } else if (textLength === 0) {
            documentType = 'empty';
        } else if (textLength > 10 && textLength <= MIN_TEXT_LENGTH) {
            // Some text but not enough to be a document (could be labels, watermarks)
            documentType = 'mixed';
        }

        // Calculate final confidence score
        const finalConfidence = isTextDocument ? Math.min(100, confidence * 1.2) : confidence;

        return {
            isTextDocument,
            isGovtDocument: isGovt,
            confidence: Math.max(0, Math.min(100, finalConfidence)),
            textLength,
            detectedText: detectedText.substring(0, 200), // Return first 200 chars for preview
            documentType,
        };
    } catch (error) {
        console.error('Image scanning failed:', error);
        // Return negative result on error
        return {
            isTextDocument: false,
            isGovtDocument: false,
            confidence: 0,
            textLength: 0,
            detectedText: '',
            documentType: 'photo',
        };
    }
}

/**
 * Validates if an image is a government document (strict mode - only accepts govt docs)
 */
export async function validateImageAsGovtDocument(
    imageData: string | File,
    onProgress?: (progress: number) => void
): Promise<{ valid: boolean; message: string; details: ScanResult }> {
    const result = await scanImageForText(imageData, onProgress);

    // Only accept government documents
    if (result.isGovtDocument && result.isTextDocument) {
        return {
            valid: true,
            message: `✓ Valid Government Document detected!`,
            details: result,
        };
    } else if (result.isTextDocument && !result.isGovtDocument) {
        return {
            valid: false,
            message: '✗ This is a text document but NOT a government document. Please upload an official government document (Aadhaar, Passport, License, Certificate, etc.).',
            details: result,
        };
    } else {
        let message = '✗ This image does not appear to be a government document.';

        switch (result.documentType) {
            case 'empty':
                message = '✗ No text detected. Please upload a government document (Aadhaar, Passport, License, Certificate, etc.) with readable text.';
                break;
            case 'photo':
                message = '✗ This appears to be a photo. Please upload a government document instead (Aadhaar, Passport, License, Certificate, etc.).';
                break;
            case 'diagram':
                message = '✗ This appears to be a diagram. Please upload an official government document.';
                break;
            case 'mixed':
                message = '✗ Very little text detected. Please upload a government document with clear, readable text.';
                break;
        }

        return {
            valid: false,
            message,
            details: result,
        };
    }
}

/**
 * Validates if an image is a text document with user-friendly messages
 */
export async function validateImageAsDocument(
    imageData: string | File,
    onProgress?: (progress: number) => void
): Promise<{ valid: boolean; message: string; details: ScanResult }> {
    const result = await scanImageForText(imageData, onProgress);

    if (result.isTextDocument) {
        return {
            valid: true,
            message: `✓ Valid text document detected! (${result.textLength} characters found)`,
            details: result,
        };
    } else {
        let message = '✗ This image does not appear to be a text document.';

        switch (result.documentType) {
            case 'empty':
                message = '✗ No text detected in this image. Please upload a document with readable text.';
                break;
            case 'photo':
                message = '✗ This appears to be a photo or picture. Please upload a text document instead (PDF screenshot, scanned document, etc.).';
                break;
            case 'diagram':
                message = '✗ This appears to be a diagram or graphic. Please upload a document with text content.';
                break;
            case 'mixed':
                message = '✗ Very little text detected. Please ensure your document image has clear, readable text.';
                break;
        }

        return {
            valid: false,
            message,
            details: result,
        };
    }
}
