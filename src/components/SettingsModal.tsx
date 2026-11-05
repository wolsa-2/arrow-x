import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Music,
  Volume2,
  Smartphone,
  Globe,
  Sun,
  Shield,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { UserSettings } from '../game/types';
import { sound, triggerHaptic } from '../utils/audio';

interface SettingsModalProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  onResetProgress: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onResetProgress,
  onClose,
}) => {
  const [showDocModal, setShowDocModal] = useState<'privacy' | 'terms' | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/40 backdrop-blur-sm select-none animate-in fade-in duration-150">
      <div className="w-full max-w-sm rounded-3xl p-6 bg-white border border-slate-200 shadow-2xl flex flex-col text-slate-900 max-h-[85vh] overflow-hidden">
        {/* Header matching Reference Screen 8 */}
        <div className="w-full flex items-center justify-between pb-4 border-b border-slate-100 mb-2 relative">
          <button
            type="button"
            aria-label="Back"
            onClick={() => {
              sound.playButton(settings.soundEnabled);
              triggerHaptic('light', settings.hapticsEnabled);
              onClose();
            }}
            className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[#0077FE] shadow-2xs active:scale-90 transition-all cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
          </button>

          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Settings
          </h2>

          <div className="w-9" />
        </div>

        {/* Settings List matching Reference Screen 8 */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 py-1">
          {/* 1. Music Toggle */}
          <div className="flex items-center justify-between py-3 px-1">
            <div className="flex items-center gap-3 text-slate-800 font-bold text-sm">
              <Music className="w-5 h-5 text-[#0077FE]" />
              <span>Music</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.musicEnabled}
              onClick={() => {
                triggerHaptic('light', settings.hapticsEnabled);
                onUpdateSettings({ musicEnabled: !settings.musicEnabled });
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.musicEnabled ? 'bg-[#0077FE]' : 'bg-slate-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out mt-0.5 ml-0.5 ${
                  settings.musicEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* 2. Sound Effects Toggle */}
          <div className="flex items-center justify-between py-3 px-1">
            <div className="flex items-center gap-3 text-slate-800 font-bold text-sm">
              <Volume2 className="w-5 h-5 text-[#0077FE]" />
              <span>Sound Effects</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.soundEnabled}
              onClick={() => {
                triggerHaptic('light', settings.hapticsEnabled);
                onUpdateSettings({ soundEnabled: !settings.soundEnabled });
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.soundEnabled ? 'bg-[#0077FE]' : 'bg-slate-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out mt-0.5 ml-0.5 ${
                  settings.soundEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* 3. Vibration / Haptics Toggle */}
          <div className="flex items-center justify-between py-3 px-1">
            <div className="flex items-center gap-3 text-slate-800 font-bold text-sm">
              <Smartphone className="w-5 h-5 text-[#0077FE]" />
              <span>Vibration / Haptics</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.hapticsEnabled}
              onClick={() => {
                triggerHaptic('light', !settings.hapticsEnabled);
                onUpdateSettings({ hapticsEnabled: !settings.hapticsEnabled });
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.hapticsEnabled ? 'bg-[#0077FE]' : 'bg-slate-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out mt-0.5 ml-0.5 ${
                  settings.hapticsEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* 4. Language Row */}
          <div className="flex items-center justify-between py-3 px-1 text-slate-800">
            <div className="flex items-center gap-3 font-bold text-sm">
              <Globe className="w-5 h-5 text-[#0077FE]" />
              <span>Language</span>
            </div>
            <div className="flex items-center gap-1 text-slate-500 font-bold text-xs">
              <span>English</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </div>

          {/* 5. Theme Row */}
          <div className="flex items-center justify-between py-3 px-1 text-slate-800">
            <div className="flex items-center gap-3 font-bold text-sm">
              <Sun className="w-5 h-5 text-[#0077FE]" />
              <span>Theme</span>
            </div>
            <div className="flex items-center gap-1 text-slate-500 font-bold text-xs">
              <span>Light</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </div>

          {/* 6. Privacy Policy Row */}
          <button
            type="button"
            onClick={() => setShowDocModal('privacy')}
            className="w-full flex items-center justify-between py-3 px-1 text-slate-800 hover:text-[#0077FE] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3 font-bold text-sm">
              <Shield className="w-5 h-5 text-[#0077FE]" />
              <span>Privacy Policy</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          {/* 7. Terms of Service Row */}
          <button
            type="button"
            onClick={() => setShowDocModal('terms')}
            className="w-full flex items-center justify-between py-3 px-1 text-slate-800 hover:text-[#0077FE] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3 font-bold text-sm">
              <FileText className="w-5 h-5 text-[#0077FE]" />
              <span>Terms of Service</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Reset Progress Button */}
        <div className="pt-3 border-t border-slate-100 flex justify-center">
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Reset all level progress and start fresh?')) {
                onResetProgress();
                onClose();
              }
            }}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-rose-500 py-1 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Saved Progress</span>
          </button>
        </div>

        {/* Privacy / Terms Modal */}
        {showDocModal && (
          <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-xs bg-white rounded-3xl p-5 shadow-2xl flex flex-col items-center text-center">
              <h3 className="text-lg font-black text-slate-900 mb-2">
                {showDocModal === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                Arrow Escape Puzzle respects your privacy. All game progress and settings are saved locally on your device. No personal data is collected or shared with external parties.
              </p>
              <button
                type="button"
                onClick={() => setShowDocModal(null)}
                className="w-full py-2.5 rounded-full bg-[#0077FE] text-white font-bold text-sm"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
