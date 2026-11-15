import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { MR } from '../../constants/marathi';
import { LogOut, User as UserIcon, Shield, Briefcase, UserCheck } from 'lucide-react';

export const Header: React.FC = () => {
  const { user, role, logout } = useAuth();

  const getRoleBadge = () => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            <Shield className="w-3.5 h-3.5" />
            {MR.roles.ADMIN}
          </span>
        );
      case 'CONTRACTOR':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            <Briefcase className="w-3.5 h-3.5" />
            {MR.roles.CONTRACTOR}
          </span>
        );
      case 'EMPLOYEE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <UserCheck className="w-3.5 h-3.5" />
            {MR.roles.EMPLOYEE}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            ह
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">
              {MR.appName}
            </h1>
            <p className="text-xs text-slate-500 hidden sm:block">
              {MR.appSubtitle}
            </p>
          </div>
        </div>

        {user && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="text-right hidden md:block">
                <div className="text-sm font-semibold text-slate-800 flex items-center gap-1.5 justify-end">
                  <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                  {user.username}
                </div>
                <div className="mt-0.5">{getRoleBadge()}</div>
              </div>
            </div>

            <button
              onClick={() => logout()}
              title={MR.landing.logoutButton}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-medium transition-colors"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-500" />
              <span>{MR.landing.logoutButton}</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
