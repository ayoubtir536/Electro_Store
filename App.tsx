/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  auth as firebaseAuth, 
  db as firestoreDb,
} from "./firebase/firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";
import { 
  collection, 
  doc, 
  onSnapshot, 
  getDoc, 
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc
} from "firebase/firestore";
import { 
  Role, User, Product, Category, Order, Coupon, Notification, 
  AuditLog, SupportTicket, WebsiteSettings, Review 
} from "./types";
import { Language, translations } from "./translations";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProductCard from "./components/ProductCard";
import ProductCompare from "./components/ProductCompare";
import RoleDashboards from "./components/RoleDashboards";
import { 
  generateWhatsAppLink, 
  generateSingleProductWhatsAppLink, 
  generateCartWhatsAppLink 
} from "./utils";
import { 
  Smartphone, Laptop, Watch, Headphones, Sparkles, ShoppingBag, 
  Trash2, ArrowRight, ShieldCheck, Tag, Heart, MessageSquare, 
  Send, X, Star, FileText, CheckCircle, Info, MapPin, Phone, Mail, Printer 
} from "lucide-react";

export default function App() {
  // Theme and Multilingual States
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem("lang") as Language) || "en";
  });

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") return saved;
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return systemPrefersDark ? "dark" : "light";
  });

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = language;
    localStorage.setItem("lang", language);
  }, [language]);

  // Database State
  const [db, setDb] = useState<{
    categories: Category[];
    subCategories: any[];
    brands: any[];
    products: Product[];
    orders: Order[];
    coupons: Coupon[];
    notifications: Notification[];
    auditLogs: AuditLog[];
    supportTickets: SupportTicket[];
    websiteSettings: WebsiteSettings;
    users: User[];
  } | null>(null);

  // App Routing States
  const [activeView, setActiveView] = useState<string>("home");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Customer Session States
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [cart, setCart] = useState<Array<{ product: Product; quantity: number }>>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [comparedProducts, setComparedProducts] = useState<Product[]>([]);

  // Advanced Shop Filters
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterBrand, setFilterBrand] = useState<string>("all");
  const [filterPriceMax, setFilterPriceMax] = useState<number>(3000);
  const [sortOption, setSortOption] = useState<string>("popular");

  // Coupon applicator
  const [couponInput, setCouponInput] = useState<string>("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState<string>("");

  // Invoice display state
  const [recentCompletedOrder, setRecentCompletedOrder] = useState<Order | null>(null);

  // Customer checkout inputs
  const [checkoutName, setCheckoutName] = useState("");
  const [checkoutPhone, setCheckoutPhone] = useState("");
  const [checkoutAddress, setCheckoutAddress] = useState("");
  const [checkoutCity, setCheckoutCity] = useState("Médéa");
  const [checkoutPayment, setCheckoutPayment] = useState("Cash on Delivery");
  const [checkoutNotes, setCheckoutNotes] = useState("");

  // Customer Support Live Chat Box
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "agent"; text: string }>>([
    { sender: "agent", text: "Welcome to Electra! I'm Emily Watson. Need advice on smartphones, graphics cards, custom PCs, or delivery times?" }
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  // AI Advice based on Gemini recommendations
  const [aiRecommendations, setAiRecommendations] = useState<Product[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [aiLoading, setAiLoading] = useState(false);

  // Support contact form states
  const [contactForm, setContactForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [contactSuccess, setContactSuccess] = useState(false);

  // Product reviews form
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  // Firebase Auth states
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Fetch initial db states
  const fetchDB = () => {
    fetch("/api/db")
      .then((res) => res.json())
      .then((data) => {
        setDb(data);
        // Default session as James Bond (VIP Customer) if not logged in with Firebase
        if (!firebaseUser && !currentUser) {
          const defaultUser = data.users.find((u: User) => u.role === Role.CUSTOMER);
          setCurrentUser(defaultUser || null);
          if (defaultUser) {
            setCheckoutName(defaultUser.name);
            setCheckoutPhone(defaultUser.phone || "");
            setCheckoutAddress(defaultUser.address || "");
            setCheckoutCity(defaultUser.city || "Médéa");
          }
        }
      });
  };

  // Real-Time Listeners for Firestore collections
  useEffect(() => {
    fetchDB();

    // Listen to Firebase Auth state
    const unsubAuth = onAuthStateChanged(firebaseAuth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        // Fetch real-time document for authenticated user
        const userRef = doc(firestoreDb, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data() as User;
          setCurrentUser({ ...userData, id: user.uid });
          setCheckoutName(userData.name);
          setCheckoutPhone(userData.phone || "");
          setCheckoutAddress(userData.address || "");
          setCheckoutCity(userData.city || "Médéa");
        } else {
          // Document doesn't exist yet, seed standard customer doc
          const newUserData: User = {
            id: user.uid,
            name: user.displayName || user.email?.split("@")[0] || "Auth User",
            email: user.email || "",
            role: Role.CUSTOMER,
            loyaltyPoints: 0,
            createdAt: new Date().toISOString(),
          };
          await setDoc(userRef, newUserData);
          setCurrentUser(newUserData);
          setCheckoutName(newUserData.name);
        }
      } else {
        // Reset to default VIP customer on log out
        if (db && db.users) {
          const defaultUser = db.users.find((u: User) => u.role === Role.CUSTOMER);
          setCurrentUser(defaultUser || null);
          if (defaultUser) {
            setCheckoutName(defaultUser.name);
            setCheckoutPhone(defaultUser.phone || "");
            setCheckoutAddress(defaultUser.address || "");
          }
        }
      }
    });

    // Real-Time database synchronization on a single document level
    const unsubDb = onSnapshot(
      doc(firestoreDb, "ecommerce", "database"),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setDb(data as any);
        }
      },
      (error) => {
        console.warn("Real-time database listener offline or restricted:", error.message);
      }
    );

    return () => {
      unsubAuth();
      unsubDb();
    };
  }, []);

  // Update AI recommendations when cart changes or viewing product
  useEffect(() => {
    if (cart.length > 0) {
      setAiLoading(true);
      fetch("/api/gemini/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cartItems: cart.map(i => ({ name: i.product.name, price: i.product.price })),
          recentViews: selectedProduct ? [selectedProduct.name] : []
        })
      })
        .then((res) => res.json())
        .then((resData) => {
          if (resData.success) {
            setAiRecommendations(resData.recommendations);
            setAiAnalysis(resData.aiAnalysis);
          }
          setAiLoading(false);
        })
        .catch(() => setAiLoading(false));
    }
  }, [cart, selectedProduct]);

  // Firebase Auth Action Handlers
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);
    try {
      await signInWithEmailAndPassword(firebaseAuth, authEmail, authPassword);
      setShowAuthModal(false);
      setAuthEmail("");
      setAuthPassword("");
    } catch (err: any) {
      setAuthError(err.message || "Invalid email or password.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);
    try {
      const userCred = await createUserWithEmailAndPassword(firebaseAuth, authEmail, authPassword);
      // Explicitly create user document in Firestore
      const userRef = doc(firestoreDb, "users", userCred.user.uid);
      const newUserData: User = {
        id: userCred.user.uid,
        name: authName || authEmail.split("@")[0],
        email: authEmail,
        role: Role.CUSTOMER, // New accounts default to Customer
        loyaltyPoints: 100, // Seed 100 welcome loyalty points!
        createdAt: new Date().toISOString(),
      };
      await setDoc(userRef, newUserData);
      setCurrentUser(newUserData);
      setShowAuthModal(false);
      setAuthEmail("");
      setAuthPassword("");
      setAuthName("");
    } catch (err: any) {
      setAuthError(err.message || "Could not register account.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError("");
    setAuthLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(firebaseAuth, provider);
      setShowAuthModal(false);
    } catch (err: any) {
      setAuthError(err.message || "Google sign-in failed.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(firebaseAuth);
    } catch (err) {
      console.error("Signout failed:", err);
    }
  };

  // Switch role dynamically
  const handleSelectRole = (role: Role) => {
    if (!db) return;
    const matchedUser = db.users.find((u) => u.role === role);
    if (matchedUser) {
      setCurrentUser(matchedUser);
      setCheckoutName(matchedUser.name);
      setCheckoutPhone(matchedUser.phone || "");
      setCheckoutAddress(matchedUser.address || "");
      setCheckoutCity(matchedUser.city || "Médéa");
      if (role !== Role.CUSTOMER && role !== Role.GUEST) {
        setActiveView("dashboard");
      } else {
        setActiveView("home");
      }
    } else {
      // Guest User
      setCurrentUser(null);
      setActiveView("home");
    }
  };

  // Cart actions
  const handleAddToCart = (product: Product) => {
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.product.id === product.id);
      if (idx > -1) {
        const copy = [...prev];
        copy[idx].quantity += 1;
        return copy;
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const handleUpdateCartQuantity = (productId: string, qty: number) => {
    if (qty <= 0) {
      handleRemoveFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((i) => (i.product.id === productId ? { ...i, quantity: qty } : i))
    );
  };

  // Wishlist toggler
  const handleAddToWishlist = (product: Product) => {
    setWishlist((prev) => {
      if (prev.some((i) => i.id === product.id)) {
        return prev.filter((i) => i.id !== product.id);
      }
      return [...prev, product];
    });
  };

  // Compare toggler
  const handleSelectCompare = (product: Product) => {
    setComparedProducts((prev) => {
      if (prev.some((i) => i.id === product.id)) {
        return prev.filter((i) => i.id !== product.id);
      }
      if (prev.length >= 4) {
        alert("You can compare a maximum of 4 devices at once.");
        return prev;
      }
      return [...prev, product];
    });
  };

  // Order via WhatsApp (Direct Item Order)
  const handleOrderWhatsAppSingle = (product: Product) => {
    if (!db) return;
    const url = generateSingleProductWhatsAppLink(
      db.websiteSettings.whatsappNumber,
      db.websiteSettings.storeName,
      product
    );
    window.open(url, "_blank");
  };

  // Order Cart via WhatsApp (Direct Cart Inquiry)
  const handleOrderWhatsAppCart = () => {
    if (!db) return;
    const subtotal = cart.reduce((sum, i) => sum + (i.product.discountPrice || i.product.price) * i.quantity, 0);
    const url = generateCartWhatsAppLink(
      db.websiteSettings.whatsappNumber,
      db.websiteSettings.storeName,
      cart.map(i => ({ name: i.product.name, price: i.product.price, quantity: i.quantity })),
      subtotal
    );
    window.open(url, "_blank");
  };

  // Apply Coupon code
  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    const coupon = db.coupons.find(c => c.code.toUpperCase() === couponInput.toUpperCase());
    if (!coupon) {
      setCouponError("Invalid coupon code.");
      setAppliedCoupon(null);
    } else if (!coupon.isActive) {
      setCouponError("This coupon is no longer active.");
      setAppliedCoupon(null);
    } else {
      setAppliedCoupon(coupon);
      setCouponError("");
    }
  };

  // Place Order Flow
  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;

    const subtotal = cart.reduce((sum, i) => sum + (i.product.discountPrice || i.product.price) * i.quantity, 0);
    let discountAmt = 0;
    if (appliedCoupon) {
      if (subtotal >= appliedCoupon.minPurchase) {
        discountAmt = appliedCoupon.discountType === "percentage" 
          ? (subtotal * appliedCoupon.discountValue) / 100 
          : appliedCoupon.discountValue;
      } else {
        alert(`Minimum purchase for coupon ${appliedCoupon.code} is $${appliedCoupon.minPurchase}`);
        return;
      }
    }

    const deliveryCost = db.websiteSettings.deliveryCost;
    const total = subtotal - discountAmt + deliveryCost;

    const payload = {
      customerName: checkoutName,
      email: currentUser?.email || "guest@gmail.com",
      phone: checkoutPhone,
      address: checkoutAddress,
      city: checkoutCity,
      paymentMethod: checkoutPayment,
      items: cart.map(i => ({ productId: i.product.id, name: i.product.name, price: i.product.discountPrice || i.product.price, quantity: i.quantity })),
      subtotal,
      deliveryCost,
      total,
      notes: checkoutNotes,
      couponCode: appliedCoupon?.code,
    };

    fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setRecentCompletedOrder(data.order);
          setCart([]);
          setAppliedCoupon(null);
          setCouponInput("");
          setCheckoutNotes("");
          
          // Refresh catalog stock
          fetchDB();
          setActiveView("invoice");

          // Open WhatsApp automáticamente with formatted Order details!
          const waUrl = generateWhatsAppLink(
            db.websiteSettings.whatsappNumber,
            db.websiteSettings.storeName,
            data.order
          );
          setTimeout(() => {
            window.open(waUrl, "_blank");
          }, 1500);
        }
      });
  };

  // Support contact form handler
  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetch("/api/support/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(contactForm),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setContactSuccess(true);
          setContactForm({ name: "", email: "", subject: "", message: "" });
          fetchDB();
          setTimeout(() => setContactSuccess(false), 4000);
        }
      });
  };

  // Support ticket replies (Super Admin / Customer Service)
  const handleReplyTicket = (id: string, replyMessage: string) => {
    fetch(`/api/support/tickets/${id}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: replyMessage, sender: "Emily Watson (Support)" }),
    })
      .then((res) => res.json())
      .then(() => fetchDB());
  };

  // Live Chat send message
  const handleSendLiveChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput) return;

    const userMsg = { sender: "user" as const, text: chatInput };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setChatLoading(true);

    fetch("/api/support/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: chatInput, history: chatMessages }),
    })
      .then((res) => res.json())
      .then((data) => {
        setChatMessages((prev) => [...prev, { sender: "agent", text: data.reply }]);
        setChatLoading(false);
      })
      .catch(() => {
        setChatMessages((prev) => [...prev, { sender: "agent", text: "I can help with specifications or checkout steps!" }]);
        setChatLoading(false);
      });
  };

  // Submit Product Review
  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !reviewComment) return;

    const payload = {
      productId: selectedProduct.id,
      userName: currentUser?.name || "Anonymous Guest",
      rating: reviewRating,
      comment: reviewComment,
    };

    // Prepend locally & push to DB
    const updatedReviews = [
      { id: `rev-${Date.now()}`, ...payload, createdAt: new Date().toISOString() },
      ...(db?.reviews || [])
    ];

    setDb(prev => prev ? { ...prev, reviews: updatedReviews } : null);
    setReviewComment("");
    alert("Thank you for your showroom hardware review!");
  };

  // Manager functions
  const handleAddProduct = (p: any) => {
    fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(p),
    })
      .then((res) => res.json())
      .then(() => fetchDB());
  };

  const handleUpdateProduct = (p: Product) => {
    fetch(`/api/products/${p.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(p),
    })
      .then((res) => res.json())
      .then(() => fetchDB());
  };

  const handleDeleteProduct = (id: string) => {
    fetch(`/api/products/${id}`, { method: "DELETE" })
      .then((res) => res.json())
      .then(() => fetchDB());
  };

  const handleUpdateOrderStatus = (id: string, shippingStatus?: string, paymentStatus?: string) => {
    fetch(`/api/orders/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shippingStatus, paymentStatus }),
    })
      .then((res) => res.json())
      .then(() => fetchDB());
  };

  const handleUpdateSettings = (settings: WebsiteSettings) => {
    fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    })
      .then((res) => res.json())
      .then(() => fetchDB());
  };

  const handleAddCoupon = (coupon: Coupon) => {
    fetch("/api/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(coupon),
    })
      .then((res) => res.json())
      .then(() => fetchDB());
  };

  if (!db) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 flex-col gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-neutral-900"></div>
        <p className="text-xs font-mono text-gray-500">Initializing Electra Enterprise Core DB System...</p>
      </div>
    );
  }

  const t = translations[language];

  // Filter & search products list
  const filteredCatalog = db.products.filter((p) => {
    // Search match
    const query = searchQuery.toLowerCase();
    const matchesSearch = !query || 
      p.name.toLowerCase().includes(query) ||
      p.sku.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query) ||
      p.brandId.toLowerCase().includes(query) ||
      p.categoryId.toLowerCase().includes(query) ||
      Object.values(p.specifications || {}).some(v => typeof v === "string" && v.toLowerCase().includes(query));

    const matchesCategory = filterCategory === "all" || p.categoryId === filterCategory;
    const matchesBrand = filterBrand === "all" || p.brandId === filterBrand;
    const matchesPrice = p.price <= filterPriceMax;

    return matchesSearch && matchesCategory && matchesBrand && matchesPrice;
  }).sort((a, b) => {
    if (sortOption === "price-low") return a.price - b.price;
    if (sortOption === "price-high") return b.price - a.price;
    if (sortOption === "rating") return b.rating - a.rating;
    return b.reviewCount - a.reviewCount; // popularity
  });

  return (
    <div className="flex flex-col min-h-screen font-sans bg-gray-50 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 transition-colors duration-300">
      
      {/* Sticky Navbar */}
      <Navbar
        currentUser={currentUser}
        onSelectRole={handleSelectRole}
        cartCount={cart.reduce((sum, i) => sum + i.quantity, 0)}
        wishlistCount={wishlist.length}
        onNavigate={(v) => { setActiveView(v); setSearchQuery(""); }}
        activeView={activeView}
        onSearch={setSearchQuery}
        language={language}
        onLanguageChange={setLanguage}
        theme={theme}
        onThemeToggle={() => setTheme(theme === "light" ? "dark" : "light")}
      />

      {/* Main Container */}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          
          {/* VIEW: HOME */}
          {activeView === "home" && (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-16 animate-in fade-in"
            >
              {/* Premium Hero Slider / Showroom Banner */}
              <div className="relative h-[480px] bg-neutral-950 text-white overflow-hidden flex items-center">
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent z-10"></div>
                
                {/* Generated Showroom Banner Asset */}
                <img
                  src="/src/assets/images/showroom_banner_1784545083781.jpg"
                  alt="Electra Showroom Banner"
                  className="absolute inset-0 w-full h-full object-cover opacity-60"
                  referrerPolicy="no-referrer"
                />

                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-20 w-full space-y-4">
                  <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-400 tracking-wider uppercase">
                    {language === "ar" ? "معرض المدية والمتجر الإلكتروني" : language === "fr" ? "Showroom de Médéa & Boutique en Ligne" : "Médéa Showroom & Online Store"}
                  </span>
                  <h1 className="text-4xl md:text-5xl font-black tracking-tight max-w-2xl leading-none">
                    {t.heroTitle}
                  </h1>
                  <p className="text-sm md:text-base text-neutral-300 max-w-lg font-normal leading-relaxed">
                    {t.heroSubtitle}
                  </p>
                  
                  <div className="pt-4 flex flex-wrap gap-3">
                    <button
                      onClick={() => { setFilterCategory("all"); setActiveView("shop"); }}
                      className="rounded-xl bg-emerald-500 px-6 py-3 text-xs font-bold text-neutral-950 hover:bg-emerald-400 transition shadow flex items-center gap-1"
                    >
                      {t.shopNow}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setActiveView("faq")}
                      className="rounded-xl bg-white/10 backdrop-blur-md px-6 py-3 text-xs font-bold text-white hover:bg-white/20 transition"
                    >
                      {t.visitUs}
                    </button>
                  </div>
                </div>
              </div>

              {/* Browse Category Departments */}
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
                <div className="text-center space-y-1.5">
                  <h2 className="text-xl font-extrabold text-neutral-950 dark:text-neutral-50">{t.advantagesTitle}</h2>
                  <p className="text-xs text-neutral-400 max-w-md mx-auto">
                    {language === "ar" ? "اكتشف المجموعات المتميزة المعتمدة من قبل أخصائيي الأجهزة الإلكترونية." : language === "fr" ? "Explorez des collections haut de gamme vérifiées par des spécialistes." : "Explore premium collections verified by physical electronics specialists."}
                  </p>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { id: "smartphones", label: t.smartphones, desc: language === "ar" ? "حقائب، واقيات، شواحن" : language === "fr" ? "Étuis, Protections, Chargeurs" : "Cases, Protectors, Chargers", icon: Smartphone },
                    { id: "computers", label: t.laptops, desc: language === "ar" ? "محمول، بطاقات شاشة، تخزين" : language === "fr" ? "Laptops, GPU haut de gamme, SSD" : "Laptops, high-end GPUs, SSDs", icon: Laptop },
                    { id: "watches", label: t.smartwatches, desc: language === "ar" ? "أحزمة ساعات، شواحن" : language === "fr" ? "Bracelets et chargeurs" : "Watch straps, watch chargers", icon: Watch },
                    { id: "accessories", label: t.accessories, desc: language === "ar" ? "سماعات، بنوك طاقة، كابلات" : language === "fr" ? "Écouteurs, Power banks, Type-C" : "Buds, Power banks, Type-C", icon: Headphones },
                  ].map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <div
                        key={cat.id}
                        onClick={() => { setFilterCategory(cat.id); setActiveView("shop"); }}
                        className="group rounded-2xl border border-gray-100 dark:border-neutral-800 bg-white dark:bg-neutral-850 p-5 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all shadow-sm hover:shadow-md cursor-pointer flex flex-col gap-3"
                      >
                        <div className="rounded-xl bg-neutral-900 dark:bg-neutral-800 p-3 text-white w-fit group-hover:bg-emerald-500 group-hover:text-neutral-950 transition-colors">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-neutral-900 dark:text-neutral-100 uppercase tracking-wide">{cat.label}</h4>
                          <p className="text-[10px] text-neutral-400 mt-1">{cat.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Premium Brand Grid Showcase */}
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
                <div className="text-center space-y-1.5">
                  <h2 className="text-lg font-black text-neutral-950 dark:text-neutral-50">
                    {language === "ar" ? "الماركات العالمية الرسمية" : language === "fr" ? "Marques Mondiales Officielles" : "Official Global Brands"}
                  </h2>
                  <p className="text-xs text-neutral-400">
                    {language === "ar" ? "شركاء الإلكترونيات الفاخرة والحوسبة عالية الأداء." : language === "fr" ? "Partenaires officiels pour l'informatique et l'électronique de pointe." : "Authorized showroom partners for high-performance computing & luxury devices."}
                  </p>
                </div>

                <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                  {[
                    { id: "apple", name: "Apple", desc: "Flagship iOS & Macs" },
                    { id: "samsung", name: "Samsung", desc: "AMOLED & Smart Tech" },
                    { id: "asus", name: "ASUS / ROG", desc: "Ultimate PC Hardware" },
                    { id: "sony", name: "Sony / Bose", desc: "Audiophile Sound" },
                    { id: "nvidia", name: "NVIDIA / AMD", desc: "Next-Gen Graphics" },
                    { id: "garmin", name: "Garmin", desc: "Multisport Wearables" }
                  ].map((brand) => (
                    <div
                      key={brand.id}
                      onClick={() => { setFilterBrand(brand.id); setActiveView("shop"); }}
                      className="group rounded-2xl border border-gray-100 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-4 text-center cursor-pointer hover:border-emerald-500 hover:shadow-lg dark:hover:shadow-neutral-900/30 transition-all duration-300"
                    >
                      <div className="font-extrabold text-sm text-neutral-900 dark:text-neutral-100 tracking-wider group-hover:text-emerald-500 transition-colors uppercase">
                        {brand.name}
                      </div>
                      <p className="text-[9px] text-neutral-400 dark:text-neutral-500 mt-1">{brand.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Animated Stats Section */}
              <div className="bg-neutral-50 dark:bg-neutral-950/40 py-10 border-y border-gray-100 dark:border-neutral-900">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
                  {[
                    { label: t.happyCustomers, value: "1,500+" },
                    { label: t.productsSold, value: "3,200+" },
                    { label: t.satisfactionRate, value: "99.4%" }
                  ].map((stat, index) => (
                    <div key={index} className="space-y-1">
                      <div className="text-3xl font-black text-emerald-500 tracking-tight font-mono">
                        {stat.value}
                      </div>
                      <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Featured Showroom Devices Grid */}
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
                <div className="flex items-end justify-between border-b border-gray-100 dark:border-neutral-800 pb-3">
                  <div>
                    <h2 className="text-lg font-black text-neutral-950 dark:text-neutral-50">{t.relatedProducts}</h2>
                    <p className="text-xs text-neutral-400">
                      {language === "ar" ? "المخزون المادي جاهز للفاتورة السريعة والاستلام." : language === "fr" ? "Inventaire physique prêt pour retrait ou livraison rapide." : "Physical inventory ready for quick invoice & courier pickup."}
                    </p>
                  </div>
                  <button onClick={() => { setFilterCategory("all"); setActiveView("shop"); }} className="text-xs font-bold text-emerald-600 hover:underline">
                    {t.backToShop}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {db.products.slice(0, 4).map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      onAddToCart={handleAddToCart}
                      onAddToWishlist={handleAddToWishlist}
                      isWishlisted={wishlist.some(item => item.id === p.id)}
                      onSelectCompare={handleSelectCompare}
                      isCompared={comparedProducts.some(item => item.id === p.id)}
                      onOrderWhatsApp={handleOrderWhatsAppSingle}
                      onViewDetails={(prod) => { setSelectedProduct(prod); setActiveView("shop"); }}
                      language={language}
                    />
                  ))}
                </div>
              </div>

              {/* Showroom Experience Details Section */}
              <div className="bg-neutral-900 dark:bg-neutral-950 text-white py-14">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-2">
                    <h4 className="font-black text-sm uppercase tracking-wider text-emerald-400">
                      {language === "ar" ? "📍 معرض المدية، الجزائر" : language === "fr" ? "📍 SHOWROOM DE MÉDÉA, ALGÉRIE" : "📍 MÉDÉA, ALGERIA SHOWROOM"}
                    </h4>
                    <p className="text-xs text-neutral-300">
                      {language === "ar" 
                        ? "جرب منتجات Apple و Samsung و Asus الفاخرة في متجرنا الحديث. استلم الطلبات خلال ساعتين أو اختر التوصيل للمنزل." 
                        : language === "fr" 
                        ? "Découvrez les produits haut de gamme Apple, Samsung et Asus dans notre showroom moderne à Médéa. Retrait sur place ou livraison à domicile." 
                        : "Experience premium Apple, Samsung, and Asus products in our state-of-the-art store in Médéa. Pick up orders within 2 hours or choose home delivery."}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-black text-sm uppercase tracking-wider text-emerald-400">
                      {language === "ar" ? "💬 مزامنة طلبات واتساب" : language === "fr" ? "💬 SYNC COMMANDE WHATSAPP" : "💬 WHATSAPP ORDER SYNC"}
                    </h4>
                    <p className="text-xs text-neutral-300">
                      {language === "ar" 
                        ? "بمجرد حفظ طلبك في قاعدة بياناتنا، نقوم تلقائيًا بإنشاء بيان شراء منسق وتوجيهك إلى واتساب للتأكيد الفوري." 
                        : language === "fr" 
                        ? "Une fois votre commande enregistrée, nous générons automatiquement un manifeste d'achat formaté et vous redirigeons vers WhatsApp." 
                        : "Once your order is saved into our database, we automatically generate a highly formatted purchase manifest and redirect you to WhatsApp for immediate fulfillment."}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-black text-sm uppercase tracking-wider text-emerald-400">
                      {language === "ar" ? "🛡️ نظام التوصيل الآمن" : language === "fr" ? "🛡️ LIVRAISON SÉCURISÉE" : "🛡️ SECURE COURIER SYSTEM"}
                    </h4>
                    <p className="text-xs text-neutral-300">
                      {language === "ar" 
                        ? "يتم التعامل مع جميع عمليات التسليم بأمان مع دعم الدفع عند الاستلام في المدية والولايات المجاورة. يسري الضمان الكامل." 
                        : language === "fr" 
                        ? "Toutes les livraisons sont sécurisées. Le paiement à la livraison est disponible. Toutes les garanties officielles des marques s'appliquent." 
                        : "All deliveries are handled securely. Cash on Delivery is supported in Médéa and nearby regions. Full official brand warranties apply."}
                    </p>
                  </div>
                </div>
              </div>

            </motion.div>
          )}

          {/* VIEW: SHOP & DETAILED CATALOG */}
          {activeView === "shop" && (
            <motion.div
              key="shop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10"
            >
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                
                {/* Left Side Filters Column */}
                <div className="lg:col-span-1 space-y-6">
                  <div className="rounded-2xl border border-gray-100 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-5 shadow-sm space-y-6">
                    <div className="flex items-center justify-between border-b border-gray-100 dark:border-neutral-900 pb-3">
                      <h3 className="font-black text-xs uppercase tracking-wider text-neutral-950 dark:text-neutral-100">Catalog Filters</h3>
                      <button
                        onClick={() => {
                          setFilterCategory("all");
                          setFilterBrand("all");
                          setFilterPriceMax(3000);
                          setSortOption("popular");
                          setSearchQuery("");
                        }}
                        className="text-[10px] text-neutral-400 hover:text-black dark:hover:text-white hover:underline"
                      >
                        Reset
                      </button>
                    </div>

                    {/* Department Category Filter */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">Category</label>
                      <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900 p-2.5 text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none"
                      >
                        <option value="all" className="dark:bg-neutral-950">All Departments</option>
                        {db.categories.map(c => (
                          <option key={c.id} value={c.id} className="dark:bg-neutral-950">{c.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Brand Manufacturer Filter */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">Brand Manufacturer</label>
                      <select
                        value={filterBrand}
                        onChange={(e) => setFilterBrand(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900 p-2.5 text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none"
                      >
                        <option value="all" className="dark:bg-neutral-950">All Manufacturers</option>
                        {db.brands.map(b => (
                          <option key={b.id} value={b.id} className="dark:bg-neutral-950">{b.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Price Range max */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-bold text-neutral-400 uppercase">
                        <span>Max Price</span>
                        <span className="text-neutral-900 dark:text-neutral-100">${filterPriceMax}</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="3000"
                        step="50"
                        value={filterPriceMax}
                        onChange={(e) => setFilterPriceMax(parseInt(e.target.value))}
                        className="w-full accent-neutral-900 dark:accent-neutral-100"
                      />
                    </div>

                    {/* Sorting options */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">Sort By</label>
                      <select
                        value={sortOption}
                        onChange={(e) => setSortOption(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900 p-2.5 text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none"
                      >
                        <option value="popular" className="dark:bg-neutral-950">Popularity (Most Reviewed)</option>
                        <option value="price-low" className="dark:bg-neutral-950">Price: Low to High</option>
                        <option value="price-high" className="dark:bg-neutral-950">Price: High to Low</option>
                        <option value="rating" className="dark:bg-neutral-950">Rating (Highest Star)</option>
                      </select>
                    </div>

                  </div>
                </div>

                {/* Right Side Grid Column */}
                <div className="lg:col-span-3 space-y-6">
                  
                  {/* Results summary header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-4">
                    <div>
                      <h2 className="text-lg font-black text-neutral-950">Available Hardware Showroom</h2>
                      <p className="text-xs text-neutral-400">Showing {filteredCatalog.length} premium electronics item matches</p>
                    </div>
                  </div>

                  {/* Products Grid */}
                  {filteredCatalog.length === 0 ? (
                    <div className="text-center py-24 rounded-2xl border border-dashed border-gray-200 bg-white p-6 space-y-2">
                      <Info className="h-8 w-8 text-neutral-300 mx-auto" />
                      <p className="text-sm font-bold text-neutral-900">No hardware fits your exact search filters.</p>
                      <p className="text-xs text-neutral-400">Try adjusting your category selectors or maximum price slider.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredCatalog.map((p) => (
                        <ProductCard
                          key={p.id}
                          product={p}
                          onAddToCart={handleAddToCart}
                          onAddToWishlist={handleAddToWishlist}
                          isWishlisted={wishlist.some(item => item.id === p.id)}
                          onSelectCompare={handleSelectCompare}
                          isCompared={comparedProducts.some(item => item.id === p.id)}
                          onOrderWhatsApp={handleOrderWhatsAppSingle}
                          onViewDetails={(prod) => setSelectedProduct(prod)}
                          language={language}
                        />
                      ))}
                    </div>
                  )}

                </div>

              </div>

              {selectedProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                  <div className="w-full max-w-4xl rounded-3xl border border-gray-100 dark:border-neutral-900 bg-white dark:bg-neutral-950 p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto relative">
                    
                    <button
                      onClick={() => setSelectedProduct(null)}
                      className="absolute top-4 right-4 rounded-full bg-neutral-100 dark:bg-neutral-900 p-2 text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition"
                    >
                      <X className="h-5 w-5" />
                    </button>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                      
                      {/* Left side image */}
                      <div className="space-y-4">
                        <div className="rounded-2xl bg-neutral-50 dark:bg-neutral-900 p-2 border border-gray-100 dark:border-neutral-850 aspect-square flex items-center justify-center">
                          <img
                            src={selectedProduct.images[0]}
                            alt={selectedProduct.name}
                            className="max-h-96 object-cover rounded-xl"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="rounded bg-emerald-50 dark:bg-emerald-950/25 px-2.5 py-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/35 uppercase">
                            Official {selectedProduct.warranty} Included
                          </div>
                        </div>
                      </div>

                      {/* Right side inspect stats */}
                      <div className="space-y-5">
                        <div>
                          <span className="text-[10px] font-mono text-gray-400 dark:text-neutral-500 uppercase">{selectedProduct.sku}</span>
                          <h2 className="text-xl font-extrabold text-neutral-900 dark:text-neutral-55 mt-0.5">{selectedProduct.name}</h2>
                          
                          <div className="flex items-center gap-1.5 mt-2 text-xs">
                            <div className="flex text-amber-400">
                              <Star className="h-4 w-4 fill-current" />
                              <span className="font-bold ml-1 text-neutral-800 dark:text-neutral-200">{selectedProduct.rating}</span>
                            </div>
                            <span className="text-gray-400 dark:text-neutral-500">({selectedProduct.reviewCount} reviews)</span>
                          </div>
                        </div>

                        <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed bg-neutral-50 dark:bg-neutral-900/40 p-4 rounded-xl border border-gray-100 dark:border-neutral-900 italic">
                          "{selectedProduct.description}"
                        </p>

                        {/* Specs detailed table */}
                        <div className="space-y-2">
                          <h4 className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wide">Detailed Specifications</h4>
                          <div className="border border-gray-100 dark:border-neutral-900 rounded-xl divide-y divide-gray-100 dark:divide-neutral-900 text-xs font-mono">
                            {Object.entries(selectedProduct.specifications || {}).map(([key, val]) => (
                              <div key={key} className="flex p-2.5">
                                <span className="w-1/3 font-bold text-neutral-500 dark:text-neutral-400 capitalize">{key.replace(/_/g, " ")}</span>
                                <span className="w-2/3 text-neutral-850 dark:text-neutral-200">{val}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Order & Cart buttons */}
                        <div className="flex flex-col gap-2 pt-2">
                          <div className="flex items-baseline gap-3 mb-2">
                            <span className="text-2xl font-black text-neutral-900 dark:text-white">
                              ${(selectedProduct.discountPrice || selectedProduct.price).toFixed(2)}
                            </span>
                            {selectedProduct.discountPrice && (
                              <span className="text-sm text-gray-400 line-through">
                                ${selectedProduct.price.toFixed(2)}
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <button
                              onClick={() => { handleAddToCart(selectedProduct); setSelectedProduct(null); }}
                              className="w-full bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-neutral-100 dark:text-neutral-950 dark:hover:bg-neutral-200 py-3 rounded-xl text-xs font-bold transition shadow"
                            >
                              Add to Showroom Cart
                            </button>
                            <button
                              onClick={() => handleOrderWhatsAppSingle(selectedProduct)}
                              className="w-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/30 py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                            >
                              <MessageSquare className="h-4 w-4 text-emerald-600 dark:text-emerald-400 fill-current" />
                              Order via WhatsApp
                            </button>
                          </div>
                        </div>

                      </div>

                    </div>

                    {/* Detailed Inspect Reviews section */}
                    <div className="border-t border-gray-100 dark:border-neutral-900 pt-6 space-y-4">
                      <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-900 dark:text-neutral-100">Verified Showroom Reviews</h3>
                      
                      {/* Review form */}
                      <form onSubmit={handleSubmitReview} className="bg-neutral-50 dark:bg-neutral-900/40 p-4 rounded-2xl border border-gray-100 dark:border-neutral-900 space-y-3">
                        <p className="text-xs font-bold text-neutral-900 dark:text-neutral-150">Share your showroom device experience:</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">Rating:</span>
                          <select
                            value={reviewRating}
                            onChange={(e) => setReviewRating(parseInt(e.target.value))}
                            className="rounded border border-gray-200 dark:border-neutral-850 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 p-1 text-xs"
                          >
                            <option value="5" className="dark:bg-neutral-950">⭐⭐⭐⭐⭐ 5 Stars</option>
                            <option value="4" className="dark:bg-neutral-950">⭐⭐⭐⭐ 4 Stars</option>
                            <option value="3" className="dark:bg-neutral-950">⭐⭐⭐ 3 Stars</option>
                            <option value="2" className="dark:bg-neutral-950">⭐⭐ 2 Stars</option>
                            <option value="1" className="dark:bg-neutral-950">⭐ 1 Star</option>
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            required
                            placeholder="Type hardware feedback or performance notes..."
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                            className="flex-1 rounded-xl border border-gray-200 dark:border-neutral-800 py-2 px-3 text-xs bg-white dark:bg-neutral-900 text-neutral-950 dark:text-white focus:outline-none"
                          />
                          <button type="submit" className="rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-neutral-100 dark:text-neutral-950 dark:hover:bg-neutral-200 px-4 py-2 text-xs font-bold">
                            Submit Review
                          </button>
                        </div>
                      </form>

                      {/* Render Reviews */}
                      <div className="space-y-3.5 max-h-48 overflow-y-auto">
                        {db.reviews.filter(r => r.productId === selectedProduct.id).length === 0 ? (
                          <p className="text-xs text-neutral-400 dark:text-neutral-500 italic">No reviews yet. Be the first to verify this product!</p>
                        ) : (
                          db.reviews.filter(r => r.productId === selectedProduct.id).map((r) => (
                            <div key={r.id} className="border-b border-gray-100 dark:border-neutral-900 pb-2 last:border-0">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-xs text-neutral-900 dark:text-neutral-100">{r.userName}</span>
                                <span className="text-amber-400 font-mono">{"⭐".repeat(r.rating)}</span>
                              </div>
                              <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1 italic">"{r.comment}"</p>
                            </div>
                          ))
                        )}
                      </div>

                    </div>

                  </div>
                </div>
              )}

            </motion.div>
          )}

          {/* VIEW: CART OVERVIEW */}
          {activeView === "cart" && (
            <motion.div
              key="cart"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left side cart items list */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <h2 className="text-xl font-extrabold text-neutral-950">Showroom Cart ({cart.length} items)</h2>
                    {cart.length > 0 && (
                      <button
                        onClick={() => setCart([])}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Clear Cart
                      </button>
                    )}
                  </div>

                  {cart.length === 0 ? (
                    <div className="text-center py-20 rounded-2xl border border-dashed border-gray-200 bg-white p-6 space-y-4">
                      <ShoppingBag className="h-10 w-10 text-neutral-300 mx-auto" />
                      <p className="text-sm font-bold text-neutral-900">Your shopping cart is currently empty.</p>
                      <button
                        onClick={() => { setFilterCategory("all"); setActiveView("shop"); }}
                        className="rounded-xl bg-neutral-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-neutral-800 transition"
                      >
                        Browse Showroom Catalog
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {cart.map((item) => {
                        const price = item.product.discountPrice || item.product.price;
                        return (
                          <div
                            key={item.product.id}
                            className="rounded-2xl border border-gray-100 bg-white p-4 flex items-center justify-between gap-4 shadow-sm hover:shadow-md transition"
                          >
                            <img
                              src={item.product.images[0]}
                              alt={item.product.name}
                              className="h-16 w-16 object-cover rounded-xl border bg-gray-50"
                              referrerPolicy="no-referrer"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-xs text-neutral-900 truncate">{item.product.name}</h4>
                              <p className="text-[10px] text-gray-400 font-mono mt-0.5">{item.product.sku}</p>
                              <p className="text-xs font-bold text-neutral-950 mt-1">${price.toFixed(2)}</p>
                            </div>

                            {/* Quantity modifier */}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleUpdateCartQuantity(item.product.id, item.quantity - 1)}
                                className="rounded bg-neutral-100 h-6 w-6 text-xs hover:bg-neutral-200 transition"
                              >
                                -
                              </button>
                              <span className="text-xs font-mono font-bold w-4 text-center">{item.quantity}</span>
                              <button
                                onClick={() => handleUpdateCartQuantity(item.product.id, item.quantity + 1)}
                                className="rounded bg-neutral-100 h-6 w-6 text-xs hover:bg-neutral-200 transition"
                              >
                                +
                              </button>
                            </div>

                            <button
                              onClick={() => handleRemoveFromCart(item.product.id)}
                              className="text-gray-400 hover:text-red-600 transition"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                </div>

                {/* Right side summary checkout card */}
                <div className="space-y-6">
                  <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-6">
                    <h3 className="font-black text-xs uppercase tracking-wider text-neutral-950 border-b border-gray-100 pb-3">Financial Order Summary</h3>
                    
                    <div className="space-y-2.5 text-xs">
                      <div className="flex justify-between text-neutral-500">
                        <span>Cart Subtotal</span>
                        <span className="font-bold text-neutral-900">
                          ${cart.reduce((sum, i) => sum + (i.product.discountPrice || i.product.price) * i.quantity, 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-neutral-500">
                        <span>Courier Showroom Delivery</span>
                        <span className="font-bold text-neutral-900">${db.websiteSettings.deliveryCost.toFixed(2)}</span>
                      </div>
                      <div className="border-t border-gray-100 pt-3 flex justify-between font-black text-sm text-neutral-950">
                        <span>Estimated Total</span>
                        <span>
                          ${(cart.reduce((sum, i) => sum + (i.product.discountPrice || i.product.price) * i.quantity, 0) + db.websiteSettings.deliveryCost).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {cart.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <button
                          onClick={() => setActiveView("checkout")}
                          className="w-full bg-neutral-900 text-white hover:bg-neutral-800 py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 shadow"
                        >
                          Proceed to Showroom Checkout
                          <ArrowRight className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={handleOrderWhatsAppCart}
                          className="w-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                        >
                          <MessageSquare className="h-4 w-4 text-emerald-600 fill-current" />
                          Order Cart via WhatsApp
                        </button>
                      </div>
                    )}
                  </div>

                  {/* AI Product Adviser Panel */}
                  {cart.length > 0 && (
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-6 space-y-4">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 uppercase tracking-wider">
                        <Sparkles className="h-4 w-4 text-emerald-600 animate-pulse" />
                        AI Product Advisor Recommendations
                      </div>
                      
                      {aiLoading ? (
                        <div className="text-center py-4 text-xs text-emerald-600 font-mono animate-pulse">
                          Consulting Gemini AI Advisor...
                        </div>
                      ) : (
                        <div className="space-y-4 text-xs">
                          <p className="text-[11px] leading-relaxed text-emerald-700 italic bg-white p-3 rounded-xl border border-emerald-100">
                            "{aiAnalysis || "Complete your tech bundle with these matching options."}"
                          </p>

                          <div className="space-y-2.5">
                            {aiRecommendations.map((rec) => (
                              <div key={rec.id} className="flex items-center justify-between border-b border-emerald-100/50 pb-2 last:border-0 last:pb-0">
                                <div>
                                  <p className="font-bold text-neutral-900">{rec.name}</p>
                                  <p className="text-[10px] text-emerald-600">${rec.price}</p>
                                </div>
                                <button
                                  onClick={() => handleAddToCart(rec)}
                                  className="rounded-lg bg-neutral-900 px-2.5 py-1 text-[10px] text-white hover:bg-neutral-800"
                                >
                                  Add
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                </div>

              </div>
            </motion.div>
          )}

          {/* VIEW: SECURE CHECKOUT PAGE */}
          {activeView === "checkout" && (
            <motion.div
              key="checkout"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                
                {/* Left checkout billing fields form */}
                <form onSubmit={handlePlaceOrder} className="md:col-span-2 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-6">
                  <h2 className="text-lg font-black text-neutral-950 border-b border-gray-100 pb-3">Courier Showroom Delivery Details</h2>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-400 uppercase">Your Name</label>
                      <input
                        type="text"
                        required
                        value={checkoutName}
                        onChange={(e) => setCheckoutName(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-gray-200 py-2.5 px-3"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-400 uppercase">Contact Phone Number</label>
                      <input
                        type="text"
                        required
                        placeholder="Include country code (e.g. +213XXXXXXXXX)"
                        value={checkoutPhone}
                        onChange={(e) => setCheckoutPhone(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-gray-200 py-2.5 px-3 font-mono"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-neutral-400 uppercase">Delivery Address</label>
                      <input
                        type="text"
                        required
                        value={checkoutAddress}
                        onChange={(e) => setCheckoutAddress(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-gray-200 py-2.5 px-3"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-400 uppercase">City</label>
                      <select
                        value={checkoutCity}
                        onChange={(e) => setCheckoutCity(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-gray-200 py-2.5 px-3"
                      >
                        <option value="Médéa">Médéa</option>
                        <option value="Algiers">Algiers</option>
                        <option value="Oran">Oran</option>
                        <option value="Constantine">Constantine</option>
                        <option value="Setif">Sétif</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-neutral-400 uppercase">Payment Option</label>
                      <select
                        value={checkoutPayment}
                        onChange={(e) => setCheckoutPayment(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-gray-200 py-2.5 px-3 text-xs"
                      >
                        <option value="Cash on Delivery">Cash on Delivery (COD)</option>
                        <option value="Bank Transfer">Bank Wire Transfer</option>
                        <option value="Credit Card">Secure Credit Card checkout</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-neutral-400 uppercase">Customer Order Notes / Specifications</label>
                      <textarea
                        rows={3}
                        placeholder="Add special delivery instructions or gift wrapping requests..."
                        value={checkoutNotes}
                        onChange={(e) => setCheckoutNotes(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-gray-200 py-2.5 px-3"
                      />
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-4 text-right">
                    <button
                      type="submit"
                      className="rounded-xl bg-neutral-900 px-6 py-3 text-xs font-bold text-white hover:bg-neutral-800 transition shadow"
                    >
                      Place Order & Sync with WhatsApp
                    </button>
                  </div>
                </form>

                {/* Right summaries column with coupon code */}
                <div className="space-y-6">
                  
                  {/* Coupon card */}
                  <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
                    <h3 className="font-bold text-xs uppercase text-neutral-950">Add Promo Coupon</h3>
                    <form onSubmit={handleApplyCoupon} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="E.g. ELECTRA10"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                        className="flex-1 rounded-xl border border-gray-200 py-2 px-3 text-xs uppercase font-mono focus:outline-none"
                      />
                      <button type="submit" className="rounded-xl bg-neutral-900 text-white px-3 py-2 text-xs font-bold hover:bg-neutral-800">
                        Apply
                      </button>
                    </form>
                    {appliedCoupon && (
                      <p className="text-[10px] text-emerald-600 font-bold">
                        Coupon {appliedCoupon.code} successfully applied! Saving: {appliedCoupon.discountType === "percentage" ? `${appliedCoupon.discountValue}%` : `$${appliedCoupon.discountValue}`}
                      </p>
                    )}
                    {couponError && <p className="text-[10px] text-red-500 font-bold">{couponError}</p>}
                  </div>

                  {/* Summary receipt review */}
                  <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4 text-xs">
                    <h3 className="font-black text-xs uppercase text-neutral-950 border-b pb-2">Purchase Review</h3>
                    
                    <div className="space-y-3">
                      {cart.map((item) => (
                        <div key={item.product.id} className="flex justify-between">
                          <span className="text-gray-500 truncate max-w-[150px]">{item.product.name} (x{item.quantity})</span>
                          <span className="font-bold text-neutral-900">
                            ${((item.product.discountPrice || item.product.price) * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-gray-100 pt-3 space-y-2 text-xs">
                      <div className="flex justify-between text-neutral-500">
                        <span>Subtotal</span>
                        <span className="font-bold text-neutral-900">
                          ${cart.reduce((sum, i) => sum + (i.product.discountPrice || i.product.price) * i.quantity, 0).toFixed(2)}
                        </span>
                      </div>
                      {appliedCoupon && (
                        <div className="flex justify-between text-emerald-600">
                          <span>Coupon Discount</span>
                          <span>
                            -${(() => {
                              const subtotal = cart.reduce((sum, i) => sum + (i.product.discountPrice || i.product.price) * i.quantity, 0);
                              return appliedCoupon.discountType === "percentage" 
                                ? ((subtotal * appliedCoupon.discountValue) / 100).toFixed(2)
                                : appliedCoupon.discountValue.toFixed(2);
                            })()}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between text-neutral-500">
                        <span>Courier Shipping</span>
                        <span className="font-bold text-neutral-900">${db.websiteSettings.deliveryCost.toFixed(2)}</span>
                      </div>
                      <div className="border-t pt-3 flex justify-between font-black text-sm text-neutral-950">
                        <span>Total Checkout Value</span>
                        <span>
                          ${(() => {
                            const subtotal = cart.reduce((sum, i) => sum + (i.product.discountPrice || i.product.price) * i.quantity, 0);
                            let discountAmt = 0;
                            if (appliedCoupon) {
                              discountAmt = appliedCoupon.discountType === "percentage" 
                                ? (subtotal * appliedCoupon.discountValue) / 100 
                                : appliedCoupon.discountValue;
                            }
                            return (subtotal - discountAmt + db.websiteSettings.deliveryCost).toFixed(2);
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            </motion.div>
          )}

          {/* VIEW: PDF PRINTABLE INVOICE PREVIEW */}
          {activeView === "invoice" && recentCompletedOrder && (
            <motion.div
              key="invoice"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12"
            >
              <div className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-2xl space-y-6" id="printable-invoice">
                
                {/* Invoice Top header */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-gray-100 pb-6">
                  <div>
                    <h1 className="text-2xl font-black tracking-widest text-neutral-900">ELECTRA SHOWROOM</h1>
                    <p className="text-xs text-neutral-500 mt-1">Rue de la Palestine, Médéa, Algeria</p>
                    <p className="text-xs text-neutral-500">Phone: {db.websiteSettings.storePhone}</p>
                  </div>
                  <div className="text-right sm:text-right">
                    <span className="rounded bg-emerald-100 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-800 uppercase">
                      Order Saved Successfully
                    </span>
                    <p className="text-xs text-neutral-500 mt-3 font-mono">Invoice Number: {recentCompletedOrder.id}</p>
                    <p className="text-xs text-neutral-500 font-mono">Date: {new Date(recentCompletedOrder.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Billing details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                  <div>
                    <h3 className="font-black uppercase tracking-wide text-neutral-400 text-[10px] mb-2">Billed To Customer</h3>
                    <p className="font-bold text-neutral-900 text-sm">{recentCompletedOrder.customerName}</p>
                    <p className="text-neutral-500 mt-0.5">{recentCompletedOrder.email}</p>
                    <p className="text-neutral-500">{recentCompletedOrder.phone}</p>
                  </div>
                  <div>
                    <h3 className="font-black uppercase tracking-wide text-neutral-400 text-[10px] mb-2">Shipping Information</h3>
                    <p className="font-bold text-neutral-900">{recentCompletedOrder.address}</p>
                    <p className="text-neutral-500 mt-0.5">City: {recentCompletedOrder.city}</p>
                    <p className="text-neutral-500">Logistics Method: Courier Express</p>
                  </div>
                </div>

                {/* Items detailed manifest */}
                <div className="border-t border-b border-gray-100 py-4">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-400 font-bold text-[10px] uppercase pb-2">
                        <th className="pb-2">Hardware Description</th>
                        <th className="pb-2 text-center">Qty</th>
                        <th className="pb-2 text-right">Unit Price</th>
                        <th className="pb-2 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {recentCompletedOrder.items.map((it) => (
                        <tr key={it.id}>
                          <td className="py-2.5 font-sans font-bold text-neutral-900">{it.name}</td>
                          <td className="py-2.5 text-center font-bold">{it.quantity}</td>
                          <td className="py-2.5 text-right">${it.price.toFixed(2)}</td>
                          <td className="py-2.5 text-right font-black">${(it.price * it.quantity).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Subtotals & total invoices */}
                <div className="flex justify-end text-xs font-mono">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>${recentCompletedOrder.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Courier Delivery</span>
                      <span>${recentCompletedOrder.deliveryCost.toFixed(2)}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-2 flex justify-between font-black text-sm text-neutral-950">
                      <span>Total Paid</span>
                      <span>${recentCompletedOrder.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Payment info notes */}
                <div className="rounded-xl bg-gray-50 border p-4 text-[11px] text-neutral-500 leading-relaxed">
                  <span className="font-bold text-neutral-800">Order Processing Workflow Notes:</span> <br />
                  This invoice is automatically saved into Electra's database. Your physical devices are secured. Please present this order sheet to our courier upon cash delivery.
                </div>

                {/* Print button & Direct Whatsapp fallback trigger */}
                <div className="flex flex-wrap gap-2.5 pt-4 justify-end no-print">
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-5 py-3 text-xs font-bold text-gray-600 hover:text-black hover:bg-gray-50 transition"
                  >
                    <Printer className="h-4 w-4" />
                    Print PDF Invoice
                  </button>

                  <button
                    onClick={() => {
                      const waUrl = generateWhatsAppLink(
                        db.websiteSettings.whatsappNumber,
                        db.websiteSettings.storeName,
                        recentCompletedOrder
                      );
                      window.open(waUrl, "_blank");
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-3 text-xs font-bold text-white hover:bg-emerald-500 transition shadow"
                  >
                    <MessageSquare className="h-4 w-4 fill-current text-emerald-200" />
                    Re-Open WhatsApp Link
                  </button>

                  <button
                    onClick={() => setActiveView("home")}
                    className="rounded-xl bg-neutral-900 px-5 py-3 text-xs font-bold text-white hover:bg-neutral-800 transition"
                  >
                    Return to Storefront
                  </button>
                </div>

              </div>
            </motion.div>
          )}

          {/* VIEW: STAFF DASHBOARDS */}
          {activeView === "dashboard" && currentUser && currentUser.role !== Role.CUSTOMER && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <RoleDashboards
                currentRole={currentUser.role}
                db={db}
                onRefreshDB={fetchDB}
                onAddProduct={handleAddProduct}
                onUpdateProduct={handleUpdateProduct}
                onDeleteProduct={handleDeleteProduct}
                onUpdateOrderStatus={handleUpdateOrderStatus}
                onReplyTicket={handleReplyTicket}
                onUpdateSettings={handleUpdateSettings}
                onAddCoupon={handleAddCoupon}
              />
            </motion.div>
          )}

          {/* VIEW: CUSTOMER ACCOUNT PROFILE */}
          {activeView === "profile" && (
            <motion.div
              key="profile"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12 space-y-8 animate-in fade-in"
            >
              {/* Not Logged In Option */}
              {!firebaseUser ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Firebase Auth card */}
                  <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm space-y-6">
                    <div className="space-y-1">
                      <h2 className="text-xl font-black text-neutral-950">
                        {authMode === "signin" ? "Sign In to Electra" : "Create Electra Account"}
                      </h2>
                      <p className="text-xs text-neutral-400">
                        {authMode === "signin" 
                          ? "Enter your credentials to access your persistent hardware showroom dashboard." 
                          : "Register with Email & Password to track orders and earn 100 welcome loyalty points!"}
                      </p>
                    </div>

                    {authError && (
                      <div className="rounded-xl bg-red-50 border border-red-100 p-3.5 text-xs font-semibold text-red-600">
                        {authError}
                      </div>
                    )}

                    <form onSubmit={authMode === "signin" ? handleEmailSignIn : handleEmailSignUp} className="space-y-4 text-xs">
                      {authMode === "signup" && (
                        <div>
                          <label className="block text-[10px] font-bold text-neutral-500 uppercase">Your Name</label>
                          <input
                            type="text"
                            required
                            placeholder="John Doe"
                            value={authName}
                            onChange={(e) => setAuthName(e.target.value)}
                            className="mt-1.5 w-full rounded-xl border border-gray-200 py-2.5 px-3 focus:outline-none focus:border-black"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-[10px] font-bold text-neutral-500 uppercase">Email Address</label>
                        <input
                          type="email"
                          required
                          placeholder="you@example.com"
                          value={authEmail}
                          onChange={(e) => setAuthEmail(e.target.value)}
                          className="mt-1.5 w-full rounded-xl border border-gray-200 py-2.5 px-3 focus:outline-none focus:border-black"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-neutral-500 uppercase">Password</label>
                        <input
                          type="password"
                          required
                          placeholder="••••••••"
                          value={authPassword}
                          onChange={(e) => setAuthPassword(e.target.value)}
                          className="mt-1.5 w-full rounded-xl border border-gray-200 py-2.5 px-3 focus:outline-none focus:border-black"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={authLoading}
                        className="w-full rounded-xl bg-neutral-950 py-3 text-white font-bold hover:bg-neutral-900 transition disabled:opacity-50"
                      >
                        {authLoading ? "Please wait..." : authMode === "signin" ? "Sign In" : "Register & Sign Up"}
                      </button>
                    </form>

                    <div className="relative flex py-2 items-center">
                      <div className="flex-grow border-t border-gray-100"></div>
                      <span className="flex-shrink mx-4 text-neutral-400 text-[10px] uppercase font-bold tracking-wider">or continue with</span>
                      <div className="flex-grow border-t border-gray-100"></div>
                    </div>

                    <button
                      onClick={handleGoogleSignIn}
                      disabled={authLoading}
                      className="w-full flex items-center justify-center gap-2 rounded-xl border border-gray-200 py-3 bg-white hover:bg-gray-50 transition text-xs font-bold text-gray-600"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24">
                        <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l3.227-3.11C18.28 1.845 15.548 1 12.24 1 5.48 1 0 6.48 0 13.2s5.48 12.2 12.24 12.2c7.055 0 11.75-4.965 11.75-11.964 0-.802-.085-1.415-.188-2.15H12.24z"/>
                      </svg>
                      Sign In with Google
                    </button>

                    <p className="text-center text-[11px] text-neutral-500">
                      {authMode === "signin" ? "New to Electra? " : "Already have an account? "}
                      <button
                        onClick={() => setAuthMode(authMode === "signin" ? "signup" : "signin")}
                        className="text-emerald-600 font-bold hover:underline"
                      >
                        {authMode === "signin" ? "Create an account" : "Sign in here"}
                      </button>
                    </p>
                  </div>

                  {/* Demo explanation card */}
                  <div className="rounded-3xl border border-dashed border-gray-200 p-8 space-y-5 flex flex-col justify-center bg-neutral-50/50">
                    <Sparkles className="h-8 w-8 text-amber-500" />
                    <h3 className="font-extrabold text-neutral-900 text-sm">💡 Explore in Demo Mode</h3>
                    <p className="text-xs text-neutral-500 leading-relaxed">
                      You are currently exploring the flagship showroom using the preset role-switching system. 
                      You are logged in as <span className="font-bold text-neutral-800">{currentUser?.name || "Guest"}</span>.
                    </p>
                    <p className="text-xs text-neutral-500 leading-relaxed">
                      To test real-time orders, secure admin route protection, customized profiles, and persistent customer point accumulation, 
                      please log in with a persistent email account or using Google Sign-In.
                    </p>
                  </div>
                </div>
              ) : (
                /* Authenticated User Profile view */
                currentUser && (
                  <div className="space-y-8 animate-in fade-in">
                    <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold text-lg">
                          {currentUser.name.charAt(0)}
                        </div>
                        <div>
                          <h2 className="text-base font-black text-neutral-950">{currentUser.name}</h2>
                          <p className="text-xs text-neutral-400">{currentUser.email}</p>
                          <span className="mt-1 inline-block rounded bg-neutral-900 text-[9px] font-bold text-emerald-400 px-1.5 py-0.2 uppercase tracking-wide font-mono">
                            {currentUser.role} Account
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {db && db.websiteSettings.enableLoyaltyPoints && (
                          <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-center">
                            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wide">Your Loyalty Points</span>
                            <p className="text-xl font-black text-amber-700 mt-1">{currentUser.loyaltyPoints || 0} Points</p>
                            <p className="text-[9px] text-amber-500 mt-0.5">Seed bonus included!</p>
                          </div>
                        )}

                        <button
                          onClick={handleSignOut}
                          className="rounded-xl border border-gray-200 bg-white hover:bg-neutral-100 px-4 py-2.5 text-xs font-bold text-gray-600 transition"
                        >
                          Sign Out
                        </button>
                      </div>
                    </div>

                    {/* Order History */}
                    <div className="space-y-4">
                      <h3 className="font-extrabold text-neutral-900 text-base">Your E-Commerce Purchase History</h3>
                      {db && db.orders.filter(o => o.email === currentUser.email).length === 0 ? (
                        <p className="text-xs text-neutral-400 italic">You have not placed any orders yet.</p>
                      ) : (
                        <div className="space-y-4">
                          {db && db.orders.filter(o => o.email === currentUser.email).map((o) => (
                            <div key={o.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-3.5">
                              <div className="flex items-center justify-between border-b pb-2 text-xs">
                                <span className="font-mono font-bold text-neutral-950">{o.id}</span>
                                <div className="flex gap-2">
                                  <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase ${
                                    o.shippingStatus === "Delivered" ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-amber-50 text-amber-600"
                                  }`}>
                                    Shipping: {o.shippingStatus}
                                  </span>
                                  <span className="text-neutral-400">{new Date(o.createdAt).toLocaleDateString()}</span>
                                </div>
                              </div>

                              <div className="text-xs space-y-2">
                                <p className="font-bold text-neutral-900">Ordered Hardware:</p>
                                <ul className="list-disc list-inside space-y-1 text-neutral-600 font-mono text-[11px]">
                                  {o.items.map(it => (
                                    <li key={it.id}>{it.name} (x{it.quantity}) - ${it.price}</li>
                                  ))}
                                </ul>
                                <div className="border-t pt-2.5 flex justify-between font-bold text-neutral-900 text-xs">
                                  <span>Billed Address: {o.address}, {o.city}</span>
                                  <span>Total paid: ${o.total.toFixed(2)}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )
              )}
            </motion.div>
          )}

          {/* VIEW: FAQ SECTION */}
          {activeView === "faq" && (
            <motion.div
              key="faq"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12 space-y-8"
            >
              <div className="text-center space-y-1">
                <h2 className="text-2xl font-extrabold text-neutral-900">Showroom FAQ & Guide</h2>
                <p className="text-xs text-neutral-400">Everything you need to know about Médéa showroom, delivery timelines, and hardware warranties.</p>
              </div>

              <div className="space-y-4">
                {[
                  { q: "Where is the physical showroom located?", a: `We are located at ${db.websiteSettings.storeAddress}. Come explore physical Apple, Asus computing rigs, and accessories.` },
                  { q: "How does the WhatsApp direct ordering integration operate?", a: "When you place an order, our Express server saves the purchase safely in our database, locks your hardware stock, generates an invoice ID, and instantly opens WhatsApp on your device with a fully compiled order manifest. You just click send to coordinate quick delivery!" },
                  { q: "What delivery options and pricing are available?", a: "We offer secure courier delivery across all 58 Algerian wilayas. Shipping cost is a flat $10. Most packages arrive within 24 to 48 hours of WhatsApp verification." },
                  { q: "Are the smartphones and computing devices genuine?", a: "Absolutely. All electronic products at Electra are brand-new, official, and are backed by genuine manufacturers' international warranties." },
                  { q: "Can I choose Cash on Delivery?", a: "Yes! We support Cash on Delivery, secure bank wire transfers, and online credit cards so you have total flexibility." },
                ].map((faq, idx) => (
                  <div key={idx} className="rounded-2xl border bg-white p-5 space-y-2 shadow-sm">
                    <h4 className="font-bold text-sm text-neutral-900 flex items-center gap-1.5">
                      <Info className="h-4 w-4 text-emerald-500" />
                      {faq.q}
                    </h4>
                    <p className="text-xs text-neutral-600 leading-relaxed pl-5 italic">"{faq.a}"</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* VIEW: CONTACT PAGE */}
          {activeView === "contact" && (
            <motion.div
              key="contact"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Contact form */}
                <form onSubmit={handleContactSubmit} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4 text-xs">
                  <h2 className="text-lg font-black text-neutral-950">Send Showroom Support Inquiry</h2>
                  <p className="text-xs text-neutral-400">Open a support ticket. Emily Watson's CS team replies within 1 hour.</p>

                  {contactSuccess && (
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-emerald-700 font-bold flex items-center gap-1.5">
                      <CheckCircle className="h-4.5 w-4.5" />
                      Support Ticket successfully submitted!
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase">Your Name</label>
                    <input
                      type="text"
                      required
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-gray-200 py-2.5 px-3"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase">Your Email</label>
                    <input
                      type="email"
                      required
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-gray-200 py-2.5 px-3"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase">Subject</label>
                    <input
                      type="text"
                      required
                      value={contactForm.subject}
                      onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-gray-200 py-2.5 px-3"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase">Message</label>
                    <textarea
                      rows={4}
                      required
                      placeholder="Type details about your smart device specifications or orders..."
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-gray-200 py-2.5 px-3"
                    />
                  </div>

                  <button type="submit" className="rounded-xl bg-neutral-900 py-3 text-white px-5 font-bold hover:bg-neutral-800 shadow">
                    Submit Support Ticket
                  </button>
                </form>

                {/* Showroom visual details */}
                <div className="space-y-6">
                  <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-950">Showroom Direct Contact Coordinates</h3>
                    
                    <ul className="space-y-3.5 text-xs">
                      <li className="flex items-start gap-2.5">
                        <MapPin className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-neutral-900">Flagship Showroom</p>
                          <p className="text-gray-500">{db.websiteSettings.storeAddress}</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <Phone className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-neutral-900">Direct Telephone Desk</p>
                          <p className="text-gray-500">{db.websiteSettings.storePhone}</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <Mail className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-neutral-900">Email Correspondence</p>
                          <p className="text-gray-500">{db.websiteSettings.storeEmail}</p>
                        </div>
                      </li>
                    </ul>
                  </div>

                  {/* Operational instructions */}
                  <div className="rounded-2xl bg-neutral-900 text-white p-6 space-y-3">
                    <h4 className="font-bold text-emerald-400 text-xs uppercase tracking-wider">Enterprise Logistics Information</h4>
                    <p className="text-xs text-neutral-300 leading-relaxed">
                      All physical showroom inquiries, return policies, and hardware warranties can also be verified directly through our dedicated team on WhatsApp.
                    </p>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* VIEW: Wishlist page */}
          {activeView === "wishlist" && (
            <motion.div
              key="wishlist"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-6"
            >
              <h2 className="text-xl font-extrabold text-neutral-950 border-b pb-3">Your Saved Hardware Wishlist</h2>
              
              {wishlist.length === 0 ? (
                <div className="text-center py-20 rounded-2xl border border-dashed border-gray-200 bg-white p-6 space-y-3">
                  <Heart className="h-10 w-10 text-neutral-300 mx-auto" />
                  <p className="text-sm font-bold text-neutral-900">Your wishlist is currently empty.</p>
                  <button
                    onClick={() => { setFilterCategory("all"); setActiveView("shop"); }}
                    className="rounded-xl bg-neutral-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-neutral-800 transition"
                  >
                    Explore Catalog
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {wishlist.map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      onAddToCart={handleAddToCart}
                      onAddToWishlist={handleAddToWishlist}
                      isWishlisted={true}
                      onSelectCompare={handleSelectCompare}
                      isCompared={comparedProducts.some(item => item.id === p.id)}
                      onOrderWhatsApp={handleOrderWhatsAppSingle}
                      onViewDetails={(prod) => { setSelectedProduct(prod); setActiveView("shop"); }}
                      language={language}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Floating Customer Live Chat Box Popup */}
      <div className="fixed bottom-6 right-6 z-40 no-print">
        {chatOpen ? (
          <div className="w-80 h-96 rounded-3xl border border-gray-100 bg-white shadow-2xl overflow-hidden flex flex-col justify-between">
            {/* Header */}
            <div className="bg-neutral-950 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-xs font-bold tracking-wide uppercase">Electra Live Support Desk</span>
              </div>
              <button onClick={() => setChatOpen(false)} className="text-neutral-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Message window */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50 text-[11px] font-sans">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`p-2.5 rounded-xl border ${
                  msg.sender === "user" ? "bg-white text-neutral-900 border-gray-100 ml-8" : "bg-neutral-900 text-white border-neutral-950 mr-8"
                }`}>
                  <p className="font-bold opacity-80 text-[9px] uppercase tracking-wide">
                    {msg.sender === "user" ? "Customer" : "Emily Watson (Advisor)"}
                  </p>
                  <p className="mt-0.5">{msg.text}</p>
                </div>
              ))}
              {chatLoading && <p className="text-[10px] text-neutral-400 animate-pulse font-mono"> Emily is formulating advisor reply...</p>}
            </div>

            {/* Input message form */}
            <form onSubmit={handleSendLiveChatMessage} className="border-t border-gray-100 p-3 flex gap-2">
              <input
                type="text"
                placeholder="Ask about smartwatches, laptops, custom rigs, COD..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 rounded-xl border border-gray-200 py-1.5 px-3 text-xs focus:outline-none"
              />
              <button type="submit" className="rounded-xl bg-neutral-900 text-white p-2">
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        ) : (
          <button
            onClick={() => setChatOpen(true)}
            className="rounded-full bg-neutral-900 hover:bg-neutral-800 text-white p-4 shadow-2xl flex items-center gap-2 font-bold text-xs"
          >
            <MessageSquare className="h-5 w-5 text-emerald-400" />
            <span className="hidden sm:inline">Advisor Chat</span>
          </button>
        )}
      </div>

      {/* Floating Compare Drawer overlay */}
      <ProductCompare
        comparedProducts={comparedProducts}
        onRemove={handleSelectCompare}
        onClear={() => setComparedProducts([])}
        onAddToCart={handleAddToCart}
        language={language}
      />

      {/* Footer component */}
      <Footer onNavigate={(v) => { setActiveView(v); setSearchQuery(""); }} storeSettings={db.websiteSettings} language={language} />
      
    </div>
  );
}
