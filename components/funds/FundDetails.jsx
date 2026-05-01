import React from 'react';
import { Card } from '@/components/ui/card';

export const FundDetails = ({ fund }) => {
  const details = [
    { label: 'Fund Type', value: fund?.fund_type },
    { label: 'Currency', value: fund?.currency },
    { label: 'Distribution Frequency', value: fund?.distribution_frequency },
    { label: 'Pays Dividends', value: fund?.pays_dividends ? 'Yes' : 'No' },
    { label: 'Inception Date', value: fund?.inception_date || 'N/A' },
    { label: 'Manager', value: fund?.manager_name }
  ];

  return (
    <Card title="Fund Details">
      <div className="space-y-3">
        {details.map((detail, idx) => (
          <div key={idx} className="flex justify-between items-center py-2 border-b border-zinc-800 last:border-0">
            <span className="text-xs text-zinc-400 font-medium">{detail.label}</span>
            <span className="text-xs font-bold text-white text-right">{detail.value || '-'}</span>
          </div>
        ))}
      </div>
    </Card>
  );
};
