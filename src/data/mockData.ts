import { Course, User, StudyGroup, Question, Session, Match, GroupMatch, ChatMessage, Resource } from '@/types';

// Mock Courses
export const mockCourses: Course[] = [
  { id: '1', code: 'CS101', title: 'Introduction to Computer Science', professor: 'Dr. Smith' },
  { id: '2', code: 'MATH201', title: 'Calculus II', professor: 'Dr. Johnson' },
  { id: '3', code: 'PHYS101', title: 'Physics I', professor: 'Dr. Williams' },
  { id: '4', code: 'CHEM101', title: 'General Chemistry', professor: 'Dr. Brown' },
  { id: '5', code: 'ENG102', title: 'Academic Writing', professor: 'Dr. Davis' },
  { id: '6', code: 'PSYCH101', title: 'Introduction to Psychology', professor: 'Dr. Miller' },
  { id: '7', code: 'ECON101', title: 'Principles of Economics', professor: 'Dr. Wilson' },
  { id: '8', code: 'BIO101', title: 'Biology I', professor: 'Dr. Taylor' },
];

// Mock Users
export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Alex Chen',
    email: 'alex@university.edu',
    school: 'State University',
    major: 'Computer Science',
    year: 'Sophomore',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    bio: 'Love coding and coffee! Looking for study partners for algorithms.',
    studyStyle: ['collaborative', 'problem-solving'],
    goals: ['high-grade', 'accountability'],
    availability: [
      { day: 'Monday', timeBlocks: [{ start: '14:00', end: '17:00' }] },
      { day: 'Wednesday', timeBlocks: [{ start: '14:00', end: '17:00' }] },
      { day: 'Friday', timeBlocks: [{ start: '10:00', end: '12:00' }] },
    ],
    courses: [
      { courseId: '1', course: mockCourses[0], enrolledAt: new Date() },
      { courseId: '2', course: mockCourses[1], enrolledAt: new Date() },
    ],
    createdAt: new Date(),
  },
  {
    id: '2',
    name: 'Sarah Miller',
    email: 'sarah@university.edu',
    school: 'State University',
    major: 'Mathematics',
    year: 'Junior',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    bio: 'Math enthusiast. Happy to help with calculus!',
    studyStyle: ['quiet', 'exam-prep'],
    goals: ['high-grade', 'consistency'],
    availability: [
      { day: 'Monday', timeBlocks: [{ start: '15:00', end: '18:00' }] },
      { day: 'Tuesday', timeBlocks: [{ start: '10:00', end: '13:00' }] },
      { day: 'Thursday', timeBlocks: [{ start: '14:00', end: '16:00' }] },
    ],
    courses: [
      { courseId: '2', course: mockCourses[1], enrolledAt: new Date() },
      { courseId: '3', course: mockCourses[2], enrolledAt: new Date() },
    ],
    createdAt: new Date(),
  },
  {
    id: '3',
    name: 'Marcus Johnson',
    email: 'marcus@university.edu',
    school: 'State University',
    major: 'Physics',
    year: 'Sophomore',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus',
    bio: 'Physics major interested in quantum mechanics.',
    studyStyle: ['collaborative', 'problem-solving'],
    goals: ['high-grade', 'accountability'],
    availability: [
      { day: 'Monday', timeBlocks: [{ start: '14:00', end: '16:00' }] },
      { day: 'Wednesday', timeBlocks: [{ start: '14:00', end: '17:00' }] },
    ],
    courses: [
      { courseId: '3', course: mockCourses[2], enrolledAt: new Date() },
      { courseId: '2', course: mockCourses[1], enrolledAt: new Date() },
    ],
    createdAt: new Date(),
  },
  {
    id: '4',
    name: 'Emily Zhang',
    email: 'emily@university.edu',
    school: 'State University',
    major: 'Computer Science',
    year: 'Freshman',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily',
    bio: 'New to CS, excited to learn!',
    studyStyle: ['collaborative', 'exam-prep'],
    goals: ['pass', 'accountability'],
    availability: [
      { day: 'Tuesday', timeBlocks: [{ start: '13:00', end: '16:00' }] },
      { day: 'Thursday', timeBlocks: [{ start: '13:00', end: '16:00' }] },
    ],
    courses: [
      { courseId: '1', course: mockCourses[0], enrolledAt: new Date() },
    ],
    createdAt: new Date(),
  },
];

// Mock Study Groups
export const mockGroups: StudyGroup[] = [
  {
    id: '1',
    name: 'CS101 Problem Solvers',
    description: 'Weekly problem-solving sessions for CS101. We work through homework together and prep for exams.',
    courseId: '1',
    course: mockCourses[0],
    members: [
      { userId: '1', user: mockUsers[0], role: 'admin', joinedAt: new Date() },
      { userId: '4', user: mockUsers[3], role: 'member', joinedAt: new Date() },
    ],
    maxMembers: 6,
    level: 'beginner',
    tags: ['homework-help', 'exam-prep', 'friendly'],
    rules: 'Be respectful, come prepared, help each other out!',
    isPublic: true,
    createdBy: '1',
    createdAt: new Date(),
  },
  {
    id: '2',
    name: 'Calculus Champions',
    description: 'High-achieving students tackling advanced calculus problems. Focus on understanding, not just memorizing.',
    courseId: '2',
    course: mockCourses[1],
    members: [
      { userId: '2', user: mockUsers[1], role: 'admin', joinedAt: new Date() },
      { userId: '3', user: mockUsers[2], role: 'member', joinedAt: new Date() },
    ],
    maxMembers: 5,
    level: 'advanced',
    tags: ['advanced', 'theory', 'proofs'],
    isPublic: true,
    createdBy: '2',
    createdAt: new Date(),
  },
  {
    id: '3',
    name: 'Physics Study Squad',
    description: 'Collaborative physics study sessions. We tackle problems together and explain concepts to each other.',
    courseId: '3',
    course: mockCourses[2],
    members: [
      { userId: '3', user: mockUsers[2], role: 'admin', joinedAt: new Date() },
    ],
    maxMembers: 8,
    level: 'average',
    tags: ['collaborative', 'problem-sets', 'labs'],
    isPublic: true,
    createdBy: '3',
    createdAt: new Date(),
  },
];

// Mock Sessions
export const mockSessions: Session[] = [
  {
    id: '1',
    groupId: '1',
    title: 'Week 5 Homework Review',
    description: 'Going over homework problems and preparing for the upcoming quiz',
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    startTime: '14:00',
    endTime: '16:00',
    location: 'Library Room 204',
    isOnline: false,
    attendees: [
      { userId: '1', user: mockUsers[0], status: 'going' },
      { userId: '4', user: mockUsers[3], status: 'going' },
    ],
    agenda: [
      { title: 'Review homework problems', duration: 45 },
      { title: 'Quiz prep questions', duration: 30 },
      { title: 'Open discussion', duration: 15 },
    ],
  },
  {
    id: '2',
    groupId: '2',
    title: 'Integration Techniques Deep Dive',
    description: 'Mastering integration by parts and substitution',
    date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    startTime: '15:00',
    endTime: '17:00',
    isOnline: true,
    meetingLink: 'https://zoom.us/j/example',
    attendees: [
      { userId: '2', user: mockUsers[1], status: 'going' },
      { userId: '3', user: mockUsers[2], status: 'maybe' },
    ],
  },
];

// Mock Questions
export const mockQuestions: Question[] = [
  {
    id: '1',
    courseId: '1',
    course: mockCourses[0],
    userId: '4',
    user: mockUsers[3],
    title: 'How do I understand recursion?',
    content: 'I keep getting confused when a function calls itself. Can someone explain the base case concept with a simple example?',
    tags: ['recursion', 'fundamentals', 'help'],
    answers: [
      {
        id: '1',
        questionId: '1',
        userId: '1',
        user: mockUsers[0],
        content: 'Think of recursion like Russian nesting dolls! The base case is the smallest doll that doesn\'t contain another. Example: factorial(1) = 1 is the base case, and factorial(n) = n * factorial(n-1) is the recursive case.',
        upvotes: 5,
        isAccepted: true,
        createdAt: new Date(),
      },
    ],
    upvotes: 3,
    createdAt: new Date(),
    isResolved: true,
  },
  {
    id: '2',
    courseId: '2',
    course: mockCourses[1],
    userId: '3',
    user: mockUsers[2],
    title: 'Integration by parts - when to use?',
    content: 'I understand the formula but I never know when to apply it vs substitution. Any tips?',
    tags: ['integration', 'techniques', 'exam-help'],
    answers: [],
    upvotes: 7,
    createdAt: new Date(),
    isResolved: false,
  },
];

// Mock Chat Messages
export const mockMessages: ChatMessage[] = [
  {
    id: '1',
    groupId: '1',
    userId: '1',
    user: mockUsers[0],
    content: 'Hey everyone! Ready for our session tomorrow?',
    createdAt: new Date(Date.now() - 3600000),
  },
  {
    id: '2',
    groupId: '1',
    userId: '4',
    user: mockUsers[3],
    content: 'Yes! I have some questions about the recursion homework.',
    createdAt: new Date(Date.now() - 3000000),
  },
  {
    id: '3',
    groupId: '1',
    userId: '1',
    user: mockUsers[0],
    content: 'Perfect, we can go through them together. See you at 2pm!',
    createdAt: new Date(Date.now() - 2400000),
    isPinned: true,
  },
];

// Mock Resources
export const mockResources: Resource[] = [
  {
    id: '1',
    title: 'CS101 Cheat Sheet',
    description: 'Quick reference for common algorithms and data structures',
    type: 'link',
    url: 'https://example.com/cs101-cheatsheet',
    courseId: '1',
    groupId: '1',
    userId: '1',
    user: mockUsers[0],
    createdAt: new Date(),
  },
  {
    id: '2',
    title: 'Calculus Formula Sheet',
    description: 'All integration formulas you need for the exam',
    type: 'note',
    courseId: '2',
    userId: '2',
    user: mockUsers[1],
    createdAt: new Date(),
  },
];

// Current user (for demo purposes)
export const currentUser: User = mockUsers[0];

// Generate recommended matches
export const getRecommendedPeople = (user: User): Match[] => {
  return mockUsers
    .filter(u => u.id !== user.id)
    .map(u => {
      const reasons: Match['reasons'] = [];
      let score = 0;

      // Check shared courses
      const sharedCourses = user.courses.filter(uc => 
        u.courses.some(c => c.courseId === uc.courseId)
      );
      if (sharedCourses.length > 0) {
        reasons.push({
          type: 'course',
          description: `Same class: ${sharedCourses.map(c => c.course.code).join(', ')}`,
          weight: 30,
        });
        score += 30 * sharedCourses.length;
      }

      // Check overlapping availability
      const hasOverlap = user.availability.some(ua =>
        u.availability.some(a => a.day === ua.day)
      );
      if (hasOverlap) {
        reasons.push({
          type: 'availability',
          description: 'Overlapping free time',
          weight: 25,
        });
        score += 25;
      }

      // Check study style match
      const sharedStyles = user.studyStyle.filter(s => u.studyStyle.includes(s));
      if (sharedStyles.length > 0) {
        reasons.push({
          type: 'study-style',
          description: `Similar style: ${sharedStyles.join(', ')}`,
          weight: 20,
        });
        score += 20 * sharedStyles.length;
      }

      // Check goals match
      const sharedGoals = user.goals.filter(g => u.goals.includes(g));
      if (sharedGoals.length > 0) {
        reasons.push({
          type: 'goal',
          description: `Same goals: ${sharedGoals.join(', ')}`,
          weight: 15,
        });
        score += 15 * sharedGoals.length;
      }

      return { userId: u.id, user: u, score, reasons };
    })
    .sort((a, b) => b.score - a.score);
};

export const getRecommendedGroups = (user: User): GroupMatch[] => {
  return mockGroups.map(group => {
    const reasons: GroupMatch['reasons'] = [];
    let score = 0;

    // Check if user is in same course
    const isInCourse = user.courses.some(c => c.courseId === group.courseId);
    if (isInCourse) {
      reasons.push({
        type: 'course',
        description: `For your ${group.course.code} class`,
        weight: 40,
      });
      score += 40;
    }

    // Check level match based on goals
    if (group.level === 'beginner' && user.goals.includes('pass')) {
      reasons.push({
        type: 'goal',
        description: 'Good for getting started',
        weight: 20,
      });
      score += 20;
    }
    if (group.level === 'advanced' && user.goals.includes('high-grade')) {
      reasons.push({
        type: 'goal',
        description: 'High-achieving focus',
        weight: 20,
      });
      score += 20;
    }

    // Check study style in tags
    const hasMatchingStyle = group.tags.some(t => 
      user.studyStyle.some(s => t.includes(s))
    );
    if (hasMatchingStyle) {
      reasons.push({
        type: 'study-style',
        description: 'Matches your study style',
        weight: 15,
      });
      score += 15;
    }

    // Space available
    if (group.members.length < group.maxMembers) {
      const spotsLeft = group.maxMembers - group.members.length;
      reasons.push({
        type: 'availability',
        description: `${spotsLeft} spot${spotsLeft > 1 ? 's' : ''} left`,
        weight: 10,
      });
      score += 10;
    }

    return { group, score, reasons };
  }).sort((a, b) => b.score - a.score);
};
