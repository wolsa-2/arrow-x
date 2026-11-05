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
  Tv,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { UserSettings } from '../game/types';
import { sound, triggerHaptic } from '../utils/audio';
import { admob, ADMOB_TEST_CONFIG } from '../services/admobService';

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
  const [showDocModal, setShowDocModal] = useState<'privacy' | 'terms' | 'admob' | null>(null);
  const [isTestMode, setIsTestMode] = useState<boolean>(() => admob.isTesting());

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

          {/* 8. AdMob Integration & Diagnostics Modal Row */}
          <button
            type="button"
            onClick={() => setShowDocModal('admob')}
            className="w-full flex items-center justify-between py-3 px-1 text-slate-800 hover:text-[#0077FE] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3 font-bold text-sm">
              <Tv className="w-5 h-5 text-[#0077FE]" />
              <div className="flex flex-col text-left">
                <span>AdMob Test & Production IDs</span>
                <span className="text-[10px] text-emerald-600 font-semibold">Google Test Mode Active</span>
              </div>
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

        {/* Privacy / Terms / AdMob Diagnostics Modal */}
        {showDocModal && (
          <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl flex flex-col items-center text-slate-900 max-h-[80vh] overflow-y-auto">
              {showDocModal === 'admob' ? (
                <div className="w-full flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0077FE] flex items-center justify-center mb-2">
                    <Tv className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mb-0.5">
                    AdMob Configuration
                  </h3>
                  <p className="text-xs text-slate-500 mb-3">
                    Development Test IDs & Release Separation
                  </p>

                  {/* Mode Banner */}
                  <div className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 mb-3 text-left">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-700">Active Mode:</span>
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                          isTestMode ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {isTestMode ? 'Official Test Mode' : 'Production Mode'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      {isTestMode
                        ? 'Using official Google demo IDs. Ad formats will never incur policy violations during testing.'
                        : 'Using safely isolated Production IDs reserved for Google Play release.'}
                    </p>
                  </div>

                  {/* Configured IDs List */}
                  <div className="w-full flex flex-col gap-2 text-left mb-4">
                    {/* App ID */}
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Google App ID
                      </div>
                      <div className="text-xs font-mono font-semibold text-slate-800 break-all select-all">
                        {admob.getAppId()}
                      </div>
                    </div>

                    {/* App Open Ad Unit ID */}
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                        <span>App Open Ad Unit ID</span>
                        <span className="text-blue-600 font-sans font-bold">App Open</span>
                      </div>
                      <div className="text-xs font-mono font-semibold text-slate-800 break-all select-all">
                        {admob.getAppOpenUnitId()}
                      </div>
                    </div>

                    {/* Rewarded Video Ad Unit ID */}
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                        <span>Rewarded Video Unit ID</span>
                        <span className="text-blue-600 font-sans font-bold">Rewarded</span>
                      </div>
                      <div className="text-xs font-mono font-semibold text-slate-800 break-all select-all">
                        {admob.getRewardedUnitId()}
                      </div>
                    </div>
                  </div>

                  {/* Interactive Test Action */}
                  <div className="w-full flex flex-col gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowDocModal(null);
                        onClose();
                        admob.showAppOpenAd();
                      }}
                      className="w-full py-2.5 px-4 rounded-xl bg-[#0077FE] hover:bg-[#0066E0] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Tv className="w-4 h-4" />
                      <span>Test App Open Ad Now</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const newMode = !isTestMode;
                        admob.setTestingMode(newMode);
                        setIsTestMode(newMode);
                      }}
                      className="w-full py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                    >
                      <span>Switch to {isTestMode ? 'Production IDs' : 'Test IDs'}</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowDocModal(null)}
                    className="w-full py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <div className="w-full flex flex-col items-center text-center">
                  <h3 className="text-lg font-black text-slate-900 mb-2">
                    {showDocModal === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed mb-4">
                    Arrow Escape Puzzle respects your privacy. All game progress and settings are saved locally on your device. No personal data is collected or shared with external parties.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowDocModal(null)}
                    className="w-full py-2.5 rounded-full bg-[#0077FE] text-white font-bold text-sm cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
