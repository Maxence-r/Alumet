import React, { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { alumetApi } from '../../services/api';
import LoadingSpinner from '../UI/LoadingSpinner';
import toast from 'react-hot-toast';

const subjects = [
  { value: 'mathematics', label: 'Mathematics' },
  { value: 'french', label: 'French' },
  { value: 'history', label: 'History' },
  { value: 'geography', label: 'Geography' },
  { value: 'physics', label: 'Physics' },
  { value: 'biology', label: 'Biology' },
  { value: 'philosophy', label: 'Philosophy' },
  { value: 'english', label: 'English' },
  { value: 'technology', label: 'Technology' },
  { value: 'snt', label: 'SNT' },
  { value: 'nsi', label: 'NSI' },
  { value: 'language', label: 'Languages' },
  { value: 'other', label: 'Other' },
];

const createAlumetSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(150, 'Title must be less than 150 characters'),
  description: z.string().max(2000, 'Description must be less than 2000 characters').optional(),
  subject: z.enum(['mathematics', 'french', 'history', 'geography', 'physics', 'biology', 'philosophy', 'english', 'technology', 'snt', 'nsi', 'language', 'other'], {
    required_error: 'Please select a subject',
  }),
  security: z.enum(['open', 'onpassword', 'closed']),
  password: z.string().optional(),
  private: z.boolean(),
  swiftchat: z.boolean(),
  discovery: z.boolean(),
  type: z.enum(['alumet', 'flashcard', 'mindmap']),
}).refine((data) => {
  if (data.security === 'onpassword' && !data.password) {
    return false;
  }
  return true;
}, {
  message: 'Password is required when security is set to password protected',
  path: ['password'],
});

type CreateAlumetForm = z.infer<typeof createAlumetSchema>;

interface CreateAlumetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateAlumetModal: React.FC<CreateAlumetModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateAlumetForm>({
    resolver: zodResolver(createAlumetSchema),
    defaultValues: {
      security: 'open',
      private: false,
      swiftchat: true,
      discovery: false,
      type: 'alumet',
    },
  });

  const security = watch('security');

  const createMutation = useMutation({
    mutationFn: (data: CreateAlumetForm) => alumetApi.createAlumet(data),
    onSuccess: (response) => {
      const alumet = response.data.data;
      toast.success('Workspace created successfully!');
      queryClient.invalidateQueries({ queryKey: ['alumets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      onClose();
      reset();
      navigate(`/alumet/${alumet._id}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create workspace');
    },
  });

  const onSubmit = (data: CreateAlumetForm) => {
    createMutation.mutate(data);
  };

  const handleClose = () => {
    if (!createMutation.isPending) {
      onClose();
      reset();
    }
  };

  return (
    <Transition show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white dark:bg-gray-800 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                    onClick={handleClose}
                    disabled={createMutation.isPending}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="w-full mt-3 text-center sm:ml-0 sm:mt-0 sm:text-left">
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 dark:text-white">
                      Create New Workspace
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Create a new Alumet workspace for collaboration and learning.
                      </p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
                      {/* Title */}
                      <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Title *
                        </label>
                        <input
                          {...register('title')}
                          type="text"
                          placeholder="Enter workspace title"
                          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                        {errors.title && (
                          <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                        )}
                      </div>

                      {/* Description */}
                      <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Description
                        </label>
                        <textarea
                          {...register('description')}
                          rows={3}
                          placeholder="Describe your workspace (optional)"
                          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                        {errors.description && (
                          <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                        )}
                      </div>

                      {/* Subject and Type */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Subject *
                          </label>
                          <select
                            {...register('subject')}
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          >
                            <option value="">Select subject</option>
                            {subjects.map((subject) => (
                              <option key={subject.value} value={subject.value}>
                                {subject.label}
                              </option>
                            ))}
                          </select>
                          {errors.subject && (
                            <p className="mt-1 text-sm text-red-600">{errors.subject.message}</p>
                          )}
                        </div>

                        <div>
                          <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Type *
                          </label>
                          <select
                            {...register('type')}
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          >
                            <option value="alumet">General Workspace</option>
                            <option value="flashcard">Flashcard Set</option>
                            <option value="mindmap">Mindmap</option>
                          </select>
                          {errors.type && (
                            <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
                          )}
                        </div>
                      </div>

                      {/* Security */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Security *
                        </label>
                        <div className="space-y-2">
                          <label className="flex items-center">
                            <input
                              {...register('security')}
                              type="radio"
                              value="open"
                              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                            />
                            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                              Open - Anyone can join
                            </span>
                          </label>
                          <label className="flex items-center">
                            <input
                              {...register('security')}
                              type="radio"
                              value="onpassword"
                              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                            />
                            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                              Password protected
                            </span>
                          </label>
                          <label className="flex items-center">
                            <input
                              {...register('security')}
                              type="radio"
                              value="closed"
                              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                            />
                            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                              Invite only
                            </span>
                          </label>
                        </div>
                        {errors.security && (
                          <p className="mt-1 text-sm text-red-600">{errors.security.message}</p>
                        )}
                      </div>

                      {/* Password field (conditional) */}
                      {security === 'onpassword' && (
                        <div>
                          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Password *
                          </label>
                          <input
                            {...register('password')}
                            type="password"
                            placeholder="Enter workspace password"
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          />
                          {errors.password && (
                            <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                          )}
                        </div>
                      )}

                      {/* Options */}
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input
                            {...register('private')}
                            type="checkbox"
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                            Private workspace
                          </span>
                        </label>
                        <label className="flex items-center">
                          <input
                            {...register('swiftchat')}
                            type="checkbox"
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                            Enable SwiftChat messaging
                          </span>
                        </label>
                        <label className="flex items-center">
                          <input
                            {...register('discovery')}
                            type="checkbox"
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                            Allow discovery by others
                          </span>
                        </label>
                      </div>

                      {/* Actions */}
                      <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 space-y-3 space-y-reverse sm:space-y-0">
                        <button
                          type="button"
                          onClick={handleClose}
                          disabled={createMutation.isPending}
                          className="inline-flex w-full justify-center rounded-md bg-white dark:bg-gray-700 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={createMutation.isPending}
                          className="inline-flex w-full justify-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {createMutation.isPending ? (
                            <>
                              <LoadingSpinner size="sm" color="white" />
                              <span className="ml-2">Creating...</span>
                            </>
                          ) : (
                            'Create Workspace'
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default CreateAlumetModal;