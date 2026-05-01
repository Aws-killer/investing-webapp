"use client";

import React, { useState } from "react";
import { useDashboard } from "@/features/context/dashboard-context";
import { useCurrency } from "@/features/context/currency-context";
import { ChevronDown, ChevronUp, FileText, Landmark, TrendingUp } from "lucide-react";
import { getStockLogoUrl } from "@/lib/stockLogos";

const formatDate = (value) => {
  if (!value) return "TBD";
  return new Date(value).toLocaleDateString();
};

const SummaryLogo = ({ symbol, logoUrl }) => {
  const [failed, setFailed] = useState(false);
  const displayLogoUrl = getStockLogoUrl(symbol, logoUrl);

  if (!displayLogoUrl || failed) {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-muted text-[10px] font-semibold text-muted-foreground">
        {symbol?.slice(0, 3) || "N/A"}
      </div>
    );
  }

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-white">
      <img
        src={displayLogoUrl}
        alt={`${symbol} logo`}
        className="h-full w-full object-contain"
        onError={() => setFailed(true)}
      />
    </div>
  );
};

export const MarketSummaryWidget = () => {
  const { marketHighlights, isLoadingMarketHighlights } = useDashboard();
  const { formatAmount } = useCurrency();
  const [openIndex, setOpenIndex] = useState(0);

  if (isLoadingMarketHighlights) {
    return <div className="h-[320px] w-full animate-pulse rounded-[22px] border border-border/70 bg-card/60" />;
  }

  const actions = marketHighlights?.corporate_actions || [];
  const gainers = marketHighlights?.top_gainers || [];
  const mostActive = marketHighlights?.most_active || [];

  const items = [
    gainers[0] && {
      title: `${gainers[0].symbol} leads the market board`,
      meta: "Top gainer",
      body: `${gainers[0].symbol} last traded at ${formatAmount(gainers[0].market_price || 0)} with a move of ${
        gainers[0].percentage_change?.toFixed?.(2) ?? gainers[0].percentage_change
      }%.`,
      icon: <TrendingUp size={11} />,
      symbol: gainers[0].symbol,
      logo_url: gainers[0].logo_url,
    },
    mostActive[0] && {
      title: `${mostActive[0].symbol} is the most active counter`,
      meta: "Volume leader",
      body: `${mostActive[0].symbol} printed ${Number(
        mostActive[0].volume || 0
      ).toLocaleString()} shares with turnover of ${formatAmount(mostActive[0].turnover || 0)}.`,
      icon: <Landmark size={11} />,
      symbol: mostActive[0].symbol,
      logo_url: mostActive[0].logo_url,
    },
    ...actions.slice(0, 4).map((action) => ({
      title: `${action.symbol} ${String(action.action_type || "Corporate Action").toLowerCase()}`,
      meta: "Corporate action",
      body: `${action.headline}${action.books_closure_date ? ` Books closure: ${formatDate(action.books_closure_date)}.` : ""}${
        action.payment_date ? ` Payment: ${formatDate(action.payment_date)}.` : ""
      }`,
      icon: <FileText size={11} />,
      document_url: action.document_url,
      symbol: action.symbol,
      logo_url: action.logo_url,
    })),
  ].filter(Boolean);

  if (!items.length) {
    return (
      <div className="rounded-[22px] border border-border/70 bg-background/60 p-5">
        <h2 className="text-lg font-semibold tracking-[-0.03em] text-foreground">Market Summary</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          No backend market highlights are available yet. Run the DSE sync and this panel will populate with live corporate actions and market leaders.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[22px] border border-border/70 bg-background/60 p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-[-0.03em] text-foreground">Market Summary</h2>
          <p className="text-sm text-muted-foreground">Backend-synced market movers and DSE corporate actions.</p>
        </div>
        <div className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">
          Trading date {marketHighlights?.trading_date ? formatDate(marketHighlights.trading_date) : "unavailable"}
        </div>
      </div>

      <div className="overflow-hidden rounded-[20px] border border-border/70 bg-card/70">
        {items.map((item, index) => {
          const isOpen = index === openIndex;
          return (
            <button
              key={`${item.title}-${index}`}
              type="button"
              onClick={() => setOpenIndex(isOpen ? -1 : index)}
              className="w-full border-b border-border/70 px-5 py-4 text-left transition last:border-b-0 hover:bg-background/80"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <SummaryLogo symbol={item.symbol} logoUrl={item.logo_url} />
                  <div className="min-w-0">
                    <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {item.icon}
                      {item.meta}
                    </div>
                    <p className="text-base font-medium tracking-[-0.03em] text-foreground">{item.title}</p>
                    {isOpen && (
                      <div className="mt-3 space-y-2">
                        <p className="max-w-4xl text-sm leading-6 text-muted-foreground">{item.body}</p>
                        {item.document_url && (
                          <a
                            href={item.document_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline"
                          >
                            Open attachment
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="shrink-0 text-muted-foreground">
                  {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MarketSummaryWidget;
