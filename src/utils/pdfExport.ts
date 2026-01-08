// RexOS PDF Export Utility - Platform-aware PDF generation and export
// Works in browser (download) and Android APK (share sheet)

import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

interface PDFExportOptions {
    element: HTMLElement;
    filename: string;
}

/**
 * Check if running in native Capacitor environment (APK)
 */
const isNativePlatform = (): boolean => {
    return Capacitor.isNativePlatform();
};

/**
 * Convert HTML element to PDF blob using html2pdf.js
 */
const generatePDFBlob = async (element: HTMLElement, filename: string): Promise<Blob> => {
    const html2pdf = (await import('html2pdf.js')).default;

    const opt = {
        margin: 10,
        filename,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
    };

    // Generate PDF as blob
    const pdfBlob = await html2pdf().set(opt).from(element).outputPdf('blob');
    return pdfBlob;
};

/**
 * Convert Blob to base64 string
 */
const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;
            // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
            const base64Data = base64.split(',')[1];
            resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

/**
 * Export PDF for browser - standard download
 */
const exportPDFBrowser = async (element: HTMLElement, filename: string): Promise<void> => {
    const html2pdf = (await import('html2pdf.js')).default;

    const opt = {
        margin: 10,
        filename,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
    };

    await html2pdf().set(opt).from(element).save();
};

/**
 * Export PDF for native (Android APK) - save to filesystem and share
 */
const exportPDFNative = async (element: HTMLElement, filename: string): Promise<void> => {
    // Generate PDF blob
    const pdfBlob = await generatePDFBlob(element, filename);

    // Convert to base64
    const base64Data = await blobToBase64(pdfBlob);

    // Ensure filename has .pdf extension
    const pdfFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;

    // Write file to cache directory
    const writeResult = await Filesystem.writeFile({
        path: pdfFilename,
        data: base64Data,
        directory: Directory.Cache,
    });

    // Get the file URI
    const fileUri = writeResult.uri;

    // Share the file - allows user to Save, Open, or Share
    await Share.share({
        title: 'RexOS Weekly Report',
        text: 'Your weekly progress report',
        url: fileUri,
        dialogTitle: 'Save or Share Report',
    });
};

/**
 * Main export function - automatically detects platform and uses appropriate method
 */
export const exportPDF = async ({ element, filename }: PDFExportOptions): Promise<void> => {
    if (isNativePlatform()) {
        await exportPDFNative(element, filename);
    } else {
        await exportPDFBrowser(element, filename);
    }
};

export default exportPDF;
