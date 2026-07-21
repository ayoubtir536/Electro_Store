/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Smartphone, Laptop, Watch, Headphones, Search, ShoppingCart, 
  Heart, User, ChevronDown, RefreshCw, Layers, ShieldCheck, 
  Menu, X, Tag, HelpCircle, FileText, Settings, Sun, Moon, Globe
} from "lucide-react";
import { Role, User as UserType } from "../types";
import { translations, Language } from "../translations";

interface NavbarProps {
  currentUser: UserType | null;
  onSelectRole: (role: Role) => void;
  cartCount: number;
  wishlistCount: number;
  onNavigate: (view: string) => void;
  activeView: string;
  onSearch: (query: string) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  theme: "light" | "dark";
  onThemeToggle: () => void;
}

export default function Navbar({
  currentUser,
  onSelectRole,
  cartCount,
  wishlistCount,
  onNavigate,
  activeView,
  onSearch,
  language,
  onLanguageChange,
  theme,
  onThemeToggle,
}: NavbarProps) {
  const [searchVal, setSearchVal] = useState("");
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [showMegaMenu, setShowMegaMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const t = translations[language];

  const presetUsers = [
    { name: "James Bond (VIP Customer)", role: Role.CUSTOMER, desc: "Order, track & review products" },
    { name: "Sarah Connor (Super Admin)", role: Role.SUPER_ADMIN, desc: "Full controls & full analytics" },
    { name: "David Miller (Phones)", role: Role.SMARTPHONE_MANAGER, desc: "Phones, screen protectors & chargers" },
    { name: "Linus Tech (Computers)", role: Role.COMPUTER_MANAGER, desc: "Computers, PC components & peripherals" },
    { name: "Alex Garmin (Watches)", role: Role.SMART_WATCH_MANAGER, desc: "Watches, watch straps & chargers" },
    { name: "Maria Beats (Accessories)", role: Role.ACCESSORIES_MANAGER, desc: "Audio, speakers & gaming accessories" },
    { name: "John FedEx (Logistics)", role: Role.ORDERS_MANAGER, desc: "Manage ship, deliver & refund queues" },
    { name: "Emily Watson (Support)", role: Role.CUSTOMER_SERVICE, desc: "Manage tickets, live chat & FAQs" },
    { name: "Guest User", role: Role.GUEST, desc: "Simple product browsing & cart setup" }
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchVal);
    onNavigate("shop");
  };

  const isRtl = language === "ar";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/95 dark:bg-neutral-950 dark:border-neutral-900 backdrop-blur-md transition-colors duration-300">
      {/* Role Switcher Banner */}
      <div className="bg-neutral-950 px-4 py-2 text-white">
        <div className={`mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 text-xs ${isRtl ? "flex-row-reverse" : ""}`}>
          <div className={`flex items-center gap-1.5 ${isRtl ? "flex-row-reverse" : ""}`}>
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-medium text-neutral-400">{t.activeSession}:</span>
            <span className="rounded bg-neutral-900 px-2 py-0.5 font-mono text-neutral-200">
              {currentUser?.name || "Guest"}
            </span>
            <span className="text-neutral-500">({currentUser?.role || Role.GUEST})</span>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
              className="flex items-center gap-1.5 rounded bg-emerald-500 px-2.5 py-1 font-semibold text-neutral-900 transition hover:bg-emerald-400"
              id="role-switch-btn"
            >
              <RefreshCw className="h-3.5 w-3.5 animate-spin-slow" />
              <span>{t.switchStoreRole}</span>
              <ChevronDown className="h-3 w-3" />
            </button>

            {showRoleSwitcher && (
              <div className={`absolute top-full mt-2 w-80 rounded-xl border border-neutral-800 bg-neutral-950 p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-3 ${isRtl ? "left-0" : "right-0"}`}>
                <div className="border-b border-neutral-900 p-2 text-[10px] font-bold tracking-wider text-neutral-500 uppercase text-center">
                  {t.selectRoleDesc}
                </div>
                <div className="max-h-96 overflow-y-auto pt-1">
                  {presetUsers.map((p) => (
                    <button
                      key={p.role}
                      onClick={() => {
                        onSelectRole(p.role);
                        setShowRoleSwitcher(false);
                      }}
                      className="w-full text-left rounded-lg p-2.5 hover:bg-neutral-900 transition flex flex-col gap-0.5"
                    >
                      <div className={`flex items-center justify-between text-xs font-semibold text-neutral-200 ${isRtl ? "flex-row-reverse" : ""}`}>
                        <span>{p.name}</span>
                        {currentUser?.role === p.role && (
                          <span className="text-[10px] bg-emerald-950 text-emerald-400 px-1.5 py-0.2 rounded border border-emerald-800 font-normal">Active</span>
                        )}
                      </div>
                      <div className={`text-[10px] text-neutral-500 ${isRtl ? "text-right" : "text-left"}`}>{p.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Primary Navigation */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className={`flex h-16 items-center justify-between gap-4 ${isRtl ? "flex-row-reverse" : ""}`}>
          
          {/* Logo */}
          <div className={`flex items-center gap-8 ${isRtl ? "flex-row-reverse" : ""}`}>
            <button 
              onClick={() => onNavigate("home")} 
              className="flex items-center gap-2 text-xl font-black tracking-widest text-neutral-950 dark:text-white"
              id="brand-logo"
            >
              <Layers className="h-6 w-6 text-emerald-500" />
              <span>ELECTRA</span>
            </button>

            {/* Desktop Navigation Links */}
            <nav className={`hidden md:flex items-center gap-6 text-sm font-medium text-neutral-600 dark:text-neutral-400 ${isRtl ? "flex-row-reverse" : ""}`}>
              <button 
                onClick={() => onNavigate("home")} 
                className={`hover:text-black dark:hover:text-white transition ${activeView === "home" ? "text-black dark:text-white font-semibold" : ""}`}
              >
                {t.home}
              </button>
              
              {/* Mega Menu Toggle */}
              <div 
                className="relative"
                onMouseEnter={() => setShowMegaMenu(true)}
                onMouseLeave={() => setShowMegaMenu(false)}
              >
                <button 
                  onClick={() => onNavigate("shop")}
                  className={`flex items-center gap-1 hover:text-black dark:hover:text-white transition ${activeView === "shop" ? "text-black dark:text-white font-semibold" : ""}`}
                >
                  <span>{t.products}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>

                {showMegaMenu && (
                  <div className={`absolute top-full pt-4 w-[600px] z-50 ${isRtl ? "right-0" : "left-0"}`}>
                    <div className="rounded-2xl border border-gray-100 dark:border-neutral-900 bg-white dark:bg-neutral-900 p-6 shadow-2xl grid grid-cols-2 gap-6">
                      <div>
                        <div className={`flex items-center gap-2 font-bold text-neutral-900 dark:text-neutral-100 text-xs tracking-wider uppercase border-b border-gray-100 dark:border-neutral-800 pb-2 mb-3 ${isRtl ? "flex-row-reverse" : ""}`}>
                          <Smartphone className="h-4 w-4 text-emerald-500" />
                          <span>Smartphones</span>
                        </div>
                        <ul className={`space-y-2 text-xs text-neutral-500 dark:text-neutral-400 ${isRtl ? "text-right" : "text-left"}`}>
                          <li><button onClick={() => { onSearch("iPhone"); onNavigate("shop"); }} className="hover:text-black dark:hover:text-white">Premium iPhones</button></li>
                          <li><button onClick={() => { onSearch("Galaxy"); onNavigate("shop"); }} className="hover:text-black dark:hover:text-white">Galaxy Flagships</button></li>
                          <li><button onClick={() => { onSearch("Pixel"); onNavigate("shop"); }} className="hover:text-black dark:hover:text-white">Google Pixels</button></li>
                          <li><button onClick={() => { onSearch("OnePlus"); onNavigate("shop"); }} className="hover:text-black dark:hover:text-white">OnePlus Devices</button></li>
                        </ul>
                      </div>
                      <div>
                        <div className={`flex items-center gap-2 font-bold text-neutral-900 dark:text-neutral-100 text-xs tracking-wider uppercase border-b border-gray-100 dark:border-neutral-800 pb-2 mb-3 ${isRtl ? "flex-row-reverse" : ""}`}>
                          <Laptop className="h-4 w-4 text-emerald-500" />
                          <span>Laptops & PC Components</span>
                        </div>
                        <ul className={`space-y-2 text-xs text-neutral-500 dark:text-neutral-400 ${isRtl ? "text-right" : "text-left"}`}>
                          <li><button onClick={() => { onSearch("MacBook"); onNavigate("shop"); }} className="hover:text-black dark:hover:text-white">MacBook Pros & Airs</button></li>
                          <li><button onClick={() => { onSearch("XPS"); onNavigate("shop"); }} className="hover:text-black dark:hover:text-white">Dell XPS Series</button></li>
                          <li><button onClick={() => { onSearch("RTX"); onNavigate("shop"); }} className="hover:text-black dark:hover:text-white">NVIDIA GPUs</button></li>
                          <li><button onClick={() => { onSearch("Ryzen"); onNavigate("shop"); }} className="hover:text-black dark:hover:text-white">AMD CPUs</button></li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button 
                onClick={() => onNavigate("faq")} 
                className={`hover:text-black dark:hover:text-white transition ${activeView === "faq" ? "text-black dark:text-white font-semibold" : ""}`}
              >
                {t.faq}
              </button>
              
              <button 
                onClick={() => onNavigate("contact")} 
                className={`hover:text-black dark:hover:text-white transition ${activeView === "contact" ? "text-black dark:text-white font-semibold" : ""}`}
              >
                {t.contact}
              </button>

              {/* Staff Dashboard link */}
              {currentUser && currentUser.role !== Role.CUSTOMER && currentUser.role !== Role.GUEST && (
                <button
                  onClick={() => onNavigate("dashboard")}
                  className={`flex items-center gap-1 rounded bg-neutral-950 border border-neutral-800 text-xs font-semibold text-white px-3 py-1 transition hover:bg-neutral-900 ${isRtl ? "flex-row-reverse" : ""}`}
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  <span>{t.staffDashboard}</span>
                </button>
              )}
            </nav>
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="hidden lg:flex items-center relative flex-1 max-w-md">
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className={`w-full rounded-full border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900 py-2 text-xs focus:border-black focus:bg-white dark:focus:border-neutral-700 focus:outline-none transition text-neutral-900 dark:text-white ${isRtl ? "pl-10 pr-4 text-right" : "pl-4 pr-10 text-left"}`}
            />
            <button type="submit" className={`absolute text-gray-400 hover:text-black dark:hover:text-white ${isRtl ? "left-3" : "right-3"}`}>
              <Search className="h-4 w-4" />
            </button>
          </form>

          {/* Action Icons Panel */}
          <div className={`flex items-center gap-1.5 sm:gap-3 md:gap-4 ${isRtl ? "flex-row-reverse" : ""}`}>
            
            {/* DESKTOP-ONLY ACTIONS */}
            <div className="hidden md:flex items-center gap-3 lg:gap-4">
              {/* Language Selector */}
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-neutral-900 rounded-full px-2 py-1">
                <Globe className="h-3.5 w-3.5 text-gray-400" />
                <select
                  value={language}
                  onChange={(e) => onLanguageChange(e.target.value as Language)}
                  className="bg-transparent text-[11px] font-bold text-gray-600 dark:text-gray-300 focus:outline-none cursor-pointer border-none"
                >
                  <option value="en" className="dark:bg-neutral-950">EN</option>
                  <option value="fr" className="dark:bg-neutral-950">FR</option>
                  <option value="ar" className="dark:bg-neutral-950">العربية</option>
                </select>
              </div>

              {/* Dark Mode Toggle */}
              <button
                onClick={onThemeToggle}
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition rounded-full hover:bg-gray-100 dark:hover:bg-neutral-900 focus:outline-none flex items-center justify-center overflow-hidden"
                title="Toggle Theme Mode"
              >
                <motion.div
                  key={theme}
                  initial={{ rotate: -90, opacity: 0, scale: 0.8 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: 90, opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="flex items-center justify-center"
                >
                  {theme === "dark" ? (
                    <Sun className="h-[18px] w-[18px] text-amber-400 fill-amber-400/20" />
                  ) : (
                    <Moon className="h-[18px] w-[18px] text-neutral-800" />
                  )}
                </motion.div>
              </button>

              {/* Wishlist */}
              <button 
                onClick={() => onNavigate("wishlist")}
                className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition rounded-full hover:bg-gray-100 dark:hover:bg-neutral-900"
                title={t.wishlist}
                id="wishlist-nav-btn-desktop"
              >
                <Heart className="h-5 w-5" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {wishlistCount}
                  </span>
                )}
              </button>

              {/* Profile */}
              <button 
                onClick={() => onNavigate("profile")}
                className="flex items-center gap-1.5 p-2 text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition rounded-full hover:bg-gray-100 dark:hover:bg-neutral-900"
                title={t.account}
                id="profile-nav-btn-desktop"
              >
                <User className="h-5 w-5" />
                {currentUser && (
                  <span className="text-xs font-semibold max-w-[80px] truncate">
                    {currentUser.name.split(" ")[0]}
                  </span>
                )}
              </button>
            </div>

            {/* SHARED/MOBILE ACTIONS */}
            {/* Mobile-Friendly Wishlist Icon (visible on smaller screens too) */}
            <button 
              onClick={() => onNavigate("wishlist")}
              className="relative p-2 md:hidden text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition rounded-full active:bg-gray-100 dark:active:bg-neutral-900"
              title={t.wishlist}
              id="wishlist-nav-btn-mobile"
            >
              <Heart className="h-[22px] w-[22px]" />
              {wishlistCount > 0 && (
                <span className="absolute top-0 right-0 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Cart Icon (Highly accessible everywhere) */}
            <button 
              onClick={() => onNavigate("cart")}
              className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition rounded-full active:bg-gray-100 dark:active:bg-neutral-900"
              title={t.cart}
              id="cart-nav-btn"
            >
              <ShoppingCart className="h-[22px] w-[22px]" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Mobile menu toggle button with animated custom lines */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition rounded-full focus:outline-none flex items-center justify-center"
              aria-label="Toggle navigation menu"
            >
              <div className="w-6 h-5 flex flex-col justify-between items-center relative">
                <motion.span
                  animate={mobileMenuOpen ? { rotate: 45, y: 9 } : { rotate: 0, y: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="w-5 h-0.5 bg-neutral-600 dark:bg-neutral-300 rounded-full"
                />
                <motion.span
                  animate={mobileMenuOpen ? { opacity: 0, scale: 0.8 } : { opacity: 1, scale: 1 }}
                  transition={{ duration: 0.15 }}
                  className="w-5 h-0.5 bg-neutral-600 dark:bg-neutral-300 rounded-full"
                />
                <motion.span
                  animate={mobileMenuOpen ? { rotate: -45, y: -9 } : { rotate: 0, y: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="w-5 h-0.5 bg-neutral-600 dark:bg-neutral-300 rounded-full"
                />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Redesigned Premium Mobile Menu Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden overflow-hidden border-t border-gray-100 dark:border-neutral-900 bg-white dark:bg-neutral-950 shadow-2xl"
          >
            <div className="px-4 py-5 space-y-5 max-h-[85vh] overflow-y-auto">
              
              {/* Premium Search Bar with Large Touch Targets */}
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 dark:border-neutral-800 py-3.5 pl-4 pr-11 text-xs focus:border-emerald-500 focus:outline-none bg-gray-50 dark:bg-neutral-900 text-neutral-900 dark:text-white transition-all shadow-sm"
                />
                <button type="submit" className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-500 p-1">
                  <Search className="h-5 w-5" />
                </button>
              </form>

              {/* Navigation list with rich typography and dividers */}
              <div className="space-y-1.5">
                {[
                  { view: "home", label: t.home },
                  { view: "shop", label: t.products },
                  { view: "faq", label: t.faq },
                  { view: "contact", label: t.contact }
                ].map((item) => (
                  <button
                    key={item.view}
                    onClick={() => {
                      onNavigate(item.view);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left py-3.5 px-4 rounded-xl text-sm font-bold transition flex items-center justify-between ${
                      activeView === item.view
                        ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100/30"
                        : "hover:bg-gray-50 dark:hover:bg-neutral-900 text-neutral-800 dark:text-neutral-200"
                    }`}
                  >
                    <span>{item.label}</span>
                    <ChevronDown className={`h-4 w-4 -rotate-90 text-neutral-400`} />
                  </button>
                ))}
              </div>

              {/* Staff Dashboard if logged in as Admin */}
              {currentUser && currentUser.role !== Role.CUSTOMER && currentUser.role !== Role.GUEST && (
                <button
                  onClick={() => {
                    onNavigate("dashboard");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-4 px-4 rounded-xl bg-neutral-950 dark:bg-neutral-900 text-white font-black text-xs flex items-center justify-center gap-2 border border-neutral-800 shadow-lg uppercase tracking-wider"
                >
                  <ShieldCheck className="h-4.5 w-4.5 text-emerald-400" />
                  <span>{t.staffDashboard}</span>
                </button>
              )}

              {/* Settings and Locales Row */}
              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-100 dark:border-neutral-900">
                {/* Language Picker */}
                <div className="space-y-1.5">
                  <span className="text-[9px] font-extrabold text-neutral-400 uppercase tracking-widest pl-1">
                    {language === "ar" ? "اللغة" : language === "fr" ? "Langue" : "Language"}
                  </span>
                  <div className="relative flex items-center bg-gray-50 dark:bg-neutral-900 border border-gray-100 dark:border-neutral-900 rounded-xl px-3 py-3">
                    <Globe className="h-4 w-4 text-gray-400 mr-2" />
                    <select
                      value={language}
                      onChange={(e) => onLanguageChange(e.target.value as Language)}
                      className="w-full bg-transparent text-xs font-bold text-neutral-700 dark:text-neutral-300 focus:outline-none cursor-pointer border-none"
                    >
                      <option value="en" className="dark:bg-neutral-950">EN - English</option>
                      <option value="fr" className="dark:bg-neutral-950">FR - Français</option>
                      <option value="ar" className="dark:bg-neutral-950">AR - العربية</option>
                    </select>
                  </div>
                </div>

                {/* Theme Selector */}
                <div className="space-y-1.5">
                  <span className="text-[9px] font-extrabold text-neutral-400 uppercase tracking-widest pl-1">
                    {language === "ar" ? "المظهر" : language === "fr" ? "Thème" : "Theme"}
                  </span>
                  <button
                    onClick={onThemeToggle}
                    className="w-full flex items-center justify-between bg-gray-50 dark:bg-neutral-900 border border-gray-100 dark:border-neutral-900 rounded-xl px-4 py-3 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800 transition text-left"
                  >
                    <span className="capitalize">{theme} Mode</span>
                    {theme === "dark" ? (
                      <Sun className="h-4.5 w-4.5 text-amber-500 fill-amber-500/20" />
                    ) : (
                      <Moon className="h-4.5 w-4.5 text-neutral-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Profile Bar */}
              <div className="pt-3 border-t border-gray-100 dark:border-neutral-900">
                <button
                  onClick={() => {
                    onNavigate("profile");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 dark:bg-neutral-900 border border-gray-100 dark:border-neutral-900 text-neutral-800 dark:text-neutral-200 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-emerald-500/10 p-2.5 text-emerald-500">
                      <User className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-black tracking-tight">{currentUser?.name || "Guest Account"}</p>
                      <p className="text-[9px] font-bold text-neutral-400 uppercase">{currentUser?.role || "GUEST"}</p>
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4 -rotate-90 text-neutral-400" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
