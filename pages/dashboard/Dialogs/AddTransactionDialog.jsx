"use client";

import React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { X } from "lucide-react";
import { useIsMobile } from "@/hooks/ui/use-mobile";
import { TransactionProvider } from "./AddTransaction/context";
import {
  AssetTypeTabs,
  TransactionTypeSelect,
  AssetSearch,
  CalculatorInputs,
  TransactionDatePicker,
  TransactionFooter,
} from "./AddTransaction/components";

const TransactionFormContent = ({ onClose }) => (
  <div className="flex flex-col h-full">
    <div className="pt-5 flex-shrink-0">
      <div className="flex items-center justify-between px-5 mb-4">
        <h2 className="text-[16px] font-extrabold tracking-[-0.04em] text-foreground">Add Transaction</h2>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-[6px] text-tertiary hover:text-foreground hover:bg-muted transition-colors"
        >
          <X size={16} />
        </button>
      </div>
      <AssetTypeTabs />
    </div>
    <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1">
      <TransactionTypeSelect />
      <AssetSearch />
      <CalculatorInputs />
      <TransactionDatePicker />
    </div>
    <div className="flex-shrink-0">
      <TransactionFooter />
    </div>
  </div>
);

export const AddTransactionDialog = (props) => {
  const isMobile = useIsMobile();
  const onClose = () => props.onOpenChange(false);

  if (isMobile) {
    return (
      <Drawer open={props.isOpen} onOpenChange={props.onOpenChange} direction="bottom">
        <DrawerContent className="bg-card border-border" style={{ maxHeight: "92dvh" }}>
          <TransactionProvider {...props}>
            <TransactionFormContent onClose={onClose} />
          </TransactionProvider>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={props.isOpen} onOpenChange={props.onOpenChange}>
      <DialogContent showCloseButton={false} className="max-w-[420px] bg-card text-foreground border-border p-0 gap-0 rounded-[12px] overflow-hidden">
        <DialogTitle className="sr-only">Add Transaction</DialogTitle>
        <TransactionProvider {...props}>
          <TransactionFormContent onClose={onClose} />
        </TransactionProvider>
      </DialogContent>
    </Dialog>
  );
};
