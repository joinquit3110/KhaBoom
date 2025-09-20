// Type declarations for course.js
export interface Course {
  id: string;
  title: string;
  description?: string;
  color: string;
  nextCourse: string;
  prevCourse: string;
  locale: string;
  availableLocales: string[];
  sections: any[];
  steps: any;
  goals: number;
  biosJSON: string;
  glossJSON: string;
  hintsJSON: string;
  hero?: string;
  icon?: string;
  
  // Methods from x-course component
  $: (selector: string) => any;
  userData: any;
  saveProgress: () => void;
  log: (category: string, action: string, data?: any) => void;
}
