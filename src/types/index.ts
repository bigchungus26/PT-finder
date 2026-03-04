export interface User {
  id: string;
  name: string;
  email: string;
  area: string;
  gym: string;
  avatar?: string;
  bio?: string;
  fitnessGoals: FitnessGoal[];
  availability: Availability[];
  createdAt: Date;
}

export type FitnessGoal = 'weight-loss' | 'muscle-gain' | 'endurance' | 'flexibility' | 'general-fitness' | 'sport-specific' | 'rehab';

export interface Availability {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  timeBlocks: TimeBlock[];
}

export interface TimeBlock {
  start: string;
  end: string;
}

export interface OnboardingState {
  step: number;
  name: string;
  area: string;
  gym: string;
  availability: Availability[];
  fitnessGoals: FitnessGoal[];
}

export interface TrainerProfile {
  id: string;
  name: string;
  specialty: string[];
  yearsExperience: number;
  certifications: string[];
  transformations: string[];
  clientsWorkedWith: number;
  hourlyRate: number;
  rating: number;
  totalReviews: number;
  gym: string;
  area: string;
  bio: string;
  verified: boolean;
}

export interface ChatMessage {
  id: string;
  groupId: string;
  userId: string;
  user: User;
  content: string;
  createdAt: Date;
  isPinned?: boolean;
}

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
