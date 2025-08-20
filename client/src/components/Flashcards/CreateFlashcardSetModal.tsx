import React, { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { flashcardsApi, alumetApi } from '../../services/api';
import LoadingSpinner from '../UI/LoadingSpinner';
import toast from 'react-hot-toast';

const createFlashcardSetSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(150, 'Title must be less than 150 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  alumetId: z.string().min(1, 'Please select a workspace'),
  isPublic: z.boolean(),
  tags: z.string().optional(),
});

type CreateFlashcardSetForm = z.infer<typeof createFlashcardSetSchema>;

interface CreateFlashcardSetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateFlashcardSetModal: React.FC<CreateFlashcardSetModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateFlashcardSetForm>({
    resolver: zodResolver(createFlashcardSetSchema),
    defaultValues: {
      isPublic: false,
    },
  });

  // Fetch user's alumets for selection
  const { data: alumetsData } = useQuery({
    queryKey: ['alumets-for-flashcards'],
    queryFn: () => alumetApi.getAlumets({ limit: 50 }).then(res => res.data.data),
    enabled: isOpen,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateFlashcardSetForm) => {
      const tagsArray = data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];
      return flashcardsApi.createFlashcardSet({
        title: data.title,
        description: data.description,
        alumetId: data.alumetId,
        isPublic: data.isPublic,
        tags: tagsArray,
      });
    },
    onSuccess: (response) => {
      const flashcardSet = response.data.data;
      toast.success('Flashcard set created successfully!');
      queryClient.invalidateQueries({ queryKey: ['flashcard-sets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      onClose();
      reset();
      navigate(`/flashcards/${flashcardSet._id}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create flashcard set');
    },
  });

  const onSubmit = (data: CreateFlashcardSetForm) => {
    createMutation.mutate(data);
  };

  const handleClose = () => {
    if (!createMutation.isPending) {
      onClose();
      reset();
    }
  };

  const alumets = alumetsData?.data || [];

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
                      Create New Flashcard Set
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Create a new set of flashcards for studying and memorization.
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
                          placeholder="Enter flashcard set title"
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
                          placeholder="Describe your flashcard set (optional)"
                          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                        {errors.description && (
                          <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                        )}
                      </div>

                      {/* Workspace */}
                      <div>
                        <label htmlFor="alumetId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Workspace *
                        </label>
                        <select
                          {...register('alumetId')}
                          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        >
                          <option value="">Select a workspace</option>
                          {alumets.map((alumet: any) => (
                            <option key={alumet._id} value={alumet._id}>
                              {alumet.title}
                            </option>
                          ))}
                        </select>
                        {errors.alumetId && (
                          <p className="mt-1 text-sm text-red-600">{errors.alumetId.message}</p>
                        )}
                      </div>

                      {/* Tags */}
                      <div>
                        <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Tags
                        </label>
                        <input
                          {...register('tags')}
                          type="text"
                          placeholder="Enter tags separated by commas (e.g., math, algebra, equations)"
                          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Separate tags with commas to help organize your flashcards
                        </p>
                      </div>

                      {/* Public checkbox */}
                      <div className="flex items-center">
                        <input
                          {...register('isPublic')}
                          type="checkbox"
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                          Make this flashcard set public
                        </label>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Public sets can be discovered and used by other users
                      </p>

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
                            'Create Flashcard Set'
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

export default CreateFlashcardSetModal;