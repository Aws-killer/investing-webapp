"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { useCreatePortfolioMutation } from "@/features/api/portfoliosApi";
import { useToast } from "@/components/ui/use-toast";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "@/features/slices/authSlice";
import { Loader2, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/ui/use-mobile";

const FieldLabel = ({ children }) => (
  <label className="text-[11px] font-bold uppercase tracking-[0.1em] text-tertiary">{children}</label>
);

const CreatePortfolioForm = ({ onClose }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const { toast } = useToast();
  const currentUser = useSelector(selectCurrentUser);
  const [createPortfolio, { isLoading }] = useCreatePortfolioMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await createPortfolio({
        name,
        description,
        userIdUsedForGetPortfolios: currentUser?.id,
      }).unwrap();
      toast({
        title: (
          <div className="flex items-center gap-2 text-emerald-500">
            <Check size={16} /> Portfolio created
          </div>
        ),
        description: `"${name}" is ready to use.`,
        className: "bg-card border-border text-foreground",
      });
      setName("");
      setDescription("");
      onClose();
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to create portfolio.", variant: "destructive" });
    }
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border flex-shrink-0">
        <div>
          <h2 className="text-[16px] font-extrabold tracking-[-0.04em] text-foreground">New Portfolio</h2>
          <p className="text-[11px] text-tertiary font-medium mt-0.5">Track a new collection of assets</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-[6px] text-tertiary hover:text-foreground hover:bg-muted transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        <div className="space-y-1.5">
          <FieldLabel>Portfolio Name</FieldLabel>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Retirement Fund"
            autoFocus
            className="w-full h-10 bg-background border border-border text-[13px] text-foreground rounded-[6px] px-3 focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-tertiary"
          />
        </div>

        <div className="space-y-1.5">
          <FieldLabel>Description <span className="normal-case tracking-normal text-tertiary font-medium">(optional)</span></FieldLabel>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Notes about this portfolio…"
            rows={3}
            className="w-full bg-background border border-border text-[13px] text-foreground rounded-[6px] px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-tertiary resize-none"
          />
        </div>

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-10 text-[13px] font-semibold text-tertiary bg-muted rounded-[6px] hover:bg-accent transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || !name.trim()}
            className={cn(
              "flex-1 h-10 text-[13px] font-bold rounded-[6px] transition-all flex items-center justify-center gap-2",
              isLoading || !name.trim()
                ? "bg-muted text-tertiary cursor-not-allowed"
                : "bg-foreground text-background hover:opacity-90 active:scale-[0.98]"
            )}
          >
            {isLoading && <Loader2 size={14} className="animate-spin" />}
            Create Portfolio
          </button>
        </div>
      </form>
    </div>
  );
};

export const CreatePortfolioDialog = ({ isOpen, onOpenChange, onPortfolioCreated: _ }) => {
  const isMobile = useIsMobile();
  const onClose = () => onOpenChange(false);

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onOpenChange} direction="bottom">
        <DrawerContent className="bg-card border-border">
          <CreatePortfolioForm onClose={onClose} />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="max-w-[380px] bg-card border-border text-foreground p-0 gap-0 rounded-[12px] overflow-hidden">
        <DialogTitle className="sr-only">New Portfolio</DialogTitle>
        <CreatePortfolioForm onClose={onClose} />
      </DialogContent>
    </Dialog>
  );
};

export default CreatePortfolioDialog;
