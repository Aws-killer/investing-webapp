// pages/dashboard/Dialogs/CreatePortfolioDialog.jsx
"use client";

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
import { Textarea } from "@/components/ui/textarea";
import { useCreatePortfolioMutation } from "@/features/api/portfoliosApi";
import { useToast } from "@/components/ui/use-toast";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "@/features/slices/authSlice";
import { Loader2, Briefcase, FileText, Plus, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const CreatePortfolioDialog = ({ isOpen, onOpenChange, onPortfolioCreated }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const { toast } = useToast();
  const currentUser = useSelector(selectCurrentUser);

  const [createPortfolio, { isLoading }] = useCreatePortfolioMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const result = await createPortfolio({
        name,
        description,
        userIdUsedForGetPortfolios: currentUser?.id,
      }).unwrap();
      
      toast({
        title: <div className="flex items-center gap-2 text-emerald-400"><CheckCircle2 size={18} /> Success</div>,
        description: "Portfolio created successfully!",
        className: "bg-[#121212] border-zinc-800 text-white"
      });
      
      setName("");
      setDescription("");
      onOpenChange(false);
      if (onPortfolioCreated) onPortfolioCreated(result.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] bg-[#0a0a0a] border border-zinc-800 text-zinc-200 shadow-2xl p-0 overflow-hidden rounded-2xl">
        {/* Header with Gradient */}
        <div className="relative p-6 bg-gradient-to-b from-zinc-900 to-[#0a0a0a] border-b border-zinc-800">
            <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-[0_0_15px_-3px_rgba(16,185,129,0.15)]">
                    <Plus className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                    <DialogTitle className="text-lg font-bold text-white">Create Portfolio</DialogTitle>
                    <DialogDescription className="text-xs text-zinc-500">Start tracking a new collection of assets</DialogDescription>
                </div>
            </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1">Portfolio Name</label>
                <div className="relative">
                    <Briefcase className="absolute left-3 top-3 h-4 w-4 text-zinc-600" />
                    <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="pl-10 bg-[#121212] border-zinc-800 focus:border-emerald-500/50 focus:ring-emerald-500/20 h-11 text-white placeholder:text-zinc-700"
                        placeholder="e.g. Retirement Fund"
                        autoFocus
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1">Description</label>
                <div className="relative">
                    <FileText className="absolute left-3 top-3 h-4 w-4 text-zinc-600" />
                    <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="pl-10 min-h-[100px] bg-[#121212] border-zinc-800 focus:border-emerald-500/50 focus:ring-emerald-500/20 text-white placeholder:text-zinc-700 resize-none pt-3"
                        placeholder="Optional notes..."
                    />
                </div>
            </div>

            <DialogFooter className="pt-2">
                <DialogClose asChild>
                    <Button type="button" variant="ghost" className="text-zinc-500 hover:text-white hover:bg-zinc-900">
                        Cancel
                    </Button>
                </DialogClose>
                <Button 
                    type="submit" 
                    disabled={isLoading || !name.trim()}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-6"
                >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Portfolio"}
                </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};