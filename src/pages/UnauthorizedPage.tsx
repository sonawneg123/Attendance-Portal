import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { MR } from '../constants/marathi';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';
import { Button } from '../components/common/Button';

export const UnauthorizedPage: React.FC = () => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  const handleGoHome = () => {
    if (role === 'ADMIN') navigate('/admin');
    else if (role === 'CONTRACTOR') navigate('/contractor');
    else if (role === 'EMPLOYEE') navigate('/employee');
    else navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center space-y-6">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold text-slate-900">
            {MR.unauthorized.title}
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            {MR.unauthorized.message}
          </p>
          {user && (
            <p className="text-xs text-slate-500 font-mono pt-1">
              लॉगिन: {user.username} | भूमिका: {user.role}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleGoHome}
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            {MR.unauthorized.backToHome}
          </Button>

          <Button
            variant="danger"
            className="flex-1"
            onClick={() => logout()}
          >
            <LogOut className="w-4 h-4 mr-1.5" />
            {MR.unauthorized.logout}
          </Button>
        </div>
      </div>
    </div>
  );
};
