/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { Role, User, Category, SubCategory, Brand, Product, Order, OrderItem, Coupon, Review, Notification, AuditLog, SupportTicket, WebsiteSettings } from "./src/types";

// Initialize express
export const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// Guarded Google Gen AI setup
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
    console.log("Google Gen AI initialized successfully.");
  } catch (err) {
    console.error("Failed to initialize Google Gen AI:", err);
  }
} else {
  console.log("No GEMINI_API_KEY environment variable provided or using default. AI features will run in high-fidelity sandbox mode.");
}

// Database JSON file path
const DB_PATH = path.join(process.cwd(), "db.json");

// Helper: Seed initial database
function getInitialDB() {
  try {
    if (fs.existsSync(DB_PATH)) {
      return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
    }
  } catch (err) {
    console.error("Failed to read DB_PATH in getInitialDB, using fallback:", err);
  }

  // Fallback structures below (unreachable when db.json exists)
  const categories: Category[] = [];
  const subCategories: SubCategory[] = [];
  const brands: Brand[] = [];
  const products: Product[] = [
    {
      id: "iphone-15-pro-max",
      name: "Apple iPhone 15 Pro Max",
      sku: "IPH15PM-256",
      price: 1199.00,
      stock: 14,
      minStockAlert: 3,
      brandId: "apple",
      categoryId: "smartphones",
      subCategoryId: "phones",
      specifications: {
        Processor: "A17 Pro Chip",
        Storage: "256GB",
        Display: "6.7\" Super Retina XDR",
        Body: "Titanium Body",
        Camera: "48MP 5x Telephoto",
        Warranty: "1 Year Apple Warranty",
      },
      description: "Forged in titanium and featuring the groundbreaking A17 Pro chip, a customizable Action button, and the most powerful iPhone camera system ever.",
      rating: 4.8,
      reviewCount: 154,
      images: [
        "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&auto=format&fit=crop&q=80"
      ],
      availability: true,
      warranty: "1 Year Apple Warranty",
    },
    {
      id: "galaxy-s24-ultra",
      name: "Samsung Galaxy S24 Ultra",
      sku: "SAMS24U-256",
      price: 1299.99,
      stock: 18,
      minStockAlert: 5,
      brandId: "samsung",
      categoryId: "smartphones",
      subCategoryId: "phones",
      specifications: {
        Processor: "Snapdragon 8 Gen 3",
        Storage: "256GB",
        Display: "6.8\" Dynamic AMOLED 2X",
        "S-Pen": "Built-in S-Pen",
        Camera: "200MP Quad Cam",
        Warranty: "2 Years Samsung Warranty",
      },
      description: "Welcome to the era of mobile AI. With Galaxy S24 Ultra in your hands, you can unleash whole new levels of creativity, productivity and possibility.",
      rating: 4.7,
      reviewCount: 98,
      images: [
        "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=80"
      ],
      availability: true,
      warranty: "2 Years Samsung Warranty",
    },
    {
      id: "pixel-8-pro",
      name: "Google Pixel 8 Pro",
      sku: "GOOG-P8P-128",
      price: 999.00,
      stock: 12,
      minStockAlert: 3,
      brandId: "google",
      categoryId: "smartphones",
      subCategoryId: "phones",
      specifications: {
        Processor: "Google Tensor G3",
        Storage: "128GB",
        Display: "6.7\" Super Actua Display",
        Camera: "50MP Camera with AI Magic Editor",
        Warranty: "1 Year Google Warranty",
      },
      description: "The Google Pixel 8 Pro is the all-pro phone engineered by Google. It has the Google Tensor G3 chip and a stunning 6.7\" Super Actua Display.",
      rating: 4.6,
      reviewCount: 45,
      images: [
        "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=80"
      ],
      availability: true,
      warranty: "1 Year Google Warranty",
    },
    {
      id: "oneplus-12",
      name: "OnePlus 12",
      sku: "OP-12-512",
      price: 799.99,
      stock: 15,
      minStockAlert: 4,
      brandId: "oneplus",
      categoryId: "smartphones",
      subCategoryId: "phones",
      specifications: {
        Processor: "Snapdragon 8 Gen 3",
        RAM: "16GB RAM",
        Storage: "512GB Storage",
        Battery: "5400mAh Battery",
        Charging: "80W Fast Charge",
        Warranty: "1 Year OnePlus Warranty",
      },
      description: "OnePlus 12 redefined. Dominate any performance barrier with the state-of-the-art Snapdragon 8 Gen 3, custom cooling systems, and extremely fast charging speeds.",
      rating: 4.7,
      reviewCount: 38,
      images: [
        "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&auto=format&fit=crop&q=80"
      ],
      availability: true,
      warranty: "1 Year OnePlus Warranty",
    },
    {
      id: "macbook-air-m3",
      name: "Apple MacBook Air 13\" (M3)",
      sku: "AP-MBA13-M3",
      price: 1299.00,
      stock: 10,
      minStockAlert: 2,
      brandId: "apple",
      categoryId: "laptops",
      subCategoryId: "laptops-sub",
      specifications: {
        CPU: "8-Core CPU",
        GPU: "10-Core GPU",
        RAM: "16GB RAM",
        Storage: "512GB SSD",
        Display: "Liquid Retina Display",
        Warranty: "1 Year Apple Warranty",
      },
      description: "Strikingly thin and fast. Built for premium portability with Apple's cutting-edge M3 chip and high-resolution Liquid Retina screen.",
      rating: 4.9,
      reviewCount: 64,
      images: [
        "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&auto=format&fit=crop&q=80"
      ],
      availability: true,
      warranty: "1 Year Apple Warranty",
    },
    {
      id: "dell-xps-13",
      name: "Dell XPS 13 Copilot+ PC",
      sku: "DELL-XPS13-CP",
      price: 1399.99,
      stock: 8,
      minStockAlert: 2,
      brandId: "dell",
      categoryId: "laptops",
      subCategoryId: "laptops-sub",
      specifications: {
        Processor: "Intel Core Ultra 7",
        RAM: "16GB",
        Storage: "1TB SSD",
        Display: "13.4\"",
        Warranty: "2 Years Dell Warranty",
      },
      description: "Designed for premium productivity. Featuring Intel Core Ultra 7 with built-in Copilot AI capabilities, high speed processing, and sleek aluminium bezel.",
      rating: 4.5,
      reviewCount: 22,
      images: [
        "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&auto=format&fit=crop&q=80"
      ],
      availability: true,
      warranty: "2 Years Dell Warranty",
    },
    {
      id: "thinkpad-x1",
      name: "Lenovo ThinkPad X1 Carbon Gen 12",
      sku: "LEN-X1C12-1TB",
      price: 1849.00,
      stock: 6,
      minStockAlert: 2,
      brandId: "lenovo",
      categoryId: "laptops",
      subCategoryId: "laptops-sub",
      specifications: {
        Processor: "Core Ultra 7",
        RAM: "32GB",
        Storage: "1TB SSD",
        Display: "14\" OLED",
        Warranty: "3 Years Lenovo Premier Support",
      },
      description: "The peak of professional computing. Ultralight frame featuring carbon fiber body, robust 32GB RAM, Intel Core Ultra, and a breathtaking OLED screen.",
      rating: 4.8,
      reviewCount: 31,
      images: [
        "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800&auto=format&fit=crop&q=80"
      ],
      availability: true,
      warranty: "3 Years Lenovo Premier Support",
    },
    {
      id: "zephyrus-g16",
      name: "ASUS ROG Zephyrus G16",
      sku: "ASUS-ZEPH-G16",
      price: 1999.99,
      stock: 4,
      minStockAlert: 1,
      brandId: "asus",
      categoryId: "laptops",
      subCategoryId: "laptops-sub",
      specifications: {
        Processor: "Core Ultra 9",
        GPU: "RTX 4070",
        RAM: "32GB",
        Storage: "1TB SSD",
        Warranty: "2 Years ASUS Global Warranty",
      },
      description: "An elegant powerhouse gaming laptop. Equipped with premium Core Ultra 9, NVIDIA RTX 4070, 32GB memory and ultra-fast 1TB SSD storage.",
      rating: 4.9,
      reviewCount: 41,
      images: [
        "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800&auto=format&fit=crop&q=80"
      ],
      availability: true,
      warranty: "2 Years ASUS Global Warranty",
    },
    {
      id: "rtx-4080-super",
      name: "NVIDIA GeForce RTX 4080 Super",
      sku: "NV-RTX4080S-16G",
      price: 999.00,
      stock: 5,
      minStockAlert: 2,
      brandId: "nvidia",
      categoryId: "pc-hardware",
      subCategoryId: "components",
      specifications: {
        VRAM: "16GB GDDR6X",
        Technologies: "DLSS 3.5",
        Warranty: "3 Years NVIDIA Warranty",
      },
      description: "Experience extreme hardware accelerated raytracing and AI rendering with DLSS 3.5. Powered by NVIDIA Ada Lovelace architecture with 16GB GDDR6X VRAM.",
      rating: 4.9,
      reviewCount: 29,
      images: [
        "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80"
      ],
      availability: true,
      warranty: "3 Years NVIDIA Warranty",
    },
    {
      id: "ryzen-7800x3d",
      name: "AMD Ryzen 7 7800X3D",
      sku: "AMD-R7-7800X3D",
      price: 449.00,
      stock: 15,
      minStockAlert: 3,
      brandId: "amd",
      categoryId: "pc-hardware",
      subCategoryId: "components",
      specifications: {
        Cores_Threads: "8C/16T",
        Socket: "AM5",
        Warranty: "3 Years AMD Warranty",
      },
      description: "The absolute king of gaming processors, featuring advanced 3D V-Cache technology, 8 hyper-threaded cores, and efficient AM5 architectural build.",
      rating: 4.9,
      reviewCount: 112,
      images: [
        "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800&auto=format&fit=crop&q=80"
      ],
      availability: true,
      warranty: "3 Years AMD Warranty",
    },
    {
      id: "samsung-990-pro",
      name: "Samsung 990 PRO 2TB",
      sku: "SAMS-990P-2TB",
      price: 179.99,
      stock: 25,
      minStockAlert: 5,
      brandId: "samsung",
      categoryId: "pc-hardware",
      subCategoryId: "components",
      specifications: {
        Interface: "PCIe 4.0 NVMe SSD",
        Capacity: "2TB",
        Warranty: "5 Years Samsung Warranty",
      },
      description: "Reaching near-limit PCIe 4.0 speeds. Ideal for hardware enthusiast, competitive gamers, and rich media content editors.",
      rating: 4.8,
      reviewCount: 88,
      images: [
        "https://images.unsplash.com/photo-1562976540-1502c2145186?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80"
      ],
      availability: true,
      warranty: "5 Years Samsung Warranty",
    },
    {
      id: "corsair-rm850x",
      name: "Corsair RM850x Shift",
      sku: "COR-RM850XS",
      price: 159.99,
      stock: 12,
      minStockAlert: 3,
      brandId: "corsair",
      categoryId: "pc-hardware",
      subCategoryId: "components",
      specifications: {
        Power: "850W Gold",
        Type: "Modular PSU",
        Warranty: "10 Years Corsair Warranty",
      },
      description: "Innovative side-mounted modular connector design for effortless cable management and efficient 80 PLUS Gold certified power routing.",
      rating: 4.7,
      reviewCount: 34,
      images: [
        "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800&auto=format&fit=crop&q=80"
      ],
      availability: true,
      warranty: "10 Years Corsair Warranty",
    },
    {
      id: "gskill-trident-z5",
      name: "G.SKILL Trident Z5 RGB",
      sku: "GSK-TZ5R-32G",
      price: 124.99,
      stock: 20,
      minStockAlert: 4,
      brandId: "gskill",
      categoryId: "pc-hardware",
      subCategoryId: "components",
      specifications: {
        Capacity: "32GB",
        Type: "DDR5-6000",
        Warranty: "Lifetime G.SKILL Warranty",
      },
      description: "Crafted for extreme performance on modern DDR5 motherboard platforms, paired with customizable light bars and aggressive aluminium heatspreaders.",
      rating: 4.7,
      reviewCount: 47,
      images: [
        "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1562976540-1502c2145186?w=800&auto=format&fit=crop&q=80"
      ],
      availability: true,
      warranty: "Lifetime G.SKILL Warranty",
    },
    {
      id: "apple-watch-ultra-2",
      name: "Apple Watch Ultra 2",
      sku: "AP-AWU2-49",
      price: 799.00,
      stock: 15,
      minStockAlert: 3,
      brandId: "apple",
      categoryId: "smartwatches",
      subCategoryId: "wearables",
      specifications: {
        Case: "49mm Titanium",
        Connectivity: "GPS",
        Warranty: "1 Year Apple Warranty",
      },
      description: "The ultimate rugged sports and navigation adventure watch. Titanium bezel, precise multi-frequency GPS, and exceptionally bright screen.",
      rating: 4.8,
      reviewCount: 92,
      images: [
        "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&auto=format&fit=crop&q=80"
      ],
      availability: true,
      warranty: "1 Year Apple Warranty",
    },
    {
      id: "galaxy-watch-ultra",
      name: "Samsung Galaxy Watch Ultra",
      sku: "SAMS-GWU-47",
      price: 649.99,
      stock: 12,
      minStockAlert: 2,
      brandId: "samsung",
      categoryId: "smartwatches",
      subCategoryId: "wearables",
      specifications: {
        Case: "47mm Titanium",
        Warranty: "2 Years Samsung Warranty",
      },
      description: "Designed for rugged active sports tracking, boasting dual-frequency GPS, custom quick button, and up to 100 hours of battery stamina.",
      rating: 4.6,
      reviewCount: 29,
      images: [
        "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&auto=format&fit=crop&q=80"
      ],
      availability: true,
      warranty: "2 Years Samsung Warranty",
    },
    {
      id: "garmin-fenix-7",
      name: "Garmin Fenix 7 Pro Sapphire Solar",
      sku: "GAR-F7PSS-SOL",
      price: 899.99,
      stock: 8,
      minStockAlert: 2,
      brandId: "garmin",
      categoryId: "smartwatches",
      subCategoryId: "wearables",
      specifications: {
        Power: "Solar Charging",
        Features: "Maps",
        Warranty: "2 Years Garmin Warranty",
      },
      description: "Premium multisport GPS timepiece featuring a highly scratch-resistant solar charging sapphire lens and preloaded full-color topomaps.",
      rating: 4.9,
      reviewCount: 42,
      images: [
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&auto=format&fit=crop&q=80"
      ],
      availability: true,
      warranty: "2 Years Garmin Warranty",
    },
    {
      id: "sony-wh1000xm5",
      name: "Sony WH-1000XM5",
      sku: "SON-XM5-WIR",
      price: 399.99,
      stock: 22,
      minStockAlert: 4,
      brandId: "sony",
      categoryId: "audio",
      subCategoryId: "audio-sub",
      specifications: {
        Noise_Cancelling: "ANC",
        Battery: "30h Battery",
        Warranty: "1 Year Sony Warranty",
      },
      description: "Class-leading dual-processor active noise cancelling performance. Breathtaking high-fidelity audio reproduction with pristine clarity.",
      rating: 4.8,
      reviewCount: 125,
      images: [
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&auto=format&fit=crop&q=80"
      ],
      availability: true,
      warranty: "1 Year Sony Warranty",
    },
    {
      id: "airpods-max",
      name: "Apple AirPods Max USB-C",
      sku: "AP-APM-UC",
      price: 549.00,
      stock: 14,
      minStockAlert: 2,
      brandId: "apple",
      categoryId: "audio",
      subCategoryId: "audio-sub",
      specifications: {
        Noise_Cancelling: "ANC",
        Audio: "Spatial Audio",
        Connector: "USB-C",
        Warranty: "1 Year Apple Warranty",
      },
      description: "A perfect balance of exhilarating high-fidelity audio and the effortless magic of AirPods. Now with USB-C connector integration.",
      rating: 4.7,
      reviewCount: 74,
      images: [
        "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80"
      ],
      availability: true,
      warranty: "1 Year Apple Warranty",
    },
    {
      id: "bose-qc-earbuds",
      name: "Bose QC Ultra Earbuds",
      sku: "BOSE-QCUE-IMM",
      price: 299.00,
      stock: 18,
      minStockAlert: 3,
      brandId: "bose",
      categoryId: "audio",
      subCategoryId: "audio-sub",
      specifications: {
        Audio: "Immersive Audio",
        Noise_Cancelling: "Yes",
        Warranty: "1 Year Bose Warranty",
      },
      description: "Breakthrough spatialized immersive audio. World-class quietness with CustomTune technology tailoring the noise cancellation specifically to you.",
      rating: 4.6,
      reviewCount: 56,
      images: [
        "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=800&auto=format&fit=crop&q=80"
      ],
      availability: true,
      warranty: "1 Year Bose Warranty",
    },
    {
      id: "sennheiser-momentum-4",
      name: "Sennheiser Momentum 4",
      sku: "SENN-M4-60H",
      price: 379.95,
      stock: 12,
      minStockAlert: 2,
      brandId: "sennheiser",
      categoryId: "audio",
      subCategoryId: "audio-sub",
      specifications: {
        Battery: "60h Battery",
        Warranty: "2 Years Sennheiser Warranty",
      },
      description: "A class-defining 60-hour battery stamina. Audiophile-grade acoustic platform with high-resolution sound, and elegant smart interface.",
      rating: 4.7,
      reviewCount: 43,
      images: [
        "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80"
      ],
      availability: true,
      warranty: "2 Years Sennheiser Warranty",
    },
    {
      id: "anker-prime-100w",
      name: "Anker Prime 100W GaN",
      sku: "ANK-P100W-GAN",
      price: 84.99,
      stock: 40,
      minStockAlert: 5,
      brandId: "anker",
      categoryId: "chargers",
      subCategoryId: "power",
      specifications: {
        Ports: "3-Port Charger",
        Warranty: "18 Months Anker Warranty",
      },
      description: "An ultra-compact 3-port charger powered by GaN technology, capable of supercharging notebooks, tablets, and smartphones simultaneously.",
      rating: 4.8,
      reviewCount: 51,
      images: [
        "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1609592424109-dd9892f1b17c?w=800&auto=format&fit=crop&q=80"
      ],
      availability: true,
      warranty: "18 Months Anker Warranty",
    },
    {
      id: "anker-prime-20000",
      name: "Anker Prime 20000mAh",
      sku: "ANK-P20K-220W",
      price: 179.99,
      stock: 25,
      minStockAlert: 4,
      brandId: "anker",
      categoryId: "chargers",
      subCategoryId: "power",
      specifications: {
        Power: "220W Power Bank",
        Warranty: "18 Months Anker Warranty",
      },
      description: "A super-high-capacity power reservoir with rapid 220W total output, featuring interactive digital status telemetry to track performance.",
      rating: 4.8,
      reviewCount: 39,
      images: [
        "https://images.unsplash.com/photo-1609592424109-dd9892f1b17c?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&auto=format&fit=crop&q=80"
      ],
      availability: true,
      warranty: "18 Months Anker Warranty",
    },
    {
      id: "belkin-boostcharge",
      name: "Belkin BoostCharge Pro 3-in-1",
      sku: "BEL-BCP31-WIR",
      price: 149.99,
      stock: 15,
      minStockAlert: 2,
      brandId: "belkin",
      categoryId: "chargers",
      subCategoryId: "power",
      specifications: {
        Type: "Wireless Charger",
        Warranty: "2 Years Belkin Warranty",
      },
      description: "Charge your premium Apple devices simultaneously with an elegant MagSafe-compatible fast-charging dock designed for desk spaces.",
      rating: 4.6,
      reviewCount: 18,
      images: [
        "https://images.unsplash.com/photo-1622445262465-2481c4574875?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=800&auto=format&fit=crop&q=80"
      ],
      availability: true,
      warranty: "2 Years Belkin Warranty",
    },
    {
      id: "anker-nano-dock",
      name: "Anker Nano Dock",
      sku: "ANK-ND131-DK",
      price: 149.99,
      stock: 12,
      minStockAlert: 2,
      brandId: "anker",
      categoryId: "chargers",
      subCategoryId: "power",
      specifications: {
        Ports: "13-in-1 Dock",
        Warranty: "18 Months Anker Warranty",
      },
      description: "A robust and highly-capable 13-in-1 desktop docking station designed to unify charging, video interfaces, and massive data transfers.",
      rating: 4.5,
      reviewCount: 23,
      images: [
        "https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1622445262465-2481c4574875?w=800&auto=format&fit=crop&q=80"
      ],
      availability: true,
      warranty: "18 Months Anker Warranty",
    },
    {
      id: "logitech-mx-master-3s",
      name: "Logitech MX Master 3S",
      sku: "LOG-MXM3S-WIR",
      price: 99.99,
      stock: 35,
      minStockAlert: 5,
      brandId: "logitech",
      categoryId: "peripherals",
      subCategoryId: "peripherals-sub",
      specifications: {
        Type: "Wireless Mouse",
        Warranty: "1 Year Logitech Warranty",
      },
      description: "An iconic silent-click ergonomic masterclass. Designed for precision tracking across surfaces, boasting an advanced 8K DPI optic.",
      rating: 4.8,
      reviewCount: 112,
      images: [
        "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80"
      ],
      availability: true,
      warranty: "1 Year Logitech Warranty",
    },
    {
      id: "logitech-mx-keys-s",
      name: "Logitech MX Keys S",
      sku: "LOG-MXKS-WIR",
      price: 109.99,
      stock: 28,
      minStockAlert: 4,
      brandId: "logitech",
      categoryId: "peripherals",
      subCategoryId: "peripherals-sub",
      specifications: {
        Type: "Wireless Keyboard",
        Warranty: "1 Year Logitech Warranty",
      },
      description: "Fluid, ultra-quiet, precise tactile feedback designed for maximum productivity. Smart smart-illumination that responds to proximity.",
      rating: 4.7,
      reviewCount: 84,
      images: [
        "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&auto=format&fit=crop&q=80"
      ],
      availability: true,
      warranty: "1 Year Logitech Warranty",
    },
    {
      id: "samsung-viewfinity-s9",
      name: "Samsung ViewFinity S9",
      sku: "SAMS-VFS9-5K",
      price: 1599.99,
      stock: 5,
      minStockAlert: 1,
      brandId: "samsung",
      categoryId: "peripherals",
      subCategoryId: "peripherals-sub",
      specifications: {
        Size: "27\" 5K Monitor",
        Warranty: "3 Years Samsung Warranty",
      },
      description: "Breathtaking clarity built for professionals. A stunning 5K screen offering authentic matte display rendering and smart feature suites.",
      rating: 4.8,
      reviewCount: 19,
      images: [
        "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800&auto=format&fit=crop&q=80"
      ],
      availability: true,
      warranty: "3 Years Samsung Warranty",
    },
  ];

  const coupons: Coupon[] = [
    { id: "electra10", code: "ELECTRA10", discountType: "percentage", discountValue: 10, minPurchase: 100, isActive: true, expiryDate: "2027-12-31" },
    { id: "welcome50", code: "WELCOME50", discountType: "fixed", discountValue: 50, minPurchase: 500, isActive: true, expiryDate: "2027-12-31" },
    { id: "superdeal", code: "SUPERDEAL", discountType: "percentage", discountValue: 20, minPurchase: 1500, isActive: true, expiryDate: "2027-12-31" },
  ];

  const websiteSettings: WebsiteSettings = {
    storeName: "ELECTRA",
    whatsappNumber: "+21325789900",
    storeEmail: "contact@electra-dz.com",
    storePhone: "+213 25 78 99 00",
    storeAddress: "Rue de la Palestine, Médéa, Algeria",
    deliveryCost: 10,
    allowCashOnDelivery: true,
    allowBankTransfer: true,
    enableLoyaltyPoints: true,
    pointsPerDollar: 1,
  };

  const users: User[] = [
    { id: "user-super-admin", name: "Sarah Connor (Super Admin)", email: "admin@electra.com", role: Role.SUPER_ADMIN, loyaltyPoints: 500, createdAt: "2026-01-10T00:00:00.000Z" },
    { id: "user-smartphone-manager", name: "David Miller (Phones)", email: "smartphones@electra.com", role: Role.SMARTPHONE_MANAGER, loyaltyPoints: 100, createdAt: "2026-02-15T00:00:00.000Z" },
    { id: "user-computer-manager", name: "Linus Tech (Computers)", email: "computers@electra.com", role: Role.COMPUTER_MANAGER, loyaltyPoints: 200, createdAt: "2026-03-01T00:00:00.000Z" },
    { id: "user-watch-manager", name: "Alex Garmin (Watches)", email: "watches@electra.com", role: Role.SMART_WATCH_MANAGER, loyaltyPoints: 80, createdAt: "2026-04-10T00:00:00.000Z" },
    { id: "user-accessories-manager", name: "Maria Beats (Accessories)", email: "accessories@electra.com", role: Role.ACCESSORIES_MANAGER, loyaltyPoints: 150, createdAt: "2026-05-05T00:00:00.000Z" },
    { id: "user-orders-manager", name: "John FedEx (Logistics)", email: "orders@electra.com", role: Role.ORDERS_MANAGER, loyaltyPoints: 0, createdAt: "2026-06-12T00:00:00.000Z" },
    { id: "user-customer-service", name: "Emily Watson (Support)", email: "service@electra.com", role: Role.CUSTOMER_SERVICE, loyaltyPoints: 50, createdAt: "2026-07-01T00:00:00.000Z" },
    { id: "user-customer", name: "James Bond (VIP Customer)", email: "customer@electra.com", role: Role.CUSTOMER, loyaltyPoints: 1250, phone: "+212677889900", address: "12 Rue des Oliviers, Anfa", city: "Casablanca", createdAt: "2026-07-15T00:00:00.000Z" },
  ];

  const orders: Order[] = [
    {
      id: "ORD-984572",
      customerName: "James Bond",
      email: "customer@electra.com",
      phone: "+212677889900",
      address: "12 Rue des Oliviers, Anfa",
      city: "Casablanca",
      paymentMethod: "Credit Card",
      paymentStatus: "Paid",
      shippingStatus: "Delivered",
      deliveryCost: 15,
      subtotal: 1099,
      total: 1114,
      whatsappSent: true,
      createdAt: "2026-07-16T14:30:00.000Z",
      items: [
        { id: "item-1", orderId: "ORD-984572", productId: "iphone-15-pro-max", name: "iPhone 15 Pro Max (256GB)", price: 1099, quantity: 1 }
      ]
    },
    {
      id: "ORD-115822",
      customerName: "Jane Doe",
      email: "jane@gmail.com",
      phone: "+212611223344",
      address: "Residence Elite, Apt 4",
      city: "Rabat",
      paymentMethod: "Cash on Delivery",
      paymentStatus: "Pending",
      shippingStatus: "Pending",
      deliveryCost: 15,
      subtotal: 349,
      total: 364,
      whatsappSent: false,
      createdAt: "2026-07-19T09:15:00.000Z",
      items: [
        { id: "item-2", orderId: "ORD-115822", productId: "sony-wh1000xm5", name: "Sony WH-1000XM5 Wireless Headphones", price: 349, quantity: 1 }
      ]
    }
  ];

  const reviews: Review[] = [
    { id: "rev-1", productId: "iphone-15-pro-max", userName: "James Bond", rating: 5, comment: "Absolutely marvelous craftsmanship. Highly recommend this premium titanium beast!", createdAt: "2026-07-17T11:00:00.000Z" },
    { id: "rev-2", productId: "sony-wh1000xm5", userName: "AcousticFanatic", rating: 4, comment: "Noise cancelling is second to none, but warm in the sun.", createdAt: "2026-07-18T16:00:00.000Z" }
  ];

  const notifications: Notification[] = [
    { id: "notif-1", title: "New Order Received", message: "Order ORD-115822 placed by Jane Doe is awaiting confirmation.", read: false, type: "success", createdAt: "2026-07-19T09:15:00.000Z" },
    { id: "notif-2", title: "Low Stock Alert", message: "ASUS ROG Strix RTX 4080 Super is down to 2 units left.", read: false, type: "warning", createdAt: "2026-07-20T01:00:00.000Z" },
  ];

  const auditLogs: AuditLog[] = [
    { id: "log-1", action: "DATABASE_INITIALIZED", details: "Enterprise DB Seeded with core inventories & roles.", createdAt: "2026-07-20T03:57:00.000Z" }
  ];

  const supportTickets: SupportTicket[] = [
    {
      id: "TCK-552",
      name: "Arthur Pendragon",
      email: "arthur@camelot.com",
      subject: "Warranty verification for ROG Laptop",
      message: "Does the laptop have international coverage in Europe?",
      status: "Open",
      createdAt: "2026-07-19T10:45:00.000Z",
      replies: []
    }
  ];

  return {
    categories,
    subCategories,
    brands,
    products,
    coupons,
    websiteSettings,
    users,
    orders,
    reviews,
    notifications,
    auditLogs,
    supportTickets,
  };
}

// Initialize Firebase Admin & Firestore with safe default fallback
let dbStore: Firestore | null = null;
try {
  const firebaseConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(firebaseConfigPath)) {
    const config = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf-8"));
    let app;
    if (getApps().length === 0) {
      const options: any = { projectId: config.projectId };
      if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        try {
          const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
          options.credential = cert(serviceAccount);
          console.log("Firebase initialized with credentials from FIREBASE_SERVICE_ACCOUNT env var.");
        } catch (err) {
          console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT environment variable:", err);
        }
      }
      app = initializeApp(options);
    } else {
      app = getApps()[0];
    }
    dbStore = config.firestoreDatabaseId && config.firestoreDatabaseId !== "(default)"
      ? getFirestore(app, config.firestoreDatabaseId)
      : getFirestore(app);
    console.log("Firebase Admin & Firestore initialized successfully with database ID:", config.firestoreDatabaseId);
  } else {
    console.warn("firebase-applet-config.json not found. Reverting to local file/memory storage.");
  }
} catch (err) {
  console.error("Failed to initialize Firebase Admin:", err);
}

let dbCache: any = null;

// Initialize dbCache from Firestore or fallback to db.json/seed
export async function initDBCache() {
  if (dbStore) {
    try {
      console.log("Loading database from Firestore...");
      const docRef = dbStore.doc("ecommerce/database");
      const snap = await docRef.get();
      if (snap.exists) {
        dbCache = snap.data();
        console.log("Database successfully loaded from Firestore.");
      } else {
        console.log("Firestore database document not found. Seeding initial database...");
        const initial = getInitialDB();
        await docRef.set(initial);
        dbCache = initial;
        console.log("Initial database successfully seeded to Firestore.");
      }
    } catch (err) {
      console.error("Failed to load from Firestore, falling back to local file/memory:", err);
    }
  }

  // Fallback to local db.json if Firebase was not initialized or failed
  if (!dbCache) {
    if (fs.existsSync(DB_PATH)) {
      try {
        dbCache = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
        console.log("Loaded database from local db.json.");
      } catch (err) {
        console.error("Failed to read local db.json, seeding new file:", err);
        dbCache = getInitialDB();
        fs.writeFileSync(DB_PATH, JSON.stringify(dbCache, null, 2));
      }
    } else {
      dbCache = getInitialDB();
      fs.writeFileSync(DB_PATH, JSON.stringify(dbCache, null, 2));
      console.log("Created new high-fidelity database seed file locally.");
    }
  }
}

function loadDB() {
  if (!dbCache) {
    // Synchronous safety fallback in case loadDB is called before initDBCache completes (extremely rare)
    if (fs.existsSync(DB_PATH)) {
      try {
        dbCache = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
      } catch (err) {
        dbCache = getInitialDB();
      }
    } else {
      dbCache = getInitialDB();
    }
  }
  return dbCache;
}

function saveDB(data: any) {
  dbCache = data;

  // Asynchronously save to local disk
  fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), "utf-8", (err) => {
    if (err) console.error("Failed to write database file locally:", err);
  });

  // Asynchronously save to Firestore
  if (dbStore) {
    dbStore.doc("ecommerce/database").set(data).catch((err) => {
      console.error("Failed to save database to Firestore:", err);
    });
  }
}

// API Endpoints
// Load entire database configuration
app.get("/api/db", (req, res) => {
  res.json(loadDB());
});

// Save raw database JSON
app.post("/api/db/raw", (req, res) => {
  const { rawJson } = req.body;
  try {
    const parsed = JSON.parse(rawJson);
    if (!parsed.products || !parsed.users || !parsed.categories) {
      return res.status(400).json({ success: false, error: "Invalid database structure. Must include products, users, and categories." });
    }
    saveDB(parsed);
    res.json({ success: true, db: parsed });
  } catch (err: any) {
    res.status(400).json({ success: false, error: "Invalid JSON format: " + err.message });
  }
});

// Reset database to initial seed
app.post("/api/db/reset", (req, res) => {
  const initial = getInitialDB();
  saveDB(initial);
  res.json({ success: true, db: initial });
});

// Update website settings
app.put("/api/settings", (req, res) => {
  const db = loadDB();
  db.websiteSettings = { ...db.websiteSettings, ...req.body };
  
  // Add audit log
  db.auditLogs.unshift({
    id: `log-${Date.now()}`,
    action: "WEBSITE_SETTINGS_UPDATE",
    details: "Super admin updated e-commerce settings.",
    createdAt: new Date().toISOString(),
  });

  saveDB(db);
  res.json({ success: true, settings: db.websiteSettings });
});

// Mock Authentication Login
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  const db = loadDB();
  
  // High fidelity validation: find a matching seeded user
  const user = db.users.find((u: User) => u.email.toLowerCase() === email.toLowerCase());
  
  if (user) {
    // In our simplified high-fidelity architecture, any password matches for demo/review convenience, but validate format
    res.json({
      success: true,
      token: "mock-jwt-token-" + user.role.replace(/\s+/g, "-").toLowerCase(),
      user
    });
  } else {
    res.status(401).json({ success: false, error: "Invalid credentials. Please use the preset role emails." });
  }
});

// Registration
app.post("/api/auth/register", (req, res) => {
  const { name, email, phone, address, city } = req.body;
  const db = loadDB();

  if (db.users.find((u: User) => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ success: false, error: "Email already registered." });
  }

  const newUser: User = {
    id: `user-${Date.now()}`,
    name,
    email,
    phone,
    address,
    city,
    role: Role.CUSTOMER,
    loyaltyPoints: 100, // Welcome loyalty points!
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);
  db.auditLogs.unshift({
    id: `log-${Date.now()}`,
    action: "USER_REGISTERED",
    details: `Customer ${name} signed up. Received 100 loyalty points.`,
    userId: newUser.id,
    userName: name,
    createdAt: new Date().toISOString(),
  });

  saveDB(db);
  res.json({ success: true, user: newUser });
});

// Create Order (WhatsApp Synced in front)
app.post("/api/orders", (req, res) => {
  const { customerName, email, phone, address, city, paymentMethod, items, subtotal, deliveryCost, total, notes, couponCode } = req.body;
  const db = loadDB();

  const orderId = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;

  // Deduct products inventory and check availability
  const orderItems = items.map((item: any) => {
    const product = db.products.find((p: Product) => p.id === item.productId);
    if (product) {
      if (product.stock >= item.quantity) {
        product.stock -= item.quantity;
        if (product.stock <= product.minStockAlert) {
          db.notifications.unshift({
            id: `notif-${Date.now()}-${product.id}`,
            title: "Stock Alert",
            message: `${product.name} is low on stock (${product.stock} left).`,
            read: false,
            type: "warning",
            createdAt: new Date().toISOString()
          });
        }
      } else {
        // Stock adjustment fallback
        product.stock = 0;
      }
    }
    return {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      orderId,
      productId: item.productId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
    };
  });

  // Calculate Loyalty Points Awarded (1 point per dollar spent based on subtotal)
  let pointsAwarded = 0;
  if (db.websiteSettings.enableLoyaltyPoints) {
    pointsAwarded = Math.round(subtotal * db.websiteSettings.pointsPerDollar);
    const user = db.users.find((u: User) => u.email.toLowerCase() === email.toLowerCase());
    if (user) {
      user.loyaltyPoints += pointsAwarded;
    }
  }

  const newOrder: Order = {
    id: orderId,
    customerName,
    email,
    phone,
    address,
    city,
    paymentMethod,
    paymentStatus: paymentMethod === "Cash on Delivery" ? "Pending" : "Paid",
    shippingStatus: "Pending",
    deliveryCost,
    subtotal,
    total,
    notes,
    whatsappSent: true,
    createdAt: new Date().toISOString(),
    items: orderItems,
  };

  db.orders.unshift(newOrder);

  // Notification
  db.notifications.unshift({
    id: `notif-${Date.now()}`,
    title: "New E-Commerce Order",
    message: `Order ${orderId} placed by ${customerName} ($${total.toFixed(2)})`,
    read: false,
    type: "success",
    createdAt: new Date().toISOString(),
  });

  // Audit
  db.auditLogs.unshift({
    id: `log-${Date.now()}`,
    action: "ORDER_PLACED",
    details: `Order ${orderId} created successfully. Loyalty Points Awarded: ${pointsAwarded}`,
    createdAt: new Date().toISOString(),
  });

  saveDB(db);
  res.json({ success: true, order: newOrder });
});

// Update order shipping or payment state (for Managers)
app.put("/api/orders/:id/status", (req, res) => {
  const { id } = req.params;
  const { shippingStatus, paymentStatus } = req.body;
  const db = loadDB();

  const order = db.orders.find((o: Order) => o.id === id);
  if (!order) {
    return res.status(404).json({ success: false, error: "Order not found" });
  }

  if (shippingStatus) order.shippingStatus = shippingStatus;
  if (paymentStatus) order.paymentStatus = paymentStatus;

  db.auditLogs.unshift({
    id: `log-${Date.now()}`,
    action: "ORDER_STATUS_UPDATE",
    details: `Order ${id} status updated to: Ship[${order.shippingStatus}] Pay[${order.paymentStatus}]`,
    createdAt: new Date().toISOString(),
  });

  saveDB(db);
  res.json({ success: true, order });
});

// Add or duplicate product (Smartphone, Computer, Accessories, Watch Managers)
app.post("/api/products", (req, res) => {
  const productData = req.body;
  const db = loadDB();

  const newProduct: Product = {
    id: productData.id || productData.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name: productData.name,
    sku: productData.sku || `SKU-${Math.floor(100000 + Math.random() * 900000)}`,
    price: parseFloat(productData.price),
    discountPrice: productData.discountPrice ? parseFloat(productData.discountPrice) : undefined,
    stock: parseInt(productData.stock) || 0,
    minStockAlert: parseInt(productData.minStockAlert) || 5,
    brandId: productData.brandId,
    categoryId: productData.categoryId,
    subCategoryId: productData.subCategoryId,
    specifications: productData.specifications || {},
    description: productData.description || "No description provided.",
    rating: 5.0,
    reviewCount: 0,
    images: productData.images && productData.images.length > 0 ? productData.images : ["https://picsum.photos/seed/electra/800/800"],
    availability: productData.stock > 0,
    warranty: productData.warranty || "1 Year General Warranty",
    barcode: productData.barcode || Math.floor(100000000000 + Math.random() * 900000000000).toString(),
  };

  db.products.unshift(newProduct);

  db.auditLogs.unshift({
    id: `log-${Date.now()}`,
    action: "PRODUCT_CREATED",
    details: `Product ${newProduct.name} added under ${newProduct.categoryId}. SKU: ${newProduct.sku}`,
    createdAt: new Date().toISOString(),
  });

  saveDB(db);
  res.json({ success: true, product: newProduct });
});

// Edit Product
app.put("/api/products/:id", (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  const db = loadDB();

  const index = db.products.findIndex((p: Product) => p.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: "Product not found" });
  }

  db.products[index] = {
    ...db.products[index],
    ...updateData,
    price: parseFloat(updateData.price),
    discountPrice: updateData.discountPrice ? parseFloat(updateData.discountPrice) : undefined,
    stock: parseInt(updateData.stock),
    minStockAlert: parseInt(updateData.minStockAlert),
    availability: parseInt(updateData.stock) > 0,
  };

  db.auditLogs.unshift({
    id: `log-${Date.now()}`,
    action: "PRODUCT_UPDATED",
    details: `Product ${db.products[index].name} details updated by manager.`,
    createdAt: new Date().toISOString(),
  });

  saveDB(db);
  res.json({ success: true, product: db.products[index] });
});

// Delete Product
app.delete("/api/products/:id", (req, res) => {
  const { id } = req.params;
  const db = loadDB();

  const product = db.products.find((p: Product) => p.id === id);
  if (!product) {
    return res.status(404).json({ success: false, error: "Product not found" });
  }

  db.products = db.products.filter((p: Product) => p.id !== id);

  db.auditLogs.unshift({
    id: `log-${Date.now()}`,
    action: "PRODUCT_DELETED",
    details: `Product ${product.name} removed from inventory.`,
    createdAt: new Date().toISOString(),
  });

  saveDB(db);
  res.json({ success: true });
});

// Import products from Excel simulator
app.post("/api/products/import-excel", (req, res) => {
  const { products: rawProducts } = req.body;
  const db = loadDB();

  let importedCount = 0;
  rawProducts.forEach((p: any) => {
    const sku = p.sku || `SKU-${Math.floor(100000 + Math.random() * 900000)}`;
    const brandId = p.brandId?.toLowerCase() || "apple";
    const categoryId = p.categoryId?.toLowerCase() || "smartphones";

    const newProduct: Product = {
      id: `imported-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: p.name,
      sku,
      price: parseFloat(p.price) || 199,
      discountPrice: p.discountPrice ? parseFloat(p.discountPrice) : undefined,
      stock: parseInt(p.stock) || 10,
      minStockAlert: parseInt(p.minStockAlert) || 3,
      brandId,
      categoryId,
      subCategoryId: p.subCategoryId,
      specifications: p.specifications || { Warranty: "1 Year" },
      description: p.description || "Imported batch product.",
      rating: 5.0,
      reviewCount: 0,
      images: ["https://picsum.photos/seed/imported/800/800"],
      availability: true,
      warranty: p.warranty || "1 Year Warranty",
    };

    db.products.unshift(newProduct);
    importedCount++;
  });

  db.auditLogs.unshift({
    id: `log-${Date.now()}`,
    action: "BULK_EXCEL_IMPORT",
    details: `Imported ${importedCount} electronics items via bulk Excel tool.`,
    createdAt: new Date().toISOString(),
  });

  saveDB(db);
  res.json({ success: true, count: importedCount });
});

// Coupons CRUD
app.post("/api/coupons", (req, res) => {
  const couponData = req.body;
  const db = loadDB();

  const newCoupon: Coupon = {
    id: couponData.code.toLowerCase(),
    code: couponData.code.toUpperCase(),
    discountType: couponData.discountType,
    discountValue: parseFloat(couponData.discountValue),
    minPurchase: parseFloat(couponData.minPurchase) || 0,
    isActive: true,
    expiryDate: couponData.expiryDate || "2027-12-31",
  };

  db.coupons.push(newCoupon);
  saveDB(db);
  res.json({ success: true, coupon: newCoupon });
});

// Gemini AI Recommendations Endpoints
app.post("/api/gemini/recommendations", async (req, res) => {
  const { cartItems, recentViews } = req.body;
  const db = loadDB();

  // Guard: if no key is set, we return mock recommendations based on categories to provide stellar out-of-the-box speed
  if (!ai) {
    // Elegant heuristic sandbox recommendations
    const relatedProducts = db.products.slice(0, 3);
    return res.json({
      success: true,
      source: "sandbox_heuristics",
      recommendations: relatedProducts,
      aiAnalysis: "Elevate your electronics experience. These recommended top picks complement your selected products perfectly, offering premium tech performance and industry-leading specifications."
    });
  }

  try {
    const prompt = `You are a professional retail recommendation AI for "ELECTRA", a luxury physical and digital electronics store.
We sell: Smartphones, Computers, Laptops, Tablets, Smart Watches, and Audio Accessories.

The customer current shopping cart contains:
${JSON.stringify(cartItems || [])}

The customer recently viewed these products:
${JSON.stringify(recentViews || [])}

Here is our available catalog:
${JSON.stringify(db.products.map((p: any) => ({ id: p.id, name: p.name, category: p.categoryId, price: p.price, description: p.description })))}

Analyze the customer interest and output a JSON response matching exactly this format:
{
  "recommendedProductIds": ["id1", "id2"],
  "aiAnalysis": "A brief, highly persuasive explanation of why these companion products would enrich their workflow."
}
Only output the JSON object. Do not include markdown code block formatting (like \`\`\`json). Just the clean JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    const cleanText = response.text?.trim() || "{}";
    let aiResponse;
    try {
      // Remove possible markdown formatting from model output
      const jsonString = cleanText.replace(/```json/g, "").replace(/```/g, "").trim();
      aiResponse = JSON.parse(jsonString);
    } catch {
      aiResponse = { recommendedProductIds: [], aiAnalysis: "Complete your premium setup with our high-end accessories." };
    }

    const recommendedIds = aiResponse.recommendedProductIds || [];
    let recommendedProducts = db.products.filter((p: Product) => recommendedIds.includes(p.id));

    if (recommendedProducts.length === 0) {
      recommendedProducts = db.products.slice(0, 2);
    }

    res.json({
      success: true,
      source: "gemini_ai",
      recommendations: recommendedProducts,
      aiAnalysis: aiResponse.aiAnalysis || "We recommend adding these perfect electronic complements to maximize your device capabilities."
    });
  } catch (error: any) {
    console.error("Gemini Recommendations failed:", error);
    res.json({
      success: true,
      source: "error_recovery_fallback",
      recommendations: db.products.slice(0, 2),
      aiAnalysis: "Complete your setup with these matching electronics items designed for high compatibility."
    });
  }
});

// Support Ticket Reply
app.post("/api/support/tickets/:id/reply", (req, res) => {
  const { id } = req.params;
  const { message, sender } = req.body;
  const db = loadDB();

  const ticket = db.supportTickets.find((t: SupportTicket) => t.id === id);
  if (!ticket) {
    return res.status(404).json({ success: false, error: "Support Ticket not found" });
  }

  ticket.replies.push({
    id: `reply-${Date.now()}`,
    sender,
    message,
    createdAt: new Date().toISOString(),
  });

  ticket.status = sender === "Emily Watson (Support)" ? "In Progress" : "Open";

  saveDB(db);
  res.json({ success: true, ticket });
});

// Create support ticket
app.post("/api/support/tickets", (req, res) => {
  const { name, email, subject, message } = req.body;
  const db = loadDB();

  const newTicket: SupportTicket = {
    id: `TCK-${Math.floor(100 + Math.random() * 900)}`,
    name,
    email,
    subject,
    message,
    status: "Open",
    createdAt: new Date().toISOString(),
    replies: [],
  };

  db.supportTickets.push(newTicket);
  db.notifications.unshift({
    id: `notif-${Date.now()}`,
    title: "New Support Ticket",
    message: `${name} opened ticket ${newTicket.id}: "${subject}"`,
    read: false,
    type: "info",
    createdAt: new Date().toISOString(),
  });

  saveDB(db);
  res.json({ success: true, ticket: newTicket });
});

// Live Chat AI Assistant (Using Gemini for Customer Service Desk simulation)
app.post("/api/support/chat", async (req, res) => {
  const { message, history } = req.body;
  
  if (!ai) {
    // High-fidelity sandbox automatic client response
    const genericReplies = [
      "Hello! Thank you for contacting Electra Customer Service. How can I assist you with your smart devices or orders today?",
      "Excellent question. All our premium laptops and smartphones come with a 1 to 2-year warranty. You can also place orders directly and pay via Cash on Delivery or Secure Transfer!",
      "We synchronize all physical purchases immediately. Once you check out, you will receive a unique Order ID and a direct WhatsApp connection link to speed up processing!",
      "Yes! We are located at Rue de la Palestine, Médéa, Algeria, and we offer quick delivery across all 58 wilayas.",
    ];
    const randomIndex = Math.floor(Math.random() * genericReplies.length);
    return res.json({ reply: genericReplies[randomIndex] });
  }

  try {
    const formattedHistory = (history || []).map((h: any) => `${h.sender === "user" ? "Customer" : "Agent"}: ${h.text}`).join("\n");
    const prompt = `You are a friendly, highly helpful premium retail Customer Support Agent for "ELECTRA", a high-end electronics store. 
Our store details:
- Name: ELECTRA Premium Electronics
- Location: Rue de la Palestine, Médéa, Algeria
- Delivery: Express delivery to Médéa, Algiers, Oran, Constantine, and all 58 wilayas in Algeria (Delivery cost: $10)
- Payment: Cash on Delivery and Bank Transfer (CCP / BaridiMob).
- WhatsApp: Integrated order processing. Customers click "Place Order" which submits to our DB and directs them to WhatsApp to finalize.

Chat history:
${formattedHistory}

Customer asks: "${message}"

Provide a highly professional, polite, concise support reply under 100 words. Speak directly as the agent. Do not say "Agent:" or "Reply:".`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({ reply: response.text?.trim() || "Thank you for reaching out! Let me check that details for you." });
  } catch (err) {
    res.json({ reply: "Our customer desk is ready to help you with any warranty, stock, or delivery details!" });
  }
});

// Analytics Dashboard Endpoint
app.get("/api/analytics", (req, res) => {
  const db = loadDB();

  // Metrics calculating
  const totalSalesRevenue = db.orders
    .filter((o: Order) => o.shippingStatus !== "Cancelled")
    .reduce((sum: number, o: Order) => sum + o.total, 0);

  const totalProfit = totalSalesRevenue * 0.25; // Simulated 25% profit margin
  const totalOrdersCount = db.orders.length;
  const totalCustomersCount = db.users.filter((u: User) => u.role === Role.CUSTOMER).length;

  // Best sellers mapping
  const itemCounts: Record<string, { count: number; name: string; revenue: number }> = {};
  db.orders.forEach((o: Order) => {
    if (o.shippingStatus !== "Cancelled") {
      o.items.forEach((it: OrderItem) => {
        if (!itemCounts[it.productId]) {
          itemCounts[it.productId] = { count: 0, name: it.name, revenue: 0 };
        }
        itemCounts[it.productId].count += it.quantity;
        itemCounts[it.productId].revenue += (it.price * it.quantity);
      });
    }
  });

  const bestSellers = Object.keys(itemCounts).map(id => ({
    id,
    ...itemCounts[id]
  })).sort((a, b) => b.count - a.count);

  // Low Stock
  const lowStockProducts = db.products.filter((p: Product) => p.stock <= p.minStockAlert);

  res.json({
    totalSalesRevenue,
    totalProfit,
    totalOrdersCount,
    totalCustomersCount,
    bestSellers,
    lowStockProducts,
    orders: db.orders,
  });
});

// Start server block
async function startServer() {
  // Initialize database cache from Firebase Firestore or local seed
  await initDBCache();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}
