"use client";

import React, { useEffect, useState } from "react";
import { AddTransactionDialog } from "@/components/dashboard/AddTransactionDialog";
import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight, Plus, Building2, Wallet, MoreHorizontal, Pencil, Trash2, Banknote, Loader2 } from "lucide-react";
import { useDashboard } from "@/features/context/dashboard-context";
import { useCurrency } from "@/features/context/currency-context";
import { getStockLogoUrl } from "@/lib/stockLogos";
import { useToast } from "@/components/ui/use-toast";
import {
  useDeleteBondHoldingMutation,
  useDeleteFundHoldingMutation,
  useDeleteStockHoldingMutation,
  useSellBondFromPortfolioMutation,
  useSellFundFromPortfolioMutation,
  useSellStockFromPortfolioMutation,
  useUpdateBondHoldingMutation,
  useUpdateFundHoldingMutation,
  useUpdateStockHoldingMutation,
} from "@/features/api/portfoliosApi";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const BOND_LOGO_URL = "/bonds/treasury-bond.svg";
const todayInputValue = () => new Date().toISOString().slice(0, 10);
const cleanNumber = (value) => String(value ?? "").replace(/,/g, "");
const formatInputNumber = (value) => {
  if (value === null || value === undefined || value === "") return "";
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? String(numberValue) : "";
};
const formatDate = (value) => {
  if (!value) return "n/a";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "n/a";
  return date.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
};
const formatQuantity = (value, assetType) => {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return "0";
  const maximumFractionDigits = assetType === "STOCK" ? 0 : 2;
  return numberValue.toLocaleString(undefined, { maximumFractionDigits });
};
const getAssetType = (pos) => String(pos?.asset_type || "").toUpperCase();
const getQuantityLabel = (assetType) => {
  if (assetType === "BOND") return "Face Value / Nominal";
  if (assetType === "FUND") return "Units";
  return "Quantity";
};
const getPriceLabel = (assetType, mode) => {
  if (assetType === "BOND") return mode === "liquidate" ? "Sale Price %" : "Average Cost %";
  if (assetType === "FUND") return mode === "liquidate" ? "Sale NAV" : "Average NAV";
  return mode === "liquidate" ? "Sale Price" : "Average Buy Price";
};

const PositionLogo = ({ pos }) => {
  const [failed, setFailed] = useState(false);
  const assetType = String(pos.asset_type || "").toUpperCase();
  const isStock = assetType === "STOCK";
  const isBond = assetType === "BOND";
  const logoUrl = isStock ? getStockLogoUrl(pos.asset_symbol, pos.logo_url) : (isBond ? BOND_LOGO_URL : null);

  if (logoUrl && !failed) {
    return (
      <div className="h-9 w-9 rounded-[8px] bg-white border border-border/60 flex items-center justify-center shrink-0 overflow-hidden">
        <img
          src={logoUrl}
          alt={isBond ? "Treasury bond logo" : `${pos.asset_symbol} logo`}
          className="h-full w-full object-contain"
          onError={() => setFailed(true)}
        />
      </div>
    );
  }

  return (
    <div className="h-9 w-9 rounded-[8px] bg-muted flex items-center justify-center text-muted-foreground shrink-0">
      {isStock ? <Building2 size={16} /> : <Wallet size={16} />}
    </div>
  );
};

const PositionItem = ({ pos, formatAmount, onAction }) => {
  const isPositive = pos.profit_loss >= 0;
  const assetType = getAssetType(pos);
  return (
    <tr className="group border-b border-border/80 last:border-0 hover:bg-background/80 transition-colors">
      <td className="min-w-[220px] px-5 py-3.5">
        <div className="flex items-center gap-3.5">
        <PositionLogo pos={pos} />
        <div>
          <div className="text-[13px] font-bold text-foreground">{pos.asset_symbol}</div>
            <div className="max-w-[190px] truncate text-[11px] text-tertiary font-medium">{pos.asset_name}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5 text-[12px] font-semibold text-muted-foreground whitespace-nowrap">{formatDate(pos.opened_date)}</td>
      <td className="px-4 py-3.5 text-[12px] text-muted-foreground whitespace-nowrap">{assetType}</td>
      <td className="px-4 py-3.5 text-right font-mono text-[12px] text-foreground whitespace-nowrap">{formatQuantity(pos.quantity, assetType)}</td>
      <td className="px-4 py-3.5 text-right font-mono text-[12px] text-muted-foreground whitespace-nowrap">{formatAmount(pos.avg_buy_price)}</td>
      <td className="px-4 py-3.5 text-right font-mono text-[12px] font-semibold text-foreground whitespace-nowrap">{formatAmount(pos.current_value)}</td>
      <td className="px-4 py-3.5 text-right whitespace-nowrap">
        <div className={cn("inline-flex items-center justify-end gap-1 rounded-full px-2 py-1 text-[11px] font-bold", isPositive ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500")}>
          {isPositive ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
          {formatAmount(pos.profit_loss)} ({pos.profit_loss_percent}%)
        </div>
      </td>
      <td className="w-12 px-3 py-3.5 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="h-8 w-8 flex items-center justify-center rounded-[6px] text-tertiary hover:bg-muted hover:text-foreground transition-colors"
              aria-label={`Open actions for ${pos.asset_symbol}`}
            >
              <MoreHorizontal size={16} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-card border-border text-foreground">
            <DropdownMenuItem onSelect={() => onAction("edit", pos)} className="cursor-pointer">
              <Pencil size={14} />
              Edit position
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onAction("liquidate", pos)} className="cursor-pointer">
              <Banknote size={14} />
              Liquidate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => onAction("delete", pos)} variant="destructive" className="cursor-pointer">
              <Trash2 size={14} />
              Delete position
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
};

const PositionActionDialog = ({ open, mode, position, portfolioId, onOpenChange }) => {
  const { toast } = useToast();
  const assetType = getAssetType(position);
  const [form, setForm] = useState({
    quantity: "",
    price: "",
    date: todayInputValue(),
    notes: "",
  });

  const [updateStock, { isLoading: isUpdatingStock }] = useUpdateStockHoldingMutation();
  const [updateFund, { isLoading: isUpdatingFund }] = useUpdateFundHoldingMutation();
  const [updateBond, { isLoading: isUpdatingBond }] = useUpdateBondHoldingMutation();
  const [sellStock, { isLoading: isSellingStock }] = useSellStockFromPortfolioMutation();
  const [sellFund, { isLoading: isSellingFund }] = useSellFundFromPortfolioMutation();
  const [sellBond, { isLoading: isSellingBond }] = useSellBondFromPortfolioMutation();
  const [deleteStock, { isLoading: isDeletingStock }] = useDeleteStockHoldingMutation();
  const [deleteFund, { isLoading: isDeletingFund }] = useDeleteFundHoldingMutation();
  const [deleteBond, { isLoading: isDeletingBond }] = useDeleteBondHoldingMutation();

  const isBusy = isUpdatingStock || isUpdatingFund || isUpdatingBond || isSellingStock || isSellingFund || isSellingBond || isDeletingStock || isDeletingFund || isDeletingBond;

  useEffect(() => {
    if (!position) return;
    setForm({
      quantity: formatInputNumber(position.quantity),
      price: formatInputNumber(mode === "liquidate" ? position.current_price : position.avg_buy_price),
      date: todayInputValue(),
      notes: "",
    });
  }, [position, mode]);

  if (!position) return null;

  const title = mode === "edit"
    ? "Edit Position"
    : mode === "liquidate"
      ? "Liquidate Position"
      : "Delete Position";
  const quantity = parseFloat(cleanNumber(form.quantity)) || 0;
  const price = parseFloat(cleanNumber(form.price)) || 0;
  const canSubmit = mode === "delete" || (quantity > 0 && price > 0 && form.date);

  const closeWithSuccess = (description) => {
    toast({
      title: "Position updated",
      description,
      className: "bg-card border-border text-foreground",
    });
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    if (!portfolioId || !position || !canSubmit || isBusy) return;
    try {
      if (mode === "edit") {
        if (assetType === "STOCK") {
          await updateStock({
            portfolioId,
            stockId: position.asset_id,
            stockData: {
              quantity,
              purchase_price: price,
              purchase_date: form.date,
              notes: form.notes || undefined,
            },
          }).unwrap();
        } else if (assetType === "FUND") {
          await updateFund({
            portfolioId,
            fundId: position.asset_id,
            fundData: {
              units_held: quantity,
              purchase_price: price,
              purchase_date: form.date,
              notes: form.notes || undefined,
            },
          }).unwrap();
        } else if (assetType === "BOND") {
          await updateBond({
            portfolioId,
            bondId: position.asset_id,
            bondData: {
              face_value_held: quantity,
              purchase_price: (quantity * price) / 100,
              purchase_date: form.date,
              notes: form.notes || undefined,
            },
          }).unwrap();
        }
        closeWithSuccess("Your position correction has been saved.");
      } else if (mode === "liquidate") {
        if (assetType === "STOCK") {
          await sellStock({
            portfolioId,
            stockId: position.asset_id,
            sellData: {
              quantity,
              sell_price: price,
              sell_date: form.date,
              notes: form.notes || "Liquidated position",
            },
          }).unwrap();
        } else if (assetType === "FUND") {
          await sellFund({
            portfolioId,
            fundId: position.asset_id,
            sellData: {
              units_to_sell: quantity,
              sell_price: price,
              sell_date: form.date,
              notes: form.notes || "Liquidated position",
            },
          }).unwrap();
        } else if (assetType === "BOND") {
          await sellBond({
            portfolioId,
            bondId: position.asset_id,
            sellData: {
              face_value_to_sell: quantity,
              sell_price: (quantity * price) / 100,
              sell_date: form.date,
              notes: form.notes || "Liquidated position",
            },
          }).unwrap();
        }
        closeWithSuccess("A sell transaction was recorded for the full position.");
      } else if (mode === "delete") {
        if (assetType === "STOCK") {
          await deleteStock({ portfolioId, stockId: position.asset_id }).unwrap();
        } else if (assetType === "FUND") {
          await deleteFund({ portfolioId, fundId: position.asset_id }).unwrap();
        } else if (assetType === "BOND") {
          await deleteBond({ portfolioId, bondId: position.asset_id }).unwrap();
        }
        closeWithSuccess("The position and its transactions were removed.");
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Could not update position",
        description: error?.data?.message || "Please check the values and try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border text-foreground sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {mode === "delete"
              ? "This removes the holding and its transaction history from this portfolio."
              : `${position.asset_symbol} - ${position.asset_name}`}
          </DialogDescription>
        </DialogHeader>

        {mode === "delete" ? (
          <div className="rounded-[8px] border border-destructive/30 bg-destructive/10 p-3 text-[13px] text-foreground">
            Delete <strong>{position.asset_symbol}</strong>? This is best for mistaken entries. Use liquidate if you actually sold the asset.
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-[0.1em] text-tertiary">{getQuantityLabel(assetType)}</label>
              <input
                type="text"
                inputMode="decimal"
                value={form.quantity}
                disabled={mode === "liquidate"}
                onChange={(e) => setForm(prev => ({ ...prev, quantity: cleanNumber(e.target.value) }))}
                className="w-full h-10 bg-background border border-border text-[13px] text-foreground rounded-[6px] px-3 disabled:opacity-70"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-[0.1em] text-tertiary">{getPriceLabel(assetType, mode)}</label>
              <input
                type="text"
                inputMode="decimal"
                value={form.price}
                onChange={(e) => setForm(prev => ({ ...prev, price: cleanNumber(e.target.value) }))}
                className="w-full h-10 bg-background border border-border text-[13px] text-foreground rounded-[6px] px-3"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-[0.1em] text-tertiary">{mode === "liquidate" ? "Sell Date" : "Correction Date"}</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm(prev => ({ ...prev, date: e.target.value }))}
                className="w-full h-10 bg-background border border-border text-[13px] text-foreground rounded-[6px] px-3"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-[0.1em] text-tertiary">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Optional"
                className="min-h-20 w-full bg-background border border-border text-[13px] text-foreground rounded-[6px] px-3 py-2 resize-none"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="h-10 px-4 rounded-[6px] border border-border text-[13px] font-bold text-foreground hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || isBusy}
            className={cn(
              "h-10 px-4 rounded-[6px] text-[13px] font-bold flex items-center justify-center gap-2",
              mode === "delete"
                ? "bg-destructive text-destructive-foreground hover:opacity-90"
                : "bg-foreground text-background hover:opacity-90",
              (!canSubmit || isBusy) && "opacity-60 cursor-not-allowed"
            )}
          >
            {isBusy && <Loader2 size={14} className="animate-spin" />}
            {mode === "edit" ? "Save Changes" : mode === "liquidate" ? "Liquidate" : "Delete"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const PositionsWidget = () => {
  const { positions, isLoadingPositions, selectedPortfolio, selectedPortfolioId } = useDashboard();
  const { formatAmount } = useCurrency();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [positionAction, setPositionAction] = useState({ open: false, mode: null, position: null });

  const openPositionAction = (mode, position) => {
    setPositionAction({ open: true, mode, position });
  };

  const closePositionAction = (open) => {
    setPositionAction(prev => ({ ...prev, open }));
  };

  if (isLoadingPositions) return <div className="h-[300px] w-full bg-card rounded-[12px] card-shadow animate-pulse" />;
  if (!selectedPortfolio) return null;

  return (
    <>
      <div className="bg-card rounded-[12px] card-shadow overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Positions</span>
          <button onClick={() => setIsAddDialogOpen(true)}
            className="h-7 w-7 flex items-center justify-center rounded-[6px] bg-muted hover:bg-accent text-muted-foreground transition"
          >
            <Plus size={14} />
          </button>
        </div>
        <div>
          {positions.length === 0
            ? <div className="px-5 py-10 text-center text-[13px] text-tertiary font-medium">No positions yet. Add a transaction to get started.</div>
            : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] border-collapse">
                  <thead className="bg-background/60">
                    <tr className="border-b border-border">
                      <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-[0.14em] text-tertiary">Asset</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.14em] text-tertiary">Opened</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.14em] text-tertiary">Type</th>
                      <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-[0.14em] text-tertiary">Quantity</th>
                      <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-[0.14em] text-tertiary">Avg Cost</th>
                      <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-[0.14em] text-tertiary">Value</th>
                      <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-[0.14em] text-tertiary">P/L</th>
                      <th className="px-3 py-3 text-right text-[10px] font-bold uppercase tracking-[0.14em] text-tertiary">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {positions.map((pos, i) => (
                      <PositionItem
                        key={`${pos.asset_id}-${i}`}
                        pos={pos}
                        formatAmount={formatAmount}
                        onAction={openPositionAction}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }
        </div>
      </div>
      {selectedPortfolioId && <AddTransactionDialog isOpen={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} portfolioIdFromWidget={selectedPortfolioId} />}
      {selectedPortfolioId && (
        <PositionActionDialog
          open={positionAction.open}
          mode={positionAction.mode}
          position={positionAction.position}
          portfolioId={selectedPortfolioId}
          onOpenChange={closePositionAction}
        />
      )}
    </>
  );
};

export default PositionsWidget;
