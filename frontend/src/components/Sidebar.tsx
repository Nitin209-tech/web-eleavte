'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useApp } from './AppContext';
import { Home, LayoutDashboard, Key, ShoppingBag, Trophy, Users, HelpCircle, Shield, FileText, Lock } from 'lucide-react';
import Link from 'next/link';

function Sidebar() {
  const pathname = usePathname();
  const { user } = useApp();

  const links = [
    { name: 'Core Portal', path: '/', icon: Home },
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Redeem Terminal', path: '/redeem', icon: Key },
    { name: 'Rewards Catalog', path: '/rewards', icon: ShoppingBag },
    { name: 'Advocate Ranks', path: '/leaderboards', icon: Trophy },
    { name: 'Community Hub', path: '/community', icon: Users },
    { name: 'Support Node', path: '/support', icon: HelpCircle }
  ];

  const adminLinks = [
    { name: 'Admin Root', path: '/admin', icon: Shield }
  ];

  const legalLinks = [
    { name: 'Terms of Protocol', path: '/terms', icon: FileText },
    { name: 'Privacy Directives', path: '/privacy', icon: Lock }
  ];

  return (
    <aside className="w-full md:w-64 border-r border-cyber-cyan/15 bg-cyber-black/85 flex flex-col justify-between shrink-0 min-h-[calc(100vh-73px)]">
      {/* Links mapping */}
      <div className="p-4 space-y-6">
        
        {/* Navigation Section */}
        <div className="space-y-1">
          <span className="text-[10px] font-mono text-cyber-light-gray/40 tracking-widest uppercase px-3 block mb-2">
            TELEMETRY NODES
          </span>
          {links.map((link) => {
            const Icon = link.icon;
            const active = pathname === link.path;
            return (
              <Link
                key={link.path}
                href={link.path}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded font-rajdhani text-sm font-bold tracking-wider transition ${
                  active 
                    ? 'bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan text-neon-cyan' 
                    : 'text-cyber-light-gray hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <Icon size={16} />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </div>

        {/* Administration secured section */}
        {user && (user.role === 'ADMIN' || user.role === 'MODERATOR') && (
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-cyber-pink/50 tracking-widest uppercase px-3 block mb-2">
              ADMIN CONTROL ROOM
            </span>
            {adminLinks.map((link) => {
              const Icon = link.icon;
              const active = pathname === link.path;
              return (
                <Link
                  key={link.path}
                  href={link.path}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded font-rajdhani text-sm font-bold tracking-wider transition ${
                    active 
                      ? 'bg-cyber-pink/10 border border-cyber-pink/30 text-cyber-pink' 
                      : 'text-cyber-light-gray hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <Icon size={16} />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </div>
        )}

      </div>

      {/* Policies bottom section */}
      <div className="p-4 border-t border-cyber-cyan/10 space-y-1 font-mono text-xs">
        {legalLinks.map((link) => {
          const Icon = link.icon;
          const active = pathname === link.path;
          return (
            <Link
              key={link.path}
              href={link.path}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded transition ${
                active ? 'text-cyber-cyan' : 'text-cyber-light-gray/60 hover:text-white'
              }`}
            >
              <Icon size={12} />
              <span className="text-[10px]">{link.name}</span>
            </Link>
          );
        })}
      </div>

    </aside>
  );
}

export default React.memo(Sidebar);
