import React, { useRef, useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { getTranslation } from '../../i18n/translations';
import { applyProgressFile, checkProgressFile, exportProgress } from '../../services/progressFile';
import type { ImportCheck } from '../../services/progressFile';
import type { Language } from '../../types/sudoku';

type Status = { tone: 'ok' | 'error'; key: string } | null;

const IMPORT_ERROR_KEY = {
  'not-a-progress-file': 'importErrorNotFile',
  'newer-version': 'importErrorNewer',
  damaged: 'importErrorDamaged',
} as const;

/**
 * Settings section to save the progress to a file and bring it back. Importing
 * always asks first, saying what the file holds, because it replaces what is on
 * the device.
 */
export const ProgressBackupSection: React.FC<{ language: Language }> = ({ language }) => {
  const fileInput = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Extract<ImportCheck, { ok: true }> | null>(null);
  const [status, setStatus] = useState<Status>(null);
  const [busy, setBusy] = useState(false);

  const t = (key: string, params?: Record<string, string | number>) => getTranslation(language, key, params);

  const onExport = async () => {
    setBusy(true);
    setStatus(null);
    const result = await exportProgress();
    setBusy(false);
    if (result === 'downloaded') setStatus({ tone: 'ok', key: 'exportDownloaded' });
    else if (result === 'failed') setStatus({ tone: 'error', key: 'exportFailed' });
  };

  const onFileChosen = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setStatus(null);
    try {
      const check = checkProgressFile(await file.text());
      if (check.ok) setPending(check);
      else setStatus({ tone: 'error', key: IMPORT_ERROR_KEY[check.error] });
    } catch {
      setStatus({ tone: 'error', key: 'importErrorDamaged' });
    }
  };

  const onConfirmImport = () => {
    if (!pending) return;
    applyProgressFile(pending.data);
    // Every screen reads its data at start; a reload is the simplest way to show the new progress.
    window.location.reload();
  };

  return (
    <section className="space-y-3 pt-1 border-t border-white/10">
      <label className="text-xs font-extrabold uppercase tracking-wider text-white/70">
        {t('progressBackup')}
      </label>
      <p className="text-[11px] leading-snug text-white/60">{t('progressBackupHelp')}</p>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => void onExport()}
          disabled={busy}
          className="flex items-center justify-center gap-2 rounded-xl bg-white/10 py-3 text-sm font-bold text-white/90 transition hover:bg-white/15 active:scale-[0.98] disabled:opacity-50"
        >
          <Download className="h-4 w-4 text-cyan-300" />
          {t('exportProgress')}
        </button>
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          disabled={busy}
          className="flex items-center justify-center gap-2 rounded-xl bg-white/10 py-3 text-sm font-bold text-white/90 transition hover:bg-white/15 active:scale-[0.98] disabled:opacity-50"
        >
          <Upload className="h-4 w-4 text-cyan-300" />
          {t('importProgress')}
        </button>
      </div>
      <input
        ref={fileInput}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(event) => void onFileChosen(event)}
        data-testid="progress-file-input"
      />

      {pending && (
        <div className="space-y-2.5 rounded-2xl border border-amber-400/40 bg-amber-950/30 p-3" role="alertdialog">
          <p className="text-sm font-bold text-white">
            {t('importConfirm', {
              completed: pending.summary.puzzlesCompleted,
              stars: pending.summary.stars,
            })}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPending(null)}
              className="rounded-xl bg-white/10 py-2 text-xs font-bold"
            >
              {t('cancel')}
            </button>
            <button
              type="button"
              onClick={onConfirmImport}
              className="rounded-xl bg-amber-500 py-2 text-xs font-black text-slate-950"
            >
              {t('importReplace')}
            </button>
          </div>
        </div>
      )}

      {status && (
        <p
          role="status"
          className={`text-xs font-bold ${status.tone === 'ok' ? 'text-emerald-300' : 'text-rose-300'}`}
        >
          {t(status.key)}
        </p>
      )}
    </section>
  );
};
