// License Types
export interface License {
  code: string;
  maxActivations: number;
  usedActivations: number;
  createdAt: string;
  lastUsedAt?: string;
  isActive: boolean;
}

export interface LicenseStore {
  licenses: License[];
  adminPin: string;
}

// Question Types
export interface TriviaQuestion {
  id: number;
  question: string;
  answers: string[];
  correctAnswerIndex: number | null; // null for survey questions
  timeLimit: number; // in seconds
  points?: number;
  isSurvey: boolean;
  isTextOnly: boolean; // text-only slides with no answers or timer
}

// Game State Types
export type GamePhase = 'standby' | 'question' | 'options' | 'answers' | 'timer' | 'reveal';

export interface GameState {
  currentQuestionIndex: number;
  phase: GamePhase;
  isFullscreen: boolean;
  isMuted: boolean;
}

// Settings Types
export interface GameSettings {
  customBackground?: string;
  timerSound?: string;
  correctSound?: string;
  wrongSound?: string;
  defaultTimeLimit: number;
  showPoints: boolean;
}

// Game Package Types (for client packaging)
export interface GamePackageMeta {
  name: string;
  createdAt: string;
  version: string;
  questionCount: number;
}

export interface GamePackage {
  meta: GamePackageMeta;
  questions: TriviaQuestion[];
  settings: Pick<GameSettings, 'defaultTimeLimit' | 'showPoints'>;
  assets?: {
    background?: string;
    logo?: string;
    sounds?: {
      timer?: string;
      correct?: string;
      wrong?: string;
    };
  };
}

// Excel Column Mapping
export const EXCEL_COLUMN_MAP = {
  question: 'שאלה',
  answer1: 'תשובה 1',
  answer2: 'תשובה 2',
  answer3: 'תשובה 3',
  answer4: 'תשובה 4',
  answer5: 'תשובה 5',
  answer6: 'תשובה 6',
  correctAnswer: 'מספר התשובה הנכונה',
  timeLimit: 'זמן מענה',
  points: 'ניקוד',
} as const;