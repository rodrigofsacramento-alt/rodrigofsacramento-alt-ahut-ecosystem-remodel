import { useEffect, useState } from 'react';
import { useLanguage } from './LanguageContext';

const STORAGE_KEY_LANG_PROMPT = 'estate_lang_prompt_shown';

const flags = {
  pt: (
    <svg className="w-16 h-16 rounded-lg shadow-lg" viewBox="0 0 24 24">
      <rect width="24" height="24" fill="#009739"/>
      <polygon points="12,3 22,12 12,21 2,12" fill="#FEDD00"/>
      <circle cx="12" cy="12" r="4" fill="#002776"/>
      <circle cx="12" cy="12" r="2" fill="#FEDD00"/>
    </svg>
  ),
  es: (
    <svg className="w-16 h-16 rounded-lg shadow-lg" viewBox="0 0 24 24">
      <rect width="24" height="24" fill="#AA151B"/>
      <rect width="24" height="8" y="8" fill="#F1BF00"/>
      <rect width="8" height="24" x="8" y="0" fill="#F1BF00"/>
      <rect width="2" height="24" x="11" y="0" fill="#AA151B"/>
      <rect width="24" height="2" y="14" fill="#AA151B"/>
      <rect width="24" height="2" y="10" fill="#AA151B"/>
    </svg>
  ),
};

export function LanguagePrompt() {
  const { lang, setLang, t } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const alreadyShown = localStorage.getItem(STORAGE_KEY_LANG_PROMPT);
      if (!alreadyShown) {
        setVisible(true);
      }
    } catch {}
  }, []);

  const handleChoose = (choice: 'pt' | 'es') => {
    setLang(choice);
    try { localStorage.setItem(STORAGE_KEY_LANG_PROMPT, 'true'); } catch {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4 animate-in zoom-in-95 duration-300">
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">🌐</div>
          <h2 className="text-xl font-bold text-slate-900 mb-1">
            {lang === 'pt' ? 'Escolha seu idioma' : 'Elija su idioma'}
          </h2>
          <p className="text-sm text-slate-500">
            {lang === 'pt' ? 'Como prefere usar o sistema?' : '¿Cómo prefiere usar el sistema?'}
          </p>
        </div>

        <div className="flex gap-4">
          {/* Português */}
          <button
            onClick={() => handleChoose('pt')}
            className="flex-1 flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-slate-200 hover:border-green-500 hover:bg-green-50 transition-all group"
          >
            {flags.pt}
            <span className="font-bold text-slate-700 group-hover:text-green-700">Português</span>
            <span className="text-xs text-slate-400">🇧🇷 Brasil</span>
          </button>

          {/* Español */}
          <button
            onClick={() => handleChoose('es')}
            className="flex-1 flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-slate-200 hover:border-red-500 hover:bg-red-50 transition-all group"
          >
            {flags.es}
            <span className="font-bold text-slate-700 group-hover:text-red-700">Español</span>
            <span className="text-xs text-slate-400">🇪🇸 Paraguay</span>
          </button>
        </div>

        <p className="text-center text-[10px] text-slate-400 mt-6">
          {lang === 'pt' ? 'Pode alterar o idioma a qualquer momento no cabeçalho.' : 'Puede cambiar el idioma en cualquier momento en el encabezado.'}
        </p>
      </div>
    </div>
  );
}