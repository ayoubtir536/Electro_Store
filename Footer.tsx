/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Layers, ShieldCheck, Mail, Phone, MapPin, CheckCircle } from "lucide-react";
import { Language, translations } from "../translations";

interface FooterProps {
  onNavigate: (view: string) => void;
  storeSettings?: any;
  language: Language;
}

export default function Footer({ onNavigate, storeSettings, language }: FooterProps) {
  const year = new Date().getFullYear();
  const t = translations[language];
  const isRtl = language === "ar";

  return (
    <footer className="bg-neutral-950 text-neutral-400 py-16 border-t border-neutral-900 transition-colors duration-300">
      <div className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-10 ${isRtl ? "text-right" : "text-left"}`}>
        
        {/* Brand Column */}
        <div className="space-y-4">
          <div className={`flex items-center gap-2 text-white font-black tracking-widest text-lg ${isRtl ? "flex-row-reverse" : ""}`}>
            <Layers className="h-5 w-5 text-emerald-400" />
            <span>ELECTRA</span>
          </div>
          <p className="text-xs leading-relaxed text-neutral-500">
            {language === "ar" 
              ? "معرض الأجهزة الإلكترونية المتميز والراقي بالمدية، الجزائر. نوفر الهواتف الذكية الرسمية، أجهزة الكمبيوتر المخصصة، والإكسسوارات الفاخرة."
              : language === "fr"
              ? "Le showroom d'électronique premium de référence à Médéa, Algérie. Nous vendons des smartphones officiels, des configurations PC sur mesure et des accessoires de luxe."
              : "Médéa's flagship premium physical electronics showroom. We sell official smartphones, computing rigs, smart wearables, and audiophile accessories."
            }
          </p>
          <div className={`flex items-center gap-2 text-xs text-neutral-400 bg-neutral-900/50 border border-neutral-800 p-3 rounded-xl w-fit ${isRtl ? "flex-row-reverse ml-auto" : "mr-auto"}`}>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <div className={isRtl ? "text-right" : "text-left"}>
              <p className="font-semibold text-neutral-300">{t.genuineProducts}</p>
              <p className="text-[10px] text-neutral-500">{t.genuineWarranty}</p>
            </div>
          </div>
        </div>

        {/* Categories Sitemaps */}
        <div>
          <h4 className="text-sm font-bold text-neutral-200 tracking-wider mb-4 uppercase">
            {language === "ar" ? "تسوق الأجهزة" : language === "fr" ? "BOUTIQUE" : "SHOP GEAR"}
          </h4>
          <ul className="space-y-2 text-xs">
            <li><button onClick={() => onNavigate("shop")} className="hover:text-emerald-400 transition">{language === "ar" ? "الهواتف الذكية" : "Smartphones"}</button></li>
            <li><button onClick={() => onNavigate("shop")} className="hover:text-emerald-400 transition">{language === "ar" ? "الحواسيب المحمولة" : "Laptops & Notebooks"}</button></li>
            <li><button onClick={() => onNavigate("shop")} className="hover:text-emerald-400 transition">{language === "ar" ? "مكونات الكمبيوتر" : "PC Hardware & Components"}</button></li>
            <li><button onClick={() => onNavigate("shop")} className="hover:text-emerald-400 transition">{language === "ar" ? "الساعات الذكية" : "Smartwatches & Wearables"}</button></li>
            <li><button onClick={() => onNavigate("shop")} className="hover:text-emerald-400 transition">{language === "ar" ? "إكسسوارات الصوت" : "Headphones & Wireless Audio"}</button></li>
          </ul>
        </div>

        {/* Support & Quick Links */}
        <div>
          <h4 className="text-sm font-bold text-neutral-200 tracking-wider mb-4 uppercase">
            {language === "ar" ? "الدعم والقوانين" : language === "fr" ? "SUPPORT & LIENS" : "SUPPORT & LAWS"}
          </h4>
          <ul className="space-y-2 text-xs">
            <li><button onClick={() => onNavigate("faq")} className="hover:text-emerald-400 transition">{t.faqTitle}</button></li>
            <li><button onClick={() => onNavigate("contact")} className="hover:text-emerald-400 transition">{t.contactTitle}</button></li>
            <li><button onClick={() => onNavigate("privacy")} className="hover:text-emerald-400 transition">{language === "ar" ? "سياسة الخصوصية" : language === "fr" ? "Politique de Confidentialité" : "Privacy Policy"}</button></li>
            <li><button onClick={() => onNavigate("terms")} className="hover:text-emerald-400 transition">{language === "ar" ? "الشروط والأحكام" : language === "fr" ? "Conditions Générales" : "Terms & Conditions"}</button></li>
            <li><button onClick={() => onNavigate("home")} className="hover:text-emerald-400 transition">{language === "ar" ? "موقع المعرض" : language === "fr" ? "Localisation du Showroom" : "Showroom Location"}</button></li>
          </ul>
        </div>

        {/* Showroom Contact Details */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-neutral-200 tracking-wider mb-4 uppercase">
            {language === "ar" ? "معرضنا الفعلي" : language === "fr" ? "SHOWROOM PHYSIQUE" : "PHYSICAL SHOWROOM"}
          </h4>
          <ul className="space-y-3 text-xs">
            <li className={`flex items-start gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
              <MapPin className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{storeSettings?.storeAddress || t.addressDetail}</span>
            </li>
            <li className={`flex items-center gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
              <Phone className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>{storeSettings?.storePhone || "+213 25 78 99 00"}</span>
            </li>
            <li className={`flex items-center gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
              <Mail className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>{storeSettings?.storeEmail || "contact@electra-dz.com"}</span>
            </li>
            <li className={`text-[10px] text-neutral-500 border-t border-neutral-900 pt-3 ${isRtl ? "text-right" : "text-left"}`}>
              {t.hours}: {t.hoursDetail} <br />
              {language === "ar" ? "الطلبات عبر الإنترنت تتزامن فوراً مع المخزن." : language === "fr" ? "Les commandes en ligne se synchronisent immédiatement." : "Orders Placed Online Sync Immediately."}
            </li>
          </ul>
        </div>

      </div>

      <div className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-neutral-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500 ${isRtl ? "sm:flex-row-reverse" : ""}`}>
        <p dir="ltr">&copy; {year} ELECTRA Physical Electronics Store. Médéa, Algeria.</p>
        <div className={`flex flex-wrap gap-4 ${isRtl ? "flex-row-reverse" : ""}`}>
          <span className={`flex items-center gap-1 ${isRtl ? "flex-row-reverse" : ""}`}>
            <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
            <span>{language === "ar" ? "تزامن مباشر مع واتساب" : language === "fr" ? "Sync WhatsApp Directe" : "WhatsApp Direct-Order Sync Enabled"}</span>
          </span>
          <span>Sitemap</span>
          <span>SSL Secured</span>
        </div>
      </div>
    </footer>
  );
}
