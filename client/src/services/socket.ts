import { io, Socket } from 'socket.io-client';
import { SocketEvents, Message, Notification, Alumet } from '../types';
import toast from 'react-hot-toast';

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Map<string, Function[]> = new Map();

  connect(token: string): void {
    if (this.socket?.connected) {
      return;
    }

    const serverUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';
    
    this.socket = io(serverUrl, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      timeout: 10000,
      retries: 3,
    });

    this.setupEventListeners();
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
    }
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.reconnectAttempts = 0;
      toast.success('Connected to real-time services');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      toast.error('Disconnected from real-time services');
      
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        this.handleReconnection();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.handleReconnection();
    });

    // Authentication events
    this.socket.on('authenticated', (data) => {
      console.log('Socket authenticated for user:', data.userId);
    });

    this.socket.on('authentication_error', (error) => {
      console.error('Socket authentication error:', error);
      toast.error('Authentication failed for real-time services');
    });

    // Message events
    this.socket.on('message:receive', (message: Message) => {
      this.emit('message:receive', message);
      
      // Show notification for new messages
      if (message.senderInfo) {
        toast(`New message from ${message.senderInfo.username}`, {
          icon: '💬',
          duration: 3000,
        });
      }
    });

    this.socket.on('message:typing', (data: { conversationId: string; userId: string; isTyping: boolean; username: string }) => {
      this.emit('message:typing', data);
    });

    // Alumet events
    this.socket.on('alumet:update', (data: { alumetId: string; update: Partial<Alumet> }) => {
      this.emit('alumet:update', data);
    });

    this.socket.on('alumet:participant_joined', (data: { alumetId: string; participant: any; username: string }) => {
      this.emit('alumet:participant_joined', data);
      toast(`${data.username} joined the workspace`, {
        icon: '👋',
        duration: 3000,
      });
    });

    this.socket.on('alumet:participant_left', (data: { alumetId: string; userId: string; username: string }) => {
      this.emit('alumet:participant_left', data);
      toast(`${data.username} left the workspace`, {
        icon: '👋',
        duration: 3000,
      });
    });

    // Collaboration events
    this.socket.on('collaboration:cursor', (data: { x: number; y: number; userId: string; alumetId: string; username: string }) => {
      this.emit('collaboration:cursor', data);
    });

    this.socket.on('collaboration:edit', (data: { type: string; data: any; alumetId: string; userId: string }) => {
      this.emit('collaboration:edit', data);
    });

    this.socket.on('collaboration:selection', (data: { selection: any; userId: string; alumetId: string }) => {
      this.emit('collaboration:selection', data);
    });

    // Notification events
    this.socket.on('notification:new', (notification: Notification) => {
      this.emit('notification:new', notification);
      
      // Show toast notification
      toast(notification.title, {
        description: notification.message,
        icon: this.getNotificationIcon(notification.type),
        duration: 5000,
      });
    });

    // Presence events
    this.socket.on('presence:update', (data: { userId: string; status: 'online' | 'offline' | 'away'; lastSeen?: Date }) => {
      this.emit('presence:update', data);
    });

    this.socket.on('presence:users_online', (userIds: string[]) => {
      this.emit('presence:users_online', userIds);
    });
  }

  private handleReconnection(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      toast.error('Failed to reconnect to real-time services');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    setTimeout(() => {
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      this.socket?.connect();
    }, delay);
  }

  private getNotificationIcon(type: string): string {
    const icons = {
      message: '💬',
      homework: '📚',
      alumet: '🏫',
      system: '⚙️',
      flashcard: '🗃️',
      collaboration: '👥',
    };
    return icons[type as keyof typeof icons] || '📢';
  }

  // Event emitter methods
  on<K extends keyof SocketEvents>(event: K, callback: SocketEvents[K]): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off<K extends keyof SocketEvents>(event: K, callback: SocketEvents[K]): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  private emit<K extends keyof SocketEvents>(event: K, ...args: Parameters<SocketEvents[K]>): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          (callback as any)(...args);
        } catch (error) {
          console.error(`Error in socket event listener for ${event}:`, error);
        }
      });
    }
  }

  // Socket emission methods
  sendMessage(conversationId: string, content: string, type: string = 'text'): void {
    if (this.socket?.connected) {
      this.socket.emit('message:send', { conversationId, content, type });
    }
  }

  setTyping(conversationId: string, isTyping: boolean): void {
    if (this.socket?.connected) {
      this.socket.emit('message:typing', { conversationId, isTyping });
    }
  }

  addMessageReaction(messageId: string, emoji: string): void {
    if (this.socket?.connected) {
      this.socket.emit('message:reaction', { messageId, emoji, action: 'add' });
    }
  }

  removeMessageReaction(messageId: string, emoji: string): void {
    if (this.socket?.connected) {
      this.socket.emit('message:reaction', { messageId, emoji, action: 'remove' });
    }
  }

  joinAlumet(alumetId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('alumet:join', alumetId);
    }
  }

  leaveAlumet(alumetId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('alumet:leave', alumetId);
    }
  }

  updateAlumet(alumetId: string, update: Partial<Alumet>): void {
    if (this.socket?.connected) {
      this.socket.emit('alumet:update', { alumetId, update });
    }
  }

  sendCursorPosition(x: number, y: number, alumetId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('collaboration:cursor', { x, y, alumetId });
    }
  }

  sendCollaborationEdit(type: string, data: any, alumetId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('collaboration:edit', { type, data, alumetId });
    }
  }

  sendSelection(selection: any, alumetId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('collaboration:selection', { selection, alumetId });
    }
  }

  markNotificationAsRead(notificationId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('notification:read', notificationId);
    }
  }

  // Utility methods
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getConnectionState(): string {
    if (!this.socket) return 'disconnected';
    return this.socket.connected ? 'connected' : 'disconnected';
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;