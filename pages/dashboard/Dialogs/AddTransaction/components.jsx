"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/features/context/currency-context";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, Check, ChevronsUpDown, ArrowRightLeft, TrendingUp, RefreshCw, AlertTriangle } from "lucide-react";
import { useTransactionContext, ASSET_TYPES } from "./context";

const FieldLabel = ({ children, className }) => (
  <label className={cn("text-[11px] font-bold uppercase tracking-[0.1em] text-tertiary", className)}>{children}</label>
);

const FieldInput = React.forwardRef(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "w-full h-10 bg-background border border-border text-[13px] text-foreground rounded-[6px] px-3",
      "focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-tertiary",
      className
    )}
    {...props}
  />
));
FieldInput.displayName = "FieldInput";

const parseMaturityYears = (value) => {
  const match = String(value || "").match(/\d+(\.\d+)?/);
  return match ? parseFloat(match[0]) : null;
};

const yearsBetweenDates = (start, end) => {
  const startDate = start ? new Date(`${start}T00:00:00`) : null;
  const endDate = end ? new Date(`${end}T00:00:00`) : null;
  if (!startDate || !endDate || Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return null;
  return (endDate.getTime() - startDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
};

const getBondIssueMismatch = ({ maturityYears, effectiveDate, maturityDate }) => {
  const expectedYears = parseMaturityYears(maturityYears);
  const actualYears = yearsBetweenDates(effectiveDate, maturityDate);
  if (!expectedYears || !actualYears || actualYears <= 0) return null;
  const missingYears = expectedYears - actualYears;
  if (missingYears < 1) return null;
  return {
    expectedYears,
    actualYears,
    missingYears,
  };
};

// --- 1. ASSET TABS ---
export const AssetTypeTabs = () => {
  const { formData, handleTabChange } = useTransactionContext();
  return (
    <div className="border-b border-border">
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex space-x-5 px-5">
          {ASSET_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => handleTabChange(type)}
              className={cn(
                "pb-3 text-[11px] font-bold uppercase tracking-[0.1em] border-b-2 transition-all",
                formData.assetType === type.id
                  ? "border-foreground text-foreground"
                  : "border-transparent text-tertiary hover:text-muted-foreground"
              )}
            >
              {type.label}
            </button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" className="h-1 opacity-0" />
      </ScrollArea>
    </div>
  );
};

// --- 2. TRANSACTION TYPE ---
export const TransactionTypeSelect = () => {
  const { formData, setFormData } = useTransactionContext();
  return (
    <div className="space-y-1.5">
      <FieldLabel>Transaction Type</FieldLabel>
      <Select
        value={formData.transactionMode}
        onValueChange={(v) => setFormData(prev => ({ ...prev, transactionMode: v, assetId: "" }))}
      >
        <SelectTrigger className="h-10 bg-background border-border text-[13px] text-foreground focus:ring-2 focus:ring-ring rounded-[6px]">
          <SelectValue placeholder="Select Type" />
        </SelectTrigger>
        <SelectContent className="bg-card border-border text-foreground">
          <SelectItem value="BUY">Buy</SelectItem>
          <SelectItem value="SELL">Sell</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

// --- 3. ASSET SEARCH ---
export const AssetSearch = () => {
  const { formData, setFormData, availableAssets, isLoadingAssets } = useTransactionContext();
  const [open, setOpen] = useState(false);
  const assetLabel = ASSET_TYPES.find(t => t.id === formData.assetType)?.label;
  const isBond = formData.assetType === "BOND";

  if (formData.assetType === "BOND" && formData.addBondFromStatement && formData.transactionMode === "BUY") {
    return null;
  }

  const getBondLabel = (bond) => {
    const auction = bond.auction_number || bond.bond_auction_number || bond.id;
    const maturity = bond.maturity_years || "Bond";
    const coupon = bond.coupon_rate ? `${bond.coupon_rate}%` : "coupon n/a";
    return `Auction ${auction} - ${maturity} - ${coupon}`;
  };

  return (
    <div className="space-y-1.5">
      <FieldLabel>{isBond ? "Select Bond by Auction Number" : `Select ${assetLabel}`}</FieldLabel>
      <Popover open={open} onOpenChange={setOpen} modal={true}>
        <PopoverTrigger asChild>
          <button
            className="w-full min-h-10 flex items-center justify-between bg-background border border-border text-[13px] rounded-[6px] px-3 py-2 hover:border-foreground/30 transition-colors"
          >
            {formData.assetName
              ? <span className="font-semibold text-foreground text-left">{formData.assetName}</span>
              : <span className="text-tertiary">{isBond ? "Search auction number..." : "Search..."}</span>}
            <ChevronsUpDown size={14} className="text-tertiary shrink-0 ml-2" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-card border-border shadow-2xl z-[9999] rounded-[8px] overflow-hidden">
          <Command className="bg-card text-foreground">
            <CommandInput
              placeholder={isBond ? "Search auction number, maturity, coupon..." : `Search ${assetLabel}...`}
              className="text-[13px] text-foreground placeholder:text-tertiary"
            />
            <CommandList className="max-h-[220px] p-1">
              <CommandEmpty className="py-6 text-center text-[13px] text-tertiary">
                {isLoadingAssets
                  ? <span className="flex items-center justify-center gap-2"><Loader2 size={14} className="animate-spin" /> Loading...</span>
                  : "No assets found."}
              </CommandEmpty>
              <CommandGroup>
                {availableAssets.map((item) => {
                  const ticker = isBond ? String(item.auction_number || item.bond_auction_number || item.isin || "") : (item.symbol || item.isin || "");
                  const name = isBond ? getBondLabel(item) : (item.name || ticker);
                  const bondSearchText = isBond
                    ? [
                        item.auction_number,
                        item.bond_auction_number,
                        item.holding_number,
                        item.maturity_years,
                        item.maturity_date,
                        item.effective_date,
                        item.coupon_rate,
                        item.isin,
                      ].filter(Boolean).join(" ")
                    : "";
                  const isSelected = formData.assetId === String(item.id);
                  return (
                    <CommandItem
                      key={String(item.id)}
                      value={isBond ? `${name} ${bondSearchText}` : `${name} ${ticker}`}
                      onSelect={() => {
                        setFormData(prev => ({
                          ...prev,
                          assetId: String(item.id),
                          assetSymbol: ticker,
                          assetName: name,
                          instrumentType: isBond ? (item.instrument_type || prev.instrumentType) : prev.instrumentType,
                          maturityYears: isBond ? (item.maturity_years || prev.maturityYears) : prev.maturityYears,
                          maturityDate: isBond ? (item.maturity_date || prev.maturityDate) : prev.maturityDate,
                          effectiveDate: isBond ? (item.effective_date || prev.effectiveDate) : prev.effectiveDate,
                          dtm: isBond && item.dtm != null ? String(item.dtm) : prev.dtm,
                          auctionNumber: isBond && item.auction_number != null ? String(item.auction_number) : prev.auctionNumber,
                          bondAuctionNumber: isBond && item.bond_auction_number != null ? String(item.bond_auction_number) : prev.bondAuctionNumber,
                          couponRate: isBond && item.coupon_rate != null ? String(item.coupon_rate) : prev.couponRate,
                          addBondFromStatement: false,
                        }));
                        setOpen(false);
                      }}
                      className="data-[selected=true]:bg-muted text-foreground cursor-pointer py-2.5 px-3 text-[13px] rounded-[6px] gap-2"
                    >
                      <Check size={13} className={cn("shrink-0 transition-opacity", isSelected ? "opacity-100" : "opacity-0")} />
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-[13px] text-foreground">{isBond ? `Auction ${ticker}` : ticker}</span>
                        <span className="text-[11px] text-tertiary truncate">{name}</span>
                        {isBond && (
                          <span className="text-[10px] text-tertiary truncate">
                            Effective {item.effective_date || "n/a"} - Matures {item.maturity_date || "n/a"} - DTM {item.dtm ?? "n/a"}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export const BondStatementFields = () => {
  const { formData, setFormData } = useTransactionContext();
  if (formData.assetType !== "BOND" || formData.transactionMode !== "BUY") return null;

  const update = (key, value) => setFormData(prev => ({ ...prev, [key]: value }));
  const hasSelectedBond = Boolean(formData.assetId);
  const showManualFields = formData.addBondFromStatement || formData.secondaryMarket;
  const issueMismatch = hasSelectedBond && !formData.addBondFromStatement
    ? getBondIssueMismatch(formData)
    : null;
  const enterOriginalIssueMode = () => {
    setFormData(prev => ({
      ...prev,
      assetId: "",
      assetSymbol: "",
      assetName: "",
      addBondFromStatement: true,
      secondaryMarket: false,
    }));
  };

  return (
    <div className="space-y-3 rounded-[10px] border border-border bg-background/60 p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <FieldLabel>Bond identity</FieldLabel>
          <p className="mt-1 text-[11px] text-tertiary">
            Search by auction number above. Use manual mode only if the bond is missing or reissued.
          </p>
        </div>
        <Switch
          checked={formData.addBondFromStatement}
          onCheckedChange={(checked) => {
            setFormData(prev => ({
              ...prev,
              addBondFromStatement: checked,
              assetId: checked ? "" : prev.assetId,
              assetSymbol: checked ? "" : prev.assetSymbol,
              assetName: checked ? "" : prev.assetName,
              secondaryMarket: checked ? false : prev.secondaryMarket,
            }));
          }}
          className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-muted"
        />
      </div>

      {hasSelectedBond && !formData.addBondFromStatement && (
        <div className="rounded-[8px] border border-border bg-card/70 p-3">
          <FieldLabel>Selected auction details</FieldLabel>
          <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-tertiary">
            <span>Auction no.</span>
            <span className="text-right font-semibold text-foreground">{formData.auctionNumber || "n/a"}</span>
            <span>Issue / effective date</span>
            <span className="text-right font-semibold text-foreground">{formData.effectiveDate || "n/a"}</span>
            <span>Maturity date</span>
            <span className="text-right font-semibold text-foreground">{formData.maturityDate || "n/a"}</span>
            <span>Coupon</span>
            <span className="text-right font-semibold text-foreground">{formData.couponRate ? `${formData.couponRate}%` : "n/a"}</span>
          </div>
          <p className="mt-2 text-[11px] leading-4 text-tertiary">
            If the auction number has multiple issue dates, search the auction number and choose the row with the correct effective date.
          </p>
          {issueMismatch && (
            <div className="mt-3 rounded-[8px] border border-amber-500/40 bg-amber-500/10 p-3 text-amber-200">
              <div className="flex items-start gap-2">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                <div className="space-y-2">
                  <p className="text-[11px] leading-4">
                    This looks like a reissue. The selected dates run for about {issueMismatch.actualYears.toFixed(1)} years,
                    but the bond is labelled {issueMismatch.expectedYears.toLocaleString()} years. If your statement shows an older effective
                    date, add that original issue record manually.
                  </p>
                  <button
                    type="button"
                    onClick={enterOriginalIssueMode}
                    className="text-[11px] font-bold text-amber-100 underline underline-offset-4 hover:text-foreground"
                  >
                    Enter original issue details
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 rounded-[8px] border border-border p-3">
        <div>
          <FieldLabel>Secondary market / manual date</FieldLabel>
          <p className="mt-1 text-[11px] text-tertiary">
            Turn this on if your buy needs a manually selected issue record. Your actual buy date is still the transaction date below.
          </p>
        </div>
        <Switch
          checked={formData.secondaryMarket}
          onCheckedChange={(checked) => update("secondaryMarket", checked)}
          className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-muted"
        />
      </div>

      {!showManualFields && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <FieldLabel>Status</FieldLabel>
            <FieldInput value={formData.holdingStatus} onChange={(e) => update("holdingStatus", e.target.value)} placeholder="FREE" />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Holding No.</FieldLabel>
            <FieldInput type="text" inputMode="numeric" value={formData.holdingNumber} onChange={(e) => update("holdingNumber", e.target.value)} placeholder="184837" />
          </div>
        </div>
      )}

      {showManualFields && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <FieldLabel>Instrument</FieldLabel>
            <FieldInput value={formData.instrumentType} onChange={(e) => update("instrumentType", e.target.value)} placeholder="TBond" />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Status</FieldLabel>
            <FieldInput value={formData.holdingStatus} onChange={(e) => update("holdingStatus", e.target.value)} placeholder="FREE" />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Maturity</FieldLabel>
            <FieldInput value={formData.maturityYears} onChange={(e) => update("maturityYears", e.target.value)} placeholder="20 Years" />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Coupon Rate</FieldLabel>
            <FieldInput type="text" inputMode="decimal" value={formData.couponRate} onChange={(e) => update("couponRate", e.target.value)} placeholder="15.49" />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Effective Date</FieldLabel>
            <FieldInput type="date" value={formData.effectiveDate} onChange={(e) => update("effectiveDate", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Maturity Date</FieldLabel>
            <FieldInput type="date" value={formData.maturityDate} onChange={(e) => update("maturityDate", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>DTM</FieldLabel>
            <FieldInput type="text" inputMode="numeric" value={formData.dtm} onChange={(e) => update("dtm", e.target.value)} placeholder="5123" />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Auction No.</FieldLabel>
            <FieldInput type="text" inputMode="numeric" value={formData.auctionNumber} onChange={(e) => update("auctionNumber", e.target.value)} placeholder="498" />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Bond/Auction No.</FieldLabel>
            <FieldInput type="text" inputMode="numeric" value={formData.bondAuctionNumber} onChange={(e) => update("bondAuctionNumber", e.target.value)} placeholder="498" />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Holding No.</FieldLabel>
            <FieldInput type="text" inputMode="numeric" value={formData.holdingNumber} onChange={(e) => update("holdingNumber", e.target.value)} placeholder="184837" />
          </div>
        </div>
      )}
    </div>
  );
};

// --- 4. CALCULATOR INPUTS ---
export const CalculatorInputs = () => {
  const {
    formData, inputByTotal, setInputByTotal, totalAmountInput,
    handleQuantityChange, handleTotalChange, handlePriceChange,
    isFetchingPrice, isRefreshing,
    fetchedPrice, applyFetchedPrice,
    canLookupPrice, refreshPrices,
  } = useTransactionContext();
  const { currencySymbol } = useCurrency();

  const isBond = formData.assetType === "BOND";
  const isStock = formData.assetType === "STOCK";

  const getUnitLabel = () => {
    if (inputByTotal) return currencySymbol;
    if (isBond) return "Nominal";
    if (isStock) return "Shares";
    return "Units";
  };

  const formatDisplayValue = (val) => {
    if (!val) return "";
    const parts = val.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  };

  const handleInputChange = (value, handler) => {
    const cleanValue = value.replace(/,/g, "");
    if (cleanValue === "" || /^\d*\.?\d*$/.test(cleanValue)) handler(cleanValue);
  };

  return (
    <>
      <div className="flex items-center justify-end gap-2">
        <Label htmlFor="calc-mode" className="text-[11px] text-tertiary cursor-pointer">By total amount</Label>
        <Switch
          id="calc-mode"
          checked={inputByTotal}
          onCheckedChange={setInputByTotal}
          className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-muted"
        />
      </div>

      <div className="space-y-1.5">
        <FieldLabel className="flex items-center gap-1.5">
          {inputByTotal ? "Total Amount" : (isBond ? "Nominal Amount" : (isStock ? "Quantity (Shares)" : "Quantity (Units)"))}
          <ArrowRightLeft size={10} className="text-tertiary" />
        </FieldLabel>
        <div className="relative">
          <FieldInput
            type="text"
            inputMode="decimal"
            value={formatDisplayValue(inputByTotal ? totalAmountInput : formData.quantity)}
            onChange={(e) => handleInputChange(e.target.value, inputByTotal ? handleTotalChange : handleQuantityChange)}
            className="pr-16"
            placeholder={isBond && !inputByTotal ? "e.g. 1,000" : "0"}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-tertiary pointer-events-none">
            {getUnitLabel()}
          </span>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <FieldLabel>{isBond ? "Price Percentage" : "Price per unit"}</FieldLabel>
          {canLookupPrice && (
            isFetchingPrice || isRefreshing ? (
              <span className="flex items-center gap-1 text-[10px] text-link font-medium">
                <Loader2 size={9} className="animate-spin" />
                {isRefreshing ? "Refreshing data…" : "Fetching price…"}
              </span>
            ) : fetchedPrice ? (
              <button
                type="button"
                onClick={applyFetchedPrice}
                className="flex items-center gap-1 text-[10px] font-bold text-link hover:text-foreground transition-colors"
              >
                <TrendingUp size={10} />
                Use {fetchedPrice.label}: {parseFloat(fetchedPrice.value).toLocaleString()}
                {fetchedPrice.date && <span className="font-normal text-tertiary ml-0.5">({fetchedPrice.date})</span>}
              </button>
            ) : (formData.assetId || formData.assetSymbol) ? (
              <button
                type="button"
                onClick={refreshPrices}
                className="flex items-center gap-1 text-[10px] font-bold text-tertiary hover:text-foreground transition-colors"
              >
                <RefreshCw size={9} />
                No data — refresh prices
              </button>
            ) : null
          )}
        </div>
        <div className="relative">
          <FieldInput
            type="text"
            inputMode="decimal"
            value={formatDisplayValue(formData.price)}
            onChange={(e) => handleInputChange(e.target.value, handlePriceChange)}
            className="pr-14"
            placeholder={isBond ? "e.g. 100" : "0.00"}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-tertiary pointer-events-none">
            {isBond ? "%" : currencySymbol}
          </span>
        </div>
      </div>
    </>
  );
};

// --- 5. DATE PICKER ---
export const TransactionDatePicker = () => {
  const { formData, setFormData, isFetchingPrice } = useTransactionContext();

  const dateValue = formData.transactionDate ? format(formData.transactionDate, "yyyy-MM-dd") : "";
  const today = format(new Date(), "yyyy-MM-dd");
  const canFetchPrice = formData.assetType !== "BOND" && !!formData.assetSymbol;

  const handleDateChange = (e) => {
    const val = e.target.value;
    if (val) {
      const [year, month, day] = val.split("-").map(Number);
      setFormData(prev => ({ ...prev, transactionDate: new Date(year, month - 1, day) }));
    }
  };

  return (
    <div className="space-y-1.5">
      <FieldLabel>Transaction Date</FieldLabel>
      <FieldInput
        type="date"
        value={dateValue}
        max={today}
        onChange={handleDateChange}
      />
      {canFetchPrice && (
        <div className="h-4 flex items-center">
          {isFetchingPrice ? (
            <span className="flex items-center gap-1.5 text-[11px] text-link">
              <Loader2 size={9} className="animate-spin" />
              Fetching market price for {dateValue}…
            </span>
          ) : formData.price && dateValue ? (
            <span className="flex items-center gap-1.5 text-[11px] text-emerald-500">
              <Check size={9} />
              Price auto-filled for {dateValue}
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
};

// --- 6. FOOTER ---
export const TransactionFooter = () => {
  const {
    formData, inputByTotal, totalAmountInput,
    isSubmitting, submitTransaction, holdings
  } = useTransactionContext();
  const { currencySymbol } = useCurrency();

  const formatNumber = (val, decimals = 2) => {
    if (!val || isNaN(val)) return "0.00";
    return new Intl.NumberFormat("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(val);
  };

  const enteredQuantity = parseFloat(formData.quantity) || 0;

  const currentHolding = holdings.find(h =>
    String(h.asset_id) === String(formData.assetId) &&
    String(h.asset_type).toUpperCase() === formData.assetType
  );

  let maxSellable = 0;
  if (currentHolding) {
    if (formData.assetType === "BOND") maxSellable = parseFloat(currentHolding.face_value_held || currentHolding.quantity || 0);
    else if (formData.assetType === "FUND") maxSellable = parseFloat(currentHolding.units_held || currentHolding.quantity || 0);
    else maxSellable = parseFloat(currentHolding.quantity || 0);
  }

  const isSellMode = formData.transactionMode === "SELL";
  const isOverSelling = isSellMode && enteredQuantity > maxSellable;
  const isFractionalError = (formData.assetType === "STOCK" || formData.assetType === "BOND") && enteredQuantity > 0 && enteredQuantity < 1;
  const isManualBond = formData.assetType === "BOND" && formData.addBondFromStatement && formData.transactionMode === "BUY";
  const hasManualBondIdentity = Boolean(
    formData.auctionNumber &&
    formData.instrumentType &&
    formData.maturityYears &&
    formData.effectiveDate &&
    formData.maturityDate &&
    formData.dtm &&
    formData.couponRate
  );
  const isDisabled = isSubmitting || (!formData.assetId && !isManualBond) || (isManualBond && !hasManualBondIdentity) || !formData.quantity || !formData.price || isFractionalError || isOverSelling;

  const getUnitLabel = () => {
    if (formData.assetType === "BOND") return " Nominal";
    if (formData.assetType === "STOCK") return " Shares";
    return " Units";
  };

  const footerLabel = inputByTotal ? "Est. Quantity" : "Total";
  const footerValue = inputByTotal
    ? (parseFloat(formData.quantity) || 0).toLocaleString(undefined, { maximumFractionDigits: 4 }) + getUnitLabel()
    : `${currencySymbol} ${formatNumber(totalAmountInput || 0)}`;

  return (
    <div className="px-5 pb-5 pt-3 space-y-3 border-t border-border bg-card">
      <div className="flex justify-between items-baseline">
        <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-tertiary">{footerLabel}</span>
        <span className="text-[20px] font-extrabold tracking-[-0.04em] text-foreground">{footerValue}</span>
      </div>

      {(isFractionalError || isOverSelling) && (
        <div className="space-y-1">
          {isFractionalError && (
            <p className="text-right text-[11px] text-destructive font-medium">
              {formData.assetType === "STOCK" ? "Shares" : "Bonds"} cannot be less than 1.
            </p>
          )}
          {isOverSelling && (
            <p className="text-right text-[11px] text-destructive font-medium">
              Insufficient balance. You own <strong>{formatNumber(maxSellable, formData.assetType === "STOCK" ? 0 : 2)}</strong>{getUnitLabel()}.
            </p>
          )}
        </div>
      )}

      <button
        onClick={submitTransaction}
        disabled={isDisabled}
        className={cn(
          "w-full h-10 text-[13px] font-bold rounded-[6px] transition-all flex items-center justify-center gap-2",
          isDisabled
            ? "bg-muted text-tertiary cursor-not-allowed"
            : "bg-foreground text-background hover:opacity-90 active:scale-[0.98]"
        )}
      >
        {isSubmitting && <Loader2 size={14} className="animate-spin" />}
        {isSellMode ? "Sell Asset" : "Add Transaction"}
      </button>
    </div>
  );
};
