import type { CourseData } from "./types";

/** Parse credits string (e.g. "3", "4", "1-2") to number - uses first value for ranges */
export function parseCredits(credits: string): number {
  if (!credits) return 3;
  const match = credits.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : 3;
}

/** Get all courses that must be taken before courseId (prerequisites) */
export function getPrereqChain(
  courseId: string,
  catalog: Record<string, CourseData>,
  visited = new Set<string>()
): string[] {
  if (visited.has(courseId)) return [];
  visited.add(courseId);
  const course = catalog[courseId];
  if (!course?.prerequisite?.length) return [];
  const result: string[] = [];
  for (const p of course.prerequisite) {
    if (catalog[p] && !result.includes(p)) result.push(p);
    result.push(...getPrereqChain(p, catalog, visited));
  }
  return [...new Set(result)];
}

/** Check if all prerequisites are in completed set */
export function prereqsSatisfied(
  courseId: string,
  catalog: Record<string, CourseData>,
  completed: Set<string>
): boolean {
  const course = catalog[courseId];
  if (!course?.prerequisite?.length) return true;
  return course.prerequisite.every((p) => completed.has(p));
}

/** Check if all concurrent requirements are satisfied (in completed or current semester) */
export function concurrentSatisfied(
  courseId: string,
  catalog: Record<string, CourseData>,
  completed: Set<string>,
  currentSemester: Set<string>
): boolean {
  const course = catalog[courseId];
  if (!course?.concurrent?.length) return true;
  return course.concurrent.every(
    (c) => completed.has(c) || currentSemester.has(c)
  );
}
