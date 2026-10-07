import { useState, useImperativeHandle, forwardRef, useEffect, useId } from 'react';
import { useGame } from '../../context/GameContext';
import { getTranslation } from '../../i18n/translations';
import {
  APP_VERSION,
  PUBLISHER,
  PUBLISHER_LEGAL_NAME,
  PUBLISHER_TRADE_NAME,
  PUBLISHER_TAX_ID,
  PUBLISHER_ADDRESS,
  PUBLISHER_EMAIL,
  PUBLISHER_WEBSITE,
  SUPPORT_URL,
  PRIVACY_PATH,
  AI_ACT_PATH,
  GOVERNANCE_PATH,
  LICENSES_PATH,
  LEGAL_HUB_PATH,
} from '../../version';
import { X, Scale, ArrowLeft } from 'lucide-react';
import { useModalAccessibility } from '../../hooks/useModalAccessibility';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LEGAL_DOCS = [
  { path: PRIVACY_PATH, labelKey: 'privacyPolicy' },
  { path: AI_ACT_PATH, labelKey: 'aiActTitle' },
  { path: GOVERNANCE_PATH, labelKey: 'governance' },
  { path: LICENSES_PATH, labelKey: 'licenses' },
  { path: LEGAL_HUB_PATH, labelKey: 'legalHub' },
] as const;

export type LegalModalHandle = {
  closeNestedDoc: () => boolean;
};

export const LegalModal = forwardRef<LegalModalHandle, LegalModalProps>(
  ({ isOpen, onClose }, ref) => {
    const { language } = useGame();
    const [openDoc, setOpenDoc] = useState<string | null>(null);
    const titleId = useId();
    const dialogRef = useModalAccessibility(isOpen, onClose, () => {
      if (openDoc) setOpenDoc(null);
      else onClose();
    });

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
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white animate-fade-in"
      >
        <header className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/50 backdrop-blur-md">
          <div className="flex items-center space-x-2 min-w-0">
            {openDoc ? (
              <button
                type="button"
                onClick={() => setOpenDoc(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition"
                aria-label={getTranslation(language, 'back')}
              >
                <ArrowLeft className="w-5 h-5 text-white/80" />
              </button>
            ) : (
              <Scale className="w-5 h-5 text-cyan-400 shrink-0" />
            )}
            <h2 id={titleId} className="text-lg font-black truncate">
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
            aria-label={getTranslation(language, 'close')}
          >
            <X className="w-5 h-5 text-white/80" />
          </button>
        </header>

        {openDoc ? (
          <iframe
            src={openDoc}
            title={getTranslation(
              language,
              LEGAL_DOCS.find((doc) => doc.path === openDoc)?.labelKey ?? 'legal',
            )}
            className="flex-1 w-full bg-white"
          />
        ) : (
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-8 text-sm leading-relaxed text-white/80">
            <p className="text-base font-black text-amber-300">{PUBLISHER}</p>
            <p>
              {getTranslation(language, 'appName')} · {getTranslation(language, 'version')}{' '}
              {APP_VERSION}
            </p>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-white/50">
                {getTranslation(language, 'legalIdentity')}
              </p>
              <p className="font-bold text-white/90">
                {PUBLISHER_LEGAL_NAME} — {PUBLISHER_TRADE_NAME}
              </p>
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[13px]">
                <dt className="text-white/45">{getTranslation(language, 'taxId')}</dt>
                <dd>{PUBLISHER_TAX_ID}</dd>
                <dt className="text-white/45">{getTranslation(language, 'address')}</dt>
                <dd>{PUBLISHER_ADDRESS}</dd>
                <dt className="text-white/45">{getTranslation(language, 'email')}</dt>
                <dd>
                  <a
                    href={`mailto:${PUBLISHER_EMAIL}`}
                    className="text-cyan-300 underline underline-offset-2"
                  >
                    {PUBLISHER_EMAIL}
                  </a>
                </dd>
                <dt className="text-white/45">{getTranslation(language, 'website')}</dt>
                <dd>
                  <a
                    href={PUBLISHER_WEBSITE}
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-300 underline underline-offset-2"
                  >
                    {PUBLISHER_WEBSITE.replace('https://', '')}
                  </a>
                </dd>
              </dl>
            </section>
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
