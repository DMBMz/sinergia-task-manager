export interface LocalTask {
  id: string;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'PENDING' | 'IN_PROGRESS' | 'IN_REVIEW' | 'BLOCKED' | 'COMPLETED';
  effortHours: number;
  startDate?: string | null;
  dueDate?: string | null;
  projectId: string;
  assigneeId?: string | null;
  assignmentStatus?: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  isRecurring?: boolean;
  recurrenceInterval?: 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'SPRINT' | null;
  rotationUserIds?: string[];
  currentRotationIndex?: number;
  parentTaskId?: string | null;
  version: number;
  _status: 'synced' | 'created' | 'updated' | 'deleted';
  createdAt: string;
  updatedAt: string;
}

export interface LocalTaskDependency {
  id: string;
  taskId: string;
  dependsOnTaskId: string;
  dependencyType: 'FINISH_TO_START' | 'START_TO_START' | 'FINISH_TO_FINISH';
  createdAt: string;
}

export interface LocalChecklistItem {
  id: string;
  taskId: string;
  title: string;
  isCompleted: boolean;
  assigneeId?: string | null;
  orderIndex: number;
  createdAt: string;
}

export interface LocalUserAbsence {
  id: string;
  userId: string;
  type: 'VACATION' | 'MEDICAL' | 'UNAVAILABLE';
  startDate: string;
  endDate: string;
  reason?: string | null;
}

export interface LocalAutomationRule {
  id: string;
  projectId: string;
  name: string;
  trigger: string;
  conditionsJson: string;
  actionsJson: string;
  isActive: boolean;
}

export interface LocalComment {
  id: string;
  taskId: string;
  authorId: string;
  authorName: string;
  content: string;
  mentions: string[];
  createdAt: string;
  _status: 'synced' | 'created';
}

export interface LocalAttachment {
  id: string;
  taskId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string;
  createdAt: string;
}

export interface LocalTag {
  id: string;
  name: string;
  color: string;
  projectId: string;
}
