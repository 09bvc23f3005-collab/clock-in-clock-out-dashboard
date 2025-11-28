export interface User {
  id: string;
  username: string;
  avatar: string;
  role: 'admin' | 'employee';
}

export interface TimeLog {
  id: string;
  userId: string;
  type: 'CLOCK_IN' | 'CLOCK_OUT';
  timestamp: string; // ISO string
  notes?: string;
}

export interface Message {
  id: string;
  userId: string;
  content: string;
  timestamp: string;
  isBot: boolean;
  embed?: {
    title: string;
    description: string;
    color: string;
    fields?: { name: string; value: string; inline?: boolean }[];
  };
}

export interface EmployeeStats {
  userId: string;
  username: string;
  avatar: string;
  totalHours: number;
  overtimeHours: number;
  status: 'working' | 'offline';
  lastAction?: string;
}

export interface DailyStat {
  date: string;
  totalHours: number;
  overtimeHours: number;
  logs: TimeLog[];
}

export enum BotIntent {
  CLOCK_IN = 'CLOCK_IN',
  CLOCK_OUT = 'CLOCK_OUT',
  STATUS = 'STATUS',
  UNKNOWN = 'UNKNOWN'
}

export interface GeminiIntentResponse {
  intent: BotIntent;
  notes?: string;
  confidence: number;
  timeOffsetMinutes?: number; // If user says "I started 5 mins ago"
}