import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  PlusIcon, 
  HeartIcon, 
  ChatBubbleLeftIcon,
  PaperClipIcon,
  EllipsisHorizontalIcon 
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { postsApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import LoadingSpinner from '../UI/LoadingSpinner';
import { Alumet, Post } from '../../types';
import { cn } from '../../utils/cn';

interface AlumetWallProps {
  alumet: Alumet;
}

const AlumetWall: React.FC<AlumetWallProps> = ({ alumet }) => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [newPostContent, setNewPostContent] = useState('');
  const [showNewPost, setShowNewPost] = useState(false);

  // Fetch posts
  const { data: postsData, isLoading } = useQuery({
    queryKey: ['posts', alumet._id],
    queryFn: () => postsApi.getPosts(alumet._id).then(res => res.data.data),
  });

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: (content: string) => postsApi.createPost(alumet._id, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts', alumet._id] });
      setNewPostContent('');
      setShowNewPost(false);
    },
  });

  // Like post mutation
  const likePostMutation = useMutation({
    mutationFn: ({ postId, action }: { postId: string; action: 'like' | 'unlike' }) => 
      action === 'like' ? postsApi.likePost(postId) : postsApi.unlikePost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts', alumet._id] });
    },
  });

  const handleCreatePost = () => {
    if (newPostContent.trim()) {
      createPostMutation.mutate(newPostContent.trim());
    }
  };

  const handleLikePost = (post: Post) => {
    const isLiked = post.likes.includes(user?._id || '');
    likePostMutation.mutate({
      postId: post._id,
      action: isLiked ? 'unlike' : 'like',
    });
  };

  const posts = postsData?.data || [];

  return (
    <div className="space-y-6">
      {/* New Post */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        {!showNewPost ? (
          <button
            onClick={() => setShowNewPost(true)}
            className="w-full text-left p-3 bg-white dark:bg-gray-600 rounded-lg border border-gray-200 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors duration-200"
          >
            <div className="flex items-center space-x-3">
              {user?.icon && user.icon !== 'defaultUser' ? (
                <img
                  src={`/api/files/avatars/${user.icon}`}
                  alt={user.name}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="h-8 w-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                    {user?.name?.[0]}{user?.lastname?.[0]}
                  </span>
                </div>
              )}
              <span className="text-gray-500 dark:text-gray-400">
                Share something with the class...
              </span>
            </div>
          </button>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              {user?.icon && user.icon !== 'defaultUser' ? (
                <img
                  src={`/api/files/avatars/${user.icon}`}
                  alt={user.name}
                  className="h-8 w-8 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="h-8 w-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                    {user?.name?.[0]}{user?.lastname?.[0]}
                  </span>
                </div>
              )}
              <div className="flex-1">
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="Share your thoughts, ask questions, or post updates..."
                  rows={3}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <button
                type="button"
                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <PaperClipIcon className="h-4 w-4 mr-2" />
                Attach files
              </button>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setShowNewPost(false);
                    setNewPostContent('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-500 dark:hover:text-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePost}
                  disabled={!newPostContent.trim() || createPostMutation.isPending}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createPostMutation.isPending ? (
                    <>
                      <LoadingSpinner size="sm" color="white" />
                      <span className="ml-2">Posting...</span>
                    </>
                  ) : (
                    'Post'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Posts */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12">
          <ChatBubbleLeftIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No posts yet</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Be the first to share something with the class.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post: Post) => (
            <div key={post._id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              {/* Post header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {post.authorInfo?.icon && post.authorInfo.icon !== 'defaultUser' ? (
                    <img
                      src={`/api/files/avatars/${post.authorInfo.icon}`}
                      alt={post.authorInfo.username}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                        {post.authorInfo?.name?.[0]}{post.authorInfo?.lastname?.[0]}
                      </span>
                    </div>
                  )}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                      {post.authorInfo?.name} {post.authorInfo?.lastname}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      @{post.authorInfo?.username} • {new Date(post.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <EllipsisHorizontalIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Post content */}
              <div className="mb-4">
                <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                  {post.content}
                </p>
              </div>

              {/* Post actions */}
              <div className="flex items-center space-x-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => handleLikePost(post)}
                  disabled={likePostMutation.isPending}
                  className={cn(
                    'flex items-center space-x-2 text-sm font-medium transition-colors duration-200',
                    post.likes.includes(user?._id || '')
                      ? 'text-red-600 hover:text-red-700'
                      : 'text-gray-500 dark:text-gray-400 hover:text-red-600'
                  )}
                >
                  {post.likes.includes(user?._id || '') ? (
                    <HeartIconSolid className="h-5 w-5" />
                  ) : (
                    <HeartIcon className="h-5 w-5" />
                  )}
                  <span>{post.likes.length}</span>
                </button>
                
                <button className="flex items-center space-x-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200">
                  <ChatBubbleLeftIcon className="h-5 w-5" />
                  <span>{post.comments.length}</span>
                </button>
              </div>

              {/* Comments section would go here */}
              {post.comments.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {post.comments.length} comment{post.comments.length !== 1 ? 's' : ''}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AlumetWall;