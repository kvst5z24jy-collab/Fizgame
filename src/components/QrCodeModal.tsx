import React, { useEffect, useState } from 'react';
import { X, Copy, Check, QrCode as QrIcon, Maximize2, ExternalLink } from 'lucide-react';
import { PhysicsGame } from '../types';

interface QrCodeModalProps {
  game: PhysicsGame | null;
  onClose: () => void;
  onStartGame: (game: PhysicsGame) => void;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({ game, onClose, onStartGame }) => {
  const [qrUrl, setQrUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);

  if (!game) return null;

  const joinUrl = `${window.location.origin}/?code=${game.shareCode}`;

  useEffect(() => {
    fetch(`/api/qrcode?text=${encodeURIComponent(joinUrl)}`)
      .then(res => res.json())
      .then(data => {
        if (data.qrDataUrl) {
          setQrUrl(data.qrDataUrl);
        }
      })
      .catch(err => console.error('Error fetching QR:', err));
  }, [joinUrl]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id="qr-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="qr-modal-card"
        onClick={(e) => e.stopPropagation()}
        className={`bg-white rounded-2xl shadow-2xl border border-slate-200 transition-all ${
          isFullScreen
            ? 'w-full h-full max-w-none max-h-none rounded-none p-10 flex flex-col justify-center items-center'
            : 'w-full max-w-lg p-6 sm:p-8'
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6 w-full">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-800">
                {game.category}
              </span>
              <span className="text-xs text-slate-500 font-semibold">
                Код: <strong className="text-slate-900 tracking-wider font-mono text-sm">{game.shareCode}</strong>
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
              {game.title}
            </h3>
          </div>
          <div className="flex items-center gap-1">
            <button
              id="qr-fullscreen-btn"
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
              title={isFullScreen ? 'Қалыпты өлшем' : 'Интерактивті тақтаға толық ашу'}
            >
              <Maximize2 className="w-5 h-5" />
            </button>
            <button
              id="qr-close-btn"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* QR Display */}
        <div className="flex flex-col items-center justify-center my-4 w-full">
          <div className="p-4 bg-white border-2 border-slate-200 rounded-2xl shadow-inner flex items-center justify-center">
            {qrUrl ? (
              <img
                src={qrUrl}
                alt="QR Code"
                className={isFullScreen ? 'w-80 h-80 sm:w-96 sm:h-96' : 'w-64 h-64'}
              />
            ) : (
              <div className="w-64 h-64 flex items-center justify-center text-slate-400">
                <QrIcon className="w-12 h-12 animate-pulse" />
              </div>
            )}
          </div>

          <p className="text-sm font-medium text-slate-600 mt-4 text-center max-w-sm">
            📲 Оқушылар телефон камерасын жақындатып немесе кодты енгізіп ойынға бірден кіре алады.
          </p>
        </div>

        {/* Link & Actions */}
        <div className="w-full space-y-3 mt-4">
          <div className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
            <span className="font-mono truncate flex-1">{joinUrl}</span>
            <button
              id="qr-copy-link-btn"
              onClick={copyToClipboard}
              className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg flex items-center gap-1.5 transition shadow-sm shrink-0"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Көшірілді</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Көшіру</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              id="qr-play-now-btn"
              onClick={() => {
                onClose();
                onStartGame(game);
              }}
              className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-center flex items-center justify-center gap-2 shadow-sm transition"
            >
              <span>Осы құрылғыда бастау</span>
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
