// User and Profile types
export interface User {
  id: string;
  name: string;
  email: string;
  school: string;
  major: string;
  year: 'Freshman' | 'Sophomore' | 'Junior' | 'Senior' | 'Graduate';
  avatar?: string;
  bio?: string;
  studyStyle: StudyStyle[];
  goals: StudyGoal[];
  availability: Availability[];
  courses: UserCourse[];
  createdAt: Date;
}

export type StudyStyle = 'quiet' | 'collaborative' | 'problem-solving' | 'exam-prep';
export type StudyGoal = 'pass' | 'high-grade' | 'consistency' | 'accountability';

export interface Availability {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  timeBlocks: TimeBlock[];
}

export interface TimeBlock {
  start: string; // e.g., "09:00"
  end: string;   // e.g., "11:00"
}

// Course types
export interface Course {
  id: string;
  code: string;
  title: string;
  description?: string;
  professor?: string;
}

export interface UserCourse {
  courseId: string;
  course: Course;
  enrolledAt: Date;
}

// Group types
export interface StudyGroup {
  id: string;
  name: string;
  description: string;
  courseId: string;
  course: Course;
  members: GroupMember[];
  maxMembers: number;
  level: 'beginner' | 'average' | 'advanced';
  tags: string[];
  rules?: string;
  isPublic: boolean;
  createdBy: string;
  createdAt: Date;
  nextSession?: Session;
}

export interface GroupMember {
  userId: string;
  user: User;
  role: 'admin' | 'member';
  joinedAt: Date;
}

// Session types
export interface Session {
  id: string;
  groupId: string;
  title: string;
  description?: string;
  date: Date;
  startTime: string;
  endTime: string;
  location?: string;
  isOnline: boolean;
  meetingLink?: string;
  attendees: SessionAttendee[];
  agenda?: AgendaItem[];
}

export interface SessionAttendee {
  userId: string;
  user: User;
  status: 'going' | 'maybe' | 'not-going';
}

export interface AgendaItem {
  title: string;
  duration: number; // in minutes
  description?: string;
}

// Question & Answer types
export interface Question {
  id: string;
  courseId: string;
  course: Course;
  userId: string;
  user: User;
  title: string;
  content: string;
  tags: string[];
  answers: Answer[];
  upvotes: number;
  createdAt: Date;
  isResolved: boolean;
}

export interface Answer {
  id: string;
  questionId: string;
  userId: string;
  user: User;
  content: string;
  upvotes: number;
  isAccepted: boolean;
  createdAt: Date;
}

// Resource types
export interface Resource {
  id: string;
  title: string;
  description?: string;
  type: 'link' | 'note' | 'file';
  url?: string;
  courseId?: string;
  groupId?: string;
  userId: string;
  user: User;
  createdAt: Date;
}

// Match types
export interface Match {
  userId: string;
  user: User;
  score: number;
  reasons: MatchReason[];
}

export interface MatchReason {
  type: 'course' | 'availability' | 'study-style' | 'goal' | 'section';
  description: string;
  weight: number;
}

export interface GroupMatch {
  group: StudyGroup;
  score: number;
  reasons: MatchReason[];
}

// Chat types
export interface ChatMessage {
  id: string;
  groupId: string;
  userId: string;
  user: User;
  content: string;
  createdAt: Date;
  isPinned?: boolean;
}

// Report types
export interface Report {
  id: string;
  reporterId: string;
  reportedUserId?: string;
  reportedGroupId?: string;
  reason: string;
  description: string;
  status: 'pending' | 'reviewed' | 'resolved';
  createdAt: Date;
}

// Onboarding state
export interface OnboardingState {
  step: number;
  name: string;
  school: string;
  major: string;
  year: User['year'] | '';
  courses: { code: string; title: string }[];
  availability: Availability[];
  studyStyle: StudyStyle[];
  goals: StudyGoal[];
}
