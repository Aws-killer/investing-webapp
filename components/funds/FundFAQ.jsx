import React from 'react';
import { ChevronDown } from 'lucide-react';

const FAQItem = ({ question }) => (
  <div className="flex items-center justify-between py-3 md:py-4 border-b border-zinc-800 cursor-pointer group">
    <span className="text-xs md:text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors pr-4">
      {question}
    </span>
    <ChevronDown size={16} className="text-zinc-500 shrink-0" />
  </div>
);

export const FundFAQ = ({ fundName }) => {
  const questions = [
    `What is the minimum investment for ${fundName}?`,
    `What are the fees associated with ${fundName}?`,
    `How often does ${fundName} distribute dividends?`,
    `What is the risk profile of ${fundName}?`
  ];

  return (
    <div>
      <h3 className="text-sm font-bold text-zinc-200 mb-3 md:mb-4">
        Frequently asked questions
      </h3>
      <div className="bg-transparent">
        {questions.map((question, idx) => (
          <FAQItem key={idx} question={question} />
        ))}
      </div>
    </div>
  );
};
