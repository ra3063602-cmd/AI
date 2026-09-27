import {
  isPhoneAction,
  type PhoneAction,
} from "@workspace/phoneai-actions";

export type AndroidBridgeResult = {
  displayMessage: string;
};

export interface AndroidBridge {
  request(action: PhoneAction): Promise<AndroidBridgeResult>;
}

export class WebMockAndroidBridge implements AndroidBridge {
  async request(action: PhoneAction): Promise<AndroidBridgeResult> {
    if (!isPhoneAction(action)) {
      throw new Error("The Android bridge rejected an invalid action.");
    }

    console.info("[PhoneAI web mock bridge] Android action requested", action);

    return {
      displayMessage: `Mock Android bridge received ${action.type}. This web preview does not control Android apps.`,
    };
  }
}

export const androidBridge: AndroidBridge = new WebMockAndroidBridge();