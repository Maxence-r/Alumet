import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  AcademicCapIcon,
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  DocumentIcon,
  PuzzlePieceIcon,
  MapIcon,
  PlusIcon,
  ArrowRightIcon,
  ClockIcon,
  UserGroupIcon,
  FireIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../../store/authStore';
import { usersApi, alumetApi, flashcardsApi, messagesApi } from '../../services/api';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const quickActions = [
  {
    name: 'Create Workspace',
    description: 'Start a new Alumet workspace',
    href: '/alumet?create=true',
    icon: AcademicCapIcon,
    color: 'bg-blue-500 hover:bg-blue-600',
  },
  {
    name: 'New Flashcard Set',
    description: 'Create flashcards for studying',
    href: '/flashcards?create=true',
    icon: BookOpenIcon,
    color: 'bg-green-500 hover:bg-green-600',
  },
  {
    name: 'Start Conversation',
    description: 'Message students or teachers',
    href: '/messages?new=true',
    icon: ChatBubbleLeftRightIcon,
    color: 'bg-purple-500 hover:bg-purple-600',
  },
  {
    name: 'Upload Files',
    description: 'Share documents and resources',
    href: '/files?upload=true',
    icon: DocumentIcon,
    color: 'bg-orange-500 hover:bg-orange-600',
  },
];

const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();

  // Fetch dashboard statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => usersApi.getDashboardStats().then(res => res.data.data),
  });

  // Fetch recent alumets
  const { data: recentAlumets, isLoading: alumetsLoading } = useQuery({
    queryKey: ['recent-alumets'],
    queryFn: () => alumetApi.getAlumets({ limit: 5 }).then(res => res.data.data?.data || []),
  });

  // Fetch due flashcards
  const { data: dueFlashcards, isLoading: flashcardsLoading } = useQuery({
    queryKey: ['due-flashcards'],
    queryFn: () => flashcardsApi.getDueFlashcards().then(res => res.data.data || []),
  });

  // Fetch recent conversations
  const { data: recentConversations, isLoading: conversationsLoading } = useQuery({
    queryKey: ['recent-conversations'],
    queryFn: () => messagesApi.getConversations().then(res => res.data.data?.slice(0, 3) || []),
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {getGreeting()}, {user?.name}! 👋
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Welcome back to your learning dashboard
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-1.5"></div>
              Online
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickActions.map((action) => (
          <Link
            key={action.name}
            to={action.href}
            className="group relative bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-200"
          >
            <div className={`inline-flex items-center justify-center p-3 rounded-lg ${action.color} text-white mb-4`}>
              <action.icon className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400">
              {action.name}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              {action.description}
            </p>
            <ArrowRightIcon className="absolute top-6 right-6 h-5 w-5 text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200" />
          </Link>
        ))}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsLoading ? (
          <div className="col-span-full flex justify-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <AcademicCapIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Workspaces</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats?.alumets?.total || 0}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-gray-600 dark:text-gray-400">
                <UserGroupIcon className="h-4 w-4 mr-1" />
                {stats?.alumets?.active || 0} active
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <BookOpenIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Flashcards</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats?.flashcards?.totalCards || 0}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-gray-600 dark:text-gray-400">
                <ClockIcon className="h-4 w-4 mr-1" />
                {stats?.flashcards?.dueForReview || 0} due for review
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <ChatBubbleLeftRightIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Messages</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats?.messages?.totalConversations || 0}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-gray-600 dark:text-gray-400">
                <div className="w-2 h-2 bg-red-400 rounded-full mr-2"></div>
                {stats?.messages?.unreadMessages || 0} unread
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                  <PuzzlePieceIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Homework</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats?.homework?.assigned || 0}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-gray-600 dark:text-gray-400">
                <FireIcon className="h-4 w-4 mr-1" />
                {stats?.homework?.pending || 0} pending
              </div>
            </div>
          </>
        )}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Workspaces */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Workspaces</h2>
            <Link
              to="/alumet"
              className="text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
            >
              View all
            </Link>
          </div>
          {alumetsLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : recentAlumets?.length === 0 ? (
            <div className="text-center py-8">
              <AcademicCapIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No workspaces yet</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Create your first workspace to get started.
              </p>
              <div className="mt-6">
                <Link
                  to="/alumet?create=true"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                >
                  <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                  Create Workspace
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {recentAlumets?.map((alumet: any) => (
                <Link
                  key={alumet._id}
                  to={`/alumet/${alumet._id}`}
                  className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {alumet.title}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-1">
                        {alumet.description || 'No description'}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className="capitalize">{alumet.subject}</span>
                      <span>•</span>
                      <span>{alumet.participants?.length || 0} members</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Due Flashcards & Recent Messages */}
        <div className="space-y-6">
          {/* Due Flashcards */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Due for Review</h2>
              <Link
                to="/flashcards"
                className="text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
              >
                Study now
              </Link>
            </div>
            {flashcardsLoading ? (
              <div className="flex justify-center py-4">
                <LoadingSpinner size="sm" />
              </div>
            ) : dueFlashcards?.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                No flashcards due for review
              </p>
            ) : (
              <div className="space-y-2">
                {dueFlashcards?.slice(0, 3).map((flashcard: any) => (
                  <div
                    key={flashcard._id}
                    className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {flashcard.question}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Due for review
                    </p>
                  </div>
                ))}
                {dueFlashcards?.length > 3 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center pt-2">
                    +{dueFlashcards.length - 3} more cards
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Recent Messages */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Messages</h2>
              <Link
                to="/messages"
                className="text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
              >
                View all
              </Link>
            </div>
            {conversationsLoading ? (
              <div className="flex justify-center py-4">
                <LoadingSpinner size="sm" />
              </div>
            ) : recentConversations?.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                No recent conversations
              </p>
            ) : (
              <div className="space-y-3">
                {recentConversations?.map((conversation: any) => (
                  <Link
                    key={conversation._id}
                    to={`/messages?conversation=${conversation._id}`}
                    className="block p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-primary-700 dark:text-primary-300">
                            {conversation.type === 'group' ? conversation.title?.[0] || 'G' : 'DM'}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {conversation.title || 'Direct Message'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {conversation.lastMessage?.content || 'No messages yet'}
                        </p>
                      </div>
                      {conversation.unreadCount > 0 && (
                        <div className="flex-shrink-0">
                          <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                            {conversation.unreadCount}
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;