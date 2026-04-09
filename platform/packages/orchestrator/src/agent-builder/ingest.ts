/**
 * Agent Builder — SOP ingestion.
 *
 * Wave 7 scope: accept an SOP PDF, interview transcript, policy doc, or a
 * link to a Confluence page. Uploads become session resources of type "file"
 * attached to the `agent-builder` Managed Agent.
 *
 * See plan § "Wave 7".
 */

export interface IngestRequest {
  tenantId: string;
  uploadedBy: string;
  source:
    | { kind: 'pdf'; path: string }
    | { kind: 'transcript'; path: string }
    | { kind: 'confluence'; url: string }
    | { kind: 'markdown'; path: string };
  targetDepartment: string;
}

export interface IngestResult {
  ingestId: string;
  resourceIds: string[];
  sessionId: string;
}

/**
 * Stage 1 of the SOP → runbook pipeline. Stub until Wave 7.
 */
export async function ingestSop(_request: IngestRequest): Promise<IngestResult> {
  throw new Error('not implemented — Wave 7');
}
