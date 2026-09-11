import React from 'react';
import { motion } from 'motion/react';
import { AppView } from '../types';
import { ALGERIA_ELECTIONS_LOGO_IMG } from '../data/initialData';

interface HomeScreenProps {
  onNavigate: (view: AppView) => void;
  totalCenters: number;
  totalOffices: number;
  totalMembers: number;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate }) => {
  const handleOpenApp = () => {
    onNavigate('staffing');
  };

  return (
    <div
      id="algerian-flag-home-screen"
      onClick={handleOpenApp}
      className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden select-none cursor-pointer p-4"
      title="انقر لفتح التطبيق"
    >
      {/* ========================================================= */}
      {/* FLIPPED ALGERIAN FLAG BACKGROUND */}
      {/* Left: Pure White (#FFFFFF) | Right: Algerian Green (#006633) */}
      {/* ========================================================= */}
      <div dir="ltr" className="absolute inset-0 flex flex-row pointer-events-none z-0">
        <div
          id="flag-white-half"
          className="h-full w-1/2 bg-white"
        />
        <div
          id="flag-green-half"
          className="h-full w-1/2 bg-[#006633]"
        />
      </div>

      {/* Subtle vignette / overlay */}
      <div className="absolute inset-0 bg-black/10 pointer-events-none z-0" />

      {/* ========================================================= */}
      {/* MAIN CENTER ELECTION ICON / BANNER */}
      {/* ========================================================= */}
      <div className="relative z-20 flex flex-col items-center justify-center max-w-lg w-full text-center space-y-4">
        <motion.button
          id="center-election-photo-btn"
          type="button"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={(e) => {
            e.stopPropagation();
            handleOpenApp();
          }}
          className="group cursor-pointer relative flex flex-col items-center justify-center p-2 rounded-3xl focus:outline-none focus:ring-4 focus:ring-amber-400"
          aria-label="فتح التطبيق - الدخول لمنصة التأطير"
        >
          {/* Glowing Frame Container */}
          <div className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 rounded-3xl overflow-hidden shadow-2xl border-4 border-amber-400/90 group-hover:border-amber-300 ring-4 ring-black/20 transition-all duration-300">
            <img
              src={ALGERIA_ELECTIONS_LOGO_IMG}
              alt="تأطير مراكز ومكاتب الانتخابات - الجزائر"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="eager"
            />
            {/* Soft inner glow on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none group-hover:opacity-80 transition-opacity" />
            
            {/* Emblem label on bottom of image */}
            <div className="absolute bottom-3 inset-x-3 bg-blue-950/85 backdrop-blur-md py-2 px-3 rounded-2xl border border-amber-400/70 shadow-lg">
              <p className="text-white font-black text-xs sm:text-sm drop-shadow-md">
                الجمهورية الجزائرية الديمقراطية الشعبية
              </p>
              <p className="text-amber-300 font-extrabold text-2xs sm:text-xs">
                السلطة الوطنية المستقلة للانتخابات
              </p>
            </div>
          </div>

          {/* Action Callout Button */}
          <div className="mt-4 px-6 py-2.5 bg-blue-950/90 group-hover:bg-blue-900 border-2 border-amber-400 text-white rounded-2xl shadow-xl backdrop-blur-md flex items-center gap-2 transition-all">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-sm sm:text-base font-black text-amber-300">
              انقر للدخول إلى منصة التأطير
            </span>
          </div>
        </motion.button>
      </div>
    </div>
  );
};



