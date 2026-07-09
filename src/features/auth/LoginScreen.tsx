import { useState, type FormEvent } from 'react';
import { supabase } from '../../data/supabaseClient';
import { Button } from '../../components/Button';

type Mode = 'sign-in' | 'sign-up';

export function LoginScreen() {
  const [mode, setMode] = useState<Mode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [signedUpMessage, setSignedUpMessage] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSignedUpMessage('');
    setSubmitting(true);
    try {
      if (mode === 'sign-in') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSignedUpMessage("Account created - you're signed in. Redirecting…");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-full max-w-sm flex-col justify-center gap-6 px-4">
      <div>
        <h1 className="text-xl font-semibold text-white">Workout Builder</h1>
        <p className="mt-1 text-sm text-slate-400">
          {mode === 'sign-in'
            ? 'Sign in to your account.'
            : "Create your account - this is a personal app, so it's just for you."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm text-slate-300">
          Email
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-white"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-300">
          Password
          <input
            type="password"
            required
            minLength={6}
            autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-white"
          />
        </label>

        {error && <p className="text-sm text-red-400">{error}</p>}
        {signedUpMessage && <p className="text-sm text-emerald-400">{signedUpMessage}</p>}

        <Button type="submit" disabled={submitting}>
          {submitting ? 'Please wait…' : mode === 'sign-in' ? 'Sign in' : 'Sign up'}
        </Button>
      </form>

      <button
        onClick={() => {
          setMode((m) => (m === 'sign-in' ? 'sign-up' : 'sign-in'));
          setError('');
          setSignedUpMessage('');
        }}
        className="text-center text-sm text-slate-500 underline underline-offset-2"
      >
        {mode === 'sign-in' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
      </button>
    </div>
  );
}
