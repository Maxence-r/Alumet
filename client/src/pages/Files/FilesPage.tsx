import React from 'react';
import { DocumentIcon, PlusIcon, FolderIcon } from '@heroicons/react/24/outline';

const FilesPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Files</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage and share your documents and resources
          </p>
        </div>
        <button className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700">
          <PlusIcon className="h-5 w-5 mr-2" />
          Upload Files
        </button>
      </div>

      {/* File browser */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-center py-12">
          <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No files yet</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Upload your first file to get started.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FilesPage;