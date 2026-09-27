import { Router, type IRouter } from "express";
import {
  SendChatMessageBody,
  SendChatMessageResponse,
} from "@workspace/api-zod";
import { logger } from "../lib/logger";
import { parseLocalCommand } from "../ai/local-command-provider";
import { openAiProvider } from "../ai/openai-provider";
import { AiProviderUnavailableError } from "../ai/provider";
import { isPhoneAction } from "@workspace/phoneai-actions";

const router: IRouter = Router();

router.post("/chat", async (req, res) => {
  const parsed = SendChatMessageBody.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      error: "Please send a valid chat message history.",
    });
    return;
  }

  const latestMessage = parsed.data.messages.at(-1);
  if (!latestMessage || latestMessage.role !== "user") {
    res.status(400).json({
      error: "The latest chat message must come from the user.",
    });
    return;
  }

  const localResponse = parseLocalCommand(latestMessage.content);
  if (localResponse) {
    res.json(
      SendChatMessageResponse.parse({
        message: {
          role: "assistant",
          content: localResponse.content,
        },
        action: localResponse.action ?? null,
      }),
    );
    return;
  }

  try {
    const providerResponse = await openAiProvider.generateResponse(
      parsed.data.messages,
    );
    const action =
      providerResponse.action && isPhoneAction(providerResponse.action)
        ? providerResponse.action
        : null;
    res.json(
      SendChatMessageResponse.parse({
        message: {
          role: "assistant",
          content: providerResponse.content,
        },
        action,
      }),
    );
  } catch (error) {
    if (error instanceof AiProviderUnavailableError) {
      logger.error(
        {
          providerStatus: error.providerStatus,
          providerCode: error.providerCode,
          providerType: error.providerType,
          requestId: error.requestId,
        },
        "AI provider is unavailable",
      );
      res.status(503).json({ error: error.message });
      return;
    }

    logger.error(
      { errorName: error instanceof Error ? error.name : typeof error },
      "OpenAI chat request failed",
    );
    res.status(502).json({
      error: "The AI provider is currently unavailable. Please try again.",
    });
  }
});

export default router;