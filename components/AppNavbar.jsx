// components/AppNavbar.jsx
"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "@/features/slices/authSlice";
import { useGetStocksQuery, useGetStockPricesQuery } from "@/features/api/stocksApi";
import { Search, Building2, BarChart3, Loader2 } from "lucide-react";
import { FloatingNav } from "./ui/floating-navbar";
import { navItems } from "./NavItems";
import { useCurrency } from "@/Providers/CurrencyProvider";


const EquityPrice = ({ symbol }) => {
    const { data: priceData, isLoading } = useGetStockPricesQuery({ symbol, time_range: '1d', page_size: 1 });
    const { formatAmount } = useCurrency();

    if (isLoading || !priceData?.prices?.length) {
        return <span className="text-sm font-mono text-neutral-500">Loading...</span>;
    }

    const price = priceData.prices[0].closing_price;
    return <span className="text-sm font-mono text-neutral-200">{formatAmount(price)}</span>;
};


const SearchBar = () => {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");
    const [isFocused, setIsFocused] = useState(false);
    const { data: stocks, isLoading: isLoadingStocks } = useGetStocksQuery();
    const searchRef = useRef(null);
  
    const filteredEquities = useMemo(() => {
      if (!searchTerm || !stocks) return [];
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      return stocks
        .filter(
          (stock) =>
            stock.name.toLowerCase().includes(lowerCaseSearchTerm) ||
            stock.symbol.toLowerCase().includes(lowerCaseSearchTerm)
        )
        .slice(0, 5); // Limit to 5 results
    }, [searchTerm, stocks]);
  
    const handleSelect = (symbol) => {
      router.push(`/stocks/${symbol}`);
      setSearchTerm("");
      setIsFocused(false);
    };
  
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (searchRef.current && !searchRef.current.contains(event.target)) {
          setIsFocused(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
  
    return (
        <div className="relative w-full max-w-md mx-auto" ref={searchRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
            <input
              type="text"
              placeholder="Search for stocks, funds..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setIsFocused(true)}
              className="w-full pl-9 pr-3 py-2 rounded-md bg-neutral-800 border border-neutral-700 focus:border-teal-500 focus:outline-none text-neutral-100"
            />
            {isLoadingStocks && isFocused && searchTerm &&(
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 animate-spin" />
            )}
          </div>
    
          {isFocused && searchTerm && filteredEquities.length > 0 && (
            <div className="absolute top-full mt-2 w-full rounded-md border border-neutral-700 bg-neutral-800 shadow-lg z-50">
              {filteredEquities.map((item) => (
                <div
                  key={item.symbol}
                  onClick={() => handleSelect(item.symbol)}
                  className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-neutral-700 cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-neutral-900 p-2 rounded-md">
                      {item.asset_type === "Stock" ? (
                        <Building2 className="h-5 w-5 text-teal-400" />
                      ) : (
                        <BarChart3 className="h-5 w-5 text-sky-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-neutral-100">{item.name}</p>
                      <p className="text-sm text-neutral-400">{item.symbol}</p>
                    </div>
                  </div>
                  <div className="text-sm font-mono text-neutral-300">
                      <EquityPrice symbol={item.symbol} />
                  </div>
                </div>
              ))}
            </div>
          )}
           {isFocused && searchTerm && !isLoadingStocks && filteredEquities.length === 0 && (
                <div className="absolute top-full mt-2 w-full rounded-md border border-neutral-700 bg-neutral-800 shadow-lg z-50">
                    <div className="p-4 text-center text-neutral-400">No results found.</div>
                </div>
           )}
        </div>
      );
    };

export const AppNavbar = () => {
    return (
      <FloatingNav navItems={navItems}>
        <SearchBar />
      </FloatingNav>
    );
};
