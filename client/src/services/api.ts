import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { 
  ApiResponse, 
  User, 
  Alumet, 
  Flashcard, 
  FlashcardSet, 
  Message, 
  Conversation, 
  FileUpload, 
  Folder, 
  Post, 
  Homework, 
  Mindmap,
  Notification,
  PaginatedResponse,
  DashboardStats
} from '../types';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth-storage');
    if (token) {
      try {
        const parsed = JSON.parse(token);
        if (parsed.state?.token) {
          config.headers.Authorization = `Bearer ${parsed.state.token}`;
        }
      } catch (error) {
        console.error('Failed to parse auth token:', error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('auth-storage');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

// Authentication API
export const authApi = {
  login: (email: string, password: string): Promise<AxiosResponse<ApiResponse<{ user: User; token: string }>>> =>
    api.post('/auth/login', { email, password }),
  
  register: (userData: {
    name: string;
    lastname: string;
    username: string;
    email: string;
    password: string;
    accountType: 'student' | 'teacher';
    subjects?: string[];
  }): Promise<AxiosResponse<ApiResponse<{ user: User; token: string }>>> =>
    api.post('/auth/register', userData),
  
  verifyToken: (): Promise<AxiosResponse<ApiResponse<{ user: User }>>> =>
    api.get('/auth/verify'),
  
  logout: (): Promise<AxiosResponse<ApiResponse>> =>
    api.post('/auth/logout'),
  
  resetPassword: (email: string): Promise<AxiosResponse<ApiResponse>> =>
    api.post('/auth/reset-password', { email }),
  
  changePassword: (currentPassword: string, newPassword: string): Promise<AxiosResponse<ApiResponse>> =>
    api.post('/auth/change-password', { currentPassword, newPassword }),
  
  enable2FA: (): Promise<AxiosResponse<ApiResponse<{ qrCode: string; secret: string }>>> =>
    api.post('/auth/2fa/enable'),
  
  verify2FA: (code: string): Promise<AxiosResponse<ApiResponse<{ user: User }>>> =>
    api.post('/auth/2fa/verify', { code }),
  
  disable2FA: (code: string): Promise<AxiosResponse<ApiResponse<{ user: User }>>> =>
    api.post('/auth/2fa/disable', { code }),

  // Helper methods
  setAuthToken: (token: string) => {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  },

  clearAuthToken: () => {
    delete api.defaults.headers.common['Authorization'];
  },
};

// Users API
export const usersApi = {
  getProfile: (userId?: string): Promise<AxiosResponse<ApiResponse<User>>> =>
    api.get(`/users/profile${userId ? `/${userId}` : ''}`),
  
  updateProfile: (userData: Partial<User>): Promise<AxiosResponse<ApiResponse<User>>> =>
    api.put('/users/profile', userData),
  
  uploadAvatar: (file: File): Promise<AxiosResponse<ApiResponse<{ url: string }>>> => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  searchUsers: (query: string): Promise<AxiosResponse<ApiResponse<User[]>>> =>
    api.get(`/users/search?q=${encodeURIComponent(query)}`),
  
  getDashboardStats: (): Promise<AxiosResponse<ApiResponse<DashboardStats>>> =>
    api.get('/users/dashboard-stats'),
};

// Alumet API
export const alumetApi = {
  getAlumets: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    subject?: string;
    type?: string;
  }): Promise<AxiosResponse<ApiResponse<PaginatedResponse<Alumet>>>> =>
    api.get('/alumet', { params }),
  
  getAlumet: (id: string): Promise<AxiosResponse<ApiResponse<Alumet>>> =>
    api.get(`/alumet/${id}`),
  
  createAlumet: (data: {
    title: string;
    description?: string;
    subject: string;
    security: 'open' | 'onpassword' | 'closed';
    password?: string;
    private: boolean;
    swiftchat: boolean;
    discovery: boolean;
    type: 'alumet' | 'flashcard' | 'mindmap';
  }): Promise<AxiosResponse<ApiResponse<Alumet>>> =>
    api.post('/alumet', data),
  
  updateAlumet: (id: string, data: Partial<Alumet>): Promise<AxiosResponse<ApiResponse<Alumet>>> =>
    api.put(`/alumet/${id}`, data),
  
  deleteAlumet: (id: string): Promise<AxiosResponse<ApiResponse>> =>
    api.delete(`/alumet/${id}`),
  
  joinAlumet: (id: string, password?: string): Promise<AxiosResponse<ApiResponse<Alumet>>> =>
    api.post(`/alumet/${id}/join`, { password }),
  
  leaveAlumet: (id: string): Promise<AxiosResponse<ApiResponse>> =>
    api.post(`/alumet/${id}/leave`),
  
  updateParticipant: (alumetId: string, userId: string, status: number): Promise<AxiosResponse<ApiResponse>> =>
    api.put(`/alumet/${alumetId}/participants/${userId}`, { status }),
  
  getParticipants: (id: string): Promise<AxiosResponse<ApiResponse<User[]>>> =>
    api.get(`/alumet/${id}/participants`),
};

// Flashcards API
export const flashcardsApi = {
  getFlashcardSets: (params?: {
    alumetId?: string;
    page?: number;
    limit?: number;
  }): Promise<AxiosResponse<ApiResponse<PaginatedResponse<FlashcardSet>>>> =>
    api.get('/flashcards/sets', { params }),
  
  getFlashcardSet: (id: string): Promise<AxiosResponse<ApiResponse<FlashcardSet>>> =>
    api.get(`/flashcards/sets/${id}`),
  
  createFlashcardSet: (data: {
    title: string;
    description?: string;
    alumetId: string;
    isPublic: boolean;
    tags?: string[];
  }): Promise<AxiosResponse<ApiResponse<FlashcardSet>>> =>
    api.post('/flashcards/sets', data),
  
  updateFlashcardSet: (id: string, data: Partial<FlashcardSet>): Promise<AxiosResponse<ApiResponse<FlashcardSet>>> =>
    api.put(`/flashcards/sets/${id}`, data),
  
  deleteFlashcardSet: (id: string): Promise<AxiosResponse<ApiResponse>> =>
    api.delete(`/flashcards/sets/${id}`),
  
  getFlashcards: (setId: string): Promise<AxiosResponse<ApiResponse<Flashcard[]>>> =>
    api.get(`/flashcards/sets/${setId}/cards`),
  
  createFlashcard: (setId: string, data: {
    question: string;
    answer: string;
    tags?: string[];
    difficulty?: 'easy' | 'medium' | 'hard';
  }): Promise<AxiosResponse<ApiResponse<Flashcard>>> =>
    api.post(`/flashcards/sets/${setId}/cards`, data),
  
  updateFlashcard: (id: string, data: Partial<Flashcard>): Promise<AxiosResponse<ApiResponse<Flashcard>>> =>
    api.put(`/flashcards/cards/${id}`, data),
  
  deleteFlashcard: (id: string): Promise<AxiosResponse<ApiResponse>> =>
    api.delete(`/flashcards/cards/${id}`),
  
  reviewFlashcard: (id: string, data: {
    quality: number;
    timeSpent: number;
  }): Promise<AxiosResponse<ApiResponse<Flashcard>>> =>
    api.post(`/flashcards/cards/${id}/review`, data),
  
  getDueFlashcards: (setId?: string): Promise<AxiosResponse<ApiResponse<Flashcard[]>>> =>
    api.get('/flashcards/due', { params: { setId } }),
  
  generateFlashcards: (data: {
    content: string;
    count?: number;
    difficulty?: 'easy' | 'medium' | 'hard';
  }): Promise<AxiosResponse<ApiResponse<{ question: string; answer: string }[]>>> =>
    api.post('/flashcards/generate', data),
};

// Messages API
export const messagesApi = {
  getConversations: (): Promise<AxiosResponse<ApiResponse<Conversation[]>>> =>
    api.get('/messages/conversations'),
  
  getConversation: (id: string): Promise<AxiosResponse<ApiResponse<Conversation>>> =>
    api.get(`/messages/conversations/${id}`),
  
  createConversation: (data: {
    participants: string[];
    type: 'private' | 'group';
    title?: string;
    description?: string;
  }): Promise<AxiosResponse<ApiResponse<Conversation>>> =>
    api.post('/messages/conversations', data),
  
  getMessages: (conversationId: string, params?: {
    page?: number;
    limit?: number;
  }): Promise<AxiosResponse<ApiResponse<PaginatedResponse<Message>>>> =>
    api.get(`/messages/conversations/${conversationId}/messages`, { params }),
  
  sendMessage: (conversationId: string, data: {
    content: string;
    type?: 'text' | 'file' | 'image';
    replyTo?: string;
    attachments?: string[];
  }): Promise<AxiosResponse<ApiResponse<Message>>> =>
    api.post(`/messages/conversations/${conversationId}/messages`, data),
  
  editMessage: (id: string, content: string): Promise<AxiosResponse<ApiResponse<Message>>> =>
    api.put(`/messages/${id}`, { content }),
  
  deleteMessage: (id: string): Promise<AxiosResponse<ApiResponse>> =>
    api.delete(`/messages/${id}`),
  
  addReaction: (messageId: string, emoji: string): Promise<AxiosResponse<ApiResponse>> =>
    api.post(`/messages/${messageId}/reactions`, { emoji }),
  
  removeReaction: (messageId: string, emoji: string): Promise<AxiosResponse<ApiResponse>> =>
    api.delete(`/messages/${messageId}/reactions/${emoji}`),
  
  markAsRead: (conversationId: string): Promise<AxiosResponse<ApiResponse>> =>
    api.post(`/messages/conversations/${conversationId}/read`),
};

// Files API
export const filesApi = {
  uploadFile: (file: File, data: {
    folderId?: string;
    alumetId?: string;
    isPublic?: boolean;
    description?: string;
    tags?: string[];
  }): Promise<AxiosResponse<ApiResponse<FileUpload>>> => {
    const formData = new FormData();
    formData.append('file', file);
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, Array.isArray(value) ? JSON.stringify(value) : String(value));
      }
    });
    return api.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  getFiles: (params?: {
    folderId?: string;
    alumetId?: string;
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<AxiosResponse<ApiResponse<PaginatedResponse<FileUpload>>>> =>
    api.get('/files', { params }),
  
  getFile: (id: string): Promise<AxiosResponse<ApiResponse<FileUpload>>> =>
    api.get(`/files/${id}`),
  
  updateFile: (id: string, data: Partial<FileUpload>): Promise<AxiosResponse<ApiResponse<FileUpload>>> =>
    api.put(`/files/${id}`, data),
  
  deleteFile: (id: string): Promise<AxiosResponse<ApiResponse>> =>
    api.delete(`/files/${id}`),
  
  getFolders: (params?: {
    parentId?: string;
    alumetId?: string;
  }): Promise<AxiosResponse<ApiResponse<Folder[]>>> =>
    api.get('/files/folders', { params }),
  
  createFolder: (data: {
    name: string;
    parentId?: string;
    alumetId?: string;
    isPublic?: boolean;
  }): Promise<AxiosResponse<ApiResponse<Folder>>> =>
    api.post('/files/folders', data),
  
  updateFolder: (id: string, data: Partial<Folder>): Promise<AxiosResponse<ApiResponse<Folder>>> =>
    api.put(`/files/folders/${id}`, data),
  
  deleteFolder: (id: string): Promise<AxiosResponse<ApiResponse>> =>
    api.delete(`/files/folders/${id}`),
  
  getPreviewUrl: (fileId: string): string =>
    `${api.defaults.baseURL}/files/${fileId}/preview`,
  
  getDownloadUrl: (fileId: string): string =>
    `${api.defaults.baseURL}/files/${fileId}/download`,
};

// Homework API
export const homeworkApi = {
  getHomework: (params?: {
    alumetId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<AxiosResponse<ApiResponse<PaginatedResponse<Homework>>>> =>
    api.get('/homework', { params }),
  
  getHomeworkItem: (id: string): Promise<AxiosResponse<ApiResponse<Homework>>> =>
    api.get(`/homework/${id}`),
  
  createHomework: (data: {
    title: string;
    description: string;
    instructions?: string;
    dueDate: Date;
    subject: string;
    assignedTo: string[];
    alumetId?: string;
    priority: 'low' | 'medium' | 'high';
    maxGrade?: number;
    allowLateSubmission: boolean;
    attachments?: string[];
  }): Promise<AxiosResponse<ApiResponse<Homework>>> =>
    api.post('/homework', data),
  
  updateHomework: (id: string, data: Partial<Homework>): Promise<AxiosResponse<ApiResponse<Homework>>> =>
    api.put(`/homework/${id}`, data),
  
  deleteHomework: (id: string): Promise<AxiosResponse<ApiResponse>> =>
    api.delete(`/homework/${id}`),
  
  submitHomework: (id: string, data: {
    content: string;
    attachments?: string[];
  }): Promise<AxiosResponse<ApiResponse>> =>
    api.post(`/homework/${id}/submit`, data),
  
  gradeSubmission: (homeworkId: string, submissionId: string, data: {
    grade: number;
    feedback?: string;
  }): Promise<AxiosResponse<ApiResponse>> =>
    api.post(`/homework/${homeworkId}/submissions/${submissionId}/grade`, data),
  
  getSubmissions: (homeworkId: string): Promise<AxiosResponse<ApiResponse<any[]>>> =>
    api.get(`/homework/${homeworkId}/submissions`),
};

// Posts/Wall API
export const postsApi = {
  getPosts: (alumetId: string, params?: {
    page?: number;
    limit?: number;
  }): Promise<AxiosResponse<ApiResponse<PaginatedResponse<Post>>>> =>
    api.get(`/posts/${alumetId}`, { params }),
  
  createPost: (alumetId: string, data: {
    content: string;
    attachments?: string[];
    tags?: string[];
  }): Promise<AxiosResponse<ApiResponse<Post>>> =>
    api.post(`/posts/${alumetId}`, data),
  
  updatePost: (id: string, data: {
    content: string;
    tags?: string[];
  }): Promise<AxiosResponse<ApiResponse<Post>>> =>
    api.put(`/posts/${id}`, data),
  
  deletePost: (id: string): Promise<AxiosResponse<ApiResponse>> =>
    api.delete(`/posts/${id}`),
  
  likePost: (id: string): Promise<AxiosResponse<ApiResponse>> =>
    api.post(`/posts/${id}/like`),
  
  unlikePost: (id: string): Promise<AxiosResponse<ApiResponse>> =>
    api.delete(`/posts/${id}/like`),
  
  addComment: (postId: string, content: string): Promise<AxiosResponse<ApiResponse>> =>
    api.post(`/posts/${postId}/comments`, { content }),
  
  deleteComment: (postId: string, commentId: string): Promise<AxiosResponse<ApiResponse>> =>
    api.delete(`/posts/${postId}/comments/${commentId}`),
};

// Mindmap API
export const mindmapApi = {
  getMindmaps: (params?: {
    alumetId?: string;
    page?: number;
    limit?: number;
  }): Promise<AxiosResponse<ApiResponse<PaginatedResponse<Mindmap>>>> =>
    api.get('/mindmaps', { params }),
  
  getMindmap: (id: string): Promise<AxiosResponse<ApiResponse<Mindmap>>> =>
    api.get(`/mindmaps/${id}`),
  
  createMindmap: (data: {
    title: string;
    description?: string;
    alumetId: string;
    isPublic: boolean;
    tags?: string[];
  }): Promise<AxiosResponse<ApiResponse<Mindmap>>> =>
    api.post('/mindmaps', data),
  
  updateMindmap: (id: string, data: Partial<Mindmap>): Promise<AxiosResponse<ApiResponse<Mindmap>>> =>
    api.put(`/mindmaps/${id}`, data),
  
  deleteMindmap: (id: string): Promise<AxiosResponse<ApiResponse>> =>
    api.delete(`/mindmaps/${id}`),
};

// Notifications API
export const notificationsApi = {
  getNotifications: (params?: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
  }): Promise<AxiosResponse<ApiResponse<PaginatedResponse<Notification>>>> =>
    api.get('/notifications', { params }),
  
  markAsRead: (id: string): Promise<AxiosResponse<ApiResponse>> =>
    api.put(`/notifications/${id}/read`),
  
  markAllAsRead: (): Promise<AxiosResponse<ApiResponse>> =>
    api.put('/notifications/read-all'),
  
  deleteNotification: (id: string): Promise<AxiosResponse<ApiResponse>> =>
    api.delete(`/notifications/${id}`),
};

// AI API
export const aiApi = {
  generateFlashcards: (data: {
    content: string;
    count?: number;
    difficulty?: 'easy' | 'medium' | 'hard';
    subject?: string;
  }): Promise<AxiosResponse<ApiResponse<{ question: string; answer: string }[]>>> =>
    api.post('/ai/generate-flashcards', data),
  
  summarizeContent: (content: string): Promise<AxiosResponse<ApiResponse<{ summary: string }>>> =>
    api.post('/ai/summarize', { content }),
  
  explainConcept: (concept: string, context?: string): Promise<AxiosResponse<ApiResponse<{ explanation: string }>>> =>
    api.post('/ai/explain', { concept, context }),
  
  generateQuiz: (data: {
    content: string;
    questionCount?: number;
    difficulty?: 'easy' | 'medium' | 'hard';
  }): Promise<AxiosResponse<ApiResponse<any[]>>> =>
    api.post('/ai/generate-quiz', data),
};

export default api;