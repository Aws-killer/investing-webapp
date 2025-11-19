// pages/dashboard/Dialogs/AddTransactionDialog.jsx
"use client";

import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/components/ui/use-toast";

// API Hooks
import {
  useAddStockToPortfolioMutation,
  useAddUttToPortfolioMutation,
  useAddBondToPortfolioMutation,
  useSellStockFromPortfolioMutation,
  useSellUttFromPortfolioMutation,
  useSellBondFromPortfolioMutation,
} from "@/features/api/portfoliosApi";
import { useGetStocksQuery } from "@/features/api/stocksApi";
import { useGetUttFundsQuery } from "@/features/api/uttApi";
import { useDashboard } from "@/Providers/dashboard";

// Icons
import {
  Loader2,
  Plus,
  Minus,
  Calendar as CalendarIcon,
  ArrowRight,
  CheckCircle2
} from "lucide-react";

// --- CONFIG ---
const initialFormState = {
  transactionMode: "BUY",
  assetType: "STOCK",
  assetId: "",
  quantity: "",
  price: "",
  transactionDate: new Date(),
  notes: "",
};

const formatDateForInput = (date) => (date ? format(date, "yyyy-MM-dd") : "");

// --- CUSTOM COMPONENTS ---

const TabButton = ({ active, onClick, children, activeClass, defaultClass }) => (
    <button
        type="button"
        onClick={onClick}
        className={cn(
            "flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all border",
            active ? activeClass : defaultClass
        )}
    >
        {children}
    </button>
);

export const AddTransactionDialog = ({ isOpen, onOpenChange, portfolioIdFromWidget }) => {
  const { toast } = useToast();
  const { selectedPortfolioId: contextPortfolioId } = useDashboard();
  const currentPortfolioId = portfolioIdFromWidget || contextPortfolioId;

  const [formData, setFormData] = useState(initialFormState);

  // Data Fetching
  const { data: stocksList = [], isLoading: isLoadingStocks } = useGetStocksQuery(undefined, { skip: formData.assetType !== "STOCK" || !isOpen });
  const { data: uttFundsList = [], isLoading: isLoadingUtt } = useGetUttFundsQuery(undefined, { skip: formData.assetType !== "UTT" || !isOpen });

  // Mutations
  const [addStock, { isLoading: isAddingStock }] = useAddStockToPortfolioMutation();
  const [addUtt, { isLoading: isAddingUtt }] = useAddUttToPortfolioMutation();
  const [addBond, { isLoading: isAddingBond }] = useAddBondToPortfolioMutation();
  const [sellStock, { isLoading: isSellingStock }] = useSellStockFromPortfolioMutation();
  const [sellUtt, { isLoading: isSellingUtt }] = useSellUttFromPortfolioMutation();
  const [sellBond, { isLoading: isSellingBond }] = useSellBondFromPortfolioMutation();

  const isLoading = isAddingStock || isAddingUtt || isAddingBond || isSellingStock || isSellingUtt || isSellingBond;

  useEffect(() => {
    if (isOpen) setFormData({ ...initialFormState, transactionDate: new Date() });
  }, [isOpen]);

  const handleSelect = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value, ...(name === 'assetType' && { assetId: '' }) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentPortfolioId) return;

    const payload = {
        portfolioId: currentPortfolioId,
        assetId: parseInt(formData.assetId),
        quantity: parseFloat(formData.quantity),
        price: parseFloat(formData.price),
        date: formatDateForInput(formData.transactionDate),
        notes: formData.notes || null,
    };

    try {
        let promise;
        const isBuy = formData.transactionMode === "BUY";
        
        if (formData.assetType === "STOCK") {
            promise = isBuy 
                ? addStock({ portfolioId: payload.portfolioId, stockData: { stock_id: payload.assetId, quantity: payload.quantity, purchase_price: payload.price, purchase_date: payload.date, notes: payload.notes } })
                : sellStock({ portfolioId: payload.portfolioId, stockId: payload.assetId, sellData: { quantity: payload.quantity, sell_price: payload.price, sell_date: payload.date, notes: payload.notes } });
        } else if (formData.assetType === "UTT") {
            promise = isBuy
                ? addUtt({ portfolioId: payload.portfolioId, uttData: { utt_fund_id: payload.assetId, units_held: payload.quantity, purchase_price: payload.price, purchase_date: payload.date, notes: payload.notes } })
                : sellUtt({ portfolioId: payload.portfolioId, uttFundId: payload.assetId, sellData: { units_to_sell: payload.quantity, sell_price: payload.price, sell_date: payload.date, notes: payload.notes } });
        } else { // BOND
             promise = isBuy
                ? addBond({ portfolioId: payload.portfolioId, bondData: { bond_id: payload.assetId, face_value_held: payload.quantity, purchase_price: payload.price, purchase_date: payload.date, notes: payload.notes } })
                : sellBond({ portfolioId: payload.portfolioId, bondId: payload.assetId, sellData: { face_value_to_sell: payload.quantity, sell_price: payload.price, sell_date: payload.date, notes: payload.notes } });
        }
        
        await promise.unwrap();
        toast({ 
            title: <div className="flex items-center gap-2 text-emerald-400"><CheckCircle2 size={18} /> Success</div>,
            description: "Transaction recorded successfully",
            className: "bg-[#121212] border-zinc-800 text-white"
        });
        onOpenChange(false);
    } catch (err) {
        toast({ title: "Error", description: "Failed to record transaction", variant: "destructive" });
    }
  };

  const totalValue = (parseFloat(formData.quantity) || 0) * (parseFloat(formData.price) || 0);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-[#0a0a0a] border border-zinc-800 text-zinc-200 shadow-2xl p-0 overflow-hidden rounded-2xl">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-800 bg-zinc-900/50">
            <DialogTitle className="text-lg font-bold text-white">Add Transaction</DialogTitle>
            <DialogDescription className="text-zinc-500 text-xs mt-1">Record a new buy or sell order manually.</DialogDescription>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
            
            {/* Toggle Groups */}
            <div className="space-y-4">
                {/* Buy / Sell Switch */}
                <div className="flex bg-[#121212] p-1 rounded-xl border border-zinc-800">
                    <TabButton 
                        active={formData.transactionMode === "BUY"} 
                        onClick={() => handleSelect("transactionMode", "BUY")}
                        activeClass="bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                        defaultClass="text-zinc-500 border-transparent hover:text-zinc-300"
                    >
                        <div className="flex items-center justify-center gap-2"><Plus size={14}/> Buy</div>
                    </TabButton>
                    <TabButton 
                        active={formData.transactionMode === "SELL"} 
                        onClick={() => handleSelect("transactionMode", "SELL")}
                        activeClass="bg-red-500/10 text-red-500 border-red-500/20"
                        defaultClass="text-zinc-500 border-transparent hover:text-zinc-300"
                    >
                        <div className="flex items-center justify-center gap-2"><Minus size={14}/> Sell</div>
                    </TabButton>
                </div>

                {/* Asset Type Switch */}
                <div className="flex gap-2">
                    {['STOCK', 'UTT', 'BOND'].map(type => (
                        <button
                            key={type}
                            type="button"
                            onClick={() => handleSelect("assetType", type)}
                            className={cn(
                                "flex-1 py-2 text-[10px] font-bold uppercase rounded-lg border transition-all",
                                formData.assetType === type 
                                    ? "bg-zinc-100 text-black border-zinc-100" 
                                    : "bg-transparent text-zinc-500 border-zinc-800 hover:border-zinc-600"
                            )}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            {/* Asset Selection */}
            <div className="space-y-4">
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Select Asset</label>
                    <Select value={formData.assetId} onValueChange={(v) => handleSelect("assetId", v)}>
                        <SelectTrigger className="bg-[#121212] border-zinc-800 text-white h-12 rounded-xl focus:ring-emerald-500/20 focus:border-emerald-500/50">
                            <SelectValue placeholder="Search asset..." />
                        </SelectTrigger>
                        <SelectContent className="bg-[#121212] border-zinc-800 text-zinc-200">
                            {(formData.assetType === 'STOCK' ? stocksList : uttFundsList).map(asset => (
                                <SelectItem key={asset.id} value={String(asset.id)} className="focus:bg-zinc-900 cursor-pointer">
                                    <span className="font-mono text-zinc-500 mr-2">{asset.symbol}</span> {asset.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Quantity</label>
                        <Input 
                            type="number" 
                            value={formData.quantity}
                            onChange={(e) => handleSelect("quantity", e.target.value)}
                            className="bg-[#121212] border-zinc-800 text-white h-12 rounded-xl focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/50"
                            placeholder="0.00"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Price</label>
                        <Input 
                            type="number" 
                            value={formData.price}
                            onChange={(e) => handleSelect("price", e.target.value)}
                            className="bg-[#121212] border-zinc-800 text-white h-12 rounded-xl focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/50"
                            placeholder="0.00"
                        />
                    </div>
                </div>

                {/* Date & Summary */}
                <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Date</label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-start text-left font-normal bg-[#121212] border-zinc-800 hover:bg-zinc-900 hover:text-white h-12 rounded-xl">
                                    <CalendarIcon className="mr-2 h-4 w-4 text-zinc-500" />
                                    {formData.transactionDate ? format(formData.transactionDate, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 bg-[#121212] border-zinc-800">
                                <Calendar
                                    mode="single"
                                    selected={formData.transactionDate}
                                    onSelect={(d) => handleSelect("transactionDate", d)}
                                    initialFocus
                                    className="text-zinc-200"
                                />
                            </PopoverContent>
                        </Popover>
                     </div>
                     
                     <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-3 flex flex-col justify-center items-end">
                        <span className="text-[10px] text-zinc-500 font-bold uppercase">Total Value</span>
                        <span className="text-lg font-mono font-bold text-white">€{totalValue.toLocaleString()}</span>
                     </div>
                </div>
            </div>

            <div className="pt-2">
                <Button 
                    type="submit" 
                    disabled={isLoading || !currentPortfolioId || !formData.assetId}
                    className={cn(
                        "w-full h-12 font-bold text-white transition-all rounded-xl shadow-lg",
                        formData.transactionMode === 'BUY' 
                            ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20" 
                            : "bg-red-600 hover:bg-red-500 shadow-red-900/20"
                    )}
                >
                    {isLoading ? <Loader2 className="animate-spin" /> : (
                        <span className="flex items-center gap-2">
                            Confirm {formData.transactionMode} <ArrowRight size={16} />
                        </span>
                    )}
                </Button>
            </div>

        </form>
      </DialogContent>
    </Dialog>
  );
};