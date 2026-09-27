import type { PhoneAction } from "@workspace/phoneai-actions";

export type ProviderChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ProviderResponse = {
  content: string;
  action?: PhoneAction;
};

export interface AiProvider {
  generateResponse(messages: ProviderChatMessage[]): Promise<ProviderResponse>;
}

export class AiProviderUnavailableError extends Error {
  readonly providerStatus?: number;
  readonly providerCode?: string | null;
  readonly providerType?: string | null;
  readonly requestId?: string | null;

  constructor(
    message = "The AI provider is currently unavailable.",
    details?: {
      providerStatus?: number;
      providerCode?: string | null;
      providerType?: string | null;
      requestId?: string | null;
    },
  ) {
    super(message);
    this.name = "AiProviderUnavailableError";
    this.providerStatus = details?.providerStatus;
    this.providerCode = details?.providerCode;
    this.providerType = details?.providerType;
    this.requestId = details?.requestId;
  }
}