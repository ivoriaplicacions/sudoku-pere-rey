import React from 'react';
import { useGame } from '../../context/GameContext';
import { getTranslation } from '../../i18n/translations';
import { APP_VERSION, PUBLISHER, SUPPORT_URL, PRIVACY_PATH } from '../../version';
import { X, Scale } from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ isOpen, onClose }) => {
  const { language } = useGame();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white animate-fade-in">
      <header className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/50 backdrop-blur-md">
        <div className="flex items-center space-x-2">
          <Scale className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-black">{getTranslation(language, 'legal')}</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-white/80" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-8 text-sm leading-relaxed text-white/80">
        <p className="text-base font-black text-amber-300">{PUBLISHER}</p>
        <p>
          {getTranslation(language, 'appName')} · {getTranslation(language, 'version')} {APP_VERSION}
        </p>
        <p>{getTranslation(language, 'privacyBody')}</p>
        <p>{getTranslation(language, 'privacyIap')}</p>
        <a
          href={SUPPORT_URL}
          target="_blank"
          rel="noreferrer"
          className="block text-cyan-300 font-bold underline underline-offset-2"
        >
          {getTranslation(language, 'support')}
        </a>
        <a
          href={PRIVACY_PATH}
          target="_blank"
          rel="noreferrer"
          className="block text-cyan-300 font-bold underline underline-offset-2"
        >
          {getTranslation(language, 'privacyPolicy')}
        </a>
      </div>
    </div>
  );
};
