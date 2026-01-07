
export enum ProgressStatus {
  NOT_STARTED = 'Not Started',
  IN_PROGRESS = 'In Progress',
  MASTERED = 'Mastered'
}

export enum AcademicTaskStatus {
  UPCOMING = 'Upcoming',
  IN_PROGRESS = 'In Progress',
  REVIEW = 'Review',
  SUBMITTED = 'Submitted'
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: 'Low' | 'Medium' | 'High';
  notes?: string;
  deadline?: string;
}

export interface Resource {
  id: string;
  type: 'markdown' | 'link';
  title: string;
  content: string; 
}

export interface Topic {
  id: string;
  title: string;
  status: ProgressStatus;
  tasks: Task[];
  resources: Resource[];
}

export interface Module {
  id: string;
  title: string;
  topics: Topic[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  modules: Module[];
}

export interface AcademicProject {
  id: string;
  title: string;
  category: string; // e.g., Thesis, Assignment, Research
  deadline: string;
  status: AcademicTaskStatus;
  notes: string;
}

export interface UserProfile {
  name: string;
  role: string;
  avatarUrl?: string;
  apiKey?: string;
}

export interface AppState {
  user: UserProfile;
  courses: Course[];
  academicProjects: AcademicProject[];
}
