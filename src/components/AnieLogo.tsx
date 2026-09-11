import React from 'react';

interface AnieLogoProps {
  className?: string;
  size?: number;
}

export const AnieLogo: React.FC<AnieLogoProps> = ({ className = 'w-24 h-24', size }) => {
  return (
    <svg
      viewBox="0 0 500 500"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Gradients for the metallic/silver border */}
        <linearGradient id="silverRing" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e2e8f0" />
          <stop offset="30%" stopColor="#94a3b8" />
          <stop offset="50%" stopColor="#f8fafc" />
          <stop offset="70%" stopColor="#64748b" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>

        {/* Flag shadow and curl gradients */}
        <linearGradient id="flagCurl" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#cbd5e1" />
          <stop offset="50%" stopColor="#f1f5f9" />
          <stop offset="100%" stopColor="#94a3b8" />
        </linearGradient>

        <linearGradient id="greenBg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#00965e" />
          <stop offset="100%" stopColor="#007a4d" />
        </linearGradient>

        {/* Text Paths */}
        {/* Top Arabic Arc */}
        <path
          id="anieArabicPath"
          d="M 68 250 A 182 182 0 1 1 432 250"
          fill="none"
        />

        {/* Inner Tifinagh Arc */}
        <path
          id="anieTifinaghPath"
          d="M 125 240 A 130 130 0 0 1 375 240"
          fill="none"
        />
      </defs>

      {/* 1. Outer Silver Ring */}
      <circle cx="250" cy="250" r="242" fill="url(#silverRing)" />
      
      {/* 2. Main Green Circle */}
      <circle cx="250" cy="250" r="230" fill="url(#greenBg)" />

      {/* 3. Top Curved Arabic Text in White */}
      <text
        fill="#FFFFFF"
        fontSize="35"
        fontWeight="900"
        fontFamily="sans-serif"
        letterSpacing="1"
        textAnchor="middle"
      >
        <textPath href="#anieArabicPath" startOffset="50%">
          السلطة الوطنية المستقلة للانتخابات
        </textPath>
      </text>

      {/* 4. Inner White Circle */}
      <circle cx="250" cy="250" r="148" fill="#FFFFFF" stroke="#e2e8f0" strokeWidth="2" />

      {/* 5. Tifinagh Text inside White Circle */}
      <text
        fill="#007a4d"
        fontSize="16.5"
        fontWeight="bold"
        fontFamily="sans-serif"
        letterSpacing="2"
        textAnchor="middle"
      >
        <textPath href="#anieTifinaghPath" startOffset="50%">
          °• ⵙⵓⵍⵟⴰ ⵜⴰⵏⴰⵎⵓⵔⵜ ⵜⴰⵏⵉⵎⴰⵏⵜ ⵉ ⵉⴼⵔⴰⵏⴻⵏ •°
        </textPath>
      </text>

      {/* 6. Center Ballot Box Icon */}
      <g transform="translate(210, 160)">
        {/* Slot Line */}
        <line x1="0" y1="56" x2="80" y2="56" stroke="#007a4d" strokeWidth="3" strokeLinecap="round" />
        
        {/* Envelope falling into slot */}
        <path
          d="M 10 30 L 40 5 L 70 30 L 70 52 L 10 52 Z"
          fill="#00965e"
          stroke="#007a4d"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* Envelope Flap Lines */}
        <path
          d="M 10 30 L 40 45 L 70 30"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 22 36 L 40 50 L 58 36"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="1.5"
        />
      </g>

      {/* 7. English Text */}
      <g textAnchor="middle">
        <text
          x="250"
          y="256"
          fill="#007a4d"
          fontSize="18"
          fontWeight="bold"
          fontFamily="sans-serif"
        >
          Independent National
        </text>
        <text
          x="250"
          y="280"
          fill="#007a4d"
          fontSize="18"
          fontWeight="bold"
          fontFamily="sans-serif"
        >
          Authority of Elections
        </text>
      </g>

      {/* 8. Bottom Waving Algerian Flag Layer */}
      {/* Flag Shape clipping to bottom border */}
      <g>
        {/* Flag Green Part (Left) */}
        <path
          d="M 28 320 Q 120 380 200 440 L 200 490 Q 90 440 28 320 Z"
          fill="#00965e"
        />
        <path
          d="M 28 320 Q 120 370 205 315 L 205 450 Q 110 440 28 320 Z"
          fill="#00965e"
        />

        {/* Flag Wave Main Body (Green Left + White Right) */}
        <path
          d="M 24 320 C 80 400 160 460 250 460 C 310 460 360 430 400 380 L 350 440 C 300 480 220 490 150 480 C 80 470 20 400 24 320 Z"
          fill="#007a4d"
          opacity="0.2"
        />

        {/* Main Flag Ribbon */}
        <path
          d="M 22 320 C 80 340 140 370 205 435 L 205 315 C 130 360 70 330 22 320 Z"
          fill="#00965e"
        />
        <path
          d="M 205 435 C 270 500 350 460 400 380 L 350 315 C 300 380 250 370 205 315 Z"
          fill="#FFFFFF"
          stroke="#cbd5e1"
          strokeWidth="1"
        />

        {/* Algerian Flag Waving Banner - Clean Path */}
        <path
          d="M 20 320 C 100 350 160 380 205 450 C 205 320 120 340 20 320 Z"
          fill="#00965e"
        />
        
        {/* Full Ribbon Wave */}
        <path
          d="M 20 320 C 120 360 180 420 205 455 C 205 315 130 330 20 320 Z"
          fill="#00965e"
        />
        <path
          d="M 205 455 C 260 490 340 450 380 390 C 330 320 250 320 205 315 Z"
          fill="#FFFFFF"
        />

        {/* Red Crescent & Star on the Flag */}
        <g transform="translate(195, 375)">
          {/* Crescent */}
          <path
            d="M 0 -28 A 28 28 0 1 1 -5 28 A 22 22 0 1 0 0 -28 Z"
            fill="#D21034"
          />
          {/* 5-pointed Star */}
          <polygon
            points="12,-6 16,3 25,3 18,9 21,18 13,12 5,18 8,9 1,3 10,3"
            fill="#D21034"
          />
        </g>

        {/* Curl / Fold at Bottom Right */}
        <path
          d="M 380 390 C 350 440 370 470 410 450 C 440 430 460 380 472 320 C 440 370 400 390 380 390 Z"
          fill="url(#flagCurl)"
          stroke="#94a3b8"
          strokeWidth="1"
        />
      </g>
    </svg>
  );
};
