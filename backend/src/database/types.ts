export type Role = 'ADMIN' | 'DELEGATE' | 'EDIT' | 'VIEW';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'IN_REVIEW' | 'BLOCKED' | 'COMPLETED';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  fcmToken?: string | null;
  quietUntil?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  color?: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: Role;
  createdAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  priority: Priority;
  status: TaskStatus;
  effortHours?: number | null;
  startDate?: Date | null;
  dueDate?: Date | null;
  projectId: string;
  assigneeId?: string | null;
  parentTaskId?: string | null;
  version: number; // US06 Lock Otimista
  lockedBy?: { id: string; name: string; avatarUrl?: string } | null;
  lockedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  projectId: string;
}

export interface TaskTag {
  taskId: string;
  tagId: string;
}

export interface Comment {
  id: string;
  taskId: string;
  authorId: string;
  content: string;
  mentions: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Attachment {
  id: string;
  taskId: string;
  commentId?: string | null;
  fileName: string;
  fileType: string;
  fileSize: number;
  storageKey: string;
  url: string;
  createdAt: Date;
}

export interface InviteToken {
  id: string;
  token: string;
  projectId?: string | null;
  taskId?: string | null;
  role: Role;
  expiresAt: Date;
  maxUses: number;
  usesCount: number;
  createdById: string;
  createdAt: Date;
}
