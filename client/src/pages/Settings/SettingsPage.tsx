import React from 'react';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';

const SettingsPage: React.FC = () => {
  const { mode, fontSize, setMode, setFontSize } = useThemeStore();
  const { user } = useAuthStore();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Customize your Alumet experience
        </p>
      </div>

      {/* Appearance */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
          Appearance
        </h3>
        
        <div className="space-y-6">
          {/* Theme */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Theme
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'light', label: 'Light', description: 'Light mode' },
                { value: 'dark', label: 'Dark', description: 'Dark mode' },
                { value: 'system', label: 'System', description: 'Follow system' },
              ].map((theme) => (
                <button
                  key={theme.value}
                  onClick={() => setMode(theme.value as any)}
                  className={`p-4 rounded-lg border-2 transition-colors duration-200 ${
                    mode === theme.value
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {theme.label}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {theme.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Font size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Font Size
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'small', label: 'Small' },
                { value: 'medium', label: 'Medium' },
                { value: 'large', label: 'Large' },
              ].map((size) => (
                <button
                  key={size.value}
                  onClick={() => setFontSize(size.value as any)}
                  className={`p-3 rounded-lg border-2 transition-colors duration-200 ${
                    fontSize === size.value
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {size.label}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
          Notifications
        </h3>
        
        <div className="space-y-4">
          {[
            { id: 'messages', label: 'New messages', description: 'Get notified when you receive new messages' },
            { id: 'homework', label: 'Homework reminders', description: 'Reminders for upcoming homework deadlines' },
            { id: 'alumet', label: 'Workspace updates', description: 'Updates from your workspaces' },
            { id: 'flashcards', label: 'Flashcard reviews', description: 'Reminders to review your flashcards' },
          ].map((notification) => (
            <div key={notification.id} className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {notification.label}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {notification.description}
                </div>
              </div>
              <input
                type="checkbox"
                defaultChecked={user?.notifications?.includes(notification.id)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Security */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
          Security
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                Two-Factor Authentication
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Add an extra layer of security to your account
              </div>
            </div>
            <button className={`px-3 py-1 rounded-md text-sm font-medium ${
              user?.isA2FEnabled
                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            }`}>
              {user?.isA2FEnabled ? 'Disable' : 'Enable'}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                Change Password
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Update your account password
              </div>
            </div>
            <button className="px-3 py-1 rounded-md text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
              Change
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;