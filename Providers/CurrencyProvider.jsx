import { createContext, useContext, useState } from 'react';

const CurrencyContext = createContext(null);

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}

export function CurrencyProvider({ children }) {
  const [currency, setCurrency] = useState('TZS');
  const [currencySymbol, setCurrencySymbol] = useState('Tz');

  const formatAmount = (amount) => {
    if (amount === null || typeof amount === 'undefined' || isNaN(parseFloat(amount))) {
      return 'N/A';
    }

    let value = parseFloat(amount);
    let suffix = '';

    // Use absolute value for range check to handle negative numbers correctly
    const absValue = Math.abs(value);

    if (absValue >= 1_000_000_000_000) {
        value = value / 1_000_000_000_000;
        suffix = 'T';
    } else if (absValue >= 1_000_000_000) {
        value = value / 1_000_000_000;
        suffix = 'B';
    } else if (absValue >= 1_000_000) {
      value = value / 1_000_000;
      suffix = 'M';
    } else if (absValue >= 10_000) {
      value = value / 1_000;
      suffix = 'K';
    }

    return `${currencySymbol}${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${suffix}`;
  };

  const value = {
    currency,
    setCurrency,
    currencySymbol,
    setCurrencySymbol,
    formatAmount,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}
