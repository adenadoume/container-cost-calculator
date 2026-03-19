import { useState } from 'react';
import { Sigma, LogIn, AlertTriangle } from 'lucide-react';

interface Props {
  onSignIn: (email: string, password: string) => Promise<string | null>;
  onSignUp: (email: string, password: string) => Promise<string | null>;
  unconfigured?: boolean;
}

export function LoginScreen({ onSignIn, unconfigured }: Props) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState<string | null>(null);
  const [busy, setBusy]         = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const err = await onSignIn(email, password);
    if (err) setError(err);
    setBusy(false);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo / title */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="rounded-2xl bg-gradient-to-br from-[#1e40af]/50 to-[#0ea5e9]/20 border border-[#2563eb]/30 p-5 shadow-xl">
            <Sigma className="h-10 w-10 text-[#60a5fa]" strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Landed Cost Calculator</h1>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-[#374151] bg-[#1f2937] p-6 shadow-2xl">

          {unconfigured && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-300">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-yellow-400" />
              <span>Auth not configured. Add <code className="font-mono">VITE_SUPABASE_URL</code> and <code className="font-mono">VITE_SUPABASE_ANON_KEY</code> to Vercel environment variables.</span>
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#9ca3af]">Email</label>
              <input
                type="email" required autoFocus
                value={email} onChange={e => setEmail(e.target.value)}
                className="w-full rounded-lg border border-[#374151] bg-[#111827] px-3 py-2 text-white placeholder-[#4b5563]
                  focus:border-[#60a5fa] focus:outline-none focus:ring-2 focus:ring-[#60a5fa]/30"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#9ca3af]">Password</label>
              <input
                type="password" required
                value={password} onChange={e => setPassword(e.target.value)}
                className="w-full rounded-lg border border-[#374151] bg-[#111827] px-3 py-2 text-white placeholder-[#4b5563]
                  focus:border-[#60a5fa] focus:outline-none focus:ring-2 focus:ring-[#60a5fa]/30"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
                {error}
              </div>
            )}

            <button
              type="submit" disabled={busy}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#2563eb] hover:bg-[#3b82f6]
                px-4 py-2.5 font-semibold text-white transition-colors disabled:opacity-60"
            >
              <LogIn className="h-4 w-4" />
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
