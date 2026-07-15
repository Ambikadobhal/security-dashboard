export function normalizeSeverity(severity?: string | null) {
  const normalized = (severity ?? "").trim().toLowerCase();

  switch (normalized) {
    case "critical":
      return "critical";
    case "high":
      return "high";
    case "medium":
    case "moderate":
      return "medium";
    case "low":
      return "low";
    case "info":
    case "unknown":
    case "":
      return "info";
    default:
      return "info";
  }
}