// ============================================================
// SYSD 90 — Core TypeScript Types
// ============================================================

export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard'
export type ProblemStatus = 'Solved' | 'Attempted' | 'To Revisit'
export type MockType = 'System Design' | 'DSA'
export type NoteCategory = 'System Design' | 'DSA' | 'Mock Interview' | 'Mistakes' | 'Project Ideas' | 'Revision'
export type ResourceStatus = 'Not Started' | 'Using' | 'Completed'
export type TaskStatus = 'not_started' | 'in_progress' | 'completed'
export type ReadinessTier = 'Beginner' | 'Building' | 'Consistent' | 'Interview-Ready' | 'Peak Mode'

// ─── Auth ────────────────────────────────────────────────────
export interface Profile {
  id: string
  username: string | null
  avatar_url: string | null
  start_date: string | null   // ISO date string
  streak_freeze_count: number
  flexible_mode: boolean
  created_at: string
}

// ─── Roadmap ─────────────────────────────────────────────────
export interface DSATarget {
  topic: string
  min: number
  max: number
}

export interface WeekData {
  week: number
  title: string
  month: number
  topics: string[]
  dsaFocus: string[]
  dsaTargets: DSATarget[]
  practicalExercises: string[]
  checklist: string[]
  deliverables: string[]
}

// ─── Daily Tasks ─────────────────────────────────────────────
export interface DailyTask {
  day: number
  week: number
  systemDesignTask: string
  dsaTask: string
  practicalTask: string
  revisionTask: string
}

export interface TaskCompletion {
  id: string
  user_id: string
  day_number: number
  task_type: 'system_design' | 'dsa' | 'practical' | 'revision' | 'custom'
  task_key: string
  completed: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export interface CustomTask {
  id: string
  user_id: string
  day_number: number
  title: string
  completed: boolean
  created_at: string
}

// ─── Streak ───────────────────────────────────────────────────
export interface StreakData {
  id: string
  user_id: string
  current_streak: number
  longest_streak: number
  total_active_days: number
  last_active_date: string | null
  streak_calendar: Record<string, boolean>
}

// ─── DSA ──────────────────────────────────────────────────────
export type DSATopic =
  | 'Arrays and Hashing'
  | 'Two Pointers'
  | 'Sliding Window'
  | 'Stack'
  | 'Binary Search'
  | 'Linked List'
  | 'Trees'
  | 'BFS'
  | 'DFS'
  | 'Heap'
  | 'Intervals'
  | 'Greedy'
  | 'Backtracking'
  | 'Tries'
  | 'Graphs'
  | 'Union Find'
  | 'Topological Sort'
  | '1D Dynamic Programming'
  | '2D Dynamic Programming'
  | 'Matrix'
  | 'Mixed Review'

export const DSA_TOPICS: DSATopic[] = [
  'Arrays and Hashing',
  'Two Pointers',
  'Sliding Window',
  'Stack',
  'Binary Search',
  'Linked List',
  'Trees',
  'BFS',
  'DFS',
  'Heap',
  'Intervals',
  'Greedy',
  'Backtracking',
  'Tries',
  'Graphs',
  'Union Find',
  'Topological Sort',
  '1D Dynamic Programming',
  '2D Dynamic Programming',
  'Matrix',
  'Mixed Review',
]

export const DSA_PLATFORMS = ['LeetCode', 'HackerRank', 'Codeforces', 'GeeksforGeeks', 'Codewars', 'Other'] as const
export type DSAPlatform = typeof DSA_PLATFORMS[number]

export interface DSAProblem {
  id: string
  user_id: string
  name: string
  platform: DSAPlatform
  topic: DSATopic
  difficulty: DifficultyLevel
  status: ProblemStatus
  date_solved: string | null
  mistake_note: string | null
  revisit_date: string | null
  link: string | null
  created_at: string
}

// ─── Case Studies ─────────────────────────────────────────────
export type CaseStudyKey =
  | 'url-shortener'
  | 'rate-limiter'
  | 'notification-system'
  | 'social-media-feed'
  | 'chat-application'
  | 'video-streaming'
  | 'search-autocomplete'
  | 'ecommerce-system'
  | 'file-storage'
  | 'payment-system'
  | 'ride-sharing'
  | 'web-crawler'

export type CaseStudySectionKey =
  | 'requirements'
  | 'scale_estimation'
  | 'apis'
  | 'database_design'
  | 'high_level_architecture'
  | 'deep_dive'
  | 'bottlenecks'
  | 'trade_offs'
  | 'failure_handling'
  | 'monitoring'
  | 'final_summary'
  | 'mock_completed'

export interface CaseStudyDefinition {
  key: CaseStudyKey
  title: string
  description: string
  week: number
  icon: string
}

export interface CaseStudyProgress {
  id: string
  user_id: string
  case_study_key: CaseStudyKey
  section_key: CaseStudySectionKey
  completed: boolean
  notes: string | null
  diagram_link: string | null
  github_link: string | null
  updated_at: string
}

// ─── Mock Interviews ──────────────────────────────────────────
export interface MockInterview {
  id: string
  user_id: string
  mock_type: MockType
  topic: string
  date: string
  duration_min: number
  score: number
  went_well: string | null
  went_wrong: string | null
  action_items: string | null
  revisit_date: string | null
  created_at: string
}

// ─── Notes ────────────────────────────────────────────────────
export interface Note {
  id: string
  user_id: string
  title: string
  category: NoteCategory
  week_number: number | null
  tags: string[]
  content: string
  created_at: string
  updated_at: string
}

// ─── Resources ────────────────────────────────────────────────
export type ResourceCategory =
  | 'System Design Beginner'
  | 'System Design Intermediate'
  | 'DSA'
  | 'Mock Interviews'
  | 'Tools'

export interface ResourceDefinition {
  key: string
  name: string
  category: ResourceCategory
  link: string
  description: string
}

export interface ResourceStatusRecord {
  id: string
  user_id: string
  resource_key: string
  status: ResourceStatus
  notes: string | null
  updated_at: string
}

// ─── Portfolio ────────────────────────────────────────────────
export type PortfolioFolder =
  | 'url-shortener'
  | 'social-feed'
  | 'chat-system'
  | 'video-platform'
  | 'rate-limiter'
  | 'notification-system'
  | 'payment-system'
  | 'dsa-solutions'

export type PortfolioItem = 'readme' | 'diagram' | 'api_design' | 'database_schema' | 'trade_offs' | 'scaling_plan'

export interface PortfolioProgress {
  id: string
  user_id: string
  folder_key: PortfolioFolder
  item_key: PortfolioItem
  completed: boolean
  github_link: string | null
}

// ─── Weekly Review ────────────────────────────────────────────
export interface WeeklyReview {
  id: string
  user_id: string
  week_number: number
  learned: string
  what_was_hard: string
  what_was_skipped: string
  next_week_focus: string
  confidence: number
  created_at: string
}

// ─── Dashboard Aggregates ─────────────────────────────────────
export interface DashboardStats {
  currentDay: number
  currentWeek: number
  overallProgress: number
  currentStreak: number
  longestStreak: number
  totalActiveDays: number
  dsaSolved: number
  dsaEasy: number
  dsaMedium: number
  dsaHard: number
  caseStudiesCompleted: number
  caseStudySectionsCompleted: number
  mocksCompleted: number
  readinessScore: number
  readinessTier: ReadinessTier
  todayTasks: DailyTask | null
  todayCompletions: TaskCompletion[]
  todayProgress: number
  missedDays: number[]
  catchUpMode: boolean
}
