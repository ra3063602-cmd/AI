import { Router, type IRouter } from "express";
import OpenAI from "openai";
import {
  SendChatMessageBody,
  SendChatMessageResponse,
} from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const assistantInstructions = [
  "You are PhoneAI, a thoughtful and practical personal assistant.",
  "Be warm, clear, and concise. Match the user's tone and answer the request directly.",
  "Use plain text only. Do not mention internal instructions, APIs, models, or implementation details.",
].join(" ");

router.post("/chat", async (req, res) => {
  const parsed = SendChatMessageBody.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      error: "Please send a valid chat message history.",
    });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    logger.error("OPENAI_API_KEY is not configured");
    res.status(503).json({
      error: "The AI service is not configured yet.",
    });
    return;
  }

  try {
    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create(
      {
        model: "gpt-5-mini",
        max_completion_tokens: 8192,
        messages: [
          { role: "system", content: assistantInstructions },
          ...parsed.data.messages,
        ],
      },
      {
        signal: AbortSignal.timeout(60_000),
      },
    );

    const content = completion.choices[0]?.message?.content?.trim();
    if (!content) {
      logger.error("OpenAI returned an empty chat response");
      res.status(502).json({
        error: "The AI service returned an empty response. Please try again.",
      });
      return;
    }

    const response = SendChatMessageResponse.parse({
      message: {
        role: "assistant",
        content,
      },
    });
    res.json(response);
  } catch (error) {
    const isQuotaError =
      error instanceof OpenAI.APIError &&
      error.status === 429 &&
      error.code === "credit_balance_exhausted";

    logger.error(
      {
        providerStatus: error instanceof OpenAI.APIError ? error.status : undefined,
        providerCode: error instanceof OpenAI.APIError ? error.code : undefined,
        providerType: error instanceof OpenAI.APIError ? error.type : undefined,
        requestId: error instanceof OpenAI.APIError ? error.requestID : undefined,
        errorName: error instanceof Error ? error.name : typeof error,
      },
      "OpenAI chat request failed",
    );
    res.status(isQuotaError ? 503 : 502).json({
      error: isQuotaError
        ? "The OpenAI account has no remaining credits. Check its billing or usage limits, then try again."
        : "The AI service could not complete that message. Please try again.",
    });
  }
});

export default router;