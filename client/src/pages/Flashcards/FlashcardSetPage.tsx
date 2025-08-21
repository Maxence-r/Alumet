import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeftIcon, 
  PlayIcon, 
  PlusIcon, 
  PencilIcon,
  TrashIcon,
  ChartBarIcon 
} from '@heroicons/react/24/outline';
import { flashcardsApi } from '../../services/api';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { Flashcard } from '../../types';

const FlashcardSetPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  // Fetch flashcard set
  const { data: flashcardSet, isLoading } = useQuery({
    queryKey: ['flashcard-set', id],
    queryFn: () => flashcardsApi.getFlashcardSet(id!).then(res => res.data.data),
    enabled: !!id,
  });

  // Fetch flashcards
  const { data: flashcards } = useQuery({
    queryKey: ['flashcards', id],
    queryFn: () => flashcardsApi.getFlashcards(id!).then(res => res.data.data),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!flashcardSet) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">Flashcard set not found</div>
        <Link
          to="/flashcards"
          className="text-primary-600 hover:text-primary-500"
        >
          Back to flashcards
        </Link>
      </div>
    );
  }

  const getProgressPercentage = () => {
    if (!flashcardSet.stats.totalCards) return 0;
    return Math.round((flashcardSet.stats.masteredCards / flashcardSet.stats.totalCards) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <Link
              to="/flashcards"
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {flashcardSet.title}
              </h1>
              {flashcardSet.description && (
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {flashcardSet.description}
                </p>
              )}
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                <span>{flashcardSet.stats.totalCards} cards</span>
                <span>•</span>
                <span>{getProgressPercentage()}% mastered</span>
                <span>•</span>
                <span>Updated {new Date(flashcardSet.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Link
              to={`/flashcards/${id}/study`}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
            >
              <PlayIcon className="h-4 w-4 mr-2" />
              Study
            </Link>
            <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md">
              <ChartBarIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
            <span>Progress</span>
            <span>{getProgressPercentage()}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{flashcardSet.stats.newCards}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">New</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{flashcardSet.stats.learningCards}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Learning</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{flashcardSet.stats.reviewCards}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Review</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{flashcardSet.stats.masteredCards}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Mastered</div>
          </div>
        </div>
      </div>

      {/* Flashcards */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Flashcards ({flashcards?.length || 0})
            </h2>
            <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700">
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Card
            </button>
          </div>
        </div>

        <div className="p-6">
          {!flashcards || flashcards.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">📚</div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">No flashcards yet</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Add your first flashcard to start studying.
              </p>
              <button className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700">
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Flashcard
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {flashcards.map((flashcard: Flashcard, index: number) => (
                <div
                  key={flashcard._id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          #{index + 1}
                        </span>
                        {flashcard.difficulty && (
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            flashcard.difficulty === 'easy' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : flashcard.difficulty === 'medium'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {flashcard.difficulty}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                            Question
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {flashcard.question}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                            Answer
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {flashcard.answer}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded">
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-red-600 rounded">
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FlashcardSetPage;