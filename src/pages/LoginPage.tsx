import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { MR } from '../constants/marathi';
import { Card } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { Alert } from '../components/common/Alert';
import { Lock, ShieldCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername || !password) {
      setError(MR.errors.emptyFields);
      return;
    }

    setIsSubmitting(true);
    try {
      const authenticatedUser = await login(cleanUsername, password);
      // Route dynamically to role landing view
      if (authenticatedUser.role === 'ADMIN') {
        navigate('/admin', { replace: true });
      } else if (authenticatedUser.role === 'CONTRACTOR') {
        navigate('/contractor', { replace: true });
      } else if (authenticatedUser.role === 'EMPLOYEE') {
        navigate('/employee', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err: any) {
      setError(err?.message || MR.errors.invalidCredentials);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-600 text-white shadow-md mb-3">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          {MR.appName}
        </h1>
        <p className="text-sm text-slate-600 mt-1">{MR.appSubtitle}</p>
        <span className="inline-block mt-2 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-slate-200 text-slate-700">
          {MR.portalVersion}
        </span>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Card
          title={MR.login.title}
          subtitle={MR.login.subtitle}
          footer={
            <div className="text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>{MR.login.securityNotice}</span>
            </div>
          }
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert
                type="error"
                message={error}
              />
            )}

            <div>
              <Input
                label={MR.login.usernameLabel}
                placeholder={MR.login.usernamePlaceholder}
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>

            <div>
              <Input
                label={MR.login.passwordLabel}
                placeholder={MR.login.passwordPlaceholder}
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full py-2.5"
              isLoading={isSubmitting}
            >
              {isSubmitting ? MR.login.submitting : MR.login.submitButton}
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-600">
              {MR.login.activatePrompt}{' '}
              <Link
                to="/activate"
                className="font-medium text-emerald-600 hover:text-emerald-700 underline"
              >
                {MR.login.activateLink}
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};
