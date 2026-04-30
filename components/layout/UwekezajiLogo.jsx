import React from 'react';
import { PieChart } from 'lucide-react';

export const UwekezajiLogo = ({ className = "" }) => (
  <div className={`flex items-center gap-2.5 ${className}`}>
    <div className="w-8 h-8 bg-foreground rounded-[8px] flex items-center justify-center">
      <PieChart className="text-background h-4 w-4" />
    </div>
    <span className="font-extrabold text-[18px] tracking-[-0.05em] text-foreground uppercase italic leading-none">
      uwekezaji
    </span>
  </div>
);

export default UwekezajiLogo;
