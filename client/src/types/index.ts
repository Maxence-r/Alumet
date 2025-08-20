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
}

export interface Participant {
  userId: string;
  status: 0 | 1 | 2 | 3 | 4; // 0-owner, 1-admin, 2-user, 3-banned, 4-requesting
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
}

export interface FlashcardUserData {
  userId: string;
  status: 0 | 1 | 2 | 3; // Learning status
  lastReview: number;
  nextReview: number;
  inRow: number; // Correct answers in a row
}

// Message Types
export interface Message {
  _id: string;
  conversationId: string;
  sender: string;
  content: string;
  timestamp: Date;
  edited?: boolean;
  editedAt?: Date;
  reactions?: MessageReaction[];
}

export interface MessageReaction {
  userId: string;
  emoji: string;
}

export interface Conversation {
  _id: string;
  participants: string[];
  type: 'private' | 'group';
  title?: string;
  lastMessage?: Message;
  lastActivity: Date;
  isArchived?: boolean;
}

// File Types
export interface FileUpload {
  _id: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  uploadedBy: string;
  uploadedAt: Date;
  folderId?: string;
  url: string;
  thumbnail?: string;
}

export interface Folder {
  _id: string;
  name: string;
  parentId?: string;
  ownerId: string;
  createdAt: Date;
  alumetId?: string;
}

// Post and Wall Types
export interface Post {
  _id: string;
  author: string;
  content: string;
  alumetId: string;
  createdAt: Date;
  updatedAt?: Date;
  likes: string[];
  comments: Comment[];
  attachments?: string[];
}

export interface Comment {
  _id: string;
  author: string;
  content: string;
  createdAt: Date;
  likes: string[];
}

// Homework/Task Types
export interface Homework {
  _id: string;
  title: string;
  description: string;
  dueDate: Date;
  subject: Subject;
  assignedBy: string;
  assignedTo: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  attachments?: string[];
  submissions?: Submission[];
  createdAt: Date;
}

export interface Submission {
  _id: string;
  studentId: string;
  content: string;
  attachments?: string[];
  submittedAt: Date;
  grade?: number;
  feedback?: string;
  gradedBy?: string;
  gradedAt?: Date;
}

// Mindmap Types
export interface MindmapNode {
  id: string;
  text: string;
  x: number;
  y: number;
  color?: string;
  parentId?: string;
  children?: string[];
}

export interface Mindmap {
  _id: string;
  title: string;
  nodes: MindmapNode[];
  connections: Connection[];
  alumetId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Connection {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  color?: string;
  style?: 'solid' | 'dashed' | 'dotted';
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
  notifications: Notification[];
}

export interface Notification {
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
  type?: 'create-alumet' | 'join-alumet' | 'upload-file' | 'user-profile';
  data?: any;
}

// Theme Types
export interface ThemeState {
  mode: 'light' | 'dark';
  primaryColor: string;
  fontSize: 'small' | 'medium' | 'large';
}

// Socket Events
export interface SocketEvents {
  // Message events
  'message:send': (data: { conversationId: string; content: string }) => void;
  'message:receive': (message: Message) => void;
  'message:typing': (data: { conversationId: string; userId: string; isTyping: boolean }) => void;
  
  // Alumet events
  'alumet:join': (alumetId: string) => void;
  'alumet:leave': (alumetId: string) => void;
  'alumet:update': (alumet: Partial<Alumet>) => void;
  
  // Collaboration events
  'collaboration:cursor': (data: { x: number; y: number; userId: string; alumetId: string }) => void;
  'collaboration:edit': (data: { type: string; data: any; alumetId: string }) => void;
}