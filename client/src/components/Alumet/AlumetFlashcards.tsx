import React from 'react';
import { BookOpenIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Alumet } from '../../types';

interface AlumetFlashcardsProps {
  alumet: Alumet;
}

const AlumetFlashcards: React.FC<AlumetFlashcardsProps> = ({ alumet }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Flashcards</h2>
        <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700">
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Flashcard
        </button>
      </div>

      {/* Flashcards */}
      <div className="text-center py-12">
        <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No flashcards yet</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Create flashcards to help with studying and memorization.
        </p>
      </div>
    </div>
  );
};

export default AlumetFlashcards;