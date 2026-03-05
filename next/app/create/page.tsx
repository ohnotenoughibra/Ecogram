'use client';

import Navigation from '@/components/Navigation';
import GameForm from '@/components/GameForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CreatePage() {
  return (
    <>
      <Navigation />
      <main className="pt-4 sm:pt-6 pb-24 sm:pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="mb-6">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3"
            >
              <ArrowLeft className="w-3 h-3" />
              Back to Library
            </Link>
            <h1 className="text-2xl font-bold">Create a CLA Game</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Design a constraint-based game for nogi grappling. Define the
              starting position, objectives, constraints, and win conditions.
            </p>
          </div>

          <GameForm />
        </div>
      </main>
    </>
  );
}
