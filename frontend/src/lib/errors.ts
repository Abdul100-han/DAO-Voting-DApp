export function formatTxError(error: unknown): string {
  if (error && typeof error === "object") {
    if ("shortMessage" in error && typeof error.shortMessage === "string") {
      return error.shortMessage;
    }
    if ("message" in error && typeof error.message === "string") {
      return error.message;
    }
  }
  return "Transaction failed.";
}
