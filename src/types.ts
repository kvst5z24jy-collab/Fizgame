export interface MistakeItem {
  question: string;
  studentAnswer: string;
  correctAnswer: string;
  explanation?: string;
  topic?: string;
}

export interface PhysicsGame {
  id: string;
  title: string;
  description: string;
  category: string;
  targetGrades: string[]; // e.g. ["7", "8", "9"]
  fileName: string;
  originalName: string;
  shareCode: string;
  deadline?: string | null;
  isActive: boolean;
  createdAt: string;
  playCount: number;
  avgScore?: number;
}

export interface StudentAttempt {
  id: string;
  gameId: string;
  gameTitle: string;
  studentName: string;
  className?: string;
  score: number;
  total: number;
  percentage: number;
  durationSec: number;
  mistakes: MistakeItem[];
  createdAt: string;
}

export interface DashboardStats {
  totalGames: number;
  totalAttempts: number;
  avgPercentage: number;
  totalStudents: number;
}

export interface PhysicsCategory {
  id: string;
  name: string;
  description?: string;
  grades?: string[];
  color?: string;
}
