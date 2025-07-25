'use server';

/**
 * @fileOverview A flow to parse uploaded documents, extract text, and split it into chunks.
 *
 * - parseDocument - A function that handles document parsing.
 * - ParseDocumentInput - The input type for the parseDocument function.
 * - ParseDocumentOutput - The return type for the parseDocument function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import mammoth from 'mammoth';
import * as xlsx from 'xlsx';
import { marked } from 'marked';
import * as cheerio from 'cheerio';

const ParseDocumentInputSchema = z.object({
    documentDataUri: z.string().describe("A document file as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});
export type ParseDocumentInput = z.infer<typeof ParseDocumentInputSchema>;

const ParseDocumentOutputSchema = z.object({
    text: z.string().describe('The full extracted text from the document.'),
    chunks: z.array(z.string()).describe('An array of text chunks extracted from the document.'),
});
export type ParseDocumentOutput = z.infer<typeof ParseDocumentOutputSchema>;

export async function parseDocument(input: ParseDocumentInput): Promise<ParseDocumentOutput> {
    return parseDocumentFlow(input);
}

// Simple chunking function
function chunkText(text: string, chunkSize = 500, overlap = 50): string[] {
    const chunks: string[] = [];
    if (!text) return chunks;

    for (let i = 0; i < text.length; i += (chunkSize - overlap)) {
        chunks.push(text.substring(i, i + chunkSize));
    }
    return chunks;
}


const parseDocumentFlow = ai.defineFlow(
    {
        name: 'parseDocumentFlow',
        inputSchema: ParseDocumentInputSchema,
        outputSchema: ParseDocumentOutputSchema,
    },
    async (input) => {
        const { documentDataUri } = input;
        const [header, base64Data] = documentDataUri.split(',');

        if (!header || !base64Data) {
            throw new Error('Invalid data URI format.');
        }

        const mimeTypeMatch = header.match(/data:(.*);base64/);
        if (!mimeTypeMatch) {
            throw new Error('Could not extract MIME type from data URI.');
        }
        const mimeType = mimeTypeMatch[1].trim();
        const buffer = Buffer.from(base64Data, 'base64');

        let extractedText = '';

        try {
            switch (mimeType) {
                case 'application pdf': // Handle malformed MIME type
                case 'application/pdf':
                    const pdfParse = (await import('pdf-parse')).default;
                    const pdfData = await pdfParse(buffer);
                    extractedText = pdfData.text;
                    break;
                case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': // .docx
                    const docxResult = await mammoth.extractRawText({ buffer });
                    extractedText = docxResult.value;
                    break;
                case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': // .xlsx
                     const workbook = xlsx.read(buffer, { type: 'buffer' });
                     const sheetNames = workbook.SheetNames;
                     let xlsxText = '';
                     sheetNames.forEach(sheetName => {
                         const sheet = workbook.Sheets[sheetName];
                         const sheetData = xlsx.utils.sheet_to_txt(sheet);
                         xlsxText += `Sheet: ${sheetName}\n${sheetData}\n\n`;
                     });
                     extractedText = xlsxText;
                    break;
                case 'text/markdown':
                    extractedText = await marked.parse(buffer.toString('utf-8'));
                    break;
                case 'text/html':
                    const $ = cheerio.load(buffer.toString('utf-8'));
                    // Remove common non-content elements like scripts, styles, and navigation.
                    $('script, style, nav, footer, header, aside').remove();
                    // Add newlines after block elements to preserve paragraph structure.
                    $('br, p, h1, h2, h3, h4, h5, h6, li, blockquote, pre').after('\n');
                    // Get the text and clean up extra whitespace.
                    extractedText = $('body').text().replace(/\s\s+/g, ' ').trim();
                    break;
                case 'text/plain':
                     extractedText = buffer.toString('utf-8');
                     break;
                default:
                    throw new Error(`Unsupported MIME type: ${mimeType}`);
            }
        } catch (error) {
            console.error(`Error parsing ${mimeType}:`, error);
            throw new Error(`Failed to parse document with MIME type: ${mimeType}`);
        }
        
        const chunks = chunkText(extractedText);

        return {
            text: extractedText,
            chunks,
        };
    }
);
