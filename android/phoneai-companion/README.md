# PhoneAI Android Companion

This is a separate Kotlin Android companion project for the existing PhoneAI web app. It is an architecture scaffold for a future native companion; it does not change the web PhoneAI UI.

## Status

The Replit container used for this project does not have Java, Gradle, the Android SDK, `adb`, or the Kotlin compiler installed. The Android project files were created, but an Android build cannot be claimed or verified in this environment.

Build it on a machine with Android Studio or the Android SDK:

```bash
gradle :app:assembleDebug
```

Or generate a Gradle wrapper on the Android development machine and run
`./gradlew :app:assembleDebug`.

The project uses Kotlin, AndroidX lifecycle/ViewModel, coroutines, WebView, and the Kotlin serialization JSON parser. The native action implementation is in `app/src/main/java/com/phoneai/companion/bridge/AndroidIntentBridge.kt`.

## Action contract

The native contract mirrors `lib/phoneai-actions/src/index.ts`:

| Action | Parameters | Native behavior |
| --- | --- | --- |
| `OPEN_URL` | `{ "url": "https://www.google.com" }` | Validated `ACTION_VIEW` Intent |
| `SEARCH_WEB` | `{ "query": "..." }` | `ACTION_WEB_SEARCH` Intent |
| `OPEN_GALLERY` | `{ "source": "device_gallery" }` | `ACTION_OPEN_DOCUMENT` with `image/*` |
| `SHOW_DATE` | `{ "locale": "default" }` | Android Toast with the local date |
| `SHOW_TIME` | `{ "locale": "default" }` | Android Toast with the local time |

`PhoneActionJsonCodec` rejects unknown action types, extra object fields, missing parameters, wrong parameter values, non-HTTPS URLs, and URL hosts outside the current Google/YouTube allowlist. The bridge validates the typed action again immediately before dispatch.

`OPEN_GALLERY` uses the system document picker and does not request `READ_MEDIA_IMAGES`, storage access, or unrestricted filesystem access. The project does not use `AccessibilityService`.

## Web communication protocol

The current browser app continues to use `WebMockAndroidBridge`. It logs and displays that Android control is unavailable. It is not replaced by this project.

When the web PhoneAI is hosted inside this Android app's WebView, the communication sequence is:

1. A future web adapter keeps the existing TypeScript `AndroidBridge.request(action)` API and generates a request ID.
2. The adapter serializes the already validated action with `JSON.stringify(action)`.
3. It calls the WebView interface:

   ```javascript
   window.PhoneAIBridge.requestAction(requestId, actionJson)
   ```

4. `PhoneAiJavascriptBridge` receives only the request ID and JSON string. It passes them to `PhoneAiActionViewModel`.
5. `PhoneActionJsonCodec` parses and validates the JSON. Invalid input produces a rejected result and never reaches an Android Intent.
6. `AndroidIntentBridge` validates the typed action again and dispatches only the five allowlisted operations.
7. The Activity sends the result back into the WebView through the callback:

   ```javascript
   window.PhoneAI?.onNativeActionResult?.({
     requestId,
     actionType,
     ok,
     message
   })
   ```

8. The future web adapter resolves or rejects the original `AndroidBridge.request(action)` Promise using the matching `requestId`.

The WebView must load only the trusted PhoneAI origin before exposing `PhoneAIBridge`. The default `PHONEAI_WEB_URL` is blank and displays a configuration message; no production URL is assumed or hardcoded.

## Permissions and safety boundaries

The manifest includes only `INTERNET`, required when the companion loads the hosted PhoneAI web app. No runtime media or storage permissions are requested. Android intents are resolved before launch, and the native layer never executes shell commands, arbitrary JavaScript, or arbitrary code from action input.