import React, { useState, useRef, useEffect } from 'react';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '../../store/authStore';
import socketService from '../../services/socket';
import { Alumet, Message } from '../../types';

interface AlumetChatProps {
  alumet: Alumet;
}

const AlumetChat: React.FC<AlumetChatProps> = ({ alumet }) => {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Socket event handlers
  useEffect(() => {
    const handleMessageReceive = (message: Message) => {
      setMessages(prev => [...prev, message]);
    };

    const handleTyping = (data: { conversationId: string; userId: string; isTyping: boolean; username: string }) => {
      if (data.userId !== user?._id) {
        setIsTyping(prev => {
          if (data.isTyping) {
            return prev.includes(data.username) ? prev : [...prev, data.username];
          } else {
            return prev.filter(username => username !== data.username);
          }
        });
      }
    };

    socketService.on('message:receive', handleMessageReceive);
    socketService.on('message:typing', handleTyping);

    return () => {
      socketService.off('message:receive', handleMessageReceive);
      socketService.off('message:typing', handleTyping);
    };
  }, [user]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      socketService.sendMessage(alumet._id, newMessage.trim());
      setNewMessage('');
      
      // Stop typing indicator
      socketService.setTyping(alumet._id, false);
    }
  };

  const handleTyping = (value: string) => {
    setNewMessage(value);
    
    // Send typing indicator
    socketService.setTyping(alumet._id, value.length > 0);
    
    // Clear typing after 2 seconds of no activity
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      socketService.setTyping(alumet._id, false);
    }, 2000);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message._id}
              className={`flex ${message.sender === user?._id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.sender === user?._id
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                }`}
              >
                {message.sender !== user?._id && (
                  <p className="text-xs font-medium mb-1 opacity-75">
                    {message.senderInfo?.username || 'Unknown'}
                  </p>
                )}
                <p className="text-sm">{message.content}</p>
                <p className={`text-xs mt-1 opacity-75 ${
                  message.sender === user?._id ? 'text-right' : 'text-left'
                }`}>
                  {new Date(message.timestamp).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            </div>
          ))
        )}
        
        {/* Typing indicators */}
        {isTyping.length > 0 && (
          <div className="flex justify-start">
            <div className="bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isTyping.join(', ')} {isTyping.length === 1 ? 'is' : 'are'} typing...
              </p>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => handleTyping(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PaperAirplaneIcon className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AlumetChat;