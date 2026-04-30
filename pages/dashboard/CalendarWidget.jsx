"use client";
import React from "react";
import { useDashboard } from "@/features/context/dashboard-context";
import { useCurrency } from "@/features/context/currency-context";
import { CalendarDays } from "lucide-react";

const EVENT_CONFIG = {
  DIVIDEND: { pill: "bg-emerald-500/10 text-emerald-500", dot: "bg-emerald-500" },
  COUPON:   { pill: "bg-blue-500/10 text-blue-500",       dot: "bg-blue-500"   },
  MATURITY: { pill: "bg-amber-500/10 text-amber-500",     dot: "bg-amber-500"  },
};

const getDaysUntil = (dateString) => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateString);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - now) / (1000 * 60 * 60 * 24));
};

const DaysLabel = ({ days }) => {
  if (days === 0) return <span className="text-[10px] font-bold text-foreground">Today</span>;
  if (days === 1) return <span className="text-[10px] font-medium text-tertiary">Tomorrow</span>;
  if (days < 0)  return <span className="text-[10px] font-medium text-tertiary">Overdue</span>;
  return <span className="text-[10px] font-medium text-tertiary">in {days}d</span>;
};

export const CalendarWidget = () => {
  const { calendarEvents, selectedPortfolio } = useDashboard();
  const { formatAmount } = useCurrency();

  if (!selectedPortfolio) return null;

  const events = calendarEvents?.slice(0, 5) ?? [];
  const totalIncome = events.reduce((sum, e) => sum + (e.estimated_amount || 0), 0);

  return (
    <div className="bg-card rounded-[12px] card-shadow p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-tertiary">Upcoming Events</p>
        {events.length > 0 && (
          <span className="text-[11px] font-semibold text-emerald-500">+{formatAmount(totalIncome)}</span>
        )}
      </div>

      {!events.length ? (
        <div className="flex flex-col items-center justify-center py-8 gap-3">
          <div className="w-10 h-10 rounded-[10px] bg-muted flex items-center justify-center">
            <CalendarDays size={18} className="text-tertiary" />
          </div>
          <p className="text-[12px] text-tertiary font-medium">No upcoming events</p>
        </div>
      ) : (
        <div className="space-y-0">
          {events.map((event, i) => {
            const d = new Date(event.event_date);
            const days = getDaysUntil(event.event_date);
            const config = EVENT_CONFIG[event.event_type?.toUpperCase()] ?? EVENT_CONFIG.DIVIDEND;
            const isLast = i === events.length - 1;

            return (
              <div key={i} className="flex gap-3">
                {/* Timeline line */}
                <div className="flex flex-col items-center">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${config.dot}`} />
                  {!isLast && <div className="w-px flex-1 bg-border mt-1 mb-1" />}
                </div>

                {/* Content */}
                <div className={`flex items-start justify-between w-full ${!isLast ? "pb-3" : ""}`}>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-bold text-foreground">{event.asset_symbol}</span>
                      <span className={`inline-flex items-center px-1.5 py-px rounded-[4px] text-[9px] font-bold uppercase tracking-[0.08em] ${config.pill}`}>
                        {event.event_type}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-tertiary font-medium">
                        {d.toLocaleDateString("default", { day: "numeric", month: "short" })}
                      </span>
                      <DaysLabel days={days} />
                    </div>
                  </div>
                  <span className="text-[13px] font-mono font-semibold text-emerald-500 shrink-0 ml-3">
                    +{formatAmount(event.estimated_amount)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CalendarWidget;
