export type Role = 'ADMIN' | 'DELEGATE' | 'EDIT' | 'VIEW';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'IN_REVIEW' | 'BLOCKED' | 'COMPLETED';
export type DependencyType = 'FINISH_TO_START' | 'START_TO_START' | 'FINISH_TO_FINISH';
export type AbsenceType = 'VACATION' | 'MEDICAL' | 'UNAVAILABLE';
export type AssignmentStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED';
export type RecurrenceInterval = 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'SPRINT';
export type AutomationTrigger = 'TASK_CREATED' | 'STATUS_CHANGED' | 'DEADLINE_APPROACHING' | 'OVERDUE' | 'ASSIGNED_TO_ME';

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

export interface TaskChecklistItem {
  id: string;
  taskId: string;
  title: string;
  isCompleted: boolean;
  completedAt?: Date | null;
  assigneeId?: string | null;
  assigneeName?: string | null;
  orderIndex: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskDependency {
  id: string;
  taskId: string;
  dependsOnTaskId: string;
  dependencyType: DependencyType;
  createdAt: Date;
}

export interface UserAbsence {
  id: string;
  userId: string;
  type: AbsenceType;
  startDate: Date;
  endDate: Date;
  reason?: string | null;
  createdAt: Date;
}

export interface AutomationRule {
  id: string;
  projectId: string;
  name: string;
  trigger: AutomationTrigger;
  conditionsJson: string;
  actionsJson: string;
  isActive: boolean;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
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
  team?: string | null;
  assigneeId?: string | null;
  assigneeName?: string | null;
  assignmentStatus?: AssignmentStatus;
  declinedReason?: string | null;
  isRecurring?: boolean;
  recurrenceInterval?: RecurrenceInterval | null;
  recurrenceEnd?: Date | null;
  maxOccurrences?: number | null;
  currentOccurrence?: number;
  rotationUserIds?: string[];
  currentRotationIndex?: number;
  parentTaskId?: string | null;
  subtasks?: any[] | null;
  dependencies?: TaskDependency[];
  prerequisites?: TaskDependency[];
  checklist?: TaskChecklistItem[];
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
