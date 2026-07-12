import React from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  showSubhead?: boolean;
  className?: string;
  lightBgCheck?: boolean; // toggle badge border to match background
}

export const Logo: React.FC<LogoProps> = ({ 
  size = "md", 
  showText = false, 
  showSubhead = true,
  className = "",
  lightBgCheck = true
}) => {
  // Dimensions
  const sizes = {
    sm: { width: 28, height: 28 },
    md: { width: 42, height: 42 },
    lg: { width: 72, height: 72 },
    xl: { width: 120, height: 120 },
  };

  const { width, height } = sizes[size];

  return (
    <div className={`flex items-center gap-3.5 ${className}`}>
      <svg
        width={width}
        height={height}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        {/* Outer terracotta ring */}
        <circle cx="60" cy="60" r="54" stroke="#C1440E" strokeWidth="2.5" />
        
        {/* Inner warm near-black circle */}
        <circle cx="60" cy="60" r="48" fill="#211F1C" />

        {/* Waveform bars centered around Y=60 */}
        <rect x="36" y="53" width="3" height="14" rx="1.5" fill="#6B665F" />
        <rect x="42" y="48" width="3" height="24" rx="1.5" fill="#E7E2D9" />
        <rect x="48" y="43" width="3" height="34" rx="1.5" fill="#6B665F" />
        <rect x="54" y="37" width="3" height="46" rx="1.5" fill="#E7E2D9" />
        
        {/* Terracotta center bars */}
        <rect x="60" y="29" width="3" height="62" rx="1.5" fill="#C1440E" />
        <rect x="66" y="21" width="3" height="78" rx="1.5" fill="#C1440E" />
        <rect x="72" y="29" width="3" height="62" rx="1.5" fill="#C1440E" />
        
        {/* Right bars */}
        <rect x="78" y="37" width="3" height="46" rx="1.5" fill="#E7E2D9" />
        <rect x="84" y="43" width="3" height="34" rx="1.5" fill="#6B665F" />
        <rect x="90" y="48" width="3" height="24" rx="1.5" fill="#E7E2D9" />
        <rect x="96" y="53" width="3" height="14" rx="1.5" fill="#6B665F" />

        {/* Verification checkmark badge bottom right */}
        <circle cx="92" cy="92" r="14" fill="#C1440E" stroke="var(--background)" strokeWidth="2.5" />
        <path
          d="M86.5 92L90 95.5L97 88.5"
          stroke="#F7F4EF"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {showText && (
        <div className="flex flex-col text-left">
          <span className="font-serif font-medium text-lg leading-none text-ink tracking-tight">
            Proof of Practice
          </span>
          {showSubhead && (
            <span className="text-[9px] text-muted font-mono tracking-wider uppercase mt-1 leading-none">
              A ledger, not a highlight reel
            </span>
          )}
        </div>
      )}
    </div>
  );
};
