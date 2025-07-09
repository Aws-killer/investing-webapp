// components/dashboard/CreatePortfolioDialog.js
import React, { useState } from "react";
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
import { useCreatePortfolioMutation } from "@/features/api/portfoliosApi";
import { useToast } from "@/components/ui/use-toast";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "@/features/slices/authSlice";
import { Loader2, Briefcase, FileText, AlertCircle, Plus } from "lucide-react";

export const CreatePortfolioDialog = ({
  isOpen,
  onOpenChange,
  onPortfolioCreated,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const { toast } = useToast();
  const currentUser = useSelector(selectCurrentUser);

  const [createPortfolio, { isLoading, error }] = useCreatePortfolioMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({
        title: "Validation Error",
        description: "Portfolio name is required.",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await createPortfolio({
        name,
        description,
        userIdUsedForGetPortfolios: currentUser?.id,
      }).unwrap();
      toast({
        title: "Success",
        description: result.message || "Portfolio created successfully!",
      });
      setName("");
      setDescription("");
      onOpenChange(false);
      if (onPortfolioCreated) onPortfolioCreated(result.data);
    } catch (err) {
      console.error("Failed to create portfolio:", err);
      toast({
        title: "Error creating portfolio",
        description:
          err.data?.detail || err.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card text-card-foreground border-muted">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Plus className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold">
                Create New Portfolio
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Set up a new investment portfolio to track your assets
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <div className="space-y-5">
            <div className="space-y-2">
              <Label
                htmlFor="name"
                className="text-sm font-medium flex items-center gap-2"
              >
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                Portfolio Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11 px-4 border-muted focus:ring-2 focus:ring-primary/20"
                placeholder="e.g., Growth Stocks, Retirement Fund"
                required
              />
              <p className="text-xs text-muted-foreground ml-1">
                Choose a descriptive name for easy identification
              </p>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="description"
                className="text-sm font-medium flex items-center gap-2"
              >
                <FileText className="h-4 w-4 text-muted-foreground" />
                Description
                <span className="text-xs text-muted-foreground font-normal">
                  (Optional)
                </span>
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[100px] px-4 py-3 border-muted focus:ring-2 focus:ring-primary/20 resize-none"
                placeholder="Add notes about your investment strategy, goals, or any other details..."
              />
              <p className="text-xs text-muted-foreground ml-1">
                {description.length}/500 characters
              </p>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
              <p className="text-sm text-destructive">
                {error.data?.detail ||
                  "An error occurred while creating the portfolio"}
              </p>
            </div>
          )}

          <DialogFooter className="gap-3 sm:gap-3">
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                className="h-11 px-6 hover:bg-muted/50"
                disabled={isLoading}
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="h-11 px-6 min-w-[120px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Portfolio
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
