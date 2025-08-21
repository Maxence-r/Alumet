import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  PlusIcon,
  BookOpenIcon,
  ClockIcon,
  FireIcon,
  ChartBarIcon,
  PlayIcon,
} from '@heroicons/react/24/outline';
import { flashcardsApi } from '../../services/api';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import CreateFlashcardSetModal from '../../components/Flashcards/CreateFlashcardSetModal';
import { FlashcardSet } from '../../types';
import { cn } from '../../utils/cn';

const FlashcardsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showCreateModal, setShowCreateModal] = useState(searchParams.get('create') === 'true');

  // Fetch flashcard sets
  const { data: flashcardSetsData, isLoading } = useQuery({
    queryKey: ['flashcard-sets'],
    queryFn: () => flashcardsApi.getFlashcardSets().then(res => res.data.data),
  });

  // Fetch due flashcards for review
  const { data: dueFlashcards } = useQuery({
    queryKey: ['due-flashcards'],
    queryFn: () => flashcardsApi.getDueFlashcards().then(res => res.data.data),
  });

  const flashcardSets = flashcardSetsData?.data || [];
  const dueCount = dueFlashcards?.length || 0;

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'hard':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getProgressPercentage = (stats: any) => {
    const total = stats.totalCards;
    if (total === 0) return 0;
    return Math.round((stats.masteredCards / total) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Flashcards</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Learn and memorize with spaced repetition
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Set
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <BookOpenIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Sets</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {flashcardSets.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <ClockIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Due for Review</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {dueCount}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <FireIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Study Streak</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                7 days
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Due for Review Section */}
      {dueCount > 0 && (
        <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-lg p-6 border border-primary-200 dark:border-primary-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-primary-900 dark:text-primary-100">
                Ready for Review!
              </h2>
              <p className="text-primary-700 dark:text-primary-200 mt-1">
                You have {dueCount} flashcard{dueCount !== 1 ? 's' : ''} ready for review
              </p>
            </div>
            <Link
              to="/flashcards/review"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
            >
              <PlayIcon className="h-4 w-4 mr-2" />
              Start Review
            </Link>
          </div>
        </div>
      )}

      {/* Flashcard Sets */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : flashcardSets.length === 0 ? (
        <div className="text-center py-12">
          <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No flashcard sets yet</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Create your first flashcard set to start learning.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              Create Flashcard Set
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {flashcardSets.map((set: FlashcardSet) => (
            <Link
              key={set._id}
              to={`/flashcards/${set._id}`}
              className="group block bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-200"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200 truncate">
                      {set.title}
                    </h3>
                    {set.description && (
                      <p className="text-gray-600 dark:text-gray-400 text-sm mt-1 line-clamp-2">
                        {set.description}
                      </p>
                    )}
                  </div>
                  <PlayIcon className="h-5 w-5 text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200 flex-shrink-0 ml-2" />
                </div>

                {/* Stats */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <span>{set.stats.totalCards} cards</span>
                    <span>{getProgressPercentage(set.stats)}% mastered</span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${getProgressPercentage(set.stats)}%` }}
                    />
                  </div>

                  {/* Card status breakdown */}
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center">
                        <div className="w-2 h-2 bg-blue-400 rounded-full mr-1" />
                        {set.stats.newCards} new
                      </span>
                      <span className="flex items-center">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full mr-1" />
                        {set.stats.learningCards} learning
                      </span>
                      <span className="flex items-center">
                        <div className="w-2 h-2 bg-green-400 rounded-full mr-1" />
                        {set.stats.masteredCards} mastered
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                {set.tags && set.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-4">
                    {set.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                      >
                        {tag}
                      </span>
                    ))}
                    {set.tags.length > 3 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                        +{set.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Meta info */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                  <span>
                    {set.isPublic ? 'Public' : 'Private'}
                  </span>
                  <span>
                    Updated {new Date(set.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <CreateFlashcardSetModal
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

export default FlashcardsPage;