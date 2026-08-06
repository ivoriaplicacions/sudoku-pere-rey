import React from 'react';
import { useGame } from '../../context/GameContext';
import { getTranslation } from '../../i18n/translations';
import { localized } from '../../i18n/localized';
import { CONTENT_PACKS, formatPrice } from '../../data/packs';
import { loadStoreProducts } from '../../services/monetization';
import { X, ShoppingBag, CheckCircle, Lock, Clock } from 'lucide-react';

interface StoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StoreModal: React.FC<StoreModalProps> = ({ isOpen, onClose }) => {
  const { language, ownedPacks, purchasePack, restorePurchases } = useGame();
  const [busy, setBusy] = React.useState<string | null>(null);
  const [storePrices, setStorePrices] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (!isOpen) return;
    void (async () => {
      const products = await loadStoreProducts();
      const prices: Record<string, string> = {};
      for (const pack of CONTENT_PACKS) {
        if (pack.productId && products[pack.productId]?.priceString) {
          prices[pack.id] = products[pack.productId].priceString!;
        }
      }
      setStorePrices(prices);
    })();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBuy = async (packId: string) => {
    setBusy(packId);
    await purchasePack(packId);
    setBusy(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white animate-fade-in">
      <header className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/50 backdrop-blur-md">
        <div className="flex items-center space-x-2">
          <ShoppingBag className="w-5 h-5 text-amber-400" />
          <h2 className="text-lg font-black">{getTranslation(language, 'store')}</h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-white/80" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-8">
        <p className="text-sm text-white/70 text-center px-2">
          {getTranslation(language, 'storeSubtitle')}
        </p>

        {CONTENT_PACKS.map((pack) => {
          const owned = ownedPacks.includes(pack.id) || pack.priceEur === 0;
          const price = storePrices[pack.id] ?? formatPrice(pack.priceEur, language);

          return (
            <div
              key={pack.id}
              className={`rounded-2xl border p-4 ${
                owned
                  ? 'bg-emerald-950/30 border-emerald-500/40'
                  : 'bg-white/5 border-white/15'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                      {getTranslation(language, 'pack')} {pack.number}
                    </span>
                    {!pack.available && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/60">
                        {getTranslation(language, 'comingSoon')}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-black text-white mt-0.5">
                    {localized(pack.name, language)}
                  </h3>
                  <p className="text-xs text-white/60 mt-1">
                    {localized(pack.description, language)}
                  </p>
                  {pack.productId && (
                    <p className="text-[10px] text-white/35 mt-1 font-mono">{pack.productId}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <div className="text-lg font-black text-amber-300">{price}</div>
                </div>
              </div>

              <div className="mt-3">
                {owned ? (
                  <div className="flex items-center gap-2 text-sm font-bold text-emerald-300">
                    <CheckCircle className="w-4 h-4" />
                    {getTranslation(language, 'owned')}
                  </div>
                ) : !pack.available ? (
                  <div className="flex items-center gap-2 text-sm font-medium text-white/50">
                    <Clock className="w-4 h-4" />
                    {getTranslation(language, 'comingSoon')}
                  </div>
                ) : (
                  <button
                    disabled={busy === pack.id}
                    onClick={() => handleBuy(pack.id)}
                    className="w-full mt-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-sm active:scale-[0.98] transition disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    <Lock className="w-4 h-4" />
                    {busy === pack.id
                      ? '...'
                      : `${getTranslation(language, 'buy')} · ${price}`}
                  </button>
                )}
              </div>
            </div>
          );
        })}

        <button
          onClick={() => restorePurchases()}
          className="w-full py-3 rounded-xl border border-white/15 text-sm font-bold text-white/80 hover:bg-white/5 transition"
        >
          {getTranslation(language, 'restorePurchases')}
        </button>
      </div>
    </div>
  );
};
