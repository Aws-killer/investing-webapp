import React from 'react';
import { Card } from '@/components/ui/card';
import { formatTZS } from '@/lib/utils';

export const FundMetrics = ({ fund, currency = "TZS" }) => {
  const metrics = [
    {
      label: 'AUM',
      value: fund?.fund_size_aum,
      format: { isCompact: true }
    },
    {
      label: '1M Return',
      value: fund?.return_1m,
      suffix: '%',
      format: { decimals: 2 }
    },
    {
      label: '3M Return',
      value: fund?.return_3m,
      suffix: '%',
      format: { decimals: 2 }
    },
    {
      label: 'YTD Return',
      value: fund?.return_ytd,
      suffix: '%',
      format: { decimals: 2 }
    },
    {
      label: 'Dividend Yield',
      value: fund?.dividend_yield_ttm,
      suffix: '%',
      format: { decimals: 2 }
    },
    {
      label: 'Management Fee',
      value: fund?.management_fee_percent,
      suffix: '%',
      format: { decimals: 2 }
    }
  ];

  return (
    <Card title="Fund Metrics">
      <div className="grid grid-cols-2 gap-y-4 md:gap-y-6 gap-x-3 md:gap-x-4">
        {metrics.map((metric, idx) => (
          <div key={idx}>
            <div className="text-xs text-zinc-400 font-medium mb-1">
              {metric.label}
            </div>
            <div className="text-sm font-bold text-white truncate">
              {metric.value !== null && metric.value !== undefined ? (
                <>
                  {!metric.suffix && `${currency} `}
                  {formatTZS(metric.value, metric.format)}
                  {metric.suffix || ''}
                </>
              ) : (
                '-'
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
