import type { CourseData, CourseCatalog, SemesterPlan, ScheduledCourse } from "./types";
import { parseCredits, prereqsSatisfied, concurrentSatisfied } from "./utils";

const MIN_CREDITS = 12;
const MAX_CREDITS = 19;
const GEN_ED_CREDITS: Record<string, number> = {
  "Computer Science": 45,
  default: 45,
};

const SEMESTER_LABELS = [
  "Year 1, Fall",
  "Year 1, Spring",
  "Year 2, Fall",
  "Year 2, Spring",
  "Year 3, Fall",
  "Year 3, Spring",
  "Year 4, Fall",
  "Year 4, Spring",
];

function makeId() {
  return Math.random().toString(36).slice(2, 9);
}

/** Merge major and minor catalogs, preferring major data for overlapping courses */
function mergeCatalogs(
  majorCatalog: CourseCatalog,
  minorCatalog: CourseCatalog
): CourseCatalog {
  const merged = { ...majorCatalog };
  for (const [key, data] of Object.entries(minorCatalog)) {
    if (!merged[key]) merged[key] = data;
    else {
      merged[key] = {
        ...data,
        prerequisite: merged[key].prerequisite?.length
          ? merged[key].prerequisite!
          : data.prerequisite || [],
        concurrent: merged[key].concurrent?.length
          ? merged[key].concurrent!
          : data.concurrent || [],
      };
    }
  }
  return merged;
}

/** Get required courses for major (ETM + MAC + MAE count). Use 121/122 path (not 131/132). */
function getMajorRequirements(
  catalog: CourseCatalog,
  major: string
): { required: string[]; electiveCount: number } {
  if (major !== "Computer Science") {
    return { required: [], electiveCount: 0 };
  }
  const etmAll = Object.entries(catalog)
    .filter(([, c]) => c.type === "ETM")
    .map(([k]) => k);
  const etmExclude = ["CMPSC 131", "CMPSC 132"];
  const etm = etmAll.filter((k) => !etmExclude.includes(k));
  const mac = Object.entries(catalog)
    .filter(([, c]) => c.type === "MAC")
    .map(([k]) => k);
  const required = [...etm, ...mac];
  return { required, electiveCount: 3 };
}

/** Get required courses for minor (MIC + MIE credits) */
function getMinorRequirements(
  catalog: CourseCatalog,
  majorCatalog: CourseCatalog
): { required: string[]; electiveCredits: number } {
  const mic = Object.entries(catalog)
    .filter(([, c]) => c.type === "MIC")
    .map(([k]) => k);
  const mie = Object.entries(catalog)
    .filter(([, c]) => c.type === "MIE")
    .map(([k]) => k);
  const required = [...mic];
  const electiveCredits = 4;
  return { required, electiveCredits };
}

/** Build combined required set (major + minor), deduplicating overlaps */
function buildRequiredSet(
  majorCatalog: CourseCatalog,
  minorCatalog: CourseCatalog,
  major: string,
  minor?: string
): { courses: string[]; maePool: string[]; miePool: string[] } {
  const { required: majorReq, electiveCount } = getMajorRequirements(
    majorCatalog,
    major
  );
  const { required: minorReq, electiveCredits } = minor
    ? getMinorRequirements(minorCatalog, majorCatalog)
    : { required: [], electiveCredits: 0 };

  const merged = mergeCatalogs(majorCatalog, minorCatalog);
  const allRequired = Array.from(new Set([...majorReq, ...minorReq]));

  const maePool = Object.entries(majorCatalog)
    .filter(([, c]) => c.type === "MAE")
    .map(([k]) => k);
  const miePool = minor
    ? Object.entries(minorCatalog)
        .filter(([, c]) => c.type === "MIE")
        .map(([k]) => k)
    : [];

  return {
    courses: allRequired,
    maePool,
    miePool,
  };
}

/** Schedule courses into 8 semesters respecting prerequisites and credit limits */
export function generatePlan(
  majorCatalog: CourseCatalog,
  minorCatalog: CourseCatalog,
  major: string,
  minor?: string,
  creditsCompleted = 0
): SemesterPlan[] {
  const merged = mergeCatalogs(majorCatalog, minorCatalog);
  const { courses, maePool, miePool } = buildRequiredSet(
    majorCatalog,
    minorCatalog,
    major,
    minor
  );

  const genEd = GEN_ED_CREDITS[major] ?? GEN_ED_CREDITS.default;
  const genEdPerSemester = [6, 6, 6, 6, 6, 5, 5, 5];

  const semesters: SemesterPlan[] = SEMESTER_LABELS.map((label, i) => ({
    id: `s${i}`,
    label,
    courses: [],
  }));

  const completed = new Set<string>();
  const remaining = new Set(courses);

  const maeToAdd = 3;
  const maeAdded: string[] = [];
  for (const c of maePool) {
    if (maeAdded.length >= maeToAdd) break;
    if (!remaining.has(c)) maeAdded.push(c);
  }
  maeAdded.forEach((c) => remaining.add(c));

  let mieCreditsAdded = 0;
  const mieTarget = 4;
  for (const c of miePool) {
    if (mieCreditsAdded >= mieTarget) break;
    const cred = parseCredits(merged[c]?.credits ?? "3");
    if (!remaining.has(c)) {
      remaining.add(c);
      mieCreditsAdded += cred;
    }
  }

  function canTake(courseId: string): boolean {
    const prereqOk = prereqsSatisfied(courseId, merged, completed);
    const course = merged[courseId];
    if (!course) return false;
    return prereqOk;
  }

  function scheduleCourse(
    courseId: string,
    semesterIndex: number
  ): ScheduledCourse | null {
    const course = merged[courseId];
    if (!course) return null;
    const sem = semesters[semesterIndex];
    const currentCredits = sem.courses.reduce((s, c) => s + c.credits, 0);
    const credits = parseCredits(course.credits);
    if (currentCredits + credits > MAX_CREDITS) return null;

    const currentSemester = new Set(sem.courses.map((c) => c.name));
    const concurrentOk = concurrentSatisfied(
      courseId,
      merged,
      completed,
      currentSemester
    );
    if (!concurrentOk) return null;

    const scheduled: ScheduledCourse = {
      id: makeId(),
      name: course.className,
      credits,
      grade: "",
      type: course.type,
    };
    sem.courses.push(scheduled);
    completed.add(courseId);
    remaining.delete(courseId);
    return scheduled;
  }

  for (let s = 0; s < 8; s++) {
    const sem = semesters[s];
    const genEdCredits = genEdPerSemester[s] ?? 0;
    if (genEdCredits > 0) {
      const chunks = [3, 3, 3, 3];
      let added = 0;
      for (const cr of chunks) {
        if (added >= genEdCredits) break;
        const currentTotal = sem.courses.reduce((sum, c) => sum + c.credits, 0);
        if (currentTotal >= MAX_CREDITS) break;
        const toAdd = Math.min(cr, genEdCredits - added, MAX_CREDITS - currentTotal);
        if (toAdd > 0) {
          sem.courses.push({
            id: makeId(),
            name: "General Education",
            credits: toAdd,
            grade: "",
          });
          added += toAdd;
        }
      }
    }

    let pass = 0;
    while (pass < 5) {
      pass++;
      let scheduledAny = false;
      for (const courseId of Array.from(remaining)) {
        if (!canTake(courseId)) continue;
        const currentCredits = sem.courses.reduce((s, c) => s + c.credits, 0);
        if (currentCredits >= MAX_CREDITS) break;
        if (scheduleCourse(courseId, s)) scheduledAny = true;
      }
      if (!scheduledAny) break;
    }
  }

  for (let s = 0; s < 8; s++) {
    const sem = semesters[s];
    const total = sem.courses.reduce((s, c) => s + c.credits, 0);
    if (total < MIN_CREDITS && total > 0) {
      const need = MIN_CREDITS - total;
      const genEd = sem.courses.find((c) => c.name === "General Education");
      if (genEd) {
        genEd.credits += Math.min(need, 3);
      } else {
        sem.courses.push({
          id: makeId(),
          name: "General Education",
          credits: Math.min(need, 3),
          grade: "",
        });
      }
    }
  }

  return semesters;
}
