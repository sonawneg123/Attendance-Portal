import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Header } from '../components/common/Header';
import { Card } from '../components/common/Card';
import { Alert } from '../components/common/Alert';
import { MR } from '../constants/marathi';
import { Shield, Database, Lock, CheckCircle2 } from 'lucide-react';

export const AdminLandingPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-rose-600" />
                <h2 className="text-xl font-bold text-slate-900">
                  {MR.roles.ADMIN}
                </h2>
              </div>
              <p className="text-sm text-slate-600 mt-1">
                {MR.landing.welcome}, {user?.username}! {MR.landing.sessionActive}
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>सुरक्षित सत्र सक्रिय</span>
            </div>
          </div>
        </div>

        <Alert
          type="info"
          title={MR.landing.sprintNoticeTitle}
          message={MR.landing.sprintNoticeBody}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card
            title="प्रमाणीकरण माहिती (Auth Profile)"
            subtitle="सर्व्हर-साइड प्रमाणीकरण तपशील"
          >
            <dl className="divide-y divide-slate-100 text-sm">
              <div className="py-2.5 flex justify-between">
                <dt className="text-slate-500">{MR.landing.userIdLabel}</dt>
                <dd className="font-mono text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                  {user?.id}
                </dd>
              </div>
              <div className="py-2.5 flex justify-between">
                <dt className="text-slate-500">वापरकर्तानाव:</dt>
                <dd className="font-semibold text-slate-800">{user?.username}</dd>
              </div>
              <div className="py-2.5 flex justify-between">
                <dt className="text-slate-500">{MR.landing.roleLabel}</dt>
                <dd className="font-semibold text-rose-600">{user?.role}</dd>
              </div>
            </dl>
          </Card>

          <Card
            title="स्प्रिंट १ सुरक्षा स्थिती (Security Status)"
            subtitle="सक्रिय सुरक्षा धोरणे"
          >
            <ul className="space-y-2.5 text-xs text-slate-700">
              <li className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>केवळ वापरकर्तानाव-पासवर्ड आधारित सुरक्षित लॉगिन (नो-ईमेल)</span>
              </li>
              <li className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>डेटाबेस पातळीवर सिंगल ॲडमिन प्रतिबंध (Singleton Guard)</span>
              </li>
              <li className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>PostgreSQL Row Level Security (RLS) सक्रिय</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>ऑडिट लॉगिंग आणि सुरक्षित नोंदणी कोड प्रणाली</span>
              </li>
            </ul>
          </Card>
        </div>
      </main>
    </div>
  );
};
