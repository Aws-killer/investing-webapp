import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils"; // Assumed to exist in your project, standard with shadcn/ui
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/components/ui/use-toast";

// Real hooks from your application
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
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Hash,
  CheckCircle2,
  XCircle,
  Calendar as CalendarIcon, // Renamed to avoid conflict with Calendar component
  Wallet,
} from "lucide-react";

// Helper function to format date for API submission
const formatDateForInput = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  const year = d.getFullYear();
  return [year, month, day].join("-");
};

// Initial state for the form
const initialFormState = {
  transactionMode: "BUY",
  assetType: "STOCK",
  assetId: "",
  quantity: "",
  price: "",
  transactionDate: new Date(), // Use Date object
  notes: "",
};

// --- DESIGN SYSTEM CONSTANTS (Inspired by the image) ---
const ASSET_TYPES = {
  STOCK: {
    label: "Stock",
    icon: TrendingUp,
    color: "bg-gradient-to-br from-indigo-500 to-blue-500",
  },
  UTT: {
    label: "UTT Fund",
    icon: Wallet,
    color: "bg-gradient-to-br from-teal-500 to-cyan-500",
  },
  BOND: {
    label: "Bond",
    icon: TrendingDown,
    color: "bg-gradient-to-br from-amber-500 to-orange-500",
  },
};

const TRANSACTION_MODES = {
  BUY: {
    label: "Buy",
    icon: Plus,
    color: "text-teal-600",
    submitColor: "bg-teal-500 hover:bg-teal-600",
  },
  SELL: {
    label: "Sell",
    icon: Minus,
    color: "text-rose-600",
    submitColor: "bg-rose-500 hover:bg-rose-600",
  },
};

export const AddTransactionDialog = ({
  isOpen,
  onOpenChange,
  portfolioIdFromWidget,
}) => {
  const { toast } = useToast();
  const { selectedPortfolioId: contextPortfolioId } = useDashboard();
  const currentPortfolioId = portfolioIdFromWidget || contextPortfolioId;

  const [formData, setFormData] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState({});

  const {
    data: stocksList = [],
    isLoading: isLoadingStocksList,
    error: errorStocksList,
  } = useGetStocksQuery(undefined, {
    skip: formData.assetType !== "STOCK" || !isOpen,
  });
  const {
    data: uttFundsList = [],
    isLoading: isLoadingUttFundsList,
    error: errorUttFundsList,
  } = useGetUttFundsQuery(undefined, {
    skip: formData.assetType !== "UTT" || !isOpen,
  });

  const [addStock, { isLoading: isLoadingAddStock }] =
    useAddStockToPortfolioMutation();
  const [addUtt, { isLoading: isLoadingAddUtt }] =
    useAddUttToPortfolioMutation();
  const [addBond, { isLoading: isLoadingAddBond }] =
    useAddBondToPortfolioMutation();
  const [sellStock, { isLoading: isLoadingSellStock }] =
    useSellStockFromPortfolioMutation();
  const [sellUtt, { isLoading: isLoadingSellUtt }] =
    useSellUttFromPortfolioMutation();
  const [sellBond, { isLoading: isLoadingSellBond }] =
    useSellBondFromPortfolioMutation();

  const isLoadingMutation =
    isLoadingAddStock ||
    isLoadingAddUtt ||
    isLoadingAddBond ||
    isLoadingSellStock ||
    isLoadingSellUtt ||
    isLoadingSellBond;
  const isLoadingAssetOptions =
    formData.assetType === "STOCK"
      ? isLoadingStocksList
      : formData.assetType === "UTT"
      ? isLoadingUttFundsList
      : false;

  useEffect(() => {
    if (isOpen) {
      setFormData({
        ...initialFormState,
        transactionDate: new Date(), // Reset with a new Date object
      });
      setFormErrors({});
    }
  }, [isOpen]);

  const validateField = (name, value) => {
    const errors = { ...formErrors };
    switch (name) {
      case "assetId":
        errors.assetId = !value
          ? `Please select a ${formData.assetType.toLowerCase()}`
          : undefined;
        break;
      case "quantity":
        errors.quantity =
          !value || parseFloat(value) <= 0 ? "Quantity must be > 0" : undefined;
        break;
      case "price":
        errors.price =
          !value || parseFloat(value) <= 0 ? "Price must be > 0" : undefined;
        break;
      case "transactionDate":
        errors.transactionDate = !value ? "Date is required" : undefined;
        break;
    }
    Object.keys(errors).forEach(
      (key) => errors[key] === undefined && delete errors[key]
    );
    setFormErrors(errors);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "assetType" && { assetId: "", quantity: "", price: "" }),
    }));
    // Reset errors only if changing asset type, otherwise validate the new selection
    if (name === "assetType") {
      setFormErrors({});
    } else {
      validateField(name, value);
    }
  };

  const calculateTotal = () => {
    const quantity = parseFloat(formData.quantity) || 0;
    const price = parseFloat(formData.price) || 0;
    return formData.assetType === "BOND" ? price : quantity * price;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!formData.assetId)
      errors.assetId = `Select a ${formData.assetType.toLowerCase()}`;
    if (!formData.quantity || parseFloat(formData.quantity) <= 0)
      errors.quantity = "Must be > 0";
    if (!formData.price || parseFloat(formData.price) <= 0)
      errors.price = "Must be > 0";
    if (!formData.transactionDate) errors.transactionDate = "Date is required";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    if (!currentPortfolioId) {
      toast({
        title: "Error",
        description: "No portfolio selected.",
        variant: "destructive",
      });
      return;
    }
    let mutationPromise;
    const commonTxData = { notes: formData.notes || null };
    const parsedAssetId = parseInt(formData.assetId);
    const parsedQuantity = parseFloat(formData.quantity);
    const parsedPrice = parseFloat(formData.price);
    const formattedDate = formatDateForInput(formData.transactionDate); // Format date for API

    try {
      if (formData.transactionMode === "BUY") {
        const buyData = {
          ...commonTxData,
          purchase_date: formattedDate,
        };
        switch (formData.assetType) {
          case "STOCK":
            mutationPromise = addStock({
              portfolioId: currentPortfolioId,
              stockData: {
                stock_id: parsedAssetId,
                quantity: parsedQuantity,
                purchase_price: parsedPrice,
                ...buyData,
              },
            }).unwrap();
            break;
          case "UTT":
            mutationPromise = addUtt({
              portfolioId: currentPortfolioId,
              uttData: {
                utt_fund_id: parsedAssetId,
                units_held: parsedQuantity,
                purchase_price: parsedPrice,
                ...buyData,
              },
            }).unwrap();
            break;
          case "BOND":
            mutationPromise = addBond({
              portfolioId: currentPortfolioId,
              bondData: {
                bond_id: parsedAssetId,
                face_value_held: parsedQuantity,
                purchase_price: parsedPrice,
                ...buyData,
              },
            }).unwrap();
            break;
          default:
            throw new Error("Invalid asset type for BUY operation.");
        }
      } else {
        // SELL mode
        const sellPayload = {
          ...commonTxData,
          sell_date: formattedDate,
        };
        switch (formData.assetType) {
          case "STOCK":
            mutationPromise = sellStock({
              portfolioId: currentPortfolioId,
              stockId: parsedAssetId,
              sellData: {
                quantity: parsedQuantity,
                sell_price: parsedPrice,
                ...sellPayload,
              },
            }).unwrap();
            break;
          case "UTT":
            mutationPromise = sellUtt({
              portfolioId: currentPortfolioId,
              uttFundId: parsedAssetId,
              sellData: {
                units_to_sell: parsedQuantity,
                sell_price: parsedPrice,
                ...sellPayload,
              },
            }).unwrap();
            break;
          case "BOND":
            mutationPromise = sellBond({
              portfolioId: currentPortfolioId,
              bondId: parsedAssetId,
              sellData: {
                face_value_to_sell: parsedQuantity,
                sell_price: parsedPrice,
                ...sellPayload,
              },
            }).unwrap();
            break;
          default:
            throw new Error("Invalid asset type for SELL operation.");
        }
      }
      const result = await mutationPromise;
      toast({
        title: (
          <div className="flex items-center">
            <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" /> Success
          </div>
        ),
        description: result.message || `Transaction processed successfully!`,
      });
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to process transaction:", err);
      const errorDescription =
        err.data?.detail || err.message || "An unexpected error occurred.";
      toast({
        title: (
          <div className="flex items-center">
            <XCircle className="mr-2 h-4 w-4 text-red-500" /> Error
          </div>
        ),
        description: String(errorDescription),
        variant: "destructive",
      });
    }
  };

  const getQuantityLabel = () =>
    formData.assetType === "STOCK"
      ? "Shares"
      : formData.assetType === "UTT"
      ? "Units"
      : "Face Value";
  const getPriceLabel = () =>
    formData.assetType === "BOND" ? "Total Price" : "Price per Unit/Share";

  const renderAssetIdInput = () => {
    // ... (This function remains unchanged)
    const commonInputClass = `h-11 bg-slate-100 border-slate-200 rounded-lg focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-teal-500 ${
      formErrors.assetId ? "border-red-400" : ""
    }`;
    if (isLoadingAssetOptions)
      return (
        <div className="flex items-center justify-center h-11 border rounded-lg bg-slate-100/50">
          <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
        </div>
      );
    const errorClass =
      "flex items-center h-11 px-3 border border-red-300 rounded-lg bg-red-50 text-sm text-red-700";
    if (formData.assetType === "STOCK") {
      if (errorStocksList)
        return (
          <div className={errorClass}>
            <XCircle className="h-4 w-4 mr-2" />
            Error
          </div>
        );
      return (
        <Select
          value={formData.assetId}
          onValueChange={(value) => handleSelectChange("assetId", value)}
        >
          <SelectTrigger className={commonInputClass}>
            <SelectValue placeholder="Select Stock" />
          </SelectTrigger>
          <SelectContent>
            {stocksList.map((stock) => (
              <SelectItem key={stock.id} value={String(stock.id)}>
                <div className="flex items-center">
                  <Badge variant="secondary" className="mr-2 text-xs">
                    {stock.symbol}
                  </Badge>
                  <span className="truncate">{stock.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    if (formData.assetType === "UTT") {
      if (errorUttFundsList)
        return (
          <div className={errorClass}>
            <XCircle className="h-4 w-4 mr-2" />
            Error
          </div>
        );
      return (
        <Select
          value={formData.assetId}
          onValueChange={(value) => handleSelectChange("assetId", value)}
        >
          <SelectTrigger className={commonInputClass}>
            <SelectValue placeholder="Select UTT Fund" />
          </SelectTrigger>
          <SelectContent>
            {uttFundsList.map((fund) => (
              <SelectItem key={fund.id} value={String(fund.id)}>
                <div className="flex items-center">
                  <Badge variant="secondary" className="mr-2 text-xs">
                    {fund.symbol}
                  </Badge>
                  <span className="truncate">{fund.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    return (
      <div className="relative">
        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          name="assetId"
          type="number"
          value={formData.assetId}
          onChange={handleChange}
          className={`${commonInputClass} pl-10`}
          placeholder="Enter Bond ID"
          required
        />
      </div>
    );
  };

  const currentMode = TRANSACTION_MODES[formData.transactionMode];
  const currentAsset = ASSET_TYPES[formData.assetType];
  const total = calculateTotal();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl bg-white p-0 rounded-2xl shadow-2xl">
        <form onSubmit={handleSubmit}>
          <div className="bg-slate-50/50 px-8 py-6 border-b border-slate-100">
            {/* ...Header remains unchanged... */}
            <DialogHeader className="flex flex-row items-center space-x-4">
              <div
                className={`flex-shrink-0 p-3 rounded-xl text-white shadow-lg ${currentAsset.color}`}
              >
                <currentAsset.icon className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold tracking-tight text-slate-800">
                  {currentMode.label} {currentAsset.label}
                </DialogTitle>
                <DialogDescription className="text-sm text-slate-500">
                  Add a new transaction to your portfolio.
                </DialogDescription>
              </div>
            </DialogHeader>
          </div>

          <div className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-x-5 gap-y-6">
              {/* --- Row 1 & 2 remain unchanged... --- */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Transaction
                </Label>
                <Select
                  value={formData.transactionMode}
                  onValueChange={(value) =>
                    handleSelectChange("transactionMode", value)
                  }
                >
                  <SelectTrigger className="h-11 bg-slate-100 border-slate-200 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TRANSACTION_MODES).map(([key, mode]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center">
                          <mode.icon className={`h-4 w-4 mr-2 ${mode.color}`} />
                          {mode.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Asset Type
                </Label>
                <Select
                  value={formData.assetType}
                  onValueChange={(value) =>
                    handleSelectChange("assetType", value)
                  }
                >
                  <SelectTrigger className="h-11 bg-slate-100 border-slate-200 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ASSET_TYPES).map(([key, asset]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center">
                          <asset.icon className="h-4 w-4 mr-2 text-slate-500" />
                          {asset.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {currentAsset.label}
                  <span className="text-rose-500 ml-1">*</span>
                </Label>
                {renderAssetIdInput()}
                {formErrors.assetId && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {formErrors.assetId}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {getQuantityLabel()}
                  <span className="text-rose-500 ml-1">*</span>
                </Label>
                <Input
                  name="quantity"
                  type="number"
                  step="any"
                  min="0"
                  value={formData.quantity}
                  onChange={handleChange}
                  className={`h-11 bg-slate-100 border-slate-200 rounded-lg ${
                    formErrors.quantity ? "border-red-400" : ""
                  }`}
                  placeholder="e.g., 10"
                  required
                />
                {formErrors.quantity && (
                  <p className="text-xs text-rose-600 mt-1">
                    {formErrors.quantity}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {getPriceLabel()}
                  <span className="text-rose-500 ml-1">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-sans">
                    €
                  </span>
                  <Input
                    name="price"
                    type="number"
                    step="any"
                    min="0"
                    value={formData.price}
                    onChange={handleChange}
                    className={`h-11 bg-slate-100 border-slate-200 rounded-lg pl-7 ${
                      formErrors.price ? "border-red-400" : ""
                    }`}
                    placeholder="e.g., 150.25"
                    required
                  />
                </div>
                {formErrors.price && (
                  <p className="text-xs text-rose-600 mt-1">
                    {formErrors.price}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              {/* --- NEW CALENDAR INPUT --- */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Date<span className="text-rose-500 ml-1">*</span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal h-11 bg-slate-100 border-slate-200 rounded-lg hover:bg-slate-200/80 px-3",
                        !formData.transactionDate && "text-muted-foreground",
                        formErrors.transactionDate && "border-red-400"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.transactionDate ? (
                        format(formData.transactionDate, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.transactionDate}
                      onSelect={(date) =>
                        handleSelectChange("transactionDate", date)
                      }
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      captionLayout="dropdown"
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {formErrors.transactionDate && (
                  <p className="text-xs text-rose-600 mt-1">
                    {formErrors.transactionDate}
                  </p>
                )}
              </div>
              {total > 0 && (
                <div className="rounded-lg bg-slate-100 p-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">
                    Total Value
                  </span>
                  <span className="text-lg font-bold text-slate-800">
                    €
                    {total.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              )}
            </div>

            {/* --- Notes, No Portfolio Warning, and Footer remain unchanged --- */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Notes{" "}
                <span className="font-normal normal-case text-slate-400">
                  (Optional)
                </span>
              </Label>
              <Textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="min-h-[70px] bg-slate-100 border-slate-200 rounded-lg resize-none"
                placeholder="Add any relevant notes..."
              />
            </div>
            {!currentPortfolioId && (
              <div className="rounded-md bg-rose-50 p-3 text-sm text-rose-700 flex items-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                No portfolio selected. Cannot submit.
              </div>
            )}
            <DialogFooter className="gap-3 pt-4 border-t border-slate-100">
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="text-slate-600"
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={
                  isLoadingMutation ||
                  isLoadingAssetOptions ||
                  !currentPortfolioId ||
                  Object.keys(formErrors).length > 0
                }
                className={`text-white transition-colors rounded-lg shadow-md shadow-slate-300/50 disabled:opacity-50 disabled:cursor-not-allowed ${currentMode.submitColor}`}
              >
                {isLoadingMutation || isLoadingAssetOptions ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <currentMode.icon className="mr-2 h-4 w-4" />
                    {currentMode.label} Transaction
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
