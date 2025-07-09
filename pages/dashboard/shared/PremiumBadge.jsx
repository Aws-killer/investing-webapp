// pages/dashboard/shared/PremiumBadge.jsx
"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";

export const PremiumBadge = () => (
  <Badge
    variant="outline"
    className="text-xs font-light text-gray-400 border-gray-400"
  >
    PREMIUM
  </Badge>
);
