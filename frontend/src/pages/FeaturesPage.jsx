import React from 'react';
import { ArrowRight } from 'lucide-react';

export default function FeaturesPage({ onNavigate }) {
  return (
    <div className="w-full max-w-3xl mx-auto py-6 px-4 pb-20 text-slate-800">
      {/* Title */}
      <div className="pb-6 mb-8 border-b border-slate-200">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight font-sans">
          Platform Features
        </h1>
        <p className="text-sm text-slate-600 mt-2 leading-relaxed">
          A straightforward guide to asking questions, finding answers, voting, and earning reputation on ThreadPoint.
        </p>
      </div>

      {/* Line by line content */}
      <div className="space-y-10 text-sm leading-relaxed">
        {/* Section 1 */}
        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-3">
            1. Questions & Answers
          </h2>
          <ul className="space-y-2 text-slate-700 pl-1">
            <li className="flex items-start gap-2">
              <span className="text-slate-400 font-bold select-none">•</span>
              <span>Write questions formatted with full Markdown, rich text, and formatting options.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-slate-400 font-bold select-none">•</span>
              <span>Tag inquiries with relevant topics (e.g. <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded font-mono">#productivity</code>, <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded font-mono">#design</code>) so the right community members can find them.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-slate-400 font-bold select-none">•</span>
              <span>Use the live preview tab to check your formatting and code blocks before posting.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-slate-400 font-bold select-none">•</span>
              <span>Filter discussions by <span className="font-semibold text-slate-900">Hot & Trending</span>, <span className="font-semibold text-slate-900">Newest</span>, or <span className="font-semibold text-slate-900">Unanswered</span>.</span>
            </li>
          </ul>
        </section>

        <hr className="border-slate-200" />

        {/* Section 2 */}
        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-3">
            2. Verified Solutions & Accepted Answers
          </h2>
          <ul className="space-y-2 text-slate-700 pl-1">
            <li className="flex items-start gap-2">
              <span className="text-slate-400 font-bold select-none">•</span>
              <span>When an answer resolves the problem, the author who asked the question can mark it as accepted.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-slate-400 font-bold select-none">•</span>
              <span><span className="font-semibold text-emerald-700">+15 Reputation Bounty</span> is awarded to the person who provided the solution.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-slate-400 font-bold select-none">•</span>
              <span><span className="font-semibold text-indigo-700">+2 Reputation</span> is awarded to the question author for verifying and accepting the answer.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-slate-400 font-bold select-none">•</span>
              <span>Accepted solutions are pinned with a green checkmark so future visitors find the fix immediately.</span>
            </li>
          </ul>
        </section>

        <hr className="border-slate-200" />

        {/* Section 3 */}
        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-3">
            3. Community Voting
          </h2>
          <ul className="space-y-2 text-slate-700 pl-1">
            <li className="flex items-start gap-2">
              <span className="text-slate-400 font-bold select-none">•</span>
              <span><span className="font-semibold text-emerald-700">+10 Reputation</span> is earned whenever a peer upvotes your question or answer.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-slate-400 font-bold select-none">•</span>
              <span><span className="font-semibold text-red-600">-2 Reputation</span> is deducted if an answer receives a downvote.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-slate-400 font-bold select-none">•</span>
              <span>Voting is reversible: clicking the same arrow a second time cancels your vote, and clicking the opposite arrow flips it.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-slate-400 font-bold select-none">•</span>
              <span>Net vote scores determine which answers appear first.</span>
            </li>
          </ul>
        </section>

        <hr className="border-slate-200" />

        {/* Section 4 */}
        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-3">
            4. Reputation & Contributor Tiers
          </h2>
          <ul className="space-y-2 text-slate-700 pl-1">
            <li className="flex items-start gap-2">
              <span className="text-slate-400 font-bold select-none">•</span>
              <span>Your reputation score reflects the community's trust in your answers and helpful contributions.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-slate-400 font-bold select-none">•</span>
              <span><span className="font-semibold text-slate-900">Bronze Contributor:</span> 0 – 499 reputation points.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-slate-400 font-bold select-none">•</span>
              <span><span className="font-semibold text-slate-900">Silver Contributor:</span> 500 – 999 reputation points.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-slate-400 font-bold select-none">•</span>
              <span><span className="font-semibold text-slate-900">Gold Contributor:</span> 1,000 – 1,999 reputation points.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-slate-400 font-bold select-none">•</span>
              <span><span className="font-semibold text-slate-900">Diamond Contributor:</span> 2,000+ reputation points.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-slate-400 font-bold select-none">•</span>
              <span>The top 10 contributors are featured on the public Community Leaderboard.</span>
            </li>
          </ul>
        </section>

        <hr className="border-slate-200" />

        {/* Section 5 */}
        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-3">
            5. Automated Milestone Badges
          </h2>
          <ul className="space-y-2 text-slate-700 pl-1">
            <li className="flex items-start gap-2">
              <span className="text-slate-400 font-bold select-none">•</span>
              <span><span className="font-semibold text-slate-900">First Inquirer:</span> Awarded automatically when you post your first question.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-slate-400 font-bold select-none">•</span>
              <span><span className="font-semibold text-slate-900">Problem Solver:</span> Awarded when your first answer is verified and accepted.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-slate-400 font-bold select-none">•</span>
              <span><span className="font-semibold text-slate-900">Popular Contributor:</span> Awarded as your answers gain upvotes across the platform.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-slate-400 font-bold select-none">•</span>
              <span>Earned badges are displayed directly on your public profile.</span>
            </li>
          </ul>
        </section>

        <hr className="border-slate-200" />

        {/* Section 6 */}
        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-3">
            6. Command Palette (Ctrl + K / ⌘K)
          </h2>
          <ul className="space-y-2 text-slate-700 pl-1">
            <li className="flex items-start gap-2">
              <span className="text-slate-400 font-bold select-none">•</span>
              <span>Press <kbd className="font-mono text-xs px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300">⌘K</kbd> on Mac or <kbd className="font-mono text-xs px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300">Ctrl+K</kbd> on Windows/Linux from any page.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-slate-400 font-bold select-none">•</span>
              <span>Quickly search questions, tags, and users without navigating away from what you are doing.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-slate-400 font-bold select-none">•</span>
              <span>Your recent searches are saved locally for one-click access.</span>
            </li>
          </ul>
        </section>

        <hr className="border-slate-200" />

        {/* Section 7 */}
        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-3">
            7. Bookmarks & Watched Tags
          </h2>
          <ul className="space-y-2 text-slate-700 pl-1">
            <li className="flex items-start gap-2">
              <span className="text-slate-400 font-bold select-none">•</span>
              <span>Bookmark helpful questions with one click to save them to your private library.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-slate-400 font-bold select-none">•</span>
              <span>Access your saved items anytime through the <span className="font-semibold text-slate-900">Bookmarks</span> link in the sidebar.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-slate-400 font-bold select-none">•</span>
              <span>Follow specific tags to quickly filter your feed for topics that interest you.</span>
            </li>
          </ul>
        </section>

        <hr className="border-slate-200" />

        {/* Section 8 */}
        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-3">
            8. Authentication & Security
          </h2>
          <ul className="space-y-2 text-slate-700 pl-1">
            <li className="flex items-start gap-2">
              <span className="text-slate-400 font-bold select-none">•</span>
              <span>Sign in with your Email and Password, or with one-click Google Sign-In.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-slate-400 font-bold select-none">•</span>
              <span>Verify your email using a secure 6-digit One-Time Password (OTP).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-slate-400 font-bold select-none">•</span>
              <span>Google users can configure a direct password in Account Settings to allow signing in either way.</span>
            </li>
          </ul>
        </section>

        <hr className="border-slate-200" />

        {/* FAQ Line by line */}
        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-4">
            Common Questions
          </h2>
          <div className="space-y-4 pl-1">
            <div>
              <p className="font-semibold text-slate-900">How do I earn reputation?</p>
              <p className="text-slate-600 mt-1">You earn +10 points for each upvote received, +15 points when your answer is accepted as the solution, and +2 points for accepting an answer on your question.</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900">Who can mark an answer as accepted?</p>
              <p className="text-slate-600 mt-1">Only the original author who posted the question has the ability to verify an answer.</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900">Can I change my vote later?</p>
              <p className="text-slate-600 mt-1">Yes, clicking your vote button a second time removes your vote. Clicking the other direction switches it immediately.</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900">How do I access the search command palette?</p>
              <p className="text-slate-600 mt-1">Press Ctrl+K (or ⌘K on a Mac) at any time, or click the search bar at the top of the screen.</p>
            </div>
          </div>
        </section>

        <hr className="border-slate-200" />

        {/* Simple actions */}
        <div className="pt-2 flex items-center gap-4">
          <button
            onClick={() => onNavigate('ask')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <span>Ask a Question</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onNavigate('feed')}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            Browse Feed
          </button>
        </div>
      </div>
    </div>
  );
}
