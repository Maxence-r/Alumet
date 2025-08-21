import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  AcademicCapIcon,
  UserGroupIcon,
  LockClosedIcon,
  GlobeAltIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { alumetApi } from '../../services/api';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import CreateAlumetModal from '../../components/Alumet/CreateAlumetModal';
import { Alumet } from '../../types';
import { cn } from '../../utils/cn';

const subjects = [
  { value: '', label: 'All Subjects' },
  { value: 'mathematics', label: 'Mathematics' },
  { value: 'french', label: 'French' },
  { value: 'history', label: 'History' },
  { value: 'geography', label: 'Geography' },
  { value: 'physics', label: 'Physics' },
  { value: 'biology', label: 'Biology' },
  { value: 'philosophy', label: 'Philosophy' },
  { value: 'english', label: 'English' },
  { value: 'technology', label: 'Technology' },
  { value: 'other', label: 'Other' },
];

const AlumetListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedSubject, setSelectedSubject] = useState(searchParams.get('subject') || '');
  const [selectedType, setSelectedType] = useState(searchParams.get('type') || '');
  const [showCreateModal, setShowCreateModal] = useState(searchParams.get('create') === 'true');

  const { data: alumetsData, isLoading, error } = useQuery({
    queryKey: ['alumets', { search: searchQuery, subject: selectedSubject, type: selectedType }],
    queryFn: () => alumetApi.getAlumets({
      search: searchQuery || undefined,
      subject: selectedSubject || undefined,
      type: selectedType || undefined,
      limit: 20,
    }).then(res => res.data.data),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateSearchParams({ search: searchQuery });
  };

  const updateSearchParams = (updates: Record<string, string>) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });
    setSearchParams(newParams);
  };

  const getSubjectLabel = (subject: string) => {
    return subjects.find(s => s.value === subject)?.label || subject;
  };

  const getSecurityIcon = (security: string) => {
    switch (security) {
      case 'closed':
        return <LockClosedIcon className="h-4 w-4 text-red-500" />;
      case 'onpassword':
        return <LockClosedIcon className="h-4 w-4 text-yellow-500" />;
      default:
        return <GlobeAltIcon className="h-4 w-4 text-green-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'flashcard':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'mindmap':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Alumet Workspaces</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Collaborate and learn in shared digital spaces
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Workspace
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-4 space-y-4 lg:space-y-0">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search workspaces..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            {/* Subject Filter */}
            <div className="w-full lg:w-48">
              <select
                value={selectedSubject}
                onChange={(e) => {
                  setSelectedSubject(e.target.value);
                  updateSearchParams({ subject: e.target.value });
                }}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {subjects.map((subject) => (
                  <option key={subject.value} value={subject.value}>
                    {subject.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div className="w-full lg:w-48">
              <select
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value);
                  updateSearchParams({ type: e.target.value });
                }}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Types</option>
                <option value="alumet">General</option>
                <option value="flashcard">Flashcards</option>
                <option value="mindmap">Mindmaps</option>
              </select>
            </div>

            <button
              type="submit"
              className="lg:w-auto w-full inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <FunnelIcon className="h-5 w-5 mr-2" />
              Filter
            </button>
          </div>
        </form>
      </div>

      {/* Workspace Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <div className="text-red-500 mb-4">Failed to load workspaces</div>
          <button
            onClick={() => window.location.reload()}
            className="text-primary-600 hover:text-primary-500"
          >
            Try again
          </button>
        </div>
      ) : alumetsData?.data?.length === 0 ? (
        <div className="text-center py-12">
          <AcademicCapIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No workspaces found</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {searchQuery || selectedSubject || selectedType 
              ? 'Try adjusting your search filters.' 
              : 'Create your first workspace to get started.'}
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              Create Workspace
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {alumetsData?.data?.map((alumet: Alumet) => (
            <Link
              key={alumet._id}
              to={`/alumet/${alumet._id}`}
              className="group block bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-200"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className={cn(
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      getTypeColor(alumet.type)
                    )}>
                      {alumet.type === 'flashcard' ? 'Flashcards' : 
                       alumet.type === 'mindmap' ? 'Mindmap' : 'General'}
                    </span>
                    {getSecurityIcon(alumet.security)}
                  </div>
                  <EyeIcon className="h-5 w-5 text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200" />
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200 mb-2 line-clamp-2">
                  {alumet.title}
                </h3>

                {/* Description */}
                {alumet.description && (
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                    {alumet.description}
                  </p>
                )}

                {/* Meta info */}
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <UserGroupIcon className="h-4 w-4" />
                      <span>{alumet.participants?.length || 0}</span>
                    </div>
                    <span className="capitalize">{getSubjectLabel(alumet.subject)}</span>
                  </div>
                  <time className="text-xs">
                    {new Date(alumet.lastUsage).toLocaleDateString()}
                  </time>
                </div>

                {/* Features */}
                <div className="flex items-center space-x-2 mt-4">
                  {alumet.swiftchat && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                      Chat
                    </span>
                  )}
                  {alumet.discovery && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      Discoverable
                    </span>
                  )}
                  {alumet.private && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                      Private
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {alumetsData?.hasNext && (
        <div className="flex justify-center">
          <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
            Load more
          </button>
        </div>
      )}

      {/* Create Modal */}
      <CreateAlumetModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          // Remove create param from URL
          const newParams = new URLSearchParams(searchParams);
          newParams.delete('create');
          setSearchParams(newParams);
        }}
      />
    </div>
  );
};

export default AlumetListPage;