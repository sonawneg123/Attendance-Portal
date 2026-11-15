import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Header } from '../components/common/Header';
import { Card } from '../components/common/Card';
import { Alert } from '../components/common/Alert';
import { MR } from '../constants/marathi';
import { UserCheck, Clock, CheckCircle2, Shield } from 'lucide-react';

export const EmployeeLandingPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <UserCheck className="w-6 h-6 text-emerald-600" />
                <h2 className="text-xl font-bold text-slate-900">
                  {MR.roles.EMPLOYEE}
                </h2>
              </div>
              <p className="text-sm text-slate-600 mt-1">
                {MR.landing.welcome}, {user?.username}! {MR.landing.sessionActive}
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>कर्मचारी खाते सक्रिय</span>
            </div>
          </div>
        </div>

        <Alert
          type="info"
          title="स्प्रिंट १ कर्मचारी सुरक्षा स्थिती"
          message="कर्मचारी प्रमाणीकरण यशस्वी झाले आहे. RLS नियमांनुसार तुम्ही फक्त तुमची स्वतःची माहिती पाहू शकता. उपस्थिती (IN/OUT) आणि वेतन वैशिष्ट्ये पुढील स्प्रिंटमध्ये सुरू होतील."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card
            title="कर्मचारी माहिती (Employee Profile)"
            subtitle="लॉगिन व सुरक्षा तपशील"
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
                <dd className="font-semibold text-emerald-600">{user?.role}</dd>
              </div>
            </dl>
          </Card>

          <Card
            title="सुरक्षितता व गोपनीयता (Privacy & Access)"
            subtitle="PostgreSQL RLS मर्यादा"
          >
            <div className="space-y-3 text-xs text-slate-600">
              <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50">
                <Shield className="w-4 h-4 text-emerald-600 mt-0.5" />
                <div>
                  <div className="font-semibold text-slate-800">डेटा गोपनीयता (Data Privacy)</div>
                  <div>इतर कर्मचाऱ्यांचे किंवा कंत्राटदाराचे खाजगी रेकॉर्ड पाहण्यास RLS द्वारे सक्त मनाई आहे.</div>
                </div>
              </div>
              <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50">
                <Clock className="w-4 h-4 text-emerald-600 mt-0.5" />
                <div>
                  <div className="font-semibold text-slate-800">उपस्थिती नोंदणी (Attendance IN/OUT)</div>
                  <div>उपस्थिती नोंदणी प्रणाली पुढील टप्प्यात उपलब्ध केली जाईल.</div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};
