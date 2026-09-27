export const PHONE_ACTION_TYPES = [
  "OPEN_URL",
  "SEARCH_WEB",
  "OPEN_GALLERY",
  "SHOW_DATE",
  "SHOW_TIME",
] as const;

export type PhoneActionType = (typeof PHONE_ACTION_TYPES)[number];

export type PhoneAction =
  | {
      type: "OPEN_URL";
      parameters: {
        url: string;
      };
    }
  | {
      type: "SEARCH_WEB";
      parameters: {
        query: string;
      };
    }
  | {
      type: "OPEN_GALLERY";
      parameters: {
        source: "device_gallery";
      };
    }
  | {
      type: "SHOW_DATE";
      parameters: {
        locale: "default";
      };
    }
  | {
      type: "SHOW_TIME";
      parameters: {
        locale: "default";
      };
    };

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function isSafeHttpsUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 2_000) return false;
  const match = value.match(/^https:\/\/([^/?#\s]+)(?:[/?#]|$)/i);
  if (!match) return false;

  return new Set([
    "google.com",
    "www.google.com",
    "youtube.com",
    "www.youtube.com",
  ]).has(match[1].toLowerCase());
}

function hasOnlyKeys(record: UnknownRecord, keys: string[]) {
  return Object.keys(record).every((key) => keys.includes(key));
}

export function isPhoneAction(value: unknown): value is PhoneAction {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, ["type", "parameters"]) ||
    !isRecord(value.parameters)
  ) {
    return false;
  }

  const parameters = value.parameters;
  switch (value.type) {
    case "OPEN_URL":
      return (
        hasOnlyKeys(parameters, ["url"]) && isSafeHttpsUrl(parameters.url)
      );
    case "SEARCH_WEB":
      return (
        hasOnlyKeys(parameters, ["query"]) &&
        typeof parameters.query === "string" &&
        parameters.query.length <= 500
      );
    case "OPEN_GALLERY":
      return (
        hasOnlyKeys(parameters, ["source"]) &&
        parameters.source === "device_gallery"
      );
    case "SHOW_DATE":
    case "SHOW_TIME":
      return (
        hasOnlyKeys(parameters, ["locale"]) &&
        parameters.locale === "default"
      );
    default:
      return false;
  }
}