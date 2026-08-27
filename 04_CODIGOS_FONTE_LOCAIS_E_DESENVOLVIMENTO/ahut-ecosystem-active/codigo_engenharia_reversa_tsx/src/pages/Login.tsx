import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { LanguagePrompt } from '../contexts/LanguagePrompt';

export default function Login() {
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleRedirectByRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setErrorMessage('Não foi possível validar a sessão do usuário.');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single();

    if (!profile?.role) {
      setErrorMessage('Seu usuário não possui perfil válido para acessar o sistema.');
      return;
    }

    if (profile.role !== 'client' && !profile.tenant_id) {
      setErrorMessage('Seu usuário não está vinculado a nenhuma empresa.');
      return;
    }

    if (profile.role === 'client') {
      navigate('/area-cliente');
    } else if (profile.role === 'agent') {
      navigate('/corretor-dashboard');
    } else {
      navigate('/');
    }
  };

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code');
    if (code) {
      setIsGoogleLoading(true);
      setErrorMessage('');
      supabase.auth.exchangeCodeForSession(code)
        .then(({ error }) => {
          window.history.replaceState({}, document.title, window.location.pathname);
          if (error) {
            setErrorMessage(error.message);
            return;
          }
          return handleRedirectByRole();
        })
        .catch((err) => {
          setErrorMessage(err?.message || 'Erro ao validar login Google.');
        })
        .finally(() => setIsGoogleLoading(false));
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!authLoading && session && !params.get('code')) {
      setErrorMessage('');
      setIsGoogleLoading(true);
      handleRedirectByRole().finally(() => setIsGoogleLoading(false));
    }
  }, [authLoading, session]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim()
      });

      if (error) {
        setErrorMessage(error.message);
      } else {
        await handleRedirectByRole();
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Erro inesperado ao realizar login.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMessage('');
    setIsGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/login'
        }
      });
      if (error) {
        setErrorMessage(error.message);
        setIsGoogleLoading(false);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Erro ao iniciar autenticação Google.');
      setIsGoogleLoading(false);
    }
  };

  return (
    <>
    <div className="min-h-screen bg-slate-950 flex">
      {/* Imagem lateral esquerda */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        <img 
          src="https://i.imgur.com/cUiF709.png" 
          alt="Estate.ia Imobiliária" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/30" />
      </div>

      {/* Formulário de Login */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-slate-950 text-white">
        <div className="w-full max-w-md space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Bem-vindo de volta</h2>
            <p className="text-slate-400 text-sm">Entre com suas credenciais para acessar o sistema.</p>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              {errorMessage}
            </div>
          )}

          {/* Botão Login Google */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isSubmitting || isGoogleLoading}
            className="w-full h-11 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800/80 text-white font-semibold text-xs flex items-center justify-center gap-3 transition-all"
          >
            {isGoogleLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-sky-400" />
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C4 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 4 3.47 2.18 7.06L5.84 9.9C6.71 7.3 9.14 5.38 12 5.38z" />
              </svg>
            )}
            Entrar com Google
          </button>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-800" />
            <span className="text-xs text-slate-500 uppercase">ou</span>
            <div className="h-px flex-1 bg-slate-800" />
          </div>

          {/* Form Email / Senha */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Email</label>
              <input 
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-11 rounded-xl bg-slate-900/80 border border-slate-800 focus:border-sky-500 px-3.5 text-xs text-white placeholder-slate-500 outline-none transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">Senha</label>
                <button type="button" className="text-xs text-sky-400 hover:underline">
                  Esqueceu a senha?
                </button>
              </div>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full h-11 rounded-xl bg-slate-900/80 border border-slate-800 focus:border-sky-500 px-3.5 pr-10 text-xs text-white placeholder-slate-500 outline-none transition-all"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isGoogleLoading}
              className="w-full h-11 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-sky-500/20 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Entrar
            </button>
          </form>

          <p className="text-center text-xs text-slate-500">
            © {new Date().getFullYear()} Estate.ia. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
    <LanguagePrompt />
    </>
  );
}
