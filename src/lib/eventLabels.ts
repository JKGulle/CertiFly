import { EVENT_TYPES } from "./eventTypes";

export function eventTypeLabel(value: string): string {
  return EVENT_TYPES.find((t) => t.value === value)?.label ?? value;
}

export function statusTone(status: string): { bg: string; fg: string } {
  switch (status) {
    case "ISSUED":
    case "PROCESSED":
      // Bright mint — issued/verified
      return { bg: "#7CF5DA", fg: "#0F2E27" };
    case "REVOKED":
    case "DEAD_LETTER":
    case "FAILED":
      // Coral-orange — revoked/error
      return { bg: "#FFB199", fg: "#5C1B0A" };
    case "REISSUED":
      // Grape purple
      return { bg: "#C9B8FF", fg: "#241452" };
    case "PENDING":
    case "PROCESSING":
      // Sunshine yellow
      return { bg: "#FFE066", fg: "#4A3900" };
    default:
      return { bg: "#FFE066", fg: "#4A3900" };
  }
}
