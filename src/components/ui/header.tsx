// src/components/ui/header.tsx
"use client";

import React from 'react';
import { ThemeToggle } from '@/components/theme-toggle';
import UserDropdownMenu from '@/components/user-dropdown-menu'; 

interface HeaderProps {
  title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  return (
    <header className="w-full py-4 px-4 sm:px-6 flex items-center justify-between border-b border-border/60 shadow-sm sticky top-0 bg-background/80 backdrop-blur-md z-50">
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-bold">{title}</h1>
      </div>
      <div className="flex items-center space-x-4">
        <ThemeToggle />
        <UserDropdownMenu />
      </div>
    </header>
  );
};

export default Header;
