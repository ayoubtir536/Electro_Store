/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { X, ShieldCheck, Scale } from "lucide-react";
import { Product } from "../types";
import { Language, translations } from "../translations";

interface ProductCompareProps {
  comparedProducts: Product[];
  onRemove: (p: Product) => void;
  onClear: () => void;
  onAddToCart: (p: Product) => void;
  language: Language;
}

export default function ProductCompare({
  comparedProducts,
  onRemove,
  onClear,
  onAddToCart,
  language,
}: ProductCompareProps) {
  if (comparedProducts.length === 0) return null;

  const t = translations[language];
  const isRtl = language === "ar";

  // Gather unique specifications across all compared products
  const allSpecKeys = Array.from(
    new Set(
      comparedProducts.flatMap((p) => Object.keys(p.specifications || {}))
    )
  );

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-900 shadow-2xl p-6 max-h-[85vh] overflow-y-auto rounded-t-3xl transition-all duration-300">
      <div className="mx-auto max-w-7xl">
        
        {/* Header */}
        <div className={`flex items-center justify-between border-b border-gray-100 dark:border-neutral-900 pb-4 mb-4 ${isRtl ? "flex-row-reverse" : ""}`}>
          <div className={`flex items-center gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
            <Scale className="h-5 w-5 text-emerald-500 animate-bounce" />
            <div className={isRtl ? "text-right" : "text-left"}>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                {language === "ar" ? "حلبة مقارنة الأجهزة" : language === "fr" ? "Arène de Comparaison" : "Device Comparison Arena"}
              </h3>
              <p className="text-[10px] text-neutral-400 dark:text-neutral-500">
                {language === "ar" 
                  ? `مقارنة ${comparedProducts.length} من الأجهزة الإلكترونية الراقية جنباً إلى جنب` 
                  : language === "fr"
                  ? `Comparaison de ${comparedProducts.length} modèles d'électronique premium côte à côte`
                  : `Comparing ${comparedProducts.length} premium electronic models side-by-side`
                }
              </p>
            </div>
          </div>
          <div className={`flex items-center gap-3 ${isRtl ? "flex-row-reverse" : ""}`}>
            <button
              onClick={onClear}
              className="text-xs text-neutral-500 hover:text-black dark:hover:text-white hover:underline"
            >
              {language === "ar" ? "مسح الكل" : language === "fr" ? "Effacer Tout" : "Clear All"}
            </button>
            <button
              onClick={onClear}
              className="rounded-full bg-neutral-100 dark:bg-neutral-900 p-2 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 hover:text-black dark:hover:text-white transition"
              title="Close Comparison"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Compare grid */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-start ${isRtl ? "dir-rtl" : "dir-ltr"}`}>
          
          {/* Legend col */}
          <div className={`hidden lg:block space-y-4 pt-48 font-mono text-[10px] text-neutral-400 ${isRtl ? "text-right" : "text-left"}`}>
            <div className="font-bold uppercase tracking-wider text-neutral-500 border-b border-neutral-100 dark:border-neutral-900 pb-1">Core Metrics</div>
            <div>SKU / Catalog Identifiers</div>
            <div>Warranty & Protection</div>
            <div>Pricing & Savings</div>
            {allSpecKeys.map((key) => (
              <div key={key} className="truncate capitalize">{key.replace(/_/g, " ")}</div>
            ))}
          </div>

          {/* Product columns */}
          {comparedProducts.map((p) => {
            const currentPrice = p.discountPrice || p.price;
            return (
              <div 
                key={p.id} 
                className="relative rounded-2xl border border-neutral-100 dark:border-neutral-900 bg-neutral-50 dark:bg-neutral-900/50 p-4 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all shadow-sm"
              >
                {/* Remove button */}
                <button
                  onClick={() => onRemove(p)}
                  className="absolute top-2 right-2 rounded-full bg-white dark:bg-neutral-800 p-1.5 text-neutral-400 hover:text-neutral-950 dark:hover:text-white shadow"
                >
                  <X className="h-3 w-3" />
                </button>

                {/* Info block */}
                <div className="flex flex-col items-center text-center pb-4 border-b border-neutral-200 dark:border-neutral-800">
                  <img
                    src={p.images[0]}
                    alt={p.name}
                    className="h-28 w-28 object-cover rounded-xl bg-white dark:bg-neutral-900 p-1 shadow-sm"
                    referrerPolicy="no-referrer"
                  />
                  <h4 className="mt-2 text-xs font-bold text-neutral-900 dark:text-neutral-100 line-clamp-2 h-8">{p.name}</h4>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-sm font-black text-neutral-950 dark:text-white">${currentPrice.toFixed(2)}</span>
                    {p.discountPrice && (
                      <span className="text-[10px] text-gray-400 line-through">${p.price.toFixed(2)}</span>
                    )}
                  </div>
                  <button
                    onClick={() => onAddToCart(p)}
                    className="mt-3 w-full rounded-lg bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-950 dark:hover:bg-neutral-200 py-1.5 text-[10px] font-bold text-white transition animate-pulse"
                  >
                    {t.addToCart}
                  </button>
                </div>

                {/* Spec List */}
                <div className={`space-y-4 pt-4 text-xs font-mono ${isRtl ? "text-right" : "text-left"}`}>
                  {/* SKU */}
                  <div className="lg:hidden font-bold text-[9px] text-neutral-400 uppercase">SKU</div>
                  <div className="text-[11px] text-neutral-600 dark:text-neutral-300 truncate">{p.sku}</div>

                  {/* Warranty */}
                  <div className="lg:hidden font-bold text-[9px] text-neutral-400 uppercase">Warranty</div>
                  <div className={`text-[11px] text-emerald-700 dark:text-emerald-400 flex items-center gap-1 ${isRtl ? "flex-row-reverse" : ""}`}>
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>{p.warranty}</span>
                  </div>

                  {/* Pricing/Stock */}
                  <div className="lg:hidden font-bold text-[9px] text-neutral-400 uppercase">Pricing</div>
                  <div className="text-[11px]">
                    {p.stock > 0 ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{t.lowStock} ({p.stock})</span>
                    ) : (
                      <span className="text-red-500 font-semibold">{t.soldOut}</span>
                    )}
                  </div>

                  {/* Specs */}
                  {allSpecKeys.map((key) => {
                    const value = p.specifications?.[key];
                    return (
                      <div key={key} className="border-t border-neutral-200 dark:border-neutral-800 pt-2">
                        <div className="lg:hidden font-bold text-[9px] text-neutral-400 uppercase mb-0.5">
                          {key.replace(/_/g, " ")}
                        </div>
                        <div className="text-[11px] text-neutral-700 dark:text-neutral-300 line-clamp-3 font-sans" title={value || "N/A"}>
                          {value || <span className="text-neutral-300">—</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            );
          })}

        </div>

      </div>
    </div>
  );
}
