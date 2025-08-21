import React from 'react';
import { Link } from 'react-router-dom';
import { 
  AcademicCapIcon,
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  DocumentIcon,
  PuzzlePieceIcon,
  MapIcon,
  CheckIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

const features = [
  {
    name: 'Alumet Workspaces',
    description: 'Collaborative learning spaces where students and teachers can work together on projects and assignments.',
    icon: AcademicCapIcon,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  {
    name: 'Smart Flashcards',
    description: 'AI-powered flashcard system with spaced repetition algorithm for optimal learning retention.',
    icon: BookOpenIcon,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  {
    name: 'Real-time Messaging',
    description: 'SwiftChat messaging system for instant communication between students and teachers.',
    icon: ChatBubbleLeftRightIcon,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  {
    name: 'File Management',
    description: 'Secure file storage and sharing with preview capabilities for all major file types.',
    icon: DocumentIcon,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
  {
    name: 'Homework System',
    description: 'EduTasker for managing assignments, submissions, and grading with deadline tracking.',
    icon: PuzzlePieceIcon,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
  },
  {
    name: 'Interactive Mindmaps',
    description: 'Collaborative mind mapping tool for brainstorming and organizing ideas visually.',
    icon: MapIcon,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
  },
];

const benefits = [
  'Free to use for all students and teachers',
  'Real-time collaboration features',
  'AI-powered learning assistance',
  'Secure and privacy-focused',
  'Mobile-responsive design',
  'Hosted in France with GDPR compliance',
];

const LandingPage: React.FC = () => {
  return (
    <div className="bg-white">
      {/* Header */}
      <header className="absolute inset-x-0 top-0 z-50">
        <nav className="flex items-center justify-between p-6 lg:px-8" aria-label="Global">
          <div className="flex lg:flex-1">
            <Link to="/" className="-m-1.5 p-1.5 flex items-center space-x-3">
              <img
                className="h-8 w-auto"
                src="/alumet-logo.png"
                alt="Alumet Education"
              />
              <span className="text-xl font-bold text-gray-900">Alumet Education</span>
            </Link>
          </div>
          <div className="flex lg:flex-1 lg:justify-end space-x-4">
            <Link
              to="/auth/login"
              className="text-sm font-semibold leading-6 text-gray-900 hover:text-primary-600"
            >
              Sign in
            </Link>
            <Link
              to="/auth/register"
              className="rounded-md bg-primary-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
            >
              Get started
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero section */}
      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div
          className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
          aria-hidden="true"
        >
          <div
            className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
            style={{
              clipPath:
                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            }}
          />
        </div>
        
        <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              The future of{' '}
              <span className="text-primary-600">digital education</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Alumet Education is a comprehensive digital workspace designed for students and teachers. 
              Collaborate, learn, and grow together with our innovative tools and AI-powered features.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                to="/auth/register"
                className="rounded-md bg-primary-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 flex items-center"
              >
                Get started for free
                <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Link>
              <a href="#features" className="text-sm font-semibold leading-6 text-gray-900">
                Learn more <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </div>
        
        <div
          className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"
          aria-hidden="true"
        >
          <div
            className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
            style={{
              clipPath:
                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            }}
          />
        </div>
      </div>

      {/* Features section */}
      <div id="features" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-primary-600">Everything you need</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Comprehensive tools for modern education
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              From collaborative workspaces to AI-powered learning tools, Alumet provides everything 
              students and teachers need for successful digital education.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
              {features.map((feature) => (
                <div key={feature.name} className="relative pl-16">
                  <dt className="text-base font-semibold leading-7 text-gray-900">
                    <div className={`absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg ${feature.bgColor}`}>
                      <feature.icon className={`h-6 w-6 ${feature.color}`} aria-hidden="true" />
                    </div>
                    {feature.name}
                  </dt>
                  <dd className="mt-2 text-base leading-7 text-gray-600">{feature.description}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {/* Benefits section */}
      <div className="bg-gray-50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Why choose Alumet?
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Built by educators, for educators. Alumet is designed with privacy, 
              accessibility, and pedagogical effectiveness at its core.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24">
            <ul className="space-y-4">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-start">
                  <div className="flex-shrink-0">
                    <CheckIcon className="h-6 w-6 text-green-500" />
                  </div>
                  <p className="ml-3 text-base leading-6 text-gray-700">{benefit}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* CTA section */}
      <div className="bg-primary-600">
        <div className="px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to transform your classroom?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-primary-100">
              Join thousands of students and teachers already using Alumet to enhance their educational experience.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                to="/auth/register"
                className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-primary-600 shadow-sm hover:bg-primary-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Get started today
              </Link>
              <Link to="/auth/login" className="text-sm font-semibold leading-6 text-white">
                Already have an account? <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-12 md:flex md:items-center md:justify-between lg:px-8">
          <div className="flex justify-center space-x-6 md:order-2">
            <p className="text-xs leading-5 text-gray-500">
              Proudly hosted in France 🇫🇷
            </p>
          </div>
          <div className="mt-8 md:order-1 md:mt-0">
            <p className="text-center text-xs leading-5 text-gray-500">
              &copy; 2024 Alumet Education. All rights reserved. Made with ❤️ for education.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;