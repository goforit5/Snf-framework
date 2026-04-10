/**
 * Agent Builder — Stage 1: Ingest.
 *
 * Converts uploaded SOP documents (PDF, DOCX, TXT, MD, transcripts) into
 * plain-text payloads suitable for the `agent-builder` Managed Agent session.
 *
 * Design decisions:
 *  - Aggressive PHI tokenization: every extracted string is passed through a
 *    `PhiTokenizer` (from `@snf/connectors` gateway redaction). If tokens are
 *    emitted, the tokenizer is attached to the result so the compile step can
 *    reference it for reviewer-facing context.
 *  - PDF/DOCX parsers are imported dynamically so the package builds without
 *    the optional `pdf-parse` and `mammoth` deps installed. When absent we
 *    emit a clear warning on the document rather than throwing.
 *  - Confluence ingest is a stub. The production path needs a tenant-specific
 *    OAuth token (TODO(wave-7-deploy)).
 *
 * See Wave 7 (SNF-96) in the plan.
 */

import {
  PhiTokenizer,
  InMemoryTokenStore,
} from '@snf/connectors';

import type {
  DocumentKind,
  IngestInput,
  IngestResult,
  IngestedDocument,
  IngestUpload,
} from './types.js';

const MAX_BYTES_WARN = 10 * 1024 * 1024; // 10 MB

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

export async function ingest(input: IngestInput): Promise<IngestResult> {
  const store = new InMemoryTokenStore();
  const tokenizer = new PhiTokenizer({ store });

  const documents: IngestedDocument[] = [];
  let phiDetected = false;

  for (const upload of input.uploads) {
    const kind = detectKind(upload);
    const doc: IngestedDocument = {
      filename: upload.filename,
      kind,
      text: '',
      warnings: [],
    };

    if (upload.bytes.byteLength > MAX_BYTES_WARN) {
      doc.warnings.push(
        `File exceeds 10MB (${upload.bytes.byteLength} bytes); processing but this may be slow or lossy.`,
      );
    }

    try {
      switch (kind) {
        case 'txt':
        case 'md':
        case 'transcript':
          doc.text = upload.bytes.toString('utf-8');
          break;
        case 'pdf':
          Object.assign(doc, await extractPdf(upload));
          break;
        case 'docx':
          Object.assign(doc, await extractDocx(upload));
          break;
        case 'confluence':
          doc.warnings.push(
            'Confluence ingest not yet implemented — TODO(wave-7-deploy): wire OAuth token per tenant.',
          );
          break;
        default:
          doc.warnings.push(
            `Unsupported file type for "${upload.filename}" (mime=${upload.mimeType}). Skipped.`,
          );
      }
    } catch (err) {
      doc.warnings.push(
        `Extraction failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    if (doc.text.trim().length === 0 && kind !== 'unknown' && kind !== 'confluence') {
      doc.warnings.push(
        'No extractable text — document may be a scanned image (no OCR configured).',
      );
    }

    // PHI tokenization
    if (doc.text.length > 0) {
      const before = doc.text;
      const after = await tokenizer.tokenize(doc.text);
      if (after !== before) {
        phiDetected = true;
      }
      doc.text = after;
    }

    documents.push(doc);
  }

  const totalChars = documents.reduce((n, d) => n + d.text.length, 0);

  return {
    documents,
    totalChars,
    tokenizer: phiDetected ? tokenizer : null,
    phiDetected,
  };
}

// ---------------------------------------------------------------------------
// Kind detection
// ---------------------------------------------------------------------------

function detectKind(upload: IngestUpload): DocumentKind {
  const name = upload.filename.toLowerCase();
  const mime = (upload.mimeType || '').toLowerCase();

  if (mime === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';
  if (
    mime ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    name.endsWith('.docx')
  ) {
    return 'docx';
  }
  if (mime === 'text/markdown' || name.endsWith('.md') || name.endsWith('.markdown')) {
    return 'md';
  }
  if (name.endsWith('.transcript.txt')) return 'transcript';
  if (mime.startsWith('text/') || name.endsWith('.txt')) return 'txt';

  // Confluence URL upload is represented as a zero-byte upload with
  // mimeType "application/vnd.confluence-url" and the url in filename.
  if (mime === 'application/vnd.confluence-url') return 'confluence';

  return 'unknown';
}

// ---------------------------------------------------------------------------
// PDF extractor (dynamic import)
// ---------------------------------------------------------------------------

async function extractPdf(upload: IngestUpload): Promise<Partial<IngestedDocument>> {
  try {
    // Dynamic import keeps pdf-parse an optional dep. Package manifests outside
    // deploy images do not install it.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod: any = await import('pdf-parse' as string).catch(() => null);
    if (!mod) {
      return {
        text: '',
        warnings: [
          'pdf-parse not installed — install `pdf-parse` in the orchestrator to extract PDF content.',
        ],
      };
    }
    const parser = mod.default ?? mod;
    const result = await parser(upload.bytes);
    return {
      text: String(result.text ?? ''),
      pageCount: typeof result.numpages === 'number' ? result.numpages : undefined,
      warnings: [],
    };
  } catch (err) {
    return {
      text: '',
      warnings: [`PDF parse error: ${err instanceof Error ? err.message : String(err)}`],
    };
  }
}

// ---------------------------------------------------------------------------
// DOCX extractor (dynamic import)
// ---------------------------------------------------------------------------

async function extractDocx(upload: IngestUpload): Promise<Partial<IngestedDocument>> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod: any = await import('mammoth' as string).catch(() => null);
    if (!mod) {
      return {
        text: '',
        warnings: [
          'mammoth not installed — install `mammoth` in the orchestrator to extract DOCX content.',
        ],
      };
    }
    const m = mod.default ?? mod;
    const res = await m.extractRawText({ buffer: upload.bytes });
    return {
      text: String(res?.value ?? ''),
      warnings: [],
    };
  } catch (err) {
    return {
      text: '',
      warnings: [`DOCX parse error: ${err instanceof Error ? err.message : String(err)}`],
    };
  }
}
