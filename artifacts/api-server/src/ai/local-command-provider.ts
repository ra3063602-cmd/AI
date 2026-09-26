import type { ProviderResponse } from "./provider";

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
    return {
      content: "Opening YouTube.",
      command: {
        type: "open_url",
        url: "https://www.youtube.com",
        label: "YouTube",
      },
    };
  }

  if (command === "open google") {
    return {
      content: "Opening Google.",
      command: {
        type: "open_url",
        url: "https://www.google.com",
        label: "Google",
      },
    };
  }

  const searchMatch = command.match(/^search the web(?: for (.+))?$/);
  if (searchMatch) {
    const query = searchMatch[1]?.trim();
    const url = query
      ? `https://www.google.com/search?q=${encodeURIComponent(query)}`
      : "https://www.google.com";

    return {
      content: query ? `Searching the web for “${query}”.` : "Opening web search.",
      command: {
        type: "open_url",
        url,
        label: "web search",
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

    return { content: `Today's date is ${date}.` };
  }

  if (
    command === "tell me the time" ||
    command === "what time is it" ||
    command === "show me the time"
  ) {
    const time = new Intl.DateTimeFormat(undefined, {
      timeStyle: "short",
    }).format(new Date());

    return { content: `The current time is ${time}.` };
  }

  return null;
}