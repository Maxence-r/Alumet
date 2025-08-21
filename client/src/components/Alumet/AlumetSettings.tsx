import React from 'react';
import { Cog6ToothIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Alumet } from '../../types';

interface AlumetSettingsProps {
  alumet: Alumet;
}

const AlumetSettings: React.FC<AlumetSettingsProps> = ({ alumet }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Settings</h2>

      {/* General Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">General</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Workspace Title
            </label>
            <input
              type="text"
              defaultValue={alumet.title}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              defaultValue={alumet.description}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">Security</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Access Level
            </label>
            <select
              defaultValue={alumet.security}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="open">Open - Anyone can join</option>
              <option value="onpassword">Password Protected</option>
              <option value="closed">Invite Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Feature Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">Features</h3>
        
        <div className="space-y-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              defaultChecked={alumet.swiftchat}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Enable SwiftChat messaging
            </span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              defaultChecked={alumet.discovery}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Allow discovery by others
            </span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              defaultChecked={alumet.private}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Private workspace
            </span>
          </label>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 p-6">
        <h3 className="text-md font-medium text-red-900 dark:text-red-200 mb-4">Danger Zone</h3>
        
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-red-900 dark:text-red-200">Delete Workspace</h4>
            <p className="text-sm text-red-700 dark:text-red-300">
              This action cannot be undone. All data will be permanently deleted.
            </p>
          </div>
          <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700">
            <TrashIcon className="h-4 w-4 mr-2" />
            Delete
          </button>
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700">
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default AlumetSettings;