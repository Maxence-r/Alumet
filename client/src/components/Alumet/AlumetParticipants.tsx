import React from 'react';
import { UserPlusIcon, UserIcon } from '@heroicons/react/24/outline';
import { Alumet } from '../../types';

interface AlumetParticipantsProps {
  alumet: Alumet;
}

const AlumetParticipants: React.FC<AlumetParticipantsProps> = ({ alumet }) => {
  const getStatusLabel = (status: number) => {
    switch (status) {
      case 0: return 'Owner';
      case 1: return 'Admin';
      case 2: return 'Member';
      case 3: return 'Banned';
      case 4: return 'Pending';
      default: return 'Unknown';
    }
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0: return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 1: return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 2: return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 3: return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 4: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Participants ({alumet.participants?.length || 0})
        </h2>
        <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700">
          <UserPlusIcon className="h-4 w-4 mr-2" />
          Invite People
        </button>
      </div>

      {/* Participants list */}
      <div className="space-y-3">
        {alumet.participants?.map((participant, index) => (
          <div
            key={participant.userId}
            className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                <UserIcon className="h-5 w-5 text-primary-700 dark:text-primary-300" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  User #{index + 1}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Joined {new Date(participant.joinedAt || Date.now()).toLocaleDateString()}
                </p>
              </div>
            </div>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(participant.status)}`}>
              {getStatusLabel(participant.status)}
            </span>
          </div>
        )) || (
          <div className="text-center py-6">
            <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No participants</h3>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlumetParticipants;