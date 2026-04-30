import React, { useState } from "react";
import Link from "next/link";
import { withAuth } from "@/features/utils/with-auth";
import {
  useGetPortfoliosQuery,
  useCreatePortfolioMutation,
} from "@/features/api/portfoliosApi";
import { Briefcase, Plus, ChevronRight, TrendingUp, X } from "lucide-react";

const cn = (...c) => c.filter(Boolean).join(" ");

const fmt = (v) => {
  if (v == null) return "—";
  const n = Number(v);
  if (isNaN(n)) return "—";
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }).format(n);
};

const SkeletonCard = () => (
  <div className="flex items-center justify-between px-4 py-4 bg-card">
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-xl bg-muted animate-pulse" />
      <div className="space-y-2">
        <div className="h-3 w-28 rounded bg-muted animate-pulse" />
        <div className="h-2.5 w-16 rounded bg-muted animate-pulse" />
      </div>
    </div>
    <div className="h-4 w-4 rounded bg-muted animate-pulse" />
  </div>
);

const CreatePortfolioModal = ({ onClose, onCreate }) => {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [createPortfolio, { isLoading }] = useCreatePortfolioMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await createPortfolio({ name: name.trim(), description: desc.trim() }).unwrap();
      onCreate();
      onClose();
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-[15px] font-bold">New Portfolio</h2>
          <button
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-[6px] hover:bg-muted transition"
          >
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground block mb-1.5">
              Portfolio Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. My DSE Portfolio"
              className="w-full h-10 px-3 bg-muted/50 border border-border rounded-md text-sm focus:outline-none focus:border-foreground/30 transition"
              required
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground block mb-1.5">
              Description (optional)
            </label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Short description…"
              rows={2}
              className="w-full px-3 py-2 bg-muted/50 border border-border rounded-md text-sm focus:outline-none focus:border-foreground/30 transition resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !name.trim()}
            className="w-full h-10 bg-foreground text-background text-[12px] font-bold rounded-[6px] hover:opacity-80 active:scale-95 transition disabled:opacity-40"
          >
            {isLoading ? "Creating…" : "Create Portfolio"}
          </button>
        </form>
      </div>
    </div>
  );
};

function PortfoliosPage() {
  const { data: response, isLoading } = useGetPortfoliosQuery();
  const [showCreate, setShowCreate] = useState(false);

  const portfolios = response?.data?.portfolios ?? [];

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <div className="max-w-screen-lg mx-auto px-4 sm:px-6 py-6">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">
              My Portfolios
            </p>
            <h1 className="text-2xl font-extrabold tracking-tight">Portfolios</h1>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="h-9 px-4 flex items-center gap-2 bg-foreground text-background text-[12px] font-bold rounded-[6px] hover:opacity-80 active:scale-95 transition"
          >
            <Plus size={15} /> New
          </button>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex flex-col divide-y divide-border rounded-xl border border-border overflow-hidden">
            {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : portfolios.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-5 py-24 text-center">
            <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
              <Briefcase size={28} className="text-muted-foreground/60" />
            </div>
            <div>
              <p className="font-semibold text-lg">No portfolios yet</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                Create your first portfolio to start tracking your investments.
              </p>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="h-10 px-6 flex items-center gap-2 bg-foreground text-background text-[12px] font-bold rounded-[6px] hover:opacity-80 active:scale-95 transition"
            >
              <Plus size={15} /> Create Portfolio
            </button>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-border rounded-xl border border-border overflow-hidden">
            {portfolios.map((portfolio) => (
              <Link
                key={portfolio.id}
                href="/dashboard"
                className="flex items-center justify-between px-4 py-4 bg-card hover:bg-muted/50 transition active:scale-[.99]"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                    <Briefcase size={18} className="text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold">{portfolio.name}</p>
                    {portfolio.description && (
                      <p className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                        {portfolio.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {portfolio.total_value != null && (
                    <div className="text-right hidden sm:block">
                      <p className="text-[13px] font-semibold">
                        TZS {fmt(portfolio.total_value)}
                      </p>
                      <p className="text-[11px] text-muted-foreground">Total value</p>
                    </div>
                  )}
                  <ChevronRight size={16} className="text-muted-foreground/50" />
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Quick link to full dashboard */}
        {portfolios.length > 0 && (
          <Link
            href="/dashboard"
            className="mt-4 flex items-center justify-center gap-2 h-10 rounded-lg border border-border text-sm font-medium hover:bg-muted transition"
          >
            <TrendingUp size={15} className="text-muted-foreground" />
            Open Dashboard
          </Link>
        )}
      </div>

      {showCreate && (
        <CreatePortfolioModal
          onClose={() => setShowCreate(false)}
          onCreate={() => {}}
        />
      )}
    </div>
  );
}

export default withAuth(PortfoliosPage);
