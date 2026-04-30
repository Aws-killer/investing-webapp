"use client";

import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "@/features/slices/authSlice";
import { useCurrency } from "@/features/context/currency-context";
import { toast } from "sonner";

const Label = ({ children }) => (
  <label className="block text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-1.5">{children}</label>
);
const ReadInput = ({ value }) => (
  <div className="h-11 bg-muted rounded-[6px] px-3.5 flex items-center text-[13px] font-medium text-muted-foreground">{value}</div>
);
const Card = ({ title, description, children }) => (
  <div className="bg-card rounded-[12px] p-6 card-shadow">
    <h2 className="text-[15px] font-extrabold tracking-[-0.03em] text-foreground">{title}</h2>
    {description && <p className="text-[13px] text-muted-foreground font-medium mt-1 leading-relaxed">{description}</p>}
    <div className="mt-6">{children}</div>
  </div>
);

export default function ProfilePage() {
  const user = useSelector(selectCurrentUser);
  const { currency, setCurrency, currencySymbol, setCurrencySymbol } = useCurrency();
  const [localCurrency, setLocalCurrency] = useState(currency);
  const [localSymbol, setLocalSymbol] = useState(currencySymbol);

  useEffect(() => { setLocalCurrency(currency); setLocalSymbol(currencySymbol); }, [currency, currencySymbol]);

  const handleSave = () => { setCurrency(localCurrency); setCurrencySymbol(localSymbol); toast.success("Settings saved"); };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border px-6 py-5">
        <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-tertiary">Account</p>
        <h1 className="text-[22px] font-extrabold tracking-[-0.05em] text-foreground mt-0.5">Profile & Settings</h1>
      </header>
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <Card title="Personal Details">
          <div className="grid gap-5 md:grid-cols-2">
            <div><Label>Name</Label><ReadInput value={user?.name || "Anonymous User"} /></div>
            <div><Label>Email</Label><ReadInput value={user?.email || "No email provided"} /></div>
          </div>
        </Card>
        <Card title="Currency Settings" description="Customize how monetary values are displayed across the application.">
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <Label>Currency</Label>
              <select value={localCurrency} onChange={(e) => setLocalCurrency(e.target.value)}
                className="w-full h-11 bg-input rounded-[6px] px-3.5 text-[13px] font-medium text-foreground ring-1 ring-border focus:outline-none focus:ring-2 focus:ring-ring transition appearance-none cursor-pointer"
              >
                <option value="TZS">Tanzanian Shilling (TZS)</option>
                <option value="USD">United States Dollar (USD)</option>
                <option value="EUR">Euro (EUR)</option>
              </select>
            </div>
            <div>
              <Label>Symbol</Label>
              <input value={localSymbol} onChange={(e) => setLocalSymbol(e.target.value)}
                className="w-full h-11 bg-input rounded-[6px] px-3.5 text-[13px] font-medium text-foreground ring-1 ring-border focus:outline-none focus:ring-2 focus:ring-ring transition"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button onClick={handleSave}
              className="h-10 px-6 bg-foreground text-background text-[12px] font-bold rounded-[6px] hover:opacity-80 active:scale-95 transition"
            >
              Save Changes
            </button>
          </div>
        </Card>
      </main>
    </div>
  );
}
