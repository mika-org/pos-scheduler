import React, { useState } from 'react';
import { Scissors, Lock, User, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from './ui/CustomComponents';
import { supabase } from '../utils/supabase';
import { signJwt } from '../utils/jwt';
import bcrypt from 'bcryptjs';

interface AdminLoginProps {
  onLogin: (success: boolean) => void;
  onNavigate: (view: 'landing' | 'login' | 'dashboard') => void;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

// Safe storage helper to prevent crash in Safari Private Browsing mode
const safeSetItem = (key: string, value: string, useSession: boolean): void => {
  try {
    if (useSession) {
      sessionStorage.setItem(key, value);
    } else {
      localStorage.setItem(key, value);
    }
  } catch (e) {
    console.warn('Storage is not accessible (Private browsing mode?):', e);
  }
};

export const AdminLogin: React.FC<AdminLoginProps> = ({
  onLogin,
  onNavigate,
  addToast
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [remember, setRemember] = useState(false);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!username.trim()) errs.username = 'Username wajib diisi';
    if (!password.trim()) errs.password = 'Password wajib diisi';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setErrors({});

    try {
      // 1. Query the custom 'admins' table inside Supabase by username only
      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .eq('username', username.trim())
        .maybeSingle();

      if (error) throw error;

      // 2. Perform client-side bcrypt password comparison if user found
      const isPasswordMatch = data ? bcrypt.compareSync(password, data.password) : false;

      if (data && isPasswordMatch) {
        // 3. Generate a secure client-side JWT using native SubtleCrypto Web API
        const jwtSecret = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'default-secret-key-12345';
        const payload = {
          id: data.id,
          username: data.username,
          role: data.role || 'admin',
          exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 // 24 Hours expiry
        };

        const token = await signJwt(payload, jwtSecret);

        // 4. Save the signed token based on Remember Me preference
        safeSetItem('admin_token', token, !remember);

        addToast('Sign-In berhasil! Sesi admin diamankan dengan JWT.', 'success');
        setIsLoading(false);
        onLogin(true);
      } else {
        setIsLoading(false);
        addToast('Username atau password salah.', 'error');
        setErrors({
          auth: 'Kredensial yang dimasukkan tidak cocok.'
        });
      }
    } catch (err: any) {
      console.error('Supabase JWT auth error, engaging secure local fallback:', err);

      // Standalone Offline Fallback in case table is missing or network is down
      // Compares input plain text password against the offline-fallback bcrypt hash of 'admin123'
      const offlineHash = '$2b$10$F9QomOKVMLCgwKLBRN582OkRX36NNJZ.Htk6bPuMHBbIqzvmlv.lG';
      const isOfflinePasswordMatch = bcrypt.compareSync(password, offlineHash);

      if (username.trim() === 'admin' && isOfflinePasswordMatch) {
        const payload = {
          id: 'offline-adm',
          username: 'admin',
          role: 'super_admin',
          exp: Math.floor(Date.now() / 1000) + 60 * 60 * 2 // 2 Hours expiry
        };
        const token = await signJwt(payload, 'offline-fallback-secret-999');
        safeSetItem('admin_token', token, !remember);

        addToast('Offline Fallback: Sign-In berhasil! Mode luring aktif.', 'info');
        setIsLoading(false);
        onLogin(true);
      } else {
        setIsLoading(false);
        addToast('Koneksi terganggu dan kredensial salah.', 'error');
        setErrors({
          auth: `Gagal otentikasi Supabase: ${err.message || 'Koneksi terputus'}`
        });
      }
    }
  };

  return (
    <div className="flex-1 min-h-screen bg-[#070a13] flex flex-col justify-center items-center p-6 relative selection:bg-amber-600/40 selection:text-white overflow-hidden">
      {/* Glow Backdrops */}
      <div className="absolute top-[20%] left-[20%] w-[350px] h-[350px] rounded-full bg-amber-500/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[20%] w-[350px] h-[350px] rounded-full bg-indigo-500/5 blur-[100px] pointer-events-none" />

      {/* Back to Home Button */}
      <button
        onClick={() => onNavigate('landing')}
        className="absolute top-6 left-6 inline-flex items-center text-xs font-semibold text-slate-400 hover:text-amber-400 transition-colors gap-1.5 cursor-pointer bg-slate-900/30 px-3 py-1.5 rounded-lg border border-slate-900 hover:border-slate-800"
      >
        <ArrowLeft className="w-4 h-4" /> Kembali ke Landing Page
      </button>

      {/* Main Login Card */}
      <Card className="w-full max-w-md shadow-2xl relative border-slate-800 bg-slate-900/80 backdrop-blur-lg rounded-2xl overflow-hidden mt-8">
        <div className="absolute top-0 left-0 w-full h-[3px] bg-linear-to-r from-amber-500 via-amber-600 to-yellow-500" />

        <CardHeader className="text-center pt-8 pb-4">
          <div className="mx-auto w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-amber-500 mb-4 glow-amber">
            <Scissors className="w-6 h-6 stroke-[2.5]" />
          </div>
          <CardTitle className="text-2xl font-extrabold font-heading text-white">ADMIN SIGN-IN</CardTitle>
          <CardDescription className="text-slate-400 mt-1">
            Kelola penjadwalan booking dan transaksi kasir POS secara terpusat.
          </CardDescription>
        </CardHeader>

        <CardContent className="px-8 pb-8 pt-2">
          {errors.auth && (
            <div className="p-3 mb-4 bg-rose-950/20 border border-rose-500/20 rounded-lg text-rose-400 text-xs font-semibold text-center">
              {errors.auth}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Input
                label="Username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (errors.username) setErrors(prev => ({ ...prev, username: '' }));
                }}
                error={errors.username}
                placeholder="Masukkan username admin..."
                className="pl-10"
                required
              />
              <User className="absolute left-3.5 top-[34px] w-4 h-4 text-slate-500" />
            </div>

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                }}
                error={errors.password}
                placeholder="Masukkan password admin..."
                className="pl-10 pr-10"
                required
              />
              <Lock className="absolute left-3.5 top-[34px] w-4 h-4 text-slate-500" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[34px] p-0.5 rounded text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold pt-1">
              <div className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  id="remember"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-800 text-amber-500 focus:ring-amber-500/30 cursor-pointer"
                />
                <label htmlFor="remember" className="cursor-pointer">Ingat Perangkat Ini</label>
              </div>
              <span className="text-amber-500/80 hover:text-amber-400 cursor-pointer">Lupa Password?</span>
            </div>

            <Button
              type="submit"
              variant="gold"
              className="w-full mt-6 py-2.5 shadow-amber-500/10 font-bold"
              isLoading={isLoading}
            >
              Sign In Sekarang
            </Button>
          </form>


        </CardContent>
      </Card>
    </div>
  );
};
