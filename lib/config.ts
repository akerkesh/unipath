export const AVAILABLE_MAJORS = [
  { id: "computer-science", label: "Computer Science" },
] as const;

export const AVAILABLE_MINORS = [
  { id: "math", label: "Mathematics" },
] as const;

export const MAJOR_JSON_MAP: Record<string, string> = {
  "Computer Science": "computer-science-major",
};

export const MINOR_JSON_MAP: Record<string, string> = {
  Mathematics: "math-minor",
};
