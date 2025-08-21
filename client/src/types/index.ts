// User and Authentication Types
export interface User {
  _id: string;
  name: string;
  lastname: string;
  username: string;
  mail: string;
  accountType: 'student' | 'teacher' | 'admin';
  isA2FEnabled: boolean;
  subjects: string[];
  icon: string;
  notifications: string[];
  badges: string[];
  suspended?: {
    reason?: string;
    date?: Date;
  };
  experiments: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Alumet Workspace Types
export interface Alumet {
  _id: string;
  title: string;
  description?: string;
  owner: string;
  security: 'open' | 'onpassword' | 'closed';
  password?: string;
  subject: Subject;
  participants: Participant[];
  private: boolean;
  swiftchat: boolean;
  lastUsage: Date;
  font: string;
  background: string;
  customsLinks: CustomLink[];
  type: 'alumet' | 'flashcard' | 'mindmap';
  discovery: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Participant {
  userId: string;
  status: 0 | 1 | 2 | 3 | 4; // 0-owner, 1-admin, 2-user, 3-banned, 4-requesting
  joinedAt: Date;
}

export interface CustomLink {
  id: string;
  title: string;
  url: string;
  icon?: string;
}

export type Subject = 
  | 'mathematics' 
  | 'french' 
  | 'history' 
  | 'geography' 
  | 'physics' 
  | 'biology' 
  | 'philosophy' 
  | 'english' 
  | 'technology' 
  | 'snt' 
  | 'nsi' 
  | 'language' 
  | 'other';

// Flashcard Types
export interface Flashcard {
  _id: string;
  flashcardSetId: string;
  question: string;
  answer: string;
  dateCreated: Date;
  usersDatas: FlashcardUserData[];
  tags?: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface FlashcardUserData {
  userId: string;
  status: 0 | 1 | 2 | 3; // Learning status: 0-new, 1-learning, 2-review, 3-mastered
  lastReview: number;
  nextReview: number;
  inRow: number; // Correct answers in a row
  interval: number; // Days until next review
  easeFactor: number; // SM-2 algorithm ease factor
  reviewCount: number;
}

export interface FlashcardSet {
  _id: string;
  title: string;
  description?: string;
  alumetId: string;
  createdBy: string;
  isPublic: boolean;
  tags: string[];
  flashcards: Flashcard[];
  stats: {
    totalCards: number;
    newCards: number;
    learningCards: number;
    reviewCards: number;
    masteredCards: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Message Types
export interface Message {
  _id: string;
  conversationId: string;
  sender: string;
  senderInfo?: {
    username: string;
    name: string;
    lastname: string;
    icon: string;
  };
  content: string;
  type: 'text' | 'file' | 'image' | 'system';
  timestamp: Date;
  edited?: boolean;
  editedAt?: Date;
  reactions?: MessageReaction[];
  replyTo?: string;
  attachments?: FileAttachment[];
}

export interface MessageReaction {
  userId: string;
  emoji: string;
  timestamp: Date;
}

export interface FileAttachment {
  id: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
  thumbnail?: string;
}

export interface Conversation {
  _id: string;
  participants: string[];
  participantsInfo?: User[];
  type: 'private' | 'group';
  title?: string;
  description?: string;
  lastMessage?: Message;
  lastActivity: Date;
  isArchived?: boolean;
  createdBy: string;
  createdAt: Date;
  unreadCount?: number;
}

// File Types
export interface FileUpload {
  _id: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  uploadedBy: string;
  uploadedByInfo?: {
    username: string;
    name: string;
    lastname: string;
  };
  uploadedAt: Date;
  folderId?: string;
  alumetId?: string;
  url: string;
  thumbnail?: string;
  isPublic: boolean;
  tags?: string[];
  description?: string;
}

export interface Folder {
  _id: string;
  name: string;
  parentId?: string;
  ownerId: string;
  alumetId?: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  children?: Folder[];
  files?: FileUpload[];
}

// Post and Wall Types
export interface Post {
  _id: string;
  author: string;
  authorInfo?: {
    username: string;
    name: string;
    lastname: string;
    icon: string;
  };
  content: string;
  alumetId: string;
  createdAt: Date;
  updatedAt?: Date;
  likes: string[];
  comments: Comment[];
  attachments?: FileAttachment[];
  isPinned?: boolean;
  tags?: string[];
}

export interface Comment {
  _id: string;
  author: string;
  authorInfo?: {
    username: string;
    name: string;
    lastname: string;
    icon: string;
  };
  content: string;
  createdAt: Date;
  likes: string[];
  replies?: Comment[];
}

// Homework/Task Types
export interface Homework {
  _id: string;
  title: string;
  description: string;
  instructions?: string;
  dueDate: Date;
  subject: Subject;
  assignedBy: string;
  assignedByInfo?: {
    username: string;
    name: string;
    lastname: string;
  };
  assignedTo: string[];
  alumetId?: string;
  status: 'draft' | 'published' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high';
  attachments?: FileAttachment[];
  submissions?: Submission[];
  maxGrade?: number;
  allowLateSubmission: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Submission {
  _id: string;
  homeworkId: string;
  studentId: string;
  studentInfo?: {
    username: string;
    name: string;
    lastname: string;
  };
  content: string;
  attachments?: FileAttachment[];
  submittedAt: Date;
  isLate: boolean;
  grade?: number;
  feedback?: string;
  gradedBy?: string;
  gradedAt?: Date;
  status: 'submitted' | 'graded' | 'returned';
}

// Mindmap Types
export interface MindmapNode {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
  backgroundColor?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  parentId?: string;
  children?: string[];
  isCollapsed?: boolean;
  level: number;
}

export interface MindmapConnection {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  color?: string;
  style?: 'solid' | 'dashed' | 'dotted';
  thickness?: number;
  label?: string;
}

export interface Mindmap {
  _id: string;
  title: string;
  description?: string;
  nodes: MindmapNode[];
  connections: MindmapConnection[];
  alumetId: string;
  createdBy: string;
  createdByInfo?: {
    username: string;
    name: string;
    lastname: string;
  };
  collaborators: string[];
  isPublic: boolean;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

// Notification Types
export interface Notification {
  _id: string;
  userId: string;
  type: 'message' | 'homework' | 'alumet' | 'system' | 'flashcard' | 'collaboration';
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: Date;
  expiresAt?: Date;
  actionUrl?: string;
  actionText?: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// UI State Types
export interface NotificationState {
  notifications: UINotification[];
}

export interface UINotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ModalState {
  isOpen: boolean;
  type?: 'create-alumet' | 'join-alumet' | 'upload-file' | 'user-profile' | 'create-flashcard-set' | 'create-homework';
  data?: any;
}

// Theme Types
export interface ThemeState {
  mode: 'light' | 'dark' | 'system';
  primaryColor: string;
  fontSize: 'small' | 'medium' | 'large';
  reducedMotion: boolean;
}

// Socket Events
export interface SocketEvents {
  // Connection events
  'connect': () => void;
  'disconnect': () => void;
  
  // Authentication events
  'authenticate': (token: string) => void;
  'authenticated': (data: { userId: string }) => void;
  'authentication_error': (error: string) => void;
  
  // Message events
  'message:send': (data: { conversationId: string; content: string; type?: string }) => void;
  'message:receive': (message: Message) => void;
  'message:typing': (data: { conversationId: string; userId: string; isTyping: boolean }) => void;
  'message:reaction': (data: { messageId: string; emoji: string; action: 'add' | 'remove' }) => void;
  
  // Alumet events
  'alumet:join': (alumetId: string) => void;
  'alumet:leave': (alumetId: string) => void;
  'alumet:update': (data: { alumetId: string; update: Partial<Alumet> }) => void;
  'alumet:participant_joined': (data: { alumetId: string; participant: Participant }) => void;
  'alumet:participant_left': (data: { alumetId: string; userId: string }) => void;
  
  // Collaboration events
  'collaboration:cursor': (data: { x: number; y: number; userId: string; alumetId: string; username: string }) => void;
  'collaboration:edit': (data: { type: string; data: any; alumetId: string; userId: string }) => void;
  'collaboration:selection': (data: { selection: any; userId: string; alumetId: string }) => void;
  
  // Notification events
  'notification:new': (notification: Notification) => void;
  'notification:read': (notificationId: string) => void;
  
  // Presence events
  'presence:update': (data: { userId: string; status: 'online' | 'offline' | 'away'; lastSeen?: Date }) => void;
  'presence:users_online': (userIds: string[]) => void;
}

// Form Types
export interface LoginForm {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface RegisterForm {
  name: string;
  lastname: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  accountType: 'student' | 'teacher';
  subjects?: string[];
  agreeToTerms: boolean;
}

export interface CreateAlumetForm {
  title: string;
  description?: string;
  subject: Subject;
  security: 'open' | 'onpassword' | 'closed';
  password?: string;
  private: boolean;
  swiftchat: boolean;
  discovery: boolean;
  type: 'alumet' | 'flashcard' | 'mindmap';
}

export interface CreateHomeworkForm {
  title: string;
  description: string;
  instructions?: string;
  dueDate: Date;
  subject: Subject;
  assignedTo: string[];
  alumetId?: string;
  priority: 'low' | 'medium' | 'high';
  maxGrade?: number;
  allowLateSubmission: boolean;
  attachments?: File[];
}

// Search and Filter Types
export interface SearchFilters {
  query?: string;
  type?: string;
  subject?: Subject;
  dateFrom?: Date;
  dateTo?: Date;
  author?: string;
  tags?: string[];
  sortBy?: 'date' | 'title' | 'relevance' | 'popularity';
  sortOrder?: 'asc' | 'desc';
}

// Statistics Types
export interface DashboardStats {
  alumets: {
    total: number;
    active: number;
    owned: number;
    participated: number;
  };
  flashcards: {
    totalSets: number;
    totalCards: number;
    dueForReview: number;
    masteredCards: number;
  };
  messages: {
    totalConversations: number;
    unreadMessages: number;
    totalMessages: number;
  };
  homework: {
    assigned: number;
    completed: number;
    overdue: number;
    pending: number;
  };
  files: {
    totalFiles: number;
    totalSize: number;
    recentUploads: number;
  };
}

// Export all types
export type {
  // Re-export commonly used types
  User as UserType,
  Alumet as AlumetType,
  Flashcard as FlashcardType,
  Message as MessageType,
  Homework as HomeworkType,
  Mindmap as MindmapType,
};