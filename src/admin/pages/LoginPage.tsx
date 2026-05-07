import { useState } from 'react';
import { AdminButton, AdminCard, AdminInput } from '../components/primitives';
import type { AdminRepository } from '../repositories';

export function LoginPage({ navigate, repository }: { navigate: (path: string) => void; repository: AdminRepository }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [signingIn, setSigningIn] = useState(false);

  async function submit() {
    try {
      setSigningIn(true);
      setError('');
      // TODO: Replace this temporary browser auth path with protected server/API admin auth.
      await repository.authenticateAdmin({ email, password });
      navigate('/admin');
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'Could not sign in.');
    } finally {
      setSigningIn(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-[#fbfbfc] px-5 py-10 text-slate-950">
      <AdminCard className="w-full max-w-md p-8">
        <img src="/spelio-logo.svg" alt="Spelio" className="mb-8 h-auto w-32" />
        <h1 className="text-2xl font-black tracking-[-0.03em]">Admin</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">Founder-only access for managing Welsh spelling content.</p>
        <div className="mt-7 grid gap-3">
          {repository.authMode === 'emailPassword' && (
            <AdminInput type="email" value={email} placeholder="Email" onChange={event => setEmail(event.target.value)} />
          )}
          <AdminInput type="password" value={password} placeholder="Password" onChange={event => setPassword(event.target.value)} onKeyDown={event => event.key === 'Enter' && submit()} />
          {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</div>}
          <AdminButton variant="primary" className="w-full" onClick={submit} disabled={signingIn}>{signingIn ? 'Signing in...' : 'Sign in'}</AdminButton>
        </div>
      </AdminCard>
    </div>
  );
}
