import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UserGroupIcon,
  Cog6ToothIcon,
  ChatBubbleLeftRightIcon,
  DocumentIcon,
  BookOpenIcon,
  MapIcon,
  PlusIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import { Tab } from '@headlessui/react';
import { alumetApi, postsApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import socketService from '../../services/socket';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import AlumetWall from '../../components/Alumet/AlumetWall';
import AlumetFiles from '../../components/Alumet/AlumetFiles';
import AlumetParticipants from '../../components/Alumet/AlumetParticipants';
import AlumetSettings from '../../components/Alumet/AlumetSettings';
import AlumetFlashcards from '../../components/Alumet/AlumetFlashcards';
import AlumetMindmaps from '../../components/Alumet/AlumetMindmaps';
import AlumetChat from '../../components/Alumet/AlumetChat';
import { cn } from '../../utils/cn';
import toast from 'react-hot-toast';

const AlumetPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState(0);
  const [showChat, setShowChat] = useState(false);

  // Fetch alumet data
  const { data: alumet, isLoading, error } = useQuery({
    queryKey: ['alumet', id],
    queryFn: () => alumetApi.getAlumet(id!).then(res => res.data.data),
    enabled: !!id,
  });

  // Join alumet mutation
  const joinMutation = useMutation({
    mutationFn: (password?: string) => alumetApi.joinAlumet(id!, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alumet', id] });
      toast.success('Joined workspace successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to join workspace');
    },
  });

  // Check if user is participant
  const isParticipant = alumet?.participants?.some(p => p.userId === user?._id);
  const userParticipant = alumet?.participants?.find(p => p.userId === user?._id);
  const isOwner = userParticipant?.status === 0;
  const isAdmin = userParticipant?.status === 0 || userParticipant?.status === 1;

  // Socket connection for real-time features
  useEffect(() => {
    if (alumet && isParticipant) {
      socketService.joinAlumet(alumet._id);
      
      return () => {
        socketService.leaveAlumet(alumet._id);
      };
    }
  }, [alumet, isParticipant]);

  // Handle socket events
  useEffect(() => {
    const handleAlumetUpdate = (data: { alumetId: string; update: any }) => {
      if (data.alumetId === id) {
        queryClient.setQueryData(['alumet', id], (oldData: any) => ({
          ...oldData,
          ...data.update,
        }));
      }
    };

    const handleParticipantJoined = (data: { alumetId: string; participant: any }) => {
      if (data.alumetId === id) {
        queryClient.invalidateQueries({ queryKey: ['alumet', id] });
      }
    };

    const handleParticipantLeft = (data: { alumetId: string; userId: string }) => {
      if (data.alumetId === id) {
        queryClient.invalidateQueries({ queryKey: ['alumet', id] });
      }
    };

    socketService.on('alumet:update', handleAlumetUpdate);
    socketService.on('alumet:participant_joined', handleParticipantJoined);
    socketService.on('alumet:participant_left', handleParticipantLeft);

    return () => {
      socketService.off('alumet:update', handleAlumetUpdate);
      socketService.off('alumet:participant_joined', handleParticipantJoined);
      socketService.off('alumet:participant_left', handleParticipantLeft);
    };
  }, [id, queryClient]);

  const tabs = [
    { name: 'Wall', icon: DocumentIcon, component: AlumetWall },
    ...(alumet?.type === 'flashcard' ? [{ name: 'Flashcards', icon: BookOpenIcon, component: AlumetFlashcards }] : []),
    ...(alumet?.type === 'mindmap' ? [{ name: 'Mindmaps', icon: MapIcon, component: AlumetMindmaps }] : []),
    { name: 'Files', icon: DocumentIcon, component: AlumetFiles },
    { name: 'Participants', icon: UserGroupIcon, component: AlumetParticipants },
    ...(isAdmin ? [{ name: 'Settings', icon: Cog6ToothIcon, component: AlumetSettings }] : []),
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !alumet) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">Failed to load workspace</div>
        <button
          onClick={() => navigate('/alumet')}
          className="text-primary-600 hover:text-primary-500"
        >
          Back to workspaces
        </button>
      </div>
    );
  }

  // If user is not a participant and workspace is not open
  if (!isParticipant && alumet.security !== 'open') {
    return (
      <div className="max-w-md mx-auto mt-12">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {alumet.title}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {alumet.security === 'onpassword' 
              ? 'This workspace is password protected.'
              : 'This workspace is invite only.'}
          </p>
          
          {alumet.security === 'onpassword' ? (
            <div className="space-y-4">
              <input
                type="password"
                placeholder="Enter password"
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const password = (e.target as HTMLInputElement).value;
                    joinMutation.mutate(password);
                  }
                }}
              />
              <button
                onClick={() => {
                  const input = document.querySelector('input[type="password"]') as HTMLInputElement;
                  joinMutation.mutate(input.value);
                }}
                disabled={joinMutation.isPending}
                className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 disabled:opacity-50"
              >
                {joinMutation.isPending ? 'Joining...' : 'Join Workspace'}
              </button>
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Contact the workspace owner for an invitation.
            </p>
          )}
          
          <button
            onClick={() => navigate('/alumet')}
            className="mt-4 text-primary-600 hover:text-primary-500"
          >
            Back to workspaces
          </button>
        </div>
      </div>
    );
  }

  const ActiveTabComponent = tabs[selectedTab]?.component || AlumetWall;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/alumet')}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {alumet.title}
                </h1>
                <span className={cn(
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                  alumet.type === 'flashcard' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : alumet.type === 'mindmap'
                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                )}>
                  {alumet.type === 'flashcard' ? 'Flashcards' : 
                   alumet.type === 'mindmap' ? 'Mindmap' : 'General'}
                </span>
              </div>
              {alumet.description && (
                <p className="text-gray-600 dark:text-gray-400">{alumet.description}</p>
              )}
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                <span className="capitalize">{alumet.subject}</span>
                <span>•</span>
                <span>{alumet.participants?.length || 0} participants</span>
                <span>•</span>
                <span>Last active {new Date(alumet.lastUsage).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {alumet.swiftchat && (
              <button
                onClick={() => setShowChat(!showChat)}
                className={cn(
                  'p-2 rounded-md transition-colors duration-200',
                  showChat
                    ? 'bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-400'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                )}
              >
                <ChatBubbleLeftRightIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex gap-6">
        {/* Main content */}
        <div className={cn('flex-1', showChat && 'lg:mr-80')}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            {/* Tabs */}
            <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
              <Tab.List className="flex border-b border-gray-200 dark:border-gray-700">
                {tabs.map((tab, index) => (
                  <Tab
                    key={tab.name}
                    className={({ selected }) =>
                      cn(
                        'flex items-center space-x-2 py-3 px-4 text-sm font-medium border-b-2 focus:outline-none',
                        selected
                          ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                      )
                    }
                  >
                    <tab.icon className="h-5 w-5" />
                    <span>{tab.name}</span>
                  </Tab>
                ))}
              </Tab.List>
              
              <Tab.Panels>
                {tabs.map((tab, index) => (
                  <Tab.Panel key={index} className="p-6">
                    <ActiveTabComponent alumet={alumet} />
                  </Tab.Panel>
                ))}
              </Tab.Panels>
            </Tab.Group>
          </div>
        </div>

        {/* Chat sidebar */}
        {showChat && alumet.swiftchat && (
          <div className="hidden lg:block fixed right-6 top-24 bottom-6 w-80">
            <div className="h-full bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  SwiftChat
                </h3>
                <button
                  onClick={() => setShowChat(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ×
                </button>
              </div>
              <AlumetChat alumet={alumet} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlumetPage;