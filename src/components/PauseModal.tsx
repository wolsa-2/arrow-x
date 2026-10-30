import React, { useState } from 'react';
import { Pause, Music, Volume2, Smartphone, Home } from 'lucide-react';
import { UserSettings } from '../game/types';
import { sound, triggerHaptic } from '../utils/audio';
import { ConfirmDialog } from './ConfirmDialog';

interface PauseModalProps {
  levelId: number;
  moves: number;
  settings: UserSettings;
  theme: 'dark' | 'light';
  onResume: () => void;
  onRestart: () => void;
  onHome: () => void;
  onOpenHowToPlay?: () => void;
  onToggleSound: () => void;
  onToggleMusic: () => void;
  onToggleHaptics: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  settings,
  onResume,
  onRestart,
  onHome,
  onToggleSound,
  onToggleMusic,
  onToggleHaptics,
}) => {
  const [confirmType, setConfirmType] = useState<'restart' | 'exit' | null>(null);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none animate-in fade-in duration-150">
        <div className="w-full max-w-[300px] rounded-3xl p-6 bg-white border border-slate-200 shadow-2xl flex flex-col items-center text-slate-900 animate-in zoom-in-95 duration-150">
          {/* Blue Circular Pause Icon Badge matching Reference Screen 5 */}
          <div className="w-16 h-16 rounded-full bg-[#0077FE] flex items-center justify-center shadow-lg shadow-blue-500/25 mb-3 text-white">
            <Pause className="w-8 h-8 fill-white" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-black text-slate-900 mb-5">
            Paused
          </h2>

          {/* Action Buttons */}
          <div className="w-full flex flex-col gap-3 mb-5">
            {/* Resume (Solid Blue Pill) */}
            <button
              type="button"
              onClick={() => {
                sound.playButton(settings.soundEnabled);
                triggerHaptic('light', settings.hapticsEnabled);
                onResume();
              }}
              className="w-full py-3 px-6 rounded-full bg-[#0077FE] hover:bg-[#0066E0] active:scale-95 text-white font-extrabold text-sm shadow-md shadow-blue-500/20 transition-all cursor-pointer text-center"
            >
              Resume
            </button>

            {/* Restart Level (Outlined Blue Pill) */}
            <button
              type="button"
              onClick={() => {
                sound.playButton(settings.soundEnabled);
                triggerHaptic('light', settings.hapticsEnabled);
                setConfirmType('restart');
              }}
              className="w-full py-2.5 px-6 rounded-full bg-white border-2 border-[#0077FE] hover:bg-blue-50/50 active:scale-95 text-[#0077FE] font-extrabold text-sm shadow-2xs transition-all cursor-pointer text-center"
            >
              Restart Level
            </button>
          </div>

          {/* Toggles List matching Reference Screen 5 */}
          <div className="w-full flex flex-col divide-y divide-slate-100 border-t border-b border-slate-100 py-2 mb-5">
            {/* Music */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2.5 text-slate-700 font-bold text-xs">
                <Music className="w-4 h-4 text-[#0077FE]" />
                <span>Music</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.musicEnabled}
                onClick={() => {
                  triggerHaptic('light', settings.hapticsEnabled);
                  onToggleMusic();
                }}
                className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
                  settings.musicEnabled ? 'bg-[#0077FE]' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out mt-0.5 ml-0.5 ${
                    settings.musicEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Sound Effects */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2.5 text-slate-700 font-bold text-xs">
                <Volume2 className="w-4 h-4 text-[#0077FE]" />
                <span>Sound Effects</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.soundEnabled}
                onClick={() => {
                  triggerHaptic('light', settings.hapticsEnabled);
                  onToggleSound();
                }}
                className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
                  settings.soundEnabled ? 'bg-[#0077FE]' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out mt-0.5 ml-0.5 ${
                    settings.soundEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Vibration */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2.5 text-slate-700 font-bold text-xs">
                <Smartphone className="w-4 h-4 text-[#0077FE]" />
                <span>Vibration</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.hapticsEnabled}
                onClick={() => {
                  triggerHaptic('light', !settings.hapticsEnabled);
                  onToggleHaptics();
                }}
                className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
                  settings.hapticsEnabled ? 'bg-[#0077FE]' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out mt-0.5 ml-0.5 ${
                    settings.hapticsEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Main Menu (Outlined Blue Pill with Home icon) */}
          <button
            type="button"
            onClick={() => {
              sound.playButton(settings.soundEnabled);
              triggerHaptic('light', settings.hapticsEnabled);
              setConfirmType('exit');
            }}
            className="w-full py-2.5 px-6 rounded-full bg-white border-2 border-[#0077FE] hover:bg-blue-50/50 active:scale-95 text-[#0077FE] font-extrabold text-sm shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4 stroke-[2.2]" />
            <span>Main Menu</span>
          </button>
        </div>
      </div>

      {confirmType && (
        <ConfirmDialog
          type={confirmType}
          onConfirm={() => {
            if (confirmType === 'restart') {
              setConfirmType(null);
              onRestart();
            } else {
              setConfirmType(null);
              onHome();
            }
          }}
          onCancel={() => setConfirmType(null)}
        />
      )}
    </>
  );
};
