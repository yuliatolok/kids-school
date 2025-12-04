// src/types.ts

export type TaskKind = "htmlPage"; // потім додамо інші типи, якщо треба

export interface Task {
  id: string;              // Firestore document id
  title: string;
  description: string;
  type: TaskKind;
  htmlUrl?: string;        // for type "htmlPage"
  targetUserIds: string[]; // list of child user IDs (can be empty => visible for all)
  createdBy: string;       // parent uid
  createdAt: number;       // timestamp (Date.now())
}

export interface TaskResult {
  id: string;
  taskId: string;
  userId: string;
  correct: number;
  incorrect: number;
  timeMs: number;
  createdAt: number;
}