// components/NavItems.jsx
import { IconHome, IconBriefcase, IconTrendingUp, IconUser } from "@tabler/icons-react";

export const navItems = [
  {
    name: "Dashboard",
    link: "/dashboard",
    icon: <IconHome className="h-4 w-4 text-neutral-500 dark:text-white" />,
  },
  {
    name: "Portfolios",
    link: "/portfolios",
    icon: <IconBriefcase className="h-4 w-4 text-neutral-500 dark:text-white" />,
  },
  {
    name: "Stocks",
    link: "/stocks",
    icon: <IconTrendingUp className="h-4 w-4 text-neutral-500 dark:text-white" />,
  },
  {
    name: "Profile",
    link: "/profile",
    icon: <IconUser className="h-4 w-4 text-neutral-500 dark:text-white" />,
  },
];
