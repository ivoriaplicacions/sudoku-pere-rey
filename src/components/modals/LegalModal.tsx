import { useState, useImperativeHandle, forwardRef, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { getTranslation } from '../../i18n/translations';
import {
  APP_VERSION,
  PUBLISHER,
  SUPPORT_URL,
  PRIVACY_PATH,
  AI_ACT_PATH,
  GOVERNANCE_PATH,
  LEGAL_HUB_PATH,
} from '../../version';
import { X, Scale, ArrowLeft } from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LEGAL_DOCS = [
  { path: PRIVACY_PATH, labelKey: 'privacyPolicy' },
  { path: AI_ACT_PATH, labelKey: 'aiActTitle' },
  { path: GOVERNANCE_PATH, labelKey: 'governance' },
  { path: LEGAL_HUB_PATH, labelKey: 'legalHub' },
] as const;

export type LegalModalHandle = {
  closeNestedDoc: () => boolean;
};

export const LegalModal = forwardRef<LegalModalHandle, LegalModalProps>(
  ({ isOpen, onClose }, ref) => {
    const { language } = useGame();
    const [openDoc, setOpenDoc] = useState<string | null>(null);

    useImperativeHandle(ref, () => ({
      closeNestedDoc: () => {
        if (!openDoc) return false;
        setOpenDoc(null);
        return true;
      },
    }));

    useEffect(() => {
      if (!isOpen) setOpenDoc(null);
    }, [isOpen]);

    if (!isOpen) return null;

    const close = () => {
      setOpenDoc(null);
      onClose();
    };

    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white animate-fade-in">
        <header className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/50 backdrop-blur-md">
          <div className="flex items-center space-x-2 min-w-0">
            {openDoc ? (
              <button
                type="button"
                onClick={() => setOpenDoc(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition"
                aria-label="Back"
              >
                <ArrowLeft className="w-5 h-5 text-white/80" />
              </button>
            ) : (
              <Scale className="w-5 h-5 text-cyan-400 shrink-0" />
            )}
            <h2 className="text-lg font-black truncate">
              {openDoc
                ? getTranslation(
                    language,
                    LEGAL_DOCS.find((d) => d.path === openDoc)?.labelKey ?? 'legal',
                  )
                : getTranslation(language, 'legal')}
            </h2>
          </div>
          <button
            type="button"
            onClick={close}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-white/80" />
          </button>
        </header>

        {openDoc ? (
          <iframe
            src={openDoc}
            title={getTranslation(language, 'legal')}
            className="flex-1 w-full bg-white"
          />
        ) : (
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-8 text-sm leading-relaxed text-white/80">
            <p className="text-base font-black text-amber-300">{PUBLISHER}</p>
            <p>
              {getTranslation(language, 'appName')} · {getTranslation(language, 'version')}{' '}
              {APP_VERSION}
            </p>
            <p>{getTranslation(language, 'privacyBody')}</p>
            <p>{getTranslation(language, 'privacyIap')}</p>
            <p className="text-base font-black text-cyan-300">
              {getTranslation(language, 'aiActTitle')}
            </p>
            <p>{getTranslation(language, 'aiActBody')}</p>
            <p className="text-base font-black text-cyan-300">
              {getTranslation(language, 'governance')}
            </p>
            <p>{getTranslation(language, 'governanceBody')}</p>
            {LEGAL_DOCS.map((doc) => (
              <button
                key={doc.path}
                type="button"
                onClick={() => setOpenDoc(doc.path)}
                className="block w-full text-left text-cyan-300 font-bold underline underline-offset-2"
              >
                {getTranslation(language, doc.labelKey)}
              </button>
            ))}
            <a
              href={SUPPORT_URL}
              target="_blank"
              rel="noreferrer"
              className="block text-cyan-300 font-bold underline underline-offset-2"
            >
              {getTranslation(language, 'support')}
            </a>
          </div>
        )}
      </div>
    );
  },
);

LegalModal.displayName = 'LegalModal';
