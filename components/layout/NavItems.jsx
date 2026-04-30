// components/NavItems.jsx
import { IconHome, IconBriefcase, IconTrendingUp, IconChartPie, IconBuildingBank } from "@tabler/icons-react";

export const navItems = [
  {
    name: "Dashboard",
    link: "/dashboard",
    icon: <IconHome className="h-4 w-4" />,
    requiresAuth: true,
  },
  {
    name: "Portfolios",
    link: "/portfolios",
    icon: <IconBriefcase className="h-4 w-4" />,
    requiresAuth: true,
  },
  {
    name: "Stocks",
    link: "/stocks",
    icon: <IconTrendingUp className="h-4 w-4" />,
  },
  {
    name: "Funds",
    link: "/funds",
    icon: <IconChartPie className="h-4 w-4" />,
  },
  {
    name: "Bonds",
    link: "/bonds",
    icon: <IconBuildingBank className="h-4 w-4" />,
  },
];
