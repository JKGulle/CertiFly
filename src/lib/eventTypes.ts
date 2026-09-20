export const EVENT_TYPES = [
  { value: "COURSE_COMPLETION", label: "Course completion" },
  { value: "EXAM_PASS", label: "Exam pass" },
  { value: "WEBINAR_CHECKIN", label: "Webinar check-in" },
  { value: "CUSTOM", label: "Custom achievement" },
] as const;

export type EventType = (typeof EVENT_TYPES)[number]["value"];
