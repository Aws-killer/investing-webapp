"use client";

import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { Check } from "lucide-react";

import { useGetStocksQuery, useGetStockPriceByDateQuery, useImportStockMutation } from "@/features/api/stocksApi";
import { useGetFundsQuery, useGetFundPriceByDateQuery, useImportFundsMutation } from "@/features/api/fundsApi";
import { useGetBondsQuery } from "@/features/api/bondsApi";
import {
  useAddStockToPortfolioMutation,
  useAddBondToPortfolioMutation,
  useAddFundToPortfolioMutation,
  useSellStockFromPortfolioMutation,
  useSellBondFromPortfolioMutation,
  useSellFundFromPortfolioMutation,
  useGetPortfolioHoldingsQuery,
} from "@/features/api/portfoliosApi";
import { useDashboard } from "@/features/context/dashboard-context";

export const ASSET_TYPES = [
    { id: "STOCK", label: "Security" },
    { id: "FUND", label: "Funds" },
    { id: "BOND", label: "Bond" },
];

const initialFormState = {
    transactionMode: "BUY",
    assetType: "STOCK",
    assetId: "",
    assetSymbol: "",
    assetName: "",
    addBondFromStatement: false,
    instrumentType: "TBond",
    holdingStatus: "FREE",
    maturityYears: "",
    maturityDate: "",
    effectiveDate: "",
    dtm: "",
    auctionNumber: "",
    bondAuctionNumber: "",
    holdingNumber: "",
    couponRate: "",
    secondaryMarket: false,
    quantity: "",
    price: "",
    transactionDate: new Date(),
    notes: "",
};

const TransactionContext = createContext(null);

export const useTransactionContext = () => {
    const context = useContext(TransactionContext);
    if (!context) throw new Error("useTransactionContext must be used within TransactionProvider");
    return context;
};

export const TransactionProvider = ({ children, isOpen, onOpenChange, portfolioIdFromWidget }) => {
    const { toast } = useToast();
    const { selectedPortfolioId: contextPortfolioId } = useDashboard();
    const currentPortfolioId = portfolioIdFromWidget || contextPortfolioId;

    // --- STATE ---
    const [formData, setFormData] = useState(initialFormState);
    const [inputByTotal, setInputByTotal] = useState(false);
    const [totalAmountInput, setTotalAmountInput] = useState("");
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setFormData({ ...initialFormState, transactionDate: new Date() });
            setInputByTotal(false);
            setTotalAmountInput("");
            setIsRefreshing(false);
        }
    }, [isOpen]);

    // --- ASSET LISTS ---
    const { data: stocksData = [], isLoading: isLoadingStocks } = useGetStocksQuery(undefined, {
        skip: formData.assetType !== "STOCK" || !isOpen,
    });
    const { data: fundsData = [], isLoading: isLoadingFunds } = useGetFundsQuery(undefined, {
        skip: formData.assetType !== "FUND" || !isOpen,
    });
    const { data: bondsData = [], isLoading: isLoadingBonds } = useGetBondsQuery(undefined, {
        skip: formData.assetType !== "BOND" || !isOpen,
    });
    const { data: holdingsData = [] } = useGetPortfolioHoldingsQuery(currentPortfolioId, {
        skip: !currentPortfolioId,
    });

    const holdings = useMemo(() => {
        const data = Array.isArray(holdingsData) ? holdingsData : (holdingsData.data || []);
        return data;
    }, [holdingsData]);

    const normalizeData = (data) => {
        if (Array.isArray(data)) return data;
        if (data && Array.isArray(data.results)) return data.results;
        if (data && Array.isArray(data.data)) return data.data;
        return [];
    };

    const stocksList = useMemo(() => normalizeData(stocksData), [stocksData]);
    const fundsList  = useMemo(() => normalizeData(fundsData),  [fundsData]);
    const bondsList  = useMemo(() => normalizeData(bondsData),  [bondsData]);

    const formatDateForInput = (date) => (date ? format(date, "yyyy-MM-dd") : "");

    // --- PRICE BY DATE ---
    // Stocks: use symbol; Funds: use numeric assetId
    const canFetchStockPrice = formData.assetType === "STOCK" && !!formData.assetSymbol && !!formData.transactionDate && isOpen;
    const canFetchFundPrice  = formData.assetType === "FUND"  && !!formData.assetId      && !!formData.transactionDate && isOpen;

    const {
        data: stockPriceData,
        isFetching: isFetchingStockPrice,
        refetch: refetchStockPrice,
    } = useGetStockPriceByDateQuery(
        { symbol: formData.assetSymbol, date: formatDateForInput(formData.transactionDate) },
        { skip: !canFetchStockPrice }
    );

    const {
        data: fundPriceData,
        isFetching: isFetchingFundPrice,
        refetch: refetchFundPrice,
    } = useGetFundPriceByDateQuery(
        { id: formData.assetId, date: formatDateForInput(formData.transactionDate) },
        { skip: !canFetchFundPrice }
    );

    // --- PRICE REFRESH (triggers import then refetches) ---
    const [importStock] = useImportStockMutation();
    const [importFunds] = useImportFundsMutation();

    const refreshPrices = async () => {
        if (isRefreshing) return;
        setIsRefreshing(true);
        try {
            if (formData.assetType === "STOCK" && formData.assetSymbol) {
                await importStock(formData.assetSymbol).unwrap();
                // Background task: wait for scraper then refetch
                await new Promise(resolve => setTimeout(resolve, 5000));
                refetchStockPrice();
            } else if (formData.assetType === "FUND" && formData.assetId) {
                await importFunds().unwrap();
                await new Promise(resolve => setTimeout(resolve, 5000));
                refetchFundPrice();
            }
        } catch (e) {
            console.error("Price refresh failed:", e);
        }
        setIsRefreshing(false);
    };

    // --- CALCULATIONS ---
    const calculateTotal = (qty, price, type) => {
        const q = parseFloat(qty) || 0;
        const p = parseFloat(price) || 0;
        return type === "BOND" ? (q * p) / 100 : q * p;
    };

    const calculateQuantity = (total, price, type) => {
        const t = parseFloat(total) || 0;
        const p = parseFloat(price) || 0;
        if (p === 0) return 0;
        if (type === "BOND") return (t * 100) / p;
        const rawQty = t / p;
        if (type === "STOCK") return Math.floor(rawQty);
        return rawQty;
    };

    // --- EVENT HANDLERS ---
    const handleTabChange = (type) => {
        if (type.disabled) return;
        setFormData(prev => ({ ...prev, assetType: type.id, assetId: "", assetSymbol: "", assetName: "", addBondFromStatement: false, secondaryMarket: false, quantity: "", price: "" }));
        setInputByTotal(false);
        setTotalAmountInput("");
    };

    const handlePriceChange = (val) => {
        setFormData(prev => {
            const newPrice = val;
            if (inputByTotal) {
                const newQty = calculateQuantity(totalAmountInput, newPrice, prev.assetType);
                return { ...prev, price: newPrice, quantity: newQty > 0 ? newQty.toString() : "" };
            } else {
                const newTotal = calculateTotal(prev.quantity, newPrice, prev.assetType);
                setTotalAmountInput(newTotal > 0 ? newTotal.toFixed(2) : "");
                return { ...prev, price: newPrice };
            }
        });
    };

    const handleQuantityChange = (val) => {
        const newTotal = calculateTotal(val, formData.price, formData.assetType);
        setFormData(prev => ({ ...prev, quantity: val }));
        setTotalAmountInput(newTotal > 0 ? newTotal.toFixed(2) : "");
    };

    const handleTotalChange = (val) => {
        setTotalAmountInput(val);
        const newQty = calculateQuantity(val, formData.price, formData.assetType);
        setFormData(prev => ({ ...prev, quantity: newQty > 0 ? newQty.toString() : "" }));
    };

    // --- AUTO-FILL PRICE ---
    useEffect(() => {
        if (formData.assetType === "STOCK" && stockPriceData?.closing_price) {
            handlePriceChange(stockPriceData.closing_price.toString());
        }
        if (formData.assetType === "FUND" && fundPriceData) {
            const price = (formData.transactionMode === "SELL" && fundPriceData.repurchase_price)
                ? fundPriceData.repurchase_price
                : (fundPriceData.nav_per_unit || fundPriceData.sale_price);
            if (price) handlePriceChange(price.toString());
        }
    }, [stockPriceData, fundPriceData, formData.assetType, formData.transactionMode]);

    // --- SUBMISSION ---
    const [addStock,  { isLoading: isAddingStock  }] = useAddStockToPortfolioMutation();
    const [addFund,   { isLoading: isAddingFund   }] = useAddFundToPortfolioMutation();
    const [addBond,   { isLoading: isAddingBond   }] = useAddBondToPortfolioMutation();
    const [sellStock, { isLoading: isSellingStock }] = useSellStockFromPortfolioMutation();
    const [sellFund,  { isLoading: isSellingFund  }] = useSellFundFromPortfolioMutation();
    const [sellBond,  { isLoading: isSellingBond  }] = useSellBondFromPortfolioMutation();

    const isSubmitting = isAddingStock || isAddingFund || isAddingBond || isSellingStock || isSellingFund || isSellingBond;

    const submitTransaction = async () => {
        const isManualBond = formData.assetType === "BOND" && formData.addBondFromStatement;
        if (!currentPortfolioId || (!formData.assetId && !isManualBond)) return;
        const basePayload = {
            portfolioId: currentPortfolioId,
            quantity: parseFloat(formData.quantity),
            price: parseFloat(formData.price),
            date: formatDateForInput(formData.transactionDate),
        };
        try {
            let promise;
            const isBuy = formData.transactionMode === "BUY";
            const id = parseInt(formData.assetId);
            if (formData.assetType === "STOCK") {
                promise = isBuy
                    ? addStock({ portfolioId: basePayload.portfolioId, stockData: { stock_id: id, quantity: basePayload.quantity, purchase_price: basePayload.price, purchase_date: basePayload.date } })
                    : sellStock({ portfolioId: basePayload.portfolioId, stockId: id, sellData: { quantity: basePayload.quantity, sell_price: basePayload.price, sell_date: basePayload.date } });
            } else if (formData.assetType === "FUND") {
                promise = isBuy
                    ? addFund({ portfolioId: basePayload.portfolioId, fundData: { fund_id: id, units_held: basePayload.quantity, purchase_price: basePayload.price, purchase_date: basePayload.date } })
                    : sellFund({ portfolioId: basePayload.portfolioId, fundId: id, sellData: { units_to_sell: basePayload.quantity, sell_price: basePayload.price, sell_date: basePayload.date } });
            } else if (formData.assetType === "BOND") {
                const totalPurchasePrice = parseFloat(totalAmountInput) || ((basePayload.quantity * basePayload.price) / 100);
                const bondData = {
                    bond_id: isManualBond ? undefined : (formData.assetId ? id : undefined),
                    auction_number: formData.auctionNumber ? parseInt(formData.auctionNumber) : undefined,
                    instrument_type: formData.instrumentType || undefined,
                    holding_status: formData.holdingStatus || undefined,
                    notes: formData.secondaryMarket ? "Secondary market purchase" : undefined,
                    maturity_years: formData.maturityYears || undefined,
                    maturity_date: formData.maturityDate || undefined,
                    effective_date: formData.effectiveDate || undefined,
                    dtm: formData.dtm ? parseInt(formData.dtm) : undefined,
                    bond_auction_number: formData.bondAuctionNumber ? parseInt(formData.bondAuctionNumber) : undefined,
                    holding_number: formData.holdingNumber ? parseInt(formData.holdingNumber) : undefined,
                    coupon_rate: formData.couponRate ? parseFloat(formData.couponRate) : undefined,
                    face_value_held: basePayload.quantity,
                    price_per_100: basePayload.price,
                    purchase_price: totalPurchasePrice,
                    purchase_date: basePayload.date,
                };
                promise = isBuy
                    ? addBond({ portfolioId: basePayload.portfolioId, bondData })
                    : sellBond({ portfolioId: basePayload.portfolioId, bondId: id, sellData: { face_value_to_sell: basePayload.quantity, sell_price: basePayload.price, sell_date: basePayload.date } });
            }
            const response = await promise.unwrap();
            const recalc = response?.data?.recalculation;
            toast({
                title: <div className="flex items-center gap-2 text-emerald-400"><Check size={18} /> Success</div>,
                description: recalc?.requested_start_date
                    ? `Transaction saved. Portfolio performance is refreshing from ${recalc.requested_start_date}.`
                    : "Transaction added successfully",
                className: "bg-card border-border text-foreground",
            });
            onOpenChange(false);
        } catch (err) {
            console.error(err);
            toast({ title: "Error", description: "Failed to save transaction", variant: "destructive" });
        }
    };

    // --- AVAILABLE ASSETS ---
    const availableAssets = useMemo(() => {
        let list = [];
        if (formData.assetType === "STOCK") list = stocksList;
        else if (formData.assetType === "FUND") list = fundsList;
        else if (formData.assetType === "BOND") list = bondsList;

        if (formData.transactionMode === "SELL") {
            const currentHoldings = Array.isArray(holdings) ? holdings : [];
            return list.filter(asset =>
                currentHoldings.some(h =>
                    String(h.asset_id) === String(asset.id) &&
                    String(h.asset_type).toUpperCase() === formData.assetType
                )
            );
        }
        return list;
    }, [formData.assetType, stocksList, fundsList, bondsList, holdings, formData.transactionMode]);

    const isLoadingAssets = useMemo(() => {
        if (formData.assetType === "STOCK") return isLoadingStocks;
        if (formData.assetType === "FUND")  return isLoadingFunds;
        if (formData.assetType === "BOND")  return isLoadingBonds;
        return false;
    }, [formData.assetType, isLoadingStocks, isLoadingFunds, isLoadingBonds]);

    const isFetchingPrice = isFetchingStockPrice || isFetchingFundPrice;

    // Resolved price for the "Use [label]" button
    const fetchedPrice = useMemo(() => {
        if (formData.assetType === "STOCK" && stockPriceData?.closing_price) {
            return { value: stockPriceData.closing_price, label: "Avg. Close", date: stockPriceData.date };
        }
        if (formData.assetType === "FUND" && fundPriceData) {
            const price = (formData.transactionMode === "SELL" && fundPriceData.repurchase_price)
                ? fundPriceData.repurchase_price
                : (fundPriceData.nav_per_unit || fundPriceData.sale_price);
            if (price) return { value: price, label: "NAV", date: fundPriceData.date };
        }
        return null;
    }, [stockPriceData, fundPriceData, formData.assetType, formData.transactionMode]);

    const applyFetchedPrice = () => {
        if (fetchedPrice) handlePriceChange(fetchedPrice.value.toString());
    };

    // Whether the current asset type supports price lookup (bonds don't)
    const canLookupPrice = formData.assetType === "STOCK" || formData.assetType === "FUND";

    return (
        <TransactionContext.Provider value={{
            formData, setFormData,
            inputByTotal, setInputByTotal,
            totalAmountInput,
            holdings,
            availableAssets, isLoadingAssets,
            isFetchingPrice, isRefreshing,
            fetchedPrice, applyFetchedPrice,
            canLookupPrice, refreshPrices,
            handleTabChange, handlePriceChange, handleQuantityChange, handleTotalChange,
            submitTransaction, isSubmitting,
        }}>
            {children}
        </TransactionContext.Provider>
    );
};
