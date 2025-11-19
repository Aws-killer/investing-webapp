// pages/dashboard/CalendarWidget.jsx
"use client";

import React from "react";
import { useDashboard } from "@/Providers/dashboard";
import { useCurrency } from "@/Providers/CurrencyProvider";
import { CalendarDays } from "lucide-react";

const WidgetCard = ({ children }) => (
  <div className="bg-[#121212] rounded-xl border border-zinc-800 p-5">
    {children}
  </div>
);

export const CalendarWidget = () => {
  const { calendarEvents, selectedPortfolio } = useDashboard();
  const { formatAmount } = useCurrency();

  if (!selectedPortfolio) return null;

  return (
    <WidgetCard>
      <div className="flex items-center gap-2 mb-5">
          <CalendarDays className="text-zinc-400 h-4 w-4" />
          <h3 className="text-sm font-bold text-zinc-100">Upcoming Events</h3>
      </div>

      <div className="space-y-4">
         {(!calendarEvents || calendarEvents.length === 0) ? (
             <p className="text-xs text-zinc-500">No upcoming events.</p>
         ) : (
             calendarEvents.slice(0, 3).map((event, i) => (
                 <div key={i} className="flex items-center justify-between group">
                     <div className="flex items-center gap-3">
                         <div className="bg-zinc-800 h-10 w-10 rounded-lg flex flex-col items-center justify-center border border-zinc-700/50">
                             <span className="text-[10px] text-zinc-500 uppercase">{new Date(event.event_date).toLocaleString('default', { month: 'short' })}</span>
                             <span className="text-sm font-bold text-zinc-200">{new Date(event.event_date).getDate()}</span>
                         </div>
                         <div>
                             <div className="text-xs font-bold text-zinc-200">{event.asset_symbol}</div>
                             <div className="text-[10px] text-zinc-500 uppercase tracking-wider">{event.event_type}</div>
                         </div>
                     </div>
                     <div className="text-sm font-mono text-emerald-400">
                         +{formatAmount(event.estimated_amount)}
                     </div>
                 </div>
             ))
         )}
      </div>
    </WidgetCard>
  );
};
export default CalendarWidget;