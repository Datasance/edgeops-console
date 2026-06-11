import React, { type ReactNode } from "react";
import { NavLink, useMatch } from "react-router-dom";
import { MenuItem } from "react-pro-sidebar";

type SidebarNavItemProps = {
  to: string;
  icon?: ReactNode;
  end?: boolean;
  children: ReactNode;
};

export default function SidebarNavItem({
  to,
  icon,
  end = false,
  children,
}: SidebarNavItemProps) {
  const match = useMatch({ path: to, end });

  return (
    <MenuItem
      component={<NavLink to={to} />}
      icon={icon}
      active={Boolean(match)}
    >
      {children}
    </MenuItem>
  );
}
