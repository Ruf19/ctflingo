export type Difficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type ChallengeType = 'quiz' | 'static_file' | 'pcap' | 'log_analysis' | 'docker_lab' | 'api_lab' | 'code_review' | 'forensics' | 'crypto' | 'web_exploit' | 'reverse' | 'osint';
export type BlockType = 'text' | 'code' | 'security_focus' | 'key_points' | 'resource' | 'table' | 'image';
export type ResourceType = 'article' | 'video' | 'docs' | 'tool';

export interface Unit {
  id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  category: string;
  tags: string[];
  estimated_hours: number;
  prerequisites: string[];
  objectives: string[];
  thumbnail_emoji: string;
  published: boolean;
  xp_required: number;
  created_at: string;
  updated_at: string;
  lessons?: Lesson[];
  challenges?: Challenge[];
}

export interface UserProgress {
  id: string;
  user_id: string;
  unit_id: string;
  joined_at: string;
}

export interface SolvedChallenge {
  id: string;
  user_id: string;
  challenge_id: string;
  xp_awarded: number;
  solved_at: string;
}

export interface ChallengeFile {
  id: string;
  challenge_id: string;
  filename: string;
  file_path: string;
  file_size: number;
  file_type: string;
  created_at: string;
}

export interface Lesson {
  id: string;
  unit_id: string;
  title: string;
  lesson_order: number;
  duration_minutes: number;
  summary: string;
  created_at: string;
  content_blocks?: LessonContentBlock[];
  resources?: LessonResource[];
}

export interface LessonContentBlock {
  id: string;
  lesson_id: string;
  block_order: number;
  block_type: BlockType;
  title: string | null;
  content: string;
  language: string | null;
  created_at: string;
}

export interface LessonResource {
  id: string;
  lesson_id: string;
  title: string;
  url: string;
  resource_type: ResourceType;
  estimated_minutes: number;
  created_at: string;
}

export interface Challenge {
  id: string;
  unit_id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  challenge_type: ChallengeType;
  flag: string | null;
  objectives: string[];
  xp_reward: number;
  created_at: string;
  hints?: ChallengeHint[];
  files?: ChallengeFile[];
}

export interface ChallengeHint {
  id: string;
  challenge_id: string;
  hint_order: number;
  content: string;
  created_at: string;
}
export interface Profile {
  id: string;
  username: string;
  role: 'user' | 'admin';
  created_at: string;
}
// --- NEW CTF PATH TYPES ---

export interface CTFPathCategory {
  id: string;
  name: string;
  description: string;
  icon_emoji: string;
  display_order: number;
  created_at: string;
}
export interface CTFPath {
  id: string;
  title: string;
  description: string;
  category_id: string; // References CTFPathCategory
  thumbnail_emoji: string;
  difficulty: Difficulty;
  published: boolean;
  created_at: string;
  updated_at: string;
  // Populated via joins
  category?: CTFPathCategory;
  nodes?: CTFPathNode[];
}
export interface CTFPathNode {
  id: string;
  path_id: string;
  challenge_id: string;
  node_order: number;
  position_x: number;
  position_y: number;
  created_at: string;
  // Populated via joins
  challenge?: Challenge;
}

export interface CTFPathProgress {
  id: string;
  user_id: string;
  path_id: string;
  current_node_order: number;
  completed: boolean;
  started_at: string;
  completed_at: string | null;
}