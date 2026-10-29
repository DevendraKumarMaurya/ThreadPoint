import React from 'react';
import { CheckCircle2, ShieldCheck, Zap, Award } from 'lucide-react';
import Logo from '../common/Logo';

export default function AuthFeatureShowcase({
  badgeSubtitle = 'Engineering Knowledge',
  title = 'Sign in to peer-reviewed technical insights.',
  subtitle = 'Engage with verified PostgreSQL benchmarks, full-text GIN search indexes, and community accepted solutions.',
  items,
}) {
  const defaultItems = [
    {
      icon: CheckCircle2,
      iconColor: 'text-emerald-400',
      badgeBg: 'bg-indigo-500/20 border-indigo-400/30',
      title: 'Verified Solutions Only',
      desc: 'Author-verified solutions with atomic concurrency guarantees.',
    },
    {
      icon: ShieldCheck,
      iconColor: 'text-indigo-400',
      badgeBg: 'bg-indigo-500/20 border-indigo-400/30',
      title: 'Transparent Reputation',
      desc: 'Earn score through community upvotes, accepted answers, and peer review.',
    },
    {
      icon: Zap,
      iconColor: 'text-amber-400',
      badgeBg: 'bg-indigo-500/20 border-indigo-400/30',
      title: 'Instant Demo Switching',
      desc: 'Test roles and multi-user interactions seamlessly with 1-click persona switching.',
    },
  ];

  const displayItems = items || defaultItems;

  return (
    <div className="lg:col-span-5 bg-gradient-to-br from-[#0F172A] via-[#1E1B4B] to-[#312E81] text-white p-6 sm:p-8 md:p-10 flex flex-col justify-between relative overflow-hidden">
      {/* Ambient light glow */}
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none"></div>

      <div>
        {/* Brand Logo */}
        <div className="flex items-center gap-3 mb-6 sm:mb-8">
          <Logo
            size={40}
            withText
            dark
            subtitle={badgeSubtitle}
            textClassName="text-xl"
            subtitleClassName="font-mono text-indigo-300"
          />
        </div>

        <h2 className="text-xl sm:text-2xl font-bold font-sans tracking-tight text-white leading-snug">
          {title}
        </h2>
        <p className="text-xs text-slate-300 mt-2.5 leading-relaxed font-sans">
          {subtitle}
        </p>

        {/* Platform Highlights */}
        <div className="mt-6 sm:mt-8 space-y-3.5">
          {displayItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="flex items-start gap-3">
                <div
                  className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 font-mono text-xs font-bold ${
                    item.badgeBg || 'bg-indigo-500/20 border-indigo-400/30'
                  } ${item.iconColor || 'text-emerald-400'}`}
                >
                  {item.customBadge ? item.customBadge : Icon ? <Icon className="w-4 h-4" /> : null}
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">{item.title}</h4>
                  <p className="text-[11px] text-slate-400 leading-normal">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-6 sm:pt-8 border-t border-slate-700/60 mt-6 text-[11px] font-mono text-slate-400 flex items-center justify-between">
        <span>PostgreSQL 16 Engine</span>
        <span>JWT & OAuth 2.0</span>
      </div>
    </div>
  );
}
