declare module '@aws-sdk/client-ssm' {
  export class SSMClient {
    constructor(config?: Record<string, unknown>);
    send(command: GetParameterCommand): Promise<GetParameterResult>;
  }

  export class GetParameterCommand {
    constructor(input: { Name: string; WithDecryption?: boolean });
  }

  export interface GetParameterResult {
    Parameter?: {
      Name?: string;
      Value?: string;
      Type?: string;
      Version?: number;
    };
  }
}
