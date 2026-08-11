import React from 'react';
import { TaskStatus } from '@/types/ripple';
import { getStatusTheme } from '@/utils/timeUtils';

interface DoomsdayGaugeProps {
  status: TaskStatus;
  percentageRemaining: number; // 0 to 100
  size?: number;
  academicRisk?: number; // 0-100
  socialRisk?: number; // 0-100
  physicalRisk?: number; // 0-100
  showInnerRings?: boolean;
  centerText?: string;
  centerSubtext?: string;
}

export const DoomsdayGauge: React.FC<DoomsdayGaugeProps> = ({
  status,
  percentageRemaining,
  size = 180,
  academicRisk = 50,
  socialRisk = 40,
  physicalRisk = 30,
  showInnerRings = true,
  centerText,
  centerSubtext
}) => {
  const theme = getStatusTheme(status);
  
  const strokeWidthOuter = 9;
  const strokeWidthInner = 5;
  const center = size / 2;
  
  const radiusOuter = center - strokeWidthOuter - 4;
  const radiusAcademic = radiusOuter - 11;
  const radiusSocial = radiusAcademic - 8;
  const radiusPhysical = radiusSocial - 8;

  const circumferenceOuter = 2 * Math.PI * radiusOuter;
  const circumferenceAcademic = 2 * Math.PI * radiusAcademic;
  const circumferenceSocial = 2 * Math.PI * radiusSocial;
  const circumferencePhysical = 2 * Math.PI * radiusPhysical;

  // Clamped values
  const clampedTime = Math.min(100, Math.max(0, percentageRemaining));
  const strokeDashoffsetOuter = circumferenceOuter - (clampedTime / 100) * circumferenceOuter;

  const strokeDashoffsetAcademic = circumferenceAcademic - (academicRisk / 100) * circumferenceAcademic;
  const strokeDashoffsetSocial = circumferenceSocial - (socialRisk / 100) * circumferenceSocial;
  const strokeDashoffsetPhysical = circumferencePhysical - (physicalRisk / 100) * circumferencePhysical;

  return (
    <div className="relative flex items-center justify-center select-none" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <defs>
          <filter id={`glow-${status}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={theme.ringColor} stopOpacity="1" />
            <stop offset="100%" stopColor={theme.ringColor} stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {/* Outer Ring Background */}
        <circle
          cx={center}
          cy={center}
          r={radiusOuter}
          stroke="#1e293b"
          strokeWidth={strokeWidthOuter}
          fill="transparent"
        />
        
        {/* Outer Ring Value (Time Buffer Left) */}
        <circle
          cx={center}
          cy={center}
          r={radiusOuter}
          stroke={`url(#ringGradient)`}
          strokeWidth={strokeWidthOuter}
          fill="transparent"
          strokeDasharray={circumferenceOuter}
          strokeDashoffset={strokeDashoffsetOuter}
          strokeLinecap="round"
          filter={`url(#glow-${status})`}
          className="transition-all duration-700 ease-out"
        />

        {showInnerRings && (
          <>
            {/* Academic Risk Ring */}
            <circle
              cx={center}
              cy={center}
              r={radiusAcademic}
              stroke="#0f172a"
              strokeWidth={strokeWidthInner}
              fill="transparent"
            />
            <circle
              cx={center}
              cy={center}
              r={radiusAcademic}
              stroke="#f43f5e"
              strokeOpacity="0.85"
              strokeWidth={strokeWidthInner}
              fill="transparent"
              strokeDasharray={circumferenceAcademic}
              strokeDashoffset={strokeDashoffsetAcademic}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />

            {/* Social Risk Ring */}
            <circle
              cx={center}
              cy={center}
              r={radiusSocial}
              stroke="#0f172a"
              strokeWidth={strokeWidthInner}
              fill="transparent"
            />
            <circle
              cx={center}
              cy={center}
              r={radiusSocial}
              stroke="#fbbf24"
              strokeOpacity="0.85"
              strokeWidth={strokeWidthInner}
              fill="transparent"
              strokeDasharray={circumferenceSocial}
              strokeDashoffset={strokeDashoffsetSocial}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />

            {/* Physical / Energy Risk Ring */}
            <circle
              cx={center}
              cy={center}
              r={radiusPhysical}
              stroke="#0f172a"
              strokeWidth={strokeWidthInner}
              fill="transparent"
            />
            <circle
              cx={center}
              cy={center}
              r={radiusPhysical}
              stroke="#c084fc"
              strokeOpacity="0.85"
              strokeWidth={strokeWidthInner}
              fill="transparent"
              strokeDasharray={circumferencePhysical}
              strokeDashoffset={strokeDashoffsetPhysical}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
          </>
        )}
      </svg>

      {/* Center Display Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
        {centerText ? (
          <>
            <span className="text-xl font-extrabold tracking-tight text-white font-mono drop-shadow">
              {centerText}
            </span>
            {centerSubtext && (
              <span className="text-[10px] font-medium text-slate-400 mt-0.5 truncate max-w-[85%]">
                {centerSubtext}
              </span>
            )}
          </>
        ) : (
          <>
            <span className="text-lg font-bold font-mono text-white">
              {Math.round(clampedTime)}%
            </span>
            <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
              Buffer
            </span>
          </>
        )}
      </div>
    </div>
  );
};