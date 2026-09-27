import type { ProviderResponse } from "./provider";
import type { PhoneAction } from "@workspace/phoneai-actions";

const cleanCommand = (input: string) =>
  input
    .trim()
    .replaceAll("’", "'")
    .replace(/\s+/g, " ")
    .replace(/[.!?]+$/, "")
    .toLowerCase();

export function parseLocalCommand(input: string): ProviderResponse | null {
  const command = cleanCommand(input);

  if (command === "open youtube") {
    const action: PhoneAction = {
      type: "OPEN_URL",
      parameters: { url: "https://www.youtube.com" },
    };
    return {
      content: "Opening YouTube.",
      action,
    };
  }

  if (command === "open google") {
    const action: PhoneAction = {
      type: "OPEN_URL",
      parameters: { url: "https://www.google.com" },
    };
    return {
      content: "Opening Google.",
      action,
    };
  }

  const searchMatch = command.match(/^search the web(?: for (.+))?$/);
  if (searchMatch) {
    const query = searchMatch[1]?.trim();

    return {
      content: query ? `Searching the web for “${query}”.` : "Opening web search.",
      action: {
        type: "SEARCH_WEB",
        parameters: { query: query ?? "" },
      },
    };
  }

  if (command === "open gallery") {
    return {
      content: "Requesting access to your gallery.",
      action: {
        type: "OPEN_GALLERY",
        parameters: { source: "device_gallery" },
      },
    };
  }

  if (
    command === "show today's date" ||
    command === "show today date" ||
    command === "what is today's date"
  ) {
    const date = new Intl.DateTimeFormat(undefined, {
      dateStyle: "full",
    }).format(new Date());

    return {
      content: `Today's date is ${date}.`,
      action: {
        type: "SHOW_DATE",
        parameters: { locale: "default" },
      },
    };
  }

  if (
    command === "tell me the time" ||
    command === "what time is it" ||
    command === "show me the time"
  ) {
    const time = new Intl.DateTimeFormat(undefined, {
      timeStyle: "short",
    }).format(new Date());

    return {
      content: `The current time is ${time}.`,
      action: {
        type: "SHOW_TIME",
        parameters: { locale: "default" },
      },
    };
  }

  return null;
}