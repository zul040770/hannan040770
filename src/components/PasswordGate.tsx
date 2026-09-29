import { useState, useEffect, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  pageTitle: string;
}

const DEFAULT_PASSWORD = 'gaji2024';

export default function PasswordGate({ children, pageTitle }: Props) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    const sessionKey = sessionStorage.getItem('payroll_unlocked');
    if (sessionKey === 'true') {
      setIsUnlocked(true);
    }
  }, []);

  const getStoredPassword = () => {
    return localStorage.getItem('payroll_password') || DEFAULT_PASSWORD;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPassword = getStoredPassword();
    if (password === correctPassword) {
      setIsUnlocked(true);
      sessionStorage.setItem('payroll_unlocked', 'true');
      setError('');
      setAttempts(0);
    } else {
      setAttempts(attempts + 1);
      setError(`Password salah! Percobaan ke-${attempts + 1}`);
      setPassword('');
    }
  };

  if (isUnlocked) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fa-solid fa-lock text-white text-3xl"></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">{pageTitle}</h2>
          <p className="text-gray-500 text-sm mt-2">Menu ini dilindungi. Masukkan password untuk mengakses.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Masukkan password"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2 flex items-center gap-2">
              <i className="fa-solid fa-circle-exclamation"></i>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition"
          >
            <i className="fa-solid fa-unlock mr-2"></i>
            Buka Akses
          </button>
        </form>

        <div className="mt-6 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs text-amber-700">
            <i className="fa-solid fa-circle-info mr-1"></i>
            <strong>Default Password:</strong> <code className="bg-amber-100 px-1 rounded">gaji2024</code>
          </p>
        </div>
      </div>
    </div>
  );
}
