'use client';

import { TestingSystem } from '@/components/testing';

export default function TestingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50/20 to-purple-50/20 dark:from-gray-900 dark:via-indigo-950/20 dark:to-purple-950/20">
      <TestingSystem />
    </div>
  );
}