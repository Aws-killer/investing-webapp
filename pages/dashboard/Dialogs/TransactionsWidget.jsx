// components/dashboard/AddTransactionDialog.js
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
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
import { useToast } from "@/components/ui/use-toast";
import {
  useAddStockToPortfolioMutation,
  useAddUttToPortfolioMutation,
  useAddBondToPortfolioMutation,
} from "@/features/api/portfoliosApi"; // Adjust path
import { useDashboard } from "@/Providers/dashboard";

// Helper for date formatting
const formatDateForInput = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  const year = d.getFullYear();
  return [year, month, day].join("-");
};

const initialFormState = {
  assetType: "STOCK", // STOCK, UTT, BOND
  assetId: "", // stock_id, utt_fund_id, bond_id
  quantity: "", // quantity, units_held, face_value_held
  price: "", // purchase_price (per unit for stock/utt, total for bond lot)
  purchaseDate: formatDateForInput(new Date()),
  notes: "",
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

  const [addStock, { isLoading: isLoadingStock }] =
    useAddStockToPortfolioMutation();
  const [addUtt, { isLoading: isLoadingUtt }] = useAddUttToPortfolioMutation();
  const [addBond, { isLoading: isLoadingBond }] =
    useAddBondToPortfolioMutation();

  const isLoading = isLoadingStock || isLoadingUtt || isLoadingBond;

  useEffect(() => {
    if (isOpen) {
      setFormData((prev) => ({
        ...initialFormState,
        purchaseDate: formatDateForInput(new Date()),
      })); // Reset form on open
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      assetType: value,
      assetId: "",
      quantity: "",
      price: "",
    })); // Reset related fields on type change
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentPortfolioId) {
      toast({
        title: "Error",
        description: "No portfolio selected.",
        variant: "destructive",
      });
      return;
    }
    if (
      !formData.assetId ||
      !formData.quantity ||
      !formData.price ||
      !formData.purchaseDate
    ) {
      toast({
        title: "Validation Error",
        description: "Please fill all required fields.",
        variant: "destructive",
      });
      return;
    }

    let mutationPromise;
    const commonData = {
      purchase_date: formData.purchaseDate,
      notes: formData.notes || null, // Ensure notes is null if empty, or handle in backend
    };

    try {
      switch (formData.assetType) {
        case "STOCK":
          mutationPromise = addStock({
            portfolioId: currentPortfolioId,
            stockData: {
              stock_id: parseInt(formData.assetId),
              quantity: parseFloat(formData.quantity),
              purchase_price: parseFloat(formData.price), // Price per share
              ...commonData,
            },
          }).unwrap();
          break;
        case "UTT":
          mutationPromise = addUtt({
            portfolioId: currentPortfolioId,
            uttData: {
              utt_fund_id: parseInt(formData.assetId),
              units_held: parseFloat(formData.quantity), // Schema uses units_held
              purchase_price: parseFloat(formData.price), // Price per unit
              ...commonData,
            },
          }).unwrap();
          break;
        case "BOND":
          mutationPromise = addBond({
            portfolioId: currentPortfolioId,
            bondData: {
              bond_id: parseInt(formData.assetId),
              face_value_held: parseFloat(formData.quantity), // This is face value
              purchase_price: parseFloat(formData.price), // This is TOTAL cost for the lot
              ...commonData,
            },
          }).unwrap();
          break;
        default:
          toast({
            title: "Error",
            description: "Invalid asset type.",
            variant: "destructive",
          });
          return;
      }

      const result = await mutationPromise;
      toast({
        title: "Success",
        description: result.message || "Transaction added successfully!",
      });
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to add transaction:", err);
      toast({
        title: "Error adding transaction",
        description:
          err.data?.detail || err.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const getAssetIdLabel = () => {
    switch (formData.assetType) {
      case "STOCK":
        return "Stock ID";
      case "UTT":
        return "UTT Fund ID";
      case "BOND":
        return "Bond ID";
      default:
        return "Asset ID";
    }
  };

  const getQuantityLabel = () => {
    switch (formData.assetType) {
      case "STOCK":
        return "Quantity (Shares)";
      case "UTT":
        return "Units Held";
      case "BOND":
        return "Face Value Held";
      default:
        return "Quantity";
    }
  };

  const getPriceLabel = () => {
    switch (formData.assetType) {
      case "STOCK":
        return "Price per Share (€)";
      case "UTT":
        return "Price per Unit (€)";
      case "BOND":
        return "Total Purchase Price for Lot (€)"; // For bonds, it's total cost
      default:
        return "Price (€)";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card text-card-foreground">
        <DialogHeader>
          <DialogTitle>Add New Transaction (Buy)</DialogTitle>
          <DialogDescription>
            Enter details for the new asset purchase.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="assetType" className="text-right">
                Asset Type
              </Label>
              <Select
                name="assetType"
                value={formData.assetType}
                onValueChange={handleSelectChange}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select asset type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STOCK">Stock</SelectItem>
                  <SelectItem value="UTT">UTT (Unit Trust)</SelectItem>
                  <SelectItem value="BOND">Bond</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="assetId" className="text-right">
                {getAssetIdLabel()}
              </Label>
              <Input
                id="assetId"
                name="assetId"
                type="number"
                value={formData.assetId}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantity" className="text-right">
                {getQuantityLabel()}
              </Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                step="any"
                value={formData.quantity}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">
                {getPriceLabel()}
              </Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="any"
                value={formData.price}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="purchaseDate" className="text-right">
                Purchase Date
              </Label>
              <Input
                id="purchaseDate"
                name="purchaseDate"
                type="date"
                value={formData.purchaseDate}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Notes
              </Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="col-span-3"
                placeholder="Optional notes"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading || !currentPortfolioId}>
              {isLoading ? "Adding..." : "Add Transaction"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTransactionDialog;