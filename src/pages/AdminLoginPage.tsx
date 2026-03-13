import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export default function AdminLoginPage() {
  const { user, isAdmin, loading, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user && isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast({ title: 'Preencha todos os campos', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    const { error } = await signIn(email.trim(), password.trim());
    setSubmitting(false);
    if (error) {
      toast({ title: 'Credenciais inválidas', description: error, variant: 'destructive' });
    }
    // If sign-in succeeds, onAuthStateChange will update user/isAdmin and trigger the redirect above
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="glass-card rounded-2xl p-8 space-y-6">
          <div className="text-center">
            <div className="mx-auto h-14 w-14 rounded-xl gold-gradient flex items-center justify-center mb-4">
              <Lock className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="font-serif text-xl font-bold text-foreground">Painel Admin</h1>
            <p className="text-sm text-muted-foreground mt-1">Faça login para acessar</p>
          </div>

          {user && !isAdmin && (
            <div className="text-center p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive">Sua conta não tem permissão de administrador.</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="mt-1"
                autoComplete="email"
              />
            </div>
            <div>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1"
                autoComplete="current-password"
              />
            </div>
            <Button
              type="submit"
              disabled={submitting}
              className="w-full gold-gradient text-primary-foreground font-bold py-5 rounded-xl"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Entrar
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
