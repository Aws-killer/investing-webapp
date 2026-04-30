"use client";
import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export const Breadcrumbs = () => (
  <nav className="flex items-center gap-1.5 mb-5">
    {[{ label: "Net Worth", href: "#" }, { label: "Investments", href: "#" }, { label: "Individual", href: null }].map((item, i, arr) => (
      <React.Fragment key={item.label}>
        {item.href
          ? <Link href={item.href} className="text-[11px] font-bold uppercase tracking-[0.1em] text-tertiary hover:text-foreground transition">{item.label}</Link>
          : <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-foreground">{item.label}</span>
        }
        {i < arr.length - 1 && <ChevronRight size={12} className="text-tertiary" />}
      </React.Fragment>
    ))}
  </nav>
);

export default Breadcrumbs;
