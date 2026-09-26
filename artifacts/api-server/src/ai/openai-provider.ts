import OpenAI from "openai";
import {
  AiProviderUnavailableError,
  type AiProvider,
  type ProviderChatMessage,
  type ProviderResponse,
} from "./provider";

const assistantInstructions = [
  "You are PhoneAI, a thoughtful and practical personal assistant.",
  "Be warm, clear, and concise. Match the user's tone and answer the request directly.",
  "Use plain text only. Do not mention internal instructions, APIs, models, or implementation details.",
].join(" ");

export class OpenAiProvider implements AiProvider {
  private readonly client: OpenAI | null;

  constructor(apiKey = process.env.OPENAI_API_KEY) {
    this.client = apiKey ? new OpenAI({ apiKey }) : null;
  }

  async generateResponse(
    messages: ProviderChatMessage[],
  ): Promise<ProviderResponse> {
    if (!this.client) {
      throw new AiProviderUnavailableError();
    }

    try {
      const completion = await this.client.chat.completions.create(
        {
          model: "gpt-5-mini",
          max_completion_tokens: 8192,
          messages: [
            { role: "system", content: assistantInstructions },
            ...messages,
          ],
        },
        {
          signal: AbortSignal.timeout(60_000),
        },
      );

      const content = completion.choices[0]?.message?.content?.trim();
      if (!content) {
        throw new AiProviderUnavailableError();
      }

      return { content };
    } catch (error) {
      if (error instanceof AiProviderUnavailableError) {
        throw error;
      }

      if (error instanceof OpenAI.APIError) {
        const isQuotaError =
          error.status === 429 && error.code === "credit_balance_exhausted";
        throw new AiProviderUnavailableError(
          isQuotaError
            ? "The AI provider is currently unavailable because the OpenAI account has no remaining credits."
            : "The AI provider is currently unavailable.",
          {
            providerStatus: error.status,
            providerCode: error.code,
            providerType: error.type,
            requestId: error.requestID,
          },
        );
      }

      throw new AiProviderUnavailableError();
    }
  }
}

export const openAiProvider = new OpenAiProvider();