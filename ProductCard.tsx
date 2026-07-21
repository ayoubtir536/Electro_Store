/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Heart, ShoppingCart, MessageSquare, Shield, Check, Eye } from "lucide-react";
import { Product } from "../types";
import { Language, translations } from "../translations";

interface ProductCardProps {
  key?: React.Key;
  product: Product;
  onAddToCart: (p: Product) => void;
  onAddToWishlist: (p: Product) => void;
  isWishlisted: boolean;
  onSelectCompare: (p: Product) => void;
  isCompared: boolean;
  onOrderWhatsApp: (p: Product) => void;
  onViewDetails: (p: Product) => void;
  brandName?: string;
  language: Language;
}

export default function ProductCard({
  product,
  onAddToCart,
  onAddToWishlist,
  isWishlisted,
  onSelectCompare,
  isCompared,
  onOrderWhatsApp,
  onViewDetails,
  brandName = "",
  language,
}: ProductCardProps) {
  const currentPrice = product.discountPrice || product.price;
  const saving = product.discountPrice ? product.price - product.discountPrice : 0;
  const t = translations[language];
  const isRtl = language === "ar";

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-100 dark:border-neutral-900 bg-white dark:bg-neutral-950 shadow-sm hover:shadow-xl dark:hover:shadow-neutral-900/30 transition-all duration-300">
      
      {/* Top badges & Wishlist */}
      <div className={`absolute top-4 left-4 right-4 z-10 flex items-center justify-between ${isRtl ? "flex-row-reverse" : ""}`}>
        <div className={`flex flex-col gap-1 ${isRtl ? "items-end" : "items-start"}`}>
          {product.discountPrice && (
            <span className="rounded-full bg-red-500 px-2.5 py-0.5 text-[10px] font-bold text-white uppercase">
              {t.save} ${saving.toFixed(2)}
            </span>
          )}
          {product.stock <= product.minStockAlert && product.stock > 0 && (
            <span className="rounded-full bg-amber-500 px-2.5 py-0.5 text-[10px] font-bold text-white uppercase animate-pulse">
              {t.lowStock} ({product.stock})
            </span>
          )}
          {product.stock === 0 && (
            <span className="rounded-full bg-neutral-500 px-2.5 py-0.5 text-[10px] font-bold text-white uppercase">
              {t.soldOut}
            </span>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddToWishlist(product);
          }}
          className={`flex h-8 w-8 items-center justify-center rounded-full bg-white dark:bg-neutral-900 shadow-md transition-transform hover:scale-110 ${
            isWishlisted ? "text-red-500" : "text-gray-400 dark:text-gray-500 hover:text-black dark:hover:text-white"
          }`}
          title="Add to Wishlist"
        >
          <Heart className={`h-4.5 w-4.5 ${isWishlisted ? "fill-current" : ""}`} />
        </button>
      </div>

      {/* Product Image Area with Hover Zoom */}
      <div 
        onClick={() => onViewDetails(product)}
        className="relative aspect-square w-full bg-gray-50 dark:bg-neutral-900 overflow-hidden cursor-pointer"
      >
        <img
          src={product.images[0]}
          alt={product.name}
          className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-black/10 dark:bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="rounded-full bg-white/95 dark:bg-neutral-900/95 px-4 py-2 text-xs font-semibold text-neutral-900 dark:text-neutral-100 shadow flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
            <Eye className="h-4 w-4 text-emerald-500" />
            {t.quickInspect}
          </span>
        </div>
      </div>

      {/* Details */}
      <div className={`flex flex-1 flex-col p-5 ${isRtl ? "text-right" : "text-left"}`}>
        <div className={`flex items-center justify-between gap-2 text-[10px] font-bold tracking-wider text-neutral-400 dark:text-neutral-500 uppercase ${isRtl ? "flex-row-reverse" : ""}`}>
          <span>{brandName || product.brandId}</span>
          <span className="font-mono">{product.sku}</span>
        </div>

        <h3 
          onClick={() => onViewDetails(product)}
          className="mt-1 text-sm font-bold text-neutral-900 dark:text-neutral-100 hover:text-emerald-600 dark:hover:text-emerald-400 transition cursor-pointer line-clamp-2 min-h-[40px]"
        >
          {product.name}
        </h3>

        {/* Specs snippet */}
        <div className="mt-2.5 grid grid-cols-2 gap-x-2 gap-y-1 bg-gray-50 dark:bg-neutral-900/50 p-2.5 rounded-lg text-[10px] text-gray-500 dark:text-gray-400 font-mono">
          {Object.entries(product.specifications || {}).slice(0, 2).map(([key, value]) => (
            <div key={key} className="truncate" title={`${key}: ${value}`}>
              <span className="font-semibold text-neutral-700 dark:text-neutral-300">{key}:</span> {value}
            </div>
          ))}
          <div className={`col-span-2 text-neutral-400 dark:text-neutral-500 flex items-center gap-1 mt-1 text-[9px] ${isRtl ? "flex-row-reverse" : ""}`}>
            <Shield className="h-3 w-3 text-emerald-500" />
            <span>{product.warranty}</span>
          </div>
        </div>

        {/* Pricing */}
        <div className={`mt-4 flex items-baseline gap-2 ${isRtl ? "flex-row-reverse justify-start" : ""}`}>
          <span className="text-lg font-black text-neutral-950 dark:text-white">
            ${currentPrice.toFixed(2)}
          </span>
          {product.discountPrice && (
            <span className="text-xs text-gray-400 dark:text-gray-500 line-through">
              ${product.price.toFixed(2)}
            </span>
          )}
        </div>

        {/* Compare Control */}
        <div className={`mt-3 flex items-center gap-2 border-t border-gray-100 dark:border-neutral-900 pt-3 ${isRtl ? "flex-row-reverse" : ""}`}>
          <label className={`flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 cursor-pointer select-none ${isRtl ? "flex-row-reverse" : ""}`}>
            <input
              type="checkbox"
              checked={isCompared}
              onChange={() => onSelectCompare(product)}
              className="h-3.5 w-3.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span>{t.compareSpecs}</span>
          </label>
        </div>

        {/* Actions bar */}
        <div className="mt-auto pt-4 flex flex-col gap-2">
          {/* Add to Cart button */}
          <button
            onClick={() => onAddToCart(product)}
            disabled={product.stock === 0}
            className={`w-full py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              product.stock === 0
                ? "bg-gray-100 dark:bg-neutral-900 text-gray-400 dark:text-neutral-600 cursor-not-allowed"
                : "bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-neutral-100 dark:text-neutral-950 dark:hover:bg-neutral-200 shadow"
            }`}
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            <span>{product.stock === 0 ? t.outOfStock : t.addToCart}</span>
          </button>

          {/* Order via WhatsApp direct button */}
          <button
            onClick={() => onOrderWhatsApp(product)}
            className="w-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/30 py-2 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
          >
            <MessageSquare className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 fill-current" />
            <span>{t.orderWhatsApp}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
