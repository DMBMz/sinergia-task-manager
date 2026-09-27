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
  parentTaskId?: string | null;
  version: number;
  _status: 'synced' | 'created' | 'updated' | 'deleted';
  createdAt: string;
  updatedAt: string;
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
