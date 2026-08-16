export function explainCallError(error: unknown): string {
  const name = error instanceof Error ? error.name : "";
  const message = error instanceof Error ? error.message : String(error);

  if (
    name === "NotAllowedError" ||
    name === "PermissionDeniedError" ||
    /permission|notallowed|denied|blocked/i.test(message)
  ) {
    return "Microphone is blocked. Allow the mic in the browser address bar, then start the call again.";
  }
  if (name === "NotFoundError" || /requested device not found|no microphone/i.test(message)) {
    return "No microphone found. Plug in a mic or enable one in Windows sound settings.";
  }
  if (/RTMClient is not a constructor|Cannot read properties of undefined/i.test(message)) {
    return "Agora Signaling failed to load. Refresh the page and try again.";
  }
  if (/CAN_NOT_GET_GATEWAY|invalid vendor key|invalid appid|dynamic key/i.test(message)) {
    return "Agora rejected the token. Confirm RTC and Conversational AI are enabled on this App ID.";
  }
  if (/NotReadableError|track start/i.test(message)) {
    return "The microphone is in use by another app. Close Zoom/Teams and try again.";
  }
  return message;
}
