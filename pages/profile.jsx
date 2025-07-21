// pages/profile.jsx
"use client";

import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "@/features/slices/authSlice";
import { useCurrency } from "@/Providers/CurrencyProvider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const ProfilePage = () => {
  const user = useSelector(selectCurrentUser);
  const {
    currency,
    setCurrency,
    currencySymbol,
    setCurrencySymbol,
  } = useCurrency();

  // Local state for form fields
  const [localCurrency, setLocalCurrency] = useState(currency);
  const [localCurrencySymbol, setLocalCurrencySymbol] = useState(currencySymbol);
  
  useEffect(() => {
    // Sync local state if context changes
    setLocalCurrency(currency);
    setLocalCurrencySymbol(currencySymbol);
  }, [currency, currencySymbol]);

  const handleSaveChanges = () => {
    setCurrency(localCurrency);
    setCurrencySymbol(localCurrencySymbol);
    toast.success("Settings saved successfully!");
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-neutral-800 bg-neutral-950/80 px-4 backdrop-blur-sm md:px-6">
        <h1 className="text-xl font-semibold">Profile & Settings</h1>
      </header>
      <main className="flex-1 p-4 md:p-6">
        <div className="mx-auto max-w-4xl space-y-8">
          {/* Personal Details Section */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
            <h2 className="text-lg font-semibold">Personal Details</h2>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={user?.name || "Anonymous User"}
                  readOnly
                  className="bg-neutral-800 border-neutral-700"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={user?.email || "No email provided"}
                  readOnly
                  className="bg-neutral-800 border-neutral-700"
                />
              </div>
            </div>
          </div>

          {/* Currency Settings Section */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
            <h2 className="text-lg font-semibold">Currency Settings</h2>
            <p className="mt-1 text-sm text-neutral-400">
              Customize how monetary values are displayed across the
              application. The display unit (e.g., K for thousands, M for millions) will be determined automatically based on the amount.
            </p>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="currency-select">Currency</Label>
                <Select
                  value={localCurrency}
                  onValueChange={setLocalCurrency}
                >
                  <SelectTrigger
                    id="currency-select"
                    className="bg-neutral-800 border-neutral-700"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-neutral-800 text-neutral-200">
                    <SelectItem value="TZS" className="focus:bg-neutral-800">
                      Tanzanian Shilling (TZS)
                    </SelectItem>
                    <SelectItem value="USD" className="focus:bg-neutral-800">
                      United States Dollar (USD)
                    </SelectItem>
                    <SelectItem value="EUR" className="focus:bg-neutral-800">
                      Euro (EUR)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency-symbol">Symbol</Label>
                <Input
                  id="currency-symbol"
                  value={localCurrencySymbol}
                  onChange={(e) => setLocalCurrencySymbol(e.target.value)}
                  className="bg-neutral-800 border-neutral-700"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={handleSaveChanges}>Save Changes</Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
