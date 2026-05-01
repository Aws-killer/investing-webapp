"use client";

import React from "react";
import { MessageSquarePlus, ArrowRight } from "lucide-react";

const SUGGESTIONS = [
  "Which holding is adding the most risk?",
  "Summarize my next income events.",
  "Where am I most concentrated?",
];

export const MarketAiWidget = () => (
  <div className="rounded-[22px] border border-border/70 bg-background/60 p-5">
    <div className="mb-4 flex items-center gap-2">
      <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-card text-foreground">
        <MessageSquarePlus size={18} />
      </div>
      <div>
        <h2 className="text-lg font-semibold tracking-[-0.03em] text-foreground">Ask Uwekezaji AI</h2>
        <p className="text-sm text-muted-foreground">Start with a portfolio question and turn this into an analyst chat.</p>
      </div>
    </div>

    <div className="rounded-[20px] border border-border/70 bg-card/70 p-4">
      <div className="flex items-center justify-between rounded-[16px] border border-border/70 bg-background/70 px-4 py-3 text-sm text-muted-foreground">
        <span>Ask anything about this portfolio</span>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-card text-foreground">
          <ArrowRight size={15} />
        </span>
      </div>

      <div className="mt-4 space-y-2">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            className="w-full rounded-[14px] border border-border/70 bg-background/60 px-3 py-2 text-left text-sm text-muted-foreground transition hover:bg-background hover:text-foreground"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  </div>
);

export default MarketAiWidget;
