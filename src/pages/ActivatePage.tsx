import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { MR } from '../constants/marathi';
import { Card } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { Alert } from '../components/common/Alert';
import { KeyRound, CheckCircle } from 'lucide-react';

export const ActivatePage: React.FC = () => {
  const [code, setCode] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { activate } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanCode = code.trim().toUpperCase();
    const cleanUsername = username.trim().toLowerCase();

    if (!cleanCode) {
      setError(MR.errors.codeRequired);
      return;
    }

    if (!cleanUsername) {
      setError(MR.errors.emptyFields);
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9_-]{3,50}$/;
    if (!usernameRegex.test(cleanUsername)) {
      setError(MR.errors.invalidUsername);
      return;
    }

    if (password.length < 8) {
      setError(MR.errors.passwordTooShort);
      return;
    }

    if (password !== confirmPassword) {
      setError(MR.errors.passwordMismatch);
      return;
    }

    setIsSubmitting(true);
    try {
      await activate({
        registration_code: cleanCode,
        username: cleanUsername,
        password,
        password_confirmation: confirmPassword,
        full_name: fullName.trim() || undefined,
        company_name: companyName.trim() || undefined,
      });

      setIsSuccess(true);
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 3000);
    } catch (err: any) {
      setError(err?.message || MR.errors.genericError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-10 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-600 text-white shadow mb-3">
          <KeyRound className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">{MR.appName}</h1>
        <p className="text-sm text-slate-600 mt-0.5">{MR.activation.title}</p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Card
          title={MR.activation.title}
          subtitle={MR.activation.subtitle}
        >
          {isSuccess ? (
            <div className="text-center py-6 space-y-4">
              <CheckCircle className="w-14 h-14 text-emerald-500 mx-auto" />
              <h3 className="text-lg font-bold text-slate-900">
                {MR.activation.successTitle}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {MR.activation.successMessage}
              </p>
              <div className="pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-emerald-600 hover:bg-emerald-700"
                >
                  {MR.activation.loginLink}
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <Alert type="error" message={error} />}

              <Input
                label={MR.activation.codeLabel}
                placeholder={MR.activation.codePlaceholder}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={isSubmitting}
                required
              />

              <Input
                label={MR.activation.usernameLabel}
                placeholder={MR.activation.usernamePlaceholder}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isSubmitting}
                required
              />

              <Input
                label={MR.activation.passwordLabel}
                placeholder={MR.activation.passwordPlaceholder}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                required
              />

              <Input
                label={MR.activation.confirmPasswordLabel}
                placeholder={MR.activation.confirmPasswordPlaceholder}
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isSubmitting}
                required
              />

              <Input
                label={MR.activation.fullNameLabel}
                placeholder={MR.activation.fullNamePlaceholder}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={isSubmitting}
              />

              <Input
                label={MR.activation.companyNameLabel}
                placeholder={MR.activation.companyNamePlaceholder}
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                disabled={isSubmitting}
                helperText="कंत्राटदार नोंदणीसाठी लागू (फक्त कंत्राटदार कोड असल्यास)"
              />

              <Button
                type="submit"
                variant="primary"
                className="w-full py-2.5 mt-2"
                isLoading={isSubmitting}
              >
                {isSubmitting ? MR.activation.submitting : MR.activation.submitButton}
              </Button>
            </form>
          )}

          {!isSuccess && (
            <div className="mt-5 pt-4 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-600">
                {MR.activation.alreadyActivatedPrompt}{' '}
                <Link
                  to="/login"
                  className="font-medium text-emerald-600 hover:text-emerald-700 underline"
                >
                  {MR.activation.loginLink}
                </Link>
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
