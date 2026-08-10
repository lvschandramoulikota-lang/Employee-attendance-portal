import React, { useState } from 'react';
import { UserCheck, ArrowRight, AlertCircle, Loader2, Shield } from 'lucide-react';
import { loginEmployee } from '../../lib/api';
import { Employee } from '../../types';

interface EmployeeLoginProps {
  onLoginSuccess: (user: Employee) => void;
  onSwitchToAdmin: () => void;
}

export const EmployeeLogin: React.FC<EmployeeLoginProps> = ({ onLoginSuccess, onSwitchToAdmin }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!identifier || !password) {
      setError('Please enter your Employee ID or Work Email and Password.');
      return;
    }

    setLoading(true);
    try {
      const res = await loginEmployee(identifier, password);
      onLoginSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Invalid Employee ID or Password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-indigo-50/30 to-slate-200 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-2xl shadow-indigo-950/5 space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-3">
          <div className="inline-flex p-3 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-600">
            <UserCheck className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Employee Portal Access</h1>
            <p className="text-xs text-slate-500 mt-1">Sign in to punch in, record breaks, and view shift history.</p>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Employee ID or Work Email
            </label>
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="e.g. EMP101 or john.doe@enterprise.com"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-300 text-slate-900 font-medium placeholder-slate-400 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition shadow-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-300 text-slate-900 font-medium placeholder-slate-400 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition shadow-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Sign In to Employee Portal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={onSwitchToAdmin}
            className="text-xs text-indigo-600 hover:text-indigo-800 transition font-semibold underline"
          >
            Switch to Admin Management Portal
          </button>
          <div className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span>Protected by Enterprise GPS Geofencing & Biometric Selfie Verification</span>
          </div>
        </div>
      </div>
    </div>
  );
};
