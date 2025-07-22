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

// Real hooks
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
  CheckCircle2,
  XCircle,
  Calendar as CalendarIcon,
  Wallet,
  ChevronDown,
} from "lucide-react";

// --- HELPERS & STATE ---
const formatDateForInput = (date) => (date ? format(date, "yyyy-MM-dd") : "");
const initialFormState = {
  transactionMode: "BUY",
  assetType: "STOCK",
  assetId: "",
  quantity: "",
  price: "",
  transactionDate: new Date(),
  notes: "",
};

// --- REDESIGNED UI SUB-COMPONENTS ---

const WidgetHeader = ({ title, description }) => (
  <DialogHeader className="text-center">
    <DialogTitle className="text-xl font-bold tracking-tight text-neutral-100">
      {title}
    </DialogTitle>
    <DialogDescription className="text-sm text-neutral-400">
      {description}
    </DialogDescription>
  </DialogHeader>
);

const ToggleButton = React.forwardRef(({ children, active, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    className={cn(
      "flex-1 px-3 py-2 text-sm font-semibold rounded-md transition-colors",
      active
        ? "bg-teal-500/10 text-teal-400"
        : "text-neutral-400 hover:bg-neutral-800"
    )}
    {...props}
  >
    {children}
  </button>
));
ToggleButton.displayName = "ToggleButton";

const FormInputGroup = ({ children, className }) => (
  <div className={cn("flex flex-col gap-1.5", className)}>{children}</div>
);

const FormInput = React.forwardRef(({ placeholder, error, ...props }, ref) => (
  <div className="relative">
    <Input
      ref={ref}
      placeholder={placeholder}
      className={cn(
        "h-auto bg-transparent border-0 border-b border-neutral-700 rounded-none px-1 py-2 placeholder:text-neutral-500 focus:border-teal-400 focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors",
        error && "border-red-500 focus:border-red-500"
      )}
      {...props}
    />
    {error && (
      <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
        <AlertCircle className="h-3.5 w-3.5" />
        {error}
      </p>
    )}
  </div>
));
FormInput.displayName = "FormInput";

// --- MAIN DIALOG COMPONENT ---

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

  const { data: stocksList = [], isLoading: isLoadingStocksList } =
    useGetStocksQuery(undefined, {
      skip: formData.assetType !== "STOCK" || !isOpen,
    });
  const { data: uttFundsList = [], isLoading: isLoadingUttFundsList } =
    useGetUttFundsQuery(undefined, {
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
      setFormData({ ...initialFormState, transactionDate: new Date() });
      setFormErrors({});
    }
  }, [isOpen]);

  const validateField = (name, value) => {
    const errors = { ...formErrors };
    if (name === "assetId" && !value) errors.assetId = `Please select an asset`;
    else delete errors.assetId;
    if (name === "quantity" && (!value || parseFloat(value) <= 0))
      errors.quantity = "Must be greater than 0";
    else delete errors.quantity;
    if (name === "price" && (!value || parseFloat(value) <= 0))
      errors.price = "Must be greater than 0";
    else delete errors.price;
    if (name === "transactionDate" && !value)
      errors.transactionDate = "Date is required";
    else delete errors.transactionDate;
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
      ...(name === "assetType" && { assetId: "" }),
    }));
    if (name === "assetType") setFormErrors({});
    else validateField(name, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!formData.assetId) errors.assetId = `Select an asset`;
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
    const mutationPayload = {
      portfolioId: currentPortfolioId,
      assetId: parseInt(formData.assetId),
      quantity: parseFloat(formData.quantity),
      price: parseFloat(formData.price),
      date: formatDateForInput(formData.transactionDate),
      notes: formData.notes || null,
    };

    try {
      switch (`${formData.transactionMode}_${formData.assetType}`) {
        case "BUY_STOCK":
          mutationPromise = addStock({
            portfolioId: mutationPayload.portfolioId,
            stockData: {
              stock_id: mutationPayload.assetId,
              quantity: mutationPayload.quantity,
              purchase_price: mutationPayload.price,
              purchase_date: mutationPayload.date,
              notes: mutationPayload.notes,
            },
          }).unwrap();
          break;
        case "BUY_UTT":
          mutationPromise = addUtt({
            portfolioId: mutationPayload.portfolioId,
            uttData: {
              utt_fund_id: mutationPayload.assetId,
              units_held: mutationPayload.quantity,
              purchase_price: mutationPayload.price,
              purchase_date: mutationPayload.date,
              notes: mutationPayload.notes,
            },
          }).unwrap();
          break;
        case "BUY_BOND":
          mutationPromise = addBond({
            portfolioId: mutationPayload.portfolioId,
            bondData: {
              bond_id: mutationPayload.assetId,
              face_value_held: mutationPayload.quantity,
              purchase_price: mutationPayload.price,
              purchase_date: mutationPayload.date,
              notes: mutationPayload.notes,
            },
          }).unwrap();
          break;
        case "SELL_STOCK":
          mutationPromise = sellStock({
            portfolioId: mutationPayload.portfolioId,
            stockId: mutationPayload.assetId,
            sellData: {
              quantity: mutationPayload.quantity,
              sell_price: mutationPayload.price,
              sell_date: mutationPayload.date,
              notes: mutationPayload.notes,
            },
          }).unwrap();
          break;
        case "SELL_UTT":
          mutationPromise = sellUtt({
            portfolioId: mutationPayload.portfolioId,
            uttFundId: mutationPayload.assetId,
            sellData: {
              units_to_sell: mutationPayload.quantity,
              sell_price: mutationPayload.price,
              sell_date: mutationPayload.date,
              notes: mutationPayload.notes,
            },
          }).unwrap();
          break;
        case "SELL_BOND":
          mutationPromise = sellBond({
            portfolioId: mutationPayload.portfolioId,
            bondId: mutationPayload.assetId,
            sellData: {
              face_value_to_sell: mutationPayload.quantity,
              sell_price: mutationPayload.price,
              sell_date: mutationPayload.date,
              notes: mutationPayload.notes,
            },
          }).unwrap();
          break;
        default:
          throw new Error("Invalid transaction type.");
      }
      const result = await mutationPromise;
      toast({
        title: (
          <div className="flex items-center">
            <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" />
            Success
          </div>
        ),
        description: result.message || `Transaction processed successfully!`,
      });
      onOpenChange(false);
    } catch (err) {
      toast({
        title: (
          <div className="flex items-center">
            <XCircle className="mr-2 h-4 w-4 text-red-500" />
            Error
          </div>
        ),
        description: String(
          err.data?.detail || err.message || "An unexpected error occurred."
        ),
        variant: "destructive",
      });
    }
  };

  const getQuantityLabel = () =>
    formData.assetType === "BOND"
      ? "Face Value"
      : formData.assetType === "UTT"
      ? "Units"
      : "Shares";
  const getPriceLabel = () =>
    formData.assetType === "BOND" ? "Total Price" : "Price per Unit/Share";
  const calculateTotal = () =>
    (parseFloat(formData.quantity) || 0) * (parseFloat(formData.price) || 0);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-black/80 p-6 border-neutral-800 rounded-xl shadow-2xl backdrop-blur-xl">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <WidgetHeader
            title="Record a Transaction"
            description="Add a new buy or sell order to your portfolio."
          />

          <div className="flex flex-col gap-5">
            <fieldset className="p-1.5 bg-neutral-900/70 rounded-lg space-y-1.5">
              <legend className="text-xs font-semibold text-neutral-500 px-1 mb-1">
                Action
              </legend>
              <div className="flex gap-1.5">
                <ToggleButton
                  active={formData.transactionMode === "BUY"}
                  onClick={() => handleSelectChange("transactionMode", "BUY")}
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Buy
                </ToggleButton>
                <ToggleButton
                  active={formData.transactionMode === "SELL"}
                  onClick={() => handleSelectChange("transactionMode", "SELL")}
                >
                  <Minus className="h-4 w-4 mr-1.5" />
                  Sell
                </ToggleButton>
              </div>
            </fieldset>

            <fieldset className="p-1.5 bg-neutral-900/70 rounded-lg space-y-1.5">
              <legend className="text-xs font-semibold text-neutral-500 px-1 mb-1">
                Asset Type
              </legend>
              <div className="flex gap-1.5">
                <ToggleButton
                  active={formData.assetType === "STOCK"}
                  onClick={() => handleSelectChange("assetType", "STOCK")}
                >
                  <TrendingUp className="h-4 w-4 mr-1.5" />
                  Stock
                </ToggleButton>
                <ToggleButton
                  active={formData.assetType === "UTT"}
                  onClick={() => handleSelectChange("assetType", "UTT")}
                >
                  <Wallet className="h-4 w-4 mr-1.5" />
                  UTT
                </ToggleButton>
                <ToggleButton
                  active={formData.assetType === "BOND"}
                  onClick={() => handleSelectChange("assetType", "BOND")}
                >
                  <TrendingDown className="h-4 w-4 mr-1.5" />
                  Bond
                </ToggleButton>
              </div>
            </fieldset>

            <FormInputGroup>
              {isLoadingAssetOptions ? (
                <div className="h-12 flex items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-neutral-500" />
                </div>
              ) : (
                <Select
                  value={formData.assetId}
                  onValueChange={(v) => handleSelectChange("assetId", v)}
                >
                  <SelectTrigger
                    className={cn(
                      "h-12 text-base px-1",
                      formErrors.assetId &&
                        "border-red-500 focus:border-red-500"
                    )}
                  >
                    <SelectValue placeholder="Select an Asset..." />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-neutral-800 text-neutral-200">
                    {(formData.assetType === "STOCK"
                      ? stocksList
                      : uttFundsList
                    ).map((asset) => (
                      <SelectItem
                        key={asset.id}
                        value={String(asset.id)}
                        className="focus:bg-neutral-800"
                      >
                        <Badge
                          variant="secondary"
                          className="mr-2 text-xs bg-neutral-700 text-neutral-300"
                        >
                          {asset.symbol}
                        </Badge>
                        <span className="truncate">{asset.name}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {formErrors.assetId && (
                <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {formErrors.assetId}
                </p>
              )}
            </FormInputGroup>

            <div className="grid grid-cols-2 gap-4">
              <FormInputGroup>
                <FormInput
                  name="quantity"
                  type="number"
                  step="any"
                  min="0"
                  value={formData.quantity}
                  onChange={handleChange}
                  placeholder={getQuantityLabel()}
                  error={formErrors.quantity}
                />
              </FormInputGroup>
              <FormInputGroup>
                <FormInput
                  name="price"
                  type="number"
                  step="any"
                  min="0"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder={getPriceLabel()}
                  error={formErrors.price}
                />
              </FormInputGroup>
            </div>

            <div className="grid grid-cols-2 gap-4 items-end">
              <FormInputGroup>
                <label className="text-xs font-semibold text-neutral-500 px-1">
                  Date
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-left font-normal h-auto p-1 border-b border-neutral-700 rounded-none hover:bg-transparent"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-neutral-500" />
                      {formData.transactionDate ? (
                        format(formData.transactionDate, "PPP")
                      ) : (
                        <span className="text-neutral-500">Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0 bg-neutral-900 border-neutral-800"
                    align="start"
                  >
                    <Calendar
                      mode="single"
                      selected={formData.transactionDate}
                      onSelect={(d) => handleSelectChange("transactionDate", d)}
                      disabled={(d) =>
                        d > new Date() || d < new Date("1900-01-01")
                      }
                      initialFocus
                      classNames={{
                        head_cell: "text-neutral-400",
                        cell: "text-neutral-200",
                        day_selected:
                          "bg-teal-500 text-white hover:bg-teal-600",
                        day_today: "text-teal-400",
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </FormInputGroup>
              {calculateTotal() > 0 && (
                <div className="text-right">
                  <p className="text-xs text-neutral-500">Total Value</p>
                  <p className="text-xl font-mono font-semibold text-white">
                    €
                    {calculateTotal().toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              )}
            </div>

            <FormInputGroup>
              <Textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="min-h-[60px] bg-transparent border border-neutral-800 rounded-md placeholder:text-neutral-500"
                placeholder="Optional notes..."
              />
            </FormInputGroup>
          </div>

          <DialogFooter className="flex flex-col gap-2 pt-4 border-t border-neutral-800">
            <Button
              type="submit"
              disabled={
                isLoadingMutation ||
                isLoadingAssetOptions ||
                !currentPortfolioId ||
                Object.keys(formErrors).length > 0
              }
              className="w-full h-12 text-base font-bold bg-teal-500 text-white hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoadingMutation || isLoadingAssetOptions ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                `Confirm ${formData.transactionMode}`
              )}
            </Button>
            <DialogClose asChild>
              <Button
                type="button"
                variant="ghost"
                className="w-full text-neutral-500 hover:text-white"
              >
                Cancel
              </Button>
            </DialogClose>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTransactionDialog;