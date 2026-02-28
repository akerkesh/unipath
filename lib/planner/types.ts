export interface CourseData {
  className: string;
  credits: string;
  difficulty: string;
  type: string;
  prerequisite?: string[];
  concurrent?: string[];
}

export type CourseCatalog = Record<string, CourseData>;

export interface ScheduledCourse {
  id: string;
  name: string;
  credits: number;
  grade: string;
  type?: string;
}

export interface SemesterPlan {
  id: string;
  label: string;
  courses: ScheduledCourse[];
}

export interface PlanConfig {
  major: string;
  minor?: string;
  genEdCredits: number;
  creditsCompleted?: number;
}
