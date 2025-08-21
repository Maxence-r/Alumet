import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { messagesApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { Conversation, Message } from '../../types';
import { cn } from '../../utils/cn';

const MessagesPage: React.FC = () => {
  const { user } = useAuthStore();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch conversations
  const { data: conversations, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => messagesApi.getConversations().then(res => res.data.data),
  });

  // Fetch messages for selected conversation
  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', selectedConversation],
    queryFn: () => messagesApi.getMessages(selectedConversation!).then(res => res.data.data),
    enabled: !!selectedConversation,
  });

  const filteredConversations = conversations?.filter((conv: Conversation) => 
    conv.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.participantsInfo?.some(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.username.toLowerCase().includes(searchQuery.toLowerCase())
    )
  ) || [];

  const messages = messagesData?.data || [];

  return (
    <div className="h-[calc(100vh-8rem)] flex bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Conversations sidebar */}
      <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Messages</h1>
            <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md">
              <PlusIcon className="h-5 w-5" />
            </button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
            />
          </div>
        </div>

        {/* Conversations list */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <LoadingSpinner />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-8">
              <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                {conversations?.length === 0 ? 'No conversations yet' : 'No conversations found'}
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {conversations?.length === 0 
                  ? 'Start a new conversation to get started.'
                  : 'Try adjusting your search terms.'}
              </p>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {filteredConversations.map((conversation: Conversation) => (
                <button
                  key={conversation._id}
                  onClick={() => setSelectedConversation(conversation._id)}
                  className={cn(
                    'w-full text-left p-3 rounded-lg transition-colors duration-200',
                    selectedConversation === conversation._id
                      ? 'bg-primary-50 dark:bg-primary-900/20 border-l-2 border-primary-500'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                  )}
                >
                  <div className="flex items-center space-x-3">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {conversation.type === 'group' ? (
                        <div className="h-10 w-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                          <UserGroupIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                        </div>
                      ) : (
                        <div className="h-10 w-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                          <UserIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {conversation.title || 
                           conversation.participantsInfo?.filter(p => p._id !== user?._id)
                             .map(p => `${p.name} ${p.lastname}`).join(', ') || 
                           'Unknown'}
                        </p>
                        {conversation.lastMessage && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(conversation.lastMessage.timestamp).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {conversation.lastMessage?.content || 'No messages yet'}
                        </p>
                        {conversation.unreadCount && conversation.unreadCount > 0 && (
                          <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-primary-600 rounded-full">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Messages header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                  <UserIcon className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {conversations?.find(c => c._id === selectedConversation)?.title || 'Conversation'}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {conversations?.find(c => c._id === selectedConversation)?.participants?.length || 0} participants
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messagesLoading ? (
                <div className="flex justify-center items-center h-32">
                  <LoadingSpinner />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8">
                  <ChatBubbleLeftRightIcon className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    No messages yet. Start the conversation!
                  </p>
                </div>
              ) : (
                messages.map((message: Message) => (
                  <div
                    key={message._id}
                    className={cn(
                      'flex',
                      message.sender === user?._id ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={cn(
                        'max-w-xs lg:max-w-md px-4 py-2 rounded-lg',
                        message.sender === user?._id
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                      )}
                    >
                      {message.sender !== user?._id && (
                        <p className="text-xs font-medium mb-1 opacity-75">
                          {message.senderInfo?.username || 'Unknown'}
                        </p>
                      )}
                      <p className="text-sm">{message.content}</p>
                      <p className={cn(
                        'text-xs mt-1 opacity-75',
                        message.sender === user?._id ? 'text-right' : 'text-left'
                      )}>
                        {new Date(message.timestamp).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Message input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700">
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
                Select a conversation
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Choose a conversation from the sidebar to start messaging.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;