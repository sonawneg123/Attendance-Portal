import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Header } from '../components/common/Header';
import { Card } from '../components/common/Card';
import { Alert } from '../components/common/Alert';
import { MR } from '../constants/marathi';
import { Briefcase, Building, Users, CheckCircle2 } from 'lucide-react';

export const ContractorLandingPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Briefcase className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-bold text-slate-900">
                  {MR.roles.CONTRACTOR}
                </h2>
              </div>
              <p className="text-sm text-slate-600 mt-1">
                {MR.landing.welcome}, {user?.username}! {MR.landing.sessionActive}
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>कंत्राटदार खाते सक्रिय</span>
            </div>
          </div>
        </div>

        <Alert
          type="info"
          title="स्प्रिंट १ पायाभूत स्थिती"
          message="कंत्राटदार प्रमाणीकरण आणि टेनंट सुरक्षा पृथक्करण (Tenant Isolation) यशस्वीरित्या सक्रिय झाले आहे. दुकान आणि कर्मचारी व्यवस्थापन स्प्रिंट २ मध्ये उपलब्ध होईल."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card
            title="कंत्राटदार माहिती (Contractor Profile)"
            subtitle="लॉगिन व भूमिका तपशील"
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
                <dd className="font-semibold text-blue-600">{user?.role}</dd>
              </div>
            </dl>
          </Card>

          <Card
            title="पुढील वैशिष्ट्ये (Sprint 2 Preview)"
            subtitle="स्प्रिंट २ मध्ये उपलब्ध होणारी कार्यप्रणाली"
          >
            <div className="space-y-3 text-xs text-slate-600">
              <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50">
                <Building className="w-4 h-4 text-blue-600 mt-0.5" />
                <div>
                  <div className="font-semibold text-slate-800">दुकान व्यवस्थापन (Shop Management)</div>
                  <div>तुमच्या अखत्यारीतील दुकाने/शाखा जोडणे व नियंत्रित करणे.</div>
                </div>
              </div>
              <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50">
                <Users className="w-4 h-4 text-blue-600 mt-0.5" />
                <div>
                  <div className="font-semibold text-slate-800">कर्मचारी नोंदणी कोड निर्मिती</div>
                  <div>कर्मचाऱ्यांसाठी एकवेळचे सुरक्षित नोंदणी कोड निर्माण करणे.</div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};
