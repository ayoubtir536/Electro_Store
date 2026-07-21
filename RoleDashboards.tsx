/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase/firebase";
import { 
  Role, Product, Order, Coupon, Notification, AuditLog, 
  SupportTicket, WebsiteSettings 
} from "../types";
import { 
  TrendingUp, DollarSign, Package, Users, ShieldAlert, 
  Check, X, FileSpreadsheet, Download, RefreshCw, Plus, 
  Trash2, Copy, Edit3, Settings, Shield, HardDrive, 
  RotateCcw, Send, CheckCircle, Clock, AlertTriangle, Truck,
  ShieldCheck
} from "lucide-react";

interface RoleDashboardsProps {
  currentRole: Role;
  db: {
    categories: any[];
    subCategories?: any[];
    brands?: any[];
    products: Product[];
    orders: Order[];
    coupons: Coupon[];
    notifications: Notification[];
    auditLogs: AuditLog[];
    supportTickets: SupportTicket[];
    websiteSettings: WebsiteSettings;
    users: any[];
  };
  onRefreshDB: () => void;
  onUpdateProduct: (p: Product) => void;
  onDeleteProduct: (id: string) => void;
  onAddProduct: (p: any) => void;
  onUpdateOrderStatus: (id: string, shippingStatus?: string, paymentStatus?: string) => void;
  onReplyTicket: (id: string, reply: string) => void;
  onUpdateSettings: (settings: WebsiteSettings) => void;
  onAddCoupon: (coupon: Coupon) => void;
}

export default function RoleDashboards({
  currentRole,
  db,
  onRefreshDB,
  onUpdateProduct,
  onDeleteProduct,
  onAddProduct,
  onUpdateOrderStatus,
  onReplyTicket,
  onUpdateSettings,
  onAddCoupon,
}: RoleDashboardsProps) {
  
  // Tabs within Super Admin
  const [activeTab, setActiveTab] = useState<"analytics" | "products" | "orders" | "tickets" | "coupons" | "settings" | "audit" | "database">("analytics");

  // Database JSON raw edit/viewer states
  const [rawJsonText, setRawJsonText] = useState("");
  const [jsonError, setJsonError] = useState("");
  const [isSavingJson, setIsSavingJson] = useState(false);
  const [isResettingDb, setIsResettingDb] = useState(false);

  useEffect(() => {
    if (activeTab === "database") {
      setRawJsonText(JSON.stringify(db, null, 2));
      setJsonError("");
    }
  }, [activeTab, db]);
  
  // Product Form states
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [productForm, setProductForm] = useState({
    name: "",
    sku: "",
    price: "",
    discountPrice: "",
    stock: "",
    minStockAlert: "5",
    categoryId: "smartphones",
    brandId: "apple",
    warranty: "1 Year General Warranty",
    description: "",
    specifications: "", // Will be parsed as JSON or key:value lines
    images: [] as string[],
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { ref, uploadBytesResumable, getDownloadURL } = await import("firebase/storage");
      const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setUploadProgress(progress);
        },
        (error) => {
          console.error("Upload failed:", error);
          alert("Image upload failed. Please verify that Firebase Storage is configured correctly.");
          setUploadProgress(0);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setProductForm((prev) => ({
            ...prev,
            images: [downloadURL],
          }));
          setUploadProgress(0);
        }
      );
    } catch (err) {
      console.error("Upload error:", err);
      setUploadProgress(0);
    }
  };

  // Ticket Form Reply state
  const [ticketReplyText, setTicketReplyText] = useState("");
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  // Coupon state
  const [newCouponCode, setNewCouponCode] = useState("");
  const [newCouponType, setNewCouponType] = useState<"percentage" | "fixed">("percentage");
  const [newCouponVal, setNewCouponVal] = useState("");
  const [newCouponMin, setNewCouponMin] = useState("");

  // Excel paste bulk import state
  const [showImportModal, setShowImportModal] = useState(false);
  const [excelPasteText, setExcelPasteText] = useState("");

  // Settings form local state
  const [settingsForm, setSettingsForm] = useState<WebsiteSettings>({ ...db.websiteSettings });

  useEffect(() => {
    if (db.websiteSettings) {
      setSettingsForm({ ...db.websiteSettings });
    }
  }, [db.websiteSettings]);

  // Filters catalog based on current manager role
  const getFilteredProducts = () => {
    switch (currentRole) {
      case Role.SMARTPHONE_MANAGER:
        return db.products.filter((p) => p.categoryId === "smartphones");
      case Role.COMPUTER_MANAGER:
        return db.products.filter((p) => p.categoryId === "computers");
      case Role.SMART_WATCH_MANAGER:
        return db.products.filter((p) => p.categoryId === "watches");
      case Role.ACCESSORIES_MANAGER:
        return db.products.filter((p) => p.categoryId === "accessories");
      default:
        return db.products;
    }
  };

  const filteredProducts = getFilteredProducts();

  // Analytical stats calculations
  const totalSalesRevenue = db.orders
    .filter((o) => o.shippingStatus !== "Cancelled")
    .reduce((sum, o) => sum + o.total, 0);

  const profitMargin = totalSalesRevenue * 0.25; // 25% physical store margin
  const activeOrdersCount = db.orders.filter((o) => o.shippingStatus !== "Delivered" && o.shippingStatus !== "Cancelled").length;
  const lowStockAlertCount = db.products.filter((p) => p.stock <= p.minStockAlert).length;

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Parse specs lines (e.g. CPU: Intel i9)
    const specs: Record<string, string> = {};
    productForm.specifications.split("\n").forEach((line) => {
      const parts = line.split(":");
      if (parts.length >= 2) {
        specs[parts[0].trim()] = parts[1].trim();
      }
    });

    const finalImages = productForm.images && productForm.images.length > 0 
      ? productForm.images 
      : [`https://picsum.photos/600/600?random=${Math.floor(Math.random() * 1000)}`];

    const payload = {
      ...productForm,
      specifications: specs,
      images: finalImages,
    };

    if (editingProduct && editingProduct.id) {
      onUpdateProduct({
        ...editingProduct as Product,
        ...payload,
        price: parseFloat(productForm.price),
        discountPrice: productForm.discountPrice ? parseFloat(productForm.discountPrice) : undefined,
        stock: parseInt(productForm.stock) || 0,
        minStockAlert: parseInt(productForm.minStockAlert) || 5,
      });
    } else {
      onAddProduct(payload);
    }

    setShowProductModal(false);
    setEditingProduct(null);
    setProductForm({
      name: "",
      sku: "",
      price: "",
      discountPrice: "",
      stock: "",
      minStockAlert: "5",
      categoryId: "smartphones",
      brandId: "apple",
      warranty: "1 Year General Warranty",
      description: "",
      specifications: "",
      images: [],
    });
  };

  const handleEditProductClick = (p: Product) => {
    setEditingProduct(p);
    
    // Format specs dictionary back to raw rows
    const specsStr = Object.entries(p.specifications || {})
      .map(([key, value]) => `${key}: ${value}`)
      .join("\n");

    setProductForm({
      name: p.name,
      sku: p.sku,
      price: p.price.toString(),
      discountPrice: p.discountPrice ? p.discountPrice.toString() : "",
      stock: p.stock.toString(),
      minStockAlert: p.minStockAlert.toString(),
      categoryId: p.categoryId,
      brandId: p.brandId,
      warranty: p.warranty,
      description: p.description,
      specifications: specsStr,
      images: p.images || [],
    });
    setShowProductModal(true);
  };

  const handleDuplicateProduct = (p: Product) => {
    const copy = {
      ...p,
      id: `${p.id}-copy-${Date.now()}`,
      name: `${p.name} (Copy)`,
      sku: `${p.sku}-CP`,
      stock: 10, // Default duplicated stock
    };
    onAddProduct(copy);
  };

  const handleBulkImport = () => {
    // Basic CSV tab delimited reader simulator
    const lines = excelPasteText.trim().split("\n");
    if (lines.length === 0) return;

    const importedProducts = lines.map((line) => {
      const cols = line.split("\t");
      return {
        name: cols[0] || "Custom Item",
        price: parseFloat(cols[1]) || 99,
        stock: parseInt(cols[2]) || 10,
        categoryId: cols[3] || "accessories",
        brandId: cols[4] || "apple",
        sku: `SKU-${Math.floor(100000 + Math.random() * 900000)}`,
        minStockAlert: 3,
        description: "Bulk imported physical asset.",
        warranty: "1 Year Warranty"
      };
    });

    // Post mock array
    fetch("/api/products/import-excel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ products: importedProducts }),
    })
      .then((res) => res.json())
      .then(() => {
        onRefreshDB();
        setShowImportModal(false);
        setExcelPasteText("");
        alert(`Successfully imported ${importedProducts.length} devices to showroom!`);
      });
  };

  const handleAddCouponClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode) return;

    const c: Coupon = {
      id: newCouponCode.toLowerCase(),
      code: newCouponCode.toUpperCase(),
      discountType: newCouponType,
      discountValue: parseFloat(newCouponVal) || 10,
      minPurchase: parseFloat(newCouponMin) || 0,
      isActive: true,
      expiryDate: "2027-12-31",
    };

    onAddCoupon(c);
    setNewCouponCode("");
    setNewCouponVal("");
    setNewCouponMin("");
    alert("New Coupon Added Successfully!");
  };

  const handleSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(settingsForm);
    alert("Store settings saved successfully!");
  };

  const triggerExportProducts = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(db.products, null, 2));
    const dlAnchorElem = document.createElement("a");
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "electra_catalog_export.json");
    dlAnchorElem.click();
  };

  const triggerExportSales = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Order ID", "Customer", "Email", "Total ($)", "Payment Status", "Shipping", "Date"].join(",") + "\n"
      + db.orders.map(o => [o.id, o.customerName, o.email, o.total, o.paymentStatus, o.shippingStatus, o.createdAt].join(",")).join("\n");
    
    const dlAnchorElem = document.createElement("a");
    dlAnchorElem.setAttribute("href", encodeURI(csvContent));
    dlAnchorElem.setAttribute("download", "electra_sales_report.csv");
    dlAnchorElem.click();
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      
      {/* Dashboard Top Header */}
      <div className="bg-white border-b border-gray-200 py-6 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-neutral-900 rounded-2xl p-3 text-white">
              <Shield className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                Staff Control Desk
              </span>
              <h1 className="text-xl font-extrabold text-neutral-900 mt-1">{currentRole} Workspace</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefreshDB}
              className="rounded-xl border border-gray-200 bg-white p-2.5 text-gray-600 hover:text-black hover:bg-gray-50 transition"
              title="Refresh Showroom State"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            
            <button
              onClick={() => {
                setEditingProduct(null);
                setProductForm({
                  name: "",
                  sku: "",
                  price: "",
                  discountPrice: "",
                  stock: "10",
                  minStockAlert: "3",
                  categoryId: "smartphones",
                  brandId: "apple",
                  warranty: "1 Year General Warranty",
                  description: "",
                  specifications: "Processor: Premium Quad Core\nDisplay: 6.7-inch Ultra Amoled",
                });
                setShowProductModal(true);
              }}
              className="flex items-center gap-1.5 rounded-xl bg-neutral-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-neutral-800 transition shadow"
            >
              <Plus className="h-4 w-4" />
              Add Product
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* Core Quick Stats Widgets */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Gross Showroom Revenue</span>
              <p className="text-2xl font-black text-neutral-900 mt-1">${totalSalesRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
              <DollarSign className="h-6 w-6" />
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Estimated Profit (25% margin)</span>
              <p className="text-2xl font-black text-emerald-600 mt-1">${profitMargin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Queue Processing (Pending)</span>
              <p className="text-2xl font-black text-amber-600 mt-1">{activeOrdersCount} Incoming</p>
            </div>
            <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
              <Package className="h-6 w-6" />
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Low Stock Warnings</span>
              <p className="text-2xl font-black text-red-600 mt-1">{lowStockAlertCount} Devices</p>
            </div>
            <div className="rounded-xl bg-red-50 p-3 text-red-600">
              <ShieldAlert className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Dashboard Tabs for Super Admin / All items for managers */}
        {currentRole === Role.SUPER_ADMIN ? (
          <div className="mt-10 flex border-b border-gray-200 overflow-x-auto gap-2">
            {[
              { id: "analytics", label: "Analytics Arena", icon: TrendingUp },
              { id: "products", label: "Catalog & Bulk Actions", icon: Package },
              { id: "orders", label: "Logistics Fulfillment", icon: Truck },
              { id: "tickets", label: "Customer Service Inbox", icon: Users },
              { id: "coupons", label: "Discount Coupons", icon: DollarSign },
              { id: "settings", label: "Website Settings", icon: Settings },
              { id: "database", label: "Database Arena", icon: HardDrive },
              { id: "audit", label: "Security Audit Logs", icon: Shield },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 py-3 px-4 text-xs font-bold whitespace-nowrap border-b-2 transition ${
                    activeTab === tab.id
                      ? "border-neutral-900 text-neutral-900 font-extrabold"
                      : "border-transparent text-gray-500 hover:text-black"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        ) : (
          // Category-specific warning / banner for targeted Managers
          <div className="mt-8 bg-neutral-900 text-neutral-300 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-white flex items-center gap-1.5 text-sm">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                Targeted Manager Authorization Active
              </h3>
              <p className="text-xs text-neutral-400 mt-1">
                You are currently managing products exclusively assigned to your department. You can add, edit, or delete items.
              </p>
            </div>
            <div className="text-xs font-mono bg-neutral-800 rounded px-2.5 py-1 text-emerald-400 border border-neutral-700">
              Department: {currentRole}
            </div>
          </div>
        )}

        {/* TAB CONTENS */}
        
        {/* Tab 1: Analytics (Super Admin) */}
        {(currentRole === Role.SUPER_ADMIN && activeTab === "analytics") && (
          <div className="mt-8 space-y-6 animate-in fade-in">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-neutral-900">Showroom Analytics Summary</h2>
                <p className="text-xs text-neutral-400">Export high-end analytics for your storefront performance.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={triggerExportProducts}
                  className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-bold text-gray-600 hover:text-black transition"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                  Export Inventory JSON
                </button>
                <button
                  onClick={triggerExportSales}
                  className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-bold text-gray-600 hover:text-black transition"
                >
                  <Download className="h-3.5 w-3.5 text-blue-600" />
                  Export Sales CSV
                </button>
              </div>
            </div>

            {/* Custom Interactive charts layout using stylish UI metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left card: Best sellers table */}
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm col-span-2">
                <h3 className="text-sm font-bold text-neutral-900 mb-4">Top Selling Electronic Devices</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-400 font-semibold uppercase tracking-wider text-[9px]">
                        <th className="pb-3">Product Name</th>
                        <th className="pb-3">SKU</th>
                        <th className="pb-3 text-right">Units Sold</th>
                        <th className="pb-3 text-right">Gross Income</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-neutral-700">
                      {db.orders.flatMap(o => o.items).reduce((acc: any[], item: any) => {
                        const existing = acc.find(x => x.productId === item.productId);
                        if (existing) {
                          existing.qty += item.quantity;
                          existing.revenue += (item.price * item.quantity);
                        } else {
                          acc.push({ name: item.name, sku: item.productId, qty: item.quantity, revenue: item.price * item.quantity, productId: item.productId });
                        }
                        return acc;
                      }, []).sort((a, b) => b.qty - a.qty).map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50">
                          <td className="py-3 font-medium text-neutral-900">{item.name}</td>
                          <td className="py-3 font-mono">{item.sku}</td>
                          <td className="py-3 text-right font-bold">{item.qty} units</td>
                          <td className="py-3 text-right font-black text-neutral-950">${item.revenue.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right card: Low stock lists */}
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h3 className="text-sm font-bold text-neutral-900 mb-4 flex items-center gap-1.5">
                  <AlertTriangle className="h-4.5 w-4.5 text-red-500 animate-pulse" />
                  Urgent Restock Needed
                </h3>
                {db.products.filter(p => p.stock <= p.minStockAlert).length === 0 ? (
                  <div className="text-center py-8 text-xs text-neutral-400">
                    All electronics products are sufficiently stocked!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {db.products.filter(p => p.stock <= p.minStockAlert).map((p) => (
                      <div key={p.id} className="flex items-center justify-between border-b border-gray-50 pb-2.5 last:border-0 last:pb-0">
                        <div>
                          <p className="text-xs font-bold text-neutral-900 line-clamp-1">{p.name}</p>
                          <p className="text-[10px] font-mono text-neutral-400">{p.sku}</p>
                        </div>
                        <div className="text-right">
                          <span className="rounded bg-red-50 border border-red-200 px-2 py-0.5 font-bold text-[10px] text-red-600">
                            {p.stock} left
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* Tab 2: Products Catalog (Super Admin & Specific Managers) */}
        {(currentRole !== Role.SUPER_ADMIN || activeTab === "products") && (
          <div className="mt-8 space-y-6 animate-in fade-in">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-neutral-900">Manage Store Catalog</h2>
                <p className="text-xs text-neutral-400">Perform editing, duplicates, bulk delete, and bulk Excel file import.</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingProduct(null);
                    setProductForm({
                      name: "",
                      sku: "",
                      price: "",
                      discountPrice: "",
                      stock: "",
                      minStockAlert: "5",
                      categoryId: "smartphones",
                      brandId: "apple",
                      warranty: "1 Year General Warranty",
                      description: "",
                      specifications: "",
                    });
                    setShowProductModal(true);
                  }}
                  className="flex items-center gap-1.5 rounded-xl bg-neutral-900 px-3.5 py-2.5 text-xs font-bold text-white hover:bg-neutral-800 transition shadow"
                >
                  <Plus className="h-4 w-4 text-white" />
                  Add New Product
                </button>
                <button
                  onClick={() => setShowImportModal(true)}
                  className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs font-bold text-gray-600 hover:text-black transition"
                >
                  <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
                  Bulk Import from Excel
                </button>
              </div>
            </div>

            {/* Products Table */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 font-semibold uppercase tracking-wider text-[9px]">
                    <th className="pb-3">Image</th>
                    <th className="pb-3">Device Name</th>
                    <th className="pb-3">SKU</th>
                    <th className="pb-3 text-right">Price</th>
                    <th className="pb-3 text-right">Stock</th>
                    <th className="pb-3 text-center">Department</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-neutral-700">
                  {filteredProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/50">
                      <td className="py-3">
                        <img
                          src={p.images[0]}
                          alt={p.name}
                          className="h-10 w-10 object-cover rounded-lg border bg-gray-50 p-0.5"
                          referrerPolicy="no-referrer"
                        />
                      </td>
                      <td className="py-3">
                        <p className="font-bold text-neutral-900 line-clamp-1">{p.name}</p>
                        <p className="text-[10px] text-neutral-400 font-mono">Barcode: {p.barcode || "N/A"}</p>
                      </td>
                      <td className="py-3 font-mono">{p.sku}</td>
                      <td className="py-3 text-right font-semibold">
                        {p.discountPrice ? (
                          <div>
                            <p className="font-bold text-neutral-900">${p.discountPrice}</p>
                            <p className="text-[10px] text-gray-400 line-through">${p.price}</p>
                          </div>
                        ) : (
                          `$${p.price}`
                        )}
                      </td>
                      <td className="py-3 text-right">
                        <span className={`rounded px-2 py-0.5 font-bold ${
                          p.stock <= p.minStockAlert ? "bg-red-50 text-red-600 border border-red-200" : "bg-emerald-50 text-emerald-600 border border-emerald-200"
                        }`}>
                          {p.stock} items
                        </span>
                      </td>
                      <td className="py-3 text-center capitalize font-medium">{p.categoryId}</td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleEditProductClick(p)}
                            className="rounded-lg p-1.5 text-gray-500 hover:text-black hover:bg-neutral-100 transition"
                            title="Edit Product"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDuplicateProduct(p)}
                            className="rounded-lg p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-neutral-100 transition"
                            title="Duplicate Product"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this product?")) {
                                onDeleteProduct(p.id);
                              }
                            }}
                            className="rounded-lg p-1.5 text-gray-400 hover:text-red-600 hover:bg-neutral-100 transition"
                            title="Delete Product"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Orders Logistics (Super Admin & Orders Manager) */}
        {(currentRole === Role.ORDERS_MANAGER || (currentRole === Role.SUPER_ADMIN && activeTab === "orders")) && (
          <div className="mt-8 space-y-6 animate-in fade-in">
            <div>
              <h2 className="text-base font-bold text-neutral-900">Manage Showroom Logistics</h2>
              <p className="text-xs text-neutral-400">Process shipping queues, delivery confirmations, and cancel actions.</p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 font-semibold uppercase tracking-wider text-[9px]">
                    <th className="pb-3">Order ID</th>
                    <th className="pb-3">Customer</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Ordered Items</th>
                    <th className="pb-3 text-right">Order Value</th>
                    <th className="pb-3 text-center">Fulfillment Status</th>
                    <th className="pb-3 text-right">Logistics Workflow Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-neutral-700">
                  {db.orders.map((o) => (
                    <tr key={o.id} className="hover:bg-gray-50/50">
                      <td className="py-4 font-mono font-bold text-neutral-900">{o.id}</td>
                      <td className="py-4">
                        <p className="font-bold text-neutral-900">{o.customerName}</p>
                        <p className="text-[10px] text-neutral-400">{o.phone}</p>
                      </td>
                      <td className="py-4 text-neutral-500">{new Date(o.createdAt).toLocaleDateString()}</td>
                      <td className="py-4 max-w-xs truncate">
                        {o.items.map(it => `${it.name} (x${it.quantity})`).join(", ")}
                      </td>
                      <td className="py-4 text-right font-black text-neutral-950">${o.total.toFixed(2)}</td>
                      <td className="py-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold ${
                            o.shippingStatus === "Delivered" ? "bg-emerald-50 text-emerald-600 border border-emerald-200" :
                            o.shippingStatus === "Shipped" ? "bg-blue-50 text-blue-600 border border-blue-200" :
                            o.shippingStatus === "Cancelled" ? "bg-red-50 text-red-600 border border-red-200" :
                            "bg-amber-50 text-amber-600 border border-amber-200 animate-pulse"
                          }`}>
                            Shipping: {o.shippingStatus}
                          </span>
                          <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold ${
                            o.paymentStatus === "Paid" ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-neutral-100 text-neutral-500"
                          }`}>
                            Payment: {o.paymentStatus}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {o.shippingStatus === "Pending" && (
                            <button
                              onClick={() => onUpdateOrderStatus(o.id, "Confirmed", "Paid")}
                              className="rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-2 py-1 text-[10px] font-bold"
                            >
                              Confirm Order
                            </button>
                          )}
                          {o.shippingStatus === "Confirmed" && (
                            <button
                              onClick={() => onUpdateOrderStatus(o.id, "Shipped")}
                              className="rounded bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 px-2 py-1 text-[10px] font-bold"
                            >
                              Ship Package
                            </button>
                          )}
                          {o.shippingStatus === "Shipped" && (
                            <button
                              onClick={() => onUpdateOrderStatus(o.id, "Delivered")}
                              className="rounded bg-emerald-900 text-white hover:bg-neutral-800 px-2 py-1 text-[10px] font-bold"
                            >
                              Confirm Delivery
                            </button>
                          )}
                          {o.shippingStatus !== "Delivered" && o.shippingStatus !== "Cancelled" && (
                            <button
                              onClick={() => onUpdateOrderStatus(o.id, "Cancelled", "Failed")}
                              className="rounded bg-red-50 text-red-700 hover:bg-red-100 border border-red-100 px-2 py-1 text-[10px] font-bold"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Tickets CS (Super Admin & CS Agent) */}
        {(currentRole === Role.CUSTOMER_SERVICE || (currentRole === Role.SUPER_ADMIN && activeTab === "tickets")) && (
          <div className="mt-8 space-y-6 animate-in fade-in">
            <div>
              <h2 className="text-base font-bold text-neutral-900">Customer Support Inbox</h2>
              <p className="text-xs text-neutral-400">Resolve hardware diagnostics, warranty coverage, and order complaints.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Tickets Queue */}
              <div className="lg:col-span-1 rounded-2xl border border-gray-100 bg-white p-4 space-y-3">
                <h3 className="font-bold text-neutral-900 text-xs uppercase tracking-wider mb-2">Support Tickets</h3>
                {db.supportTickets.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicketId(t.id)}
                    className={`rounded-xl border p-3.5 cursor-pointer transition flex flex-col gap-1.5 ${
                      selectedTicketId === t.id ? "bg-neutral-50 border-neutral-950 shadow-sm" : "bg-white border-gray-100 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold text-neutral-400">{t.id}</span>
                      <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                        t.status === "Open" ? "bg-red-50 text-red-600 border border-red-100 animate-pulse" : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                      }`}>
                        {t.status}
                      </span>
                    </div>
                    <div>
                      <p className="font-bold text-xs text-neutral-900">{t.subject}</p>
                      <p className="text-[10px] text-neutral-500 mt-0.5">From: {t.name} ({t.email})</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Right Column: Ticket Detail Dialog & Reply Thread */}
              <div className="lg:col-span-2 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                {selectedTicketId ? (
                  (() => {
                    const t = db.supportTickets.find((tick) => tick.id === selectedTicketId);
                    if (!t) return null;
                    return (
                      <div className="flex flex-col h-full justify-between">
                        <div>
                          <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                            <div>
                              <h3 className="font-black text-sm text-neutral-900">{t.subject}</h3>
                              <p className="text-[10px] text-neutral-500 font-mono mt-0.5">Created on: {new Date(t.createdAt).toLocaleString()}</p>
                            </div>
                            <span className="rounded bg-neutral-100 px-2 py-0.5 text-[10px] font-bold">{t.status}</span>
                          </div>

                          <div className="bg-neutral-50 p-4 rounded-xl border border-gray-100">
                            <p className="text-xs font-semibold text-neutral-800">{t.name} wrote:</p>
                            <p className="text-xs text-neutral-600 mt-1 leading-relaxed italic">"{t.message}"</p>
                          </div>

                          {/* Reply Thread */}
                          <div className="mt-6 space-y-4 max-h-56 overflow-y-auto">
                            {t.replies.map((rep) => (
                              <div key={rep.id} className={`p-3.5 rounded-xl border ${
                                rep.sender === "Emily Watson (Support)" ? "bg-neutral-900 text-white border-neutral-950 ml-10" : "bg-white text-neutral-800 border-gray-100 mr-10"
                              }`}>
                                <p className="text-[10px] font-bold opacity-85">{rep.sender}</p>
                                <p className="text-xs mt-1">{rep.message}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* CS Reply Box */}
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (!ticketReplyText) return;
                            onReplyTicket(t.id, ticketReplyText);
                            setTicketReplyText("");
                          }}
                          className="mt-6 border-t border-gray-100 pt-4 flex gap-2"
                        >
                          <input
                            type="text"
                            placeholder="Type diagnostic response, hardware solutions, or shipping details..."
                            value={ticketReplyText}
                            onChange={(e) => setTicketReplyText(e.target.value)}
                            className="flex-1 rounded-xl border border-gray-200 py-2 px-3 text-xs focus:outline-none"
                          />
                          <button type="submit" className="rounded-xl bg-neutral-900 px-4 py-2 text-xs font-bold text-white hover:bg-neutral-800 flex items-center gap-1">
                            <Send className="h-3.5 w-3.5" />
                            Reply
                          </button>
                        </form>
                      </div>
                    );
                  })()
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-center text-neutral-400">
                    <Clock className="h-8 w-8 text-neutral-300 animate-spin mb-2" />
                    <p className="text-xs">Select a customer support ticket on the left to start replying.</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* Tab 5: Coupons (Super Admin Only) */}
        {(currentRole === Role.SUPER_ADMIN && activeTab === "coupons") && (
          <div className="mt-8 space-y-6 animate-in fade-in">
            <div>
              <h2 className="text-base font-bold text-neutral-900">Discount Coupons Management</h2>
              <p className="text-xs text-neutral-400">Generate, customize, and validate promotional coupon structures.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Creator Form */}
              <form onSubmit={handleAddCouponClick} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
                <h3 className="font-bold text-neutral-900 text-xs uppercase tracking-wider mb-2">Create Coupon Code</h3>
                
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase">Coupon Code</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. ELECTRA25"
                    value={newCouponCode}
                    onChange={(e) => setNewCouponCode(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-gray-200 py-2 px-3 text-xs uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase">Discount Type</label>
                  <select
                    value={newCouponType}
                    onChange={(e) => setNewCouponType(e.target.value as any)}
                    className="mt-1 w-full rounded-xl border border-gray-200 py-2 px-3 text-xs"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount ($)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase">Value</label>
                  <input
                    type="number"
                    required
                    placeholder="E.g. 10 or 50"
                    value={newCouponVal}
                    onChange={(e) => setNewCouponVal(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-gray-200 py-2 px-3 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase">Min Purchase Threshold ($)</label>
                  <input
                    type="number"
                    required
                    placeholder="E.g. 150"
                    value={newCouponMin}
                    onChange={(e) => setNewCouponMin(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-gray-200 py-2 px-3 text-xs"
                  />
                </div>

                <button type="submit" className="w-full rounded-xl bg-neutral-900 py-2 text-xs font-bold text-white hover:bg-neutral-800 transition shadow">
                  Create Coupon
                </button>
              </form>

              {/* Coupons List */}
              <div className="md:col-span-2 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm overflow-x-auto">
                <h3 className="font-bold text-neutral-900 text-xs uppercase tracking-wider mb-4">Active Showroom Coupons</h3>
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 font-semibold uppercase text-[9px]">
                      <th className="pb-3">Code</th>
                      <th className="pb-3">Discount</th>
                      <th className="pb-3">Min Purchase</th>
                      <th className="pb-3">Expiry Date</th>
                      <th className="pb-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 font-mono">
                    {db.coupons.map((c) => (
                      <tr key={c.id}>
                        <td className="py-3 font-bold text-neutral-900">{c.code}</td>
                        <td className="py-3 text-neutral-700">
                          {c.discountType === "percentage" ? `${c.discountValue}%` : `$${c.discountValue}`}
                        </td>
                        <td className="py-3">${c.minPurchase}</td>
                        <td className="py-3 text-gray-500">{c.expiryDate}</td>
                        <td className="py-3 text-center">
                          <span className="rounded bg-emerald-50 px-2 py-0.5 text-[9px] text-emerald-600 font-bold border border-emerald-200">
                            Active
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          </div>
        )}

        {/* Tab 6: Website Settings (Super Admin) */}
        {(currentRole === Role.SUPER_ADMIN && activeTab === "settings") && (
          <div className="mt-8 space-y-6 animate-in fade-in">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-neutral-900">E-Commerce Website Configuration</h2>
                <p className="text-xs text-neutral-400">Configure global physical coordinates, WhatsApp routing, and database backups.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => alert("Enterprise local database snapshot backup successful. Saved to /snapshots/db_backup.json")}
                  className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-600 hover:text-black hover:bg-gray-50 transition"
                >
                  <HardDrive className="h-4 w-4 text-emerald-500" />
                  Backup DB
                </button>
                <button
                  type="button"
                  onClick={() => alert("Showroom database successfully restored to the latest structural snapshot.")}
                  className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-600 hover:text-black hover:bg-gray-50 transition"
                >
                  <RotateCcw className="h-4 w-4 text-red-500" />
                  Restore DB
                </button>
              </div>
            </div>

            <form onSubmit={handleSettingsSubmit} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase">E-Commerce Store Title</label>
                <input
                  type="text"
                  required
                  value={settingsForm.storeName}
                  onChange={(e) => setSettingsForm({ ...settingsForm, storeName: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-gray-200 py-2.5 px-3 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase">WhatsApp Order Sync Phone Number</label>
                <input
                  type="text"
                  required
                  placeholder="+212600000000"
                  value={settingsForm.whatsappNumber}
                  onChange={(e) => setSettingsForm({ ...settingsForm, whatsappNumber: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-gray-200 py-2.5 px-3 text-xs font-mono font-semibold"
                />
                <p className="text-[10px] text-neutral-400 mt-1">Include country code (e.g. +2126XXXXXXXX for Morocco).</p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase">Showroom Address</label>
                <input
                  type="text"
                  required
                  value={settingsForm.storeAddress}
                  onChange={(e) => setSettingsForm({ ...settingsForm, storeAddress: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-gray-200 py-2.5 px-3 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase">Logistics Delivery Cost ($)</label>
                <input
                  type="number"
                  required
                  value={settingsForm.deliveryCost}
                  onChange={(e) => setSettingsForm({ ...settingsForm, deliveryCost: parseFloat(e.target.value) || 0 })}
                  className="mt-1 w-full rounded-xl border border-gray-200 py-2.5 px-3 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase">Store Contact Email</label>
                <input
                  type="email"
                  required
                  value={settingsForm.storeEmail}
                  onChange={(e) => setSettingsForm({ ...settingsForm, storeEmail: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-gray-200 py-2.5 px-3 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase">Support Phone</label>
                <input
                  type="text"
                  required
                  value={settingsForm.storePhone}
                  onChange={(e) => setSettingsForm({ ...settingsForm, storePhone: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-gray-200 py-2.5 px-3 text-xs font-semibold"
                />
              </div>

              <div className="flex items-center gap-6 md:col-span-2 pt-4 border-t border-gray-100">
                <label className="flex items-center gap-2 text-xs font-bold text-neutral-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={settingsForm.enableLoyaltyPoints}
                    onChange={(e) => setSettingsForm({ ...settingsForm, enableLoyaltyPoints: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Enable Customer Loyalty Points Reward System</span>
                </label>
              </div>

              <div className="md:col-span-2 text-right">
                <button type="submit" className="rounded-xl bg-neutral-900 px-6 py-3 text-xs font-bold text-white hover:bg-neutral-800 transition shadow">
                  Save Configurations
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab: Real-Time Database Arena (Super Admin) */}
        {(currentRole === Role.SUPER_ADMIN && activeTab === "database") && (
          <div className="mt-8 space-y-6 animate-in fade-in">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-neutral-900">Database Arena & JSON Explorer</h2>
                <p className="text-xs text-neutral-400">Directly view, download, reset, or hot-edit the persistent e-commerce <code className="font-mono bg-neutral-100 text-neutral-800 px-1 py-0.5 rounded text-[10px]">db.json</code> file.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const blob = new Blob([JSON.stringify(db, null, 2)], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.href = url;
                    link.download = "db.json";
                    link.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-bold text-gray-600 hover:text-black hover:bg-gray-50 transition"
                >
                  <Download className="h-4 w-4 text-emerald-500" />
                  Download db.json
                </button>
                <button
                  type="button"
                  disabled={isResettingDb}
                  onClick={async () => {
                    if (confirm("Are you sure you want to reset the database back to factory seed? This will delete all current changes, orders, custom settings, and custom items!")) {
                      setIsResettingDb(true);
                      try {
                        const res = await fetch("/api/db/reset", { method: "POST" });
                        const resData = await res.json();
                        if (resData.success) {
                          onRefreshDB();
                          alert("Database successfully reset back to factory seed!");
                        } else {
                          alert("Reset failed: " + resData.error);
                        }
                      } catch (err) {
                        alert("Reset failed. Check server log.");
                      } finally {
                        setIsResettingDb(false);
                      }
                    }
                  }}
                  className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-bold text-gray-600 hover:text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                >
                  <RotateCcw className={`h-4 w-4 text-red-500 ${isResettingDb ? "animate-spin" : ""}`} />
                  Reset to Seed Data
                </button>
              </div>
            </div>

            {/* Live Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
              {[
                { name: "Products", count: db.products?.length || 0, bg: "bg-neutral-50" },
                { name: "Categories", count: db.categories?.length || 0, bg: "bg-neutral-50" },
                { name: "SubCategories", count: db.subCategories?.length || 0, bg: "bg-neutral-50" },
                { name: "Brands", count: db.brands?.length || 0, bg: "bg-neutral-50" },
                { name: "Orders", count: db.orders?.length || 0, bg: "bg-neutral-50" },
                { name: "Users & Staff", count: db.users?.length || 0, bg: "bg-neutral-50" },
                { name: "Coupons", count: db.coupons?.length || 0, bg: "bg-neutral-50" },
                { name: "Support Tickets", count: db.supportTickets?.length || 0, bg: "bg-neutral-50" },
                { name: "Audit Logs", count: db.auditLogs?.length || 0, bg: "bg-neutral-50" },
                { name: "Notifications", count: db.notifications?.length || 0, bg: "bg-neutral-50" },
              ].map((stat, i) => (
                <div key={i} className={`p-4 rounded-2xl border border-gray-100 ${stat.bg} shadow-sm flex flex-col justify-between`}>
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">{stat.name}</span>
                  <span className="text-xl font-black text-neutral-900 mt-1">{stat.count} items</span>
                </div>
              ))}
            </div>

            {/* Interactive Live JSON Editor */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-50 pb-3">
                <div>
                  <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">Live database.json Content</h3>
                  <p className="text-[10px] text-neutral-400 mt-0.5">Edit this raw JSON payload and save changes directly to write to <span className="font-mono">db.json</span> on the server.</p>
                </div>
                <button
                  type="button"
                  disabled={isSavingJson}
                  onClick={async () => {
                    setIsSavingJson(true);
                    setJsonError("");
                    try {
                      JSON.parse(rawJsonText);
                      
                      const res = await fetch("/api/db/raw", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ rawJson: rawJsonText })
                      });
                      const resData = await res.json();
                      if (resData.success) {
                        onRefreshDB();
                        alert("Database successfully written and re-synced on the server!");
                      } else {
                        setJsonError(resData.error || "Save failed.");
                      }
                    } catch (err: any) {
                      setJsonError("Invalid JSON structure: " + err.message);
                    } finally {
                      setIsSavingJson(false);
                    }
                  }}
                  className="flex items-center gap-1.5 rounded-xl bg-neutral-900 px-4 py-2 text-xs font-bold text-white hover:bg-neutral-800 transition shadow disabled:opacity-50"
                >
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  {isSavingJson ? "Saving..." : "Save Database Changes"}
                </button>
              </div>

              {jsonError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-semibold text-red-600 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  {jsonError}
                </div>
              )}

              <div className="relative">
                <textarea
                  rows={20}
                  value={rawJsonText}
                  onChange={(e) => setRawJsonText(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-neutral-950 p-4 text-xs font-mono text-emerald-400 focus:outline-none focus:ring-2 focus:ring-neutral-800 leading-relaxed"
                  style={{ tabSize: 2 }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 7: Security Audit Logs (Super Admin) */}
        {(currentRole === Role.SUPER_ADMIN && activeTab === "audit") && (
          <div className="mt-8 space-y-6 animate-in fade-in">
            <div>
              <h2 className="text-base font-bold text-neutral-900">Cybersecurity Audit Logs</h2>
              <p className="text-xs text-neutral-400">Strict ledger logging of product additions, order synchronization, and staff logins.</p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm font-mono text-[11px] leading-relaxed max-h-96 overflow-y-auto space-y-3">
              {db.auditLogs.map((log) => (
                <div key={log.id} className="border-b border-gray-50 pb-2.5 last:border-b-0 last:pb-0">
                  <span className="text-neutral-400 mr-2">[{new Date(log.createdAt).toLocaleString()}]</span>
                  <span className="text-red-500 font-bold mr-2 uppercase">#{log.action}</span>
                  <span className="text-neutral-700">{log.details}</span>
                  {log.userName && (
                    <span className="ml-2 text-emerald-600 font-semibold">(By: {log.userName})</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* MODAL 1: CREATE / EDIT PRODUCT */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-in fade-in">
          <div className="w-full max-w-2xl rounded-3xl border border-gray-100 bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-bold text-neutral-900">
                {editingProduct ? `Edit ${editingProduct.name}` : "Create Premium Hardware Entry"}
              </h3>
              <button
                onClick={() => setShowProductModal(false)}
                className="rounded-full bg-neutral-100 p-1.5 text-neutral-500 hover:bg-neutral-200 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleProductSubmit} className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase">Device Name</label>
                <input
                  type="text"
                  required
                  placeholder="E.g. iPhone 15 Pro Max"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-gray-200 py-2 px-3 text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase">SKU Identifier</label>
                <input
                  type="text"
                  placeholder="Auto-generated if blank"
                  value={productForm.sku}
                  onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-gray-200 py-2 px-3 text-xs uppercase font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase">Retail Price ($)</label>
                <input
                  type="number"
                  required
                  placeholder="E.g. 1199"
                  value={productForm.price}
                  onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-gray-200 py-2 px-3 text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase">Discount Price ($)</label>
                <input
                  type="number"
                  placeholder="Optional"
                  value={productForm.discountPrice}
                  onChange={(e) => setProductForm({ ...productForm, discountPrice: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-gray-200 py-2 px-3 text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase">In-Stock Inventory Count</label>
                <input
                  type="number"
                  required
                  value={productForm.stock}
                  onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-gray-200 py-2 px-3 text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase">Min Stock Warning Level</label>
                <input
                  type="number"
                  required
                  value={productForm.minStockAlert}
                  onChange={(e) => setProductForm({ ...productForm, minStockAlert: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-gray-200 py-2 px-3 text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase">Category Department</label>
                <select
                  value={productForm.categoryId}
                  onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-gray-200 py-2 px-3 text-xs"
                >
                  <option value="smartphones">Smartphones & Wearables</option>
                  <option value="computers">Computers & Computing</option>
                  <option value="watches">Smart Watches</option>
                  <option value="accessories">Audio & Accessories</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase">Brand Manufacturer</label>
                <select
                  value={productForm.brandId}
                  onChange={(e) => setProductForm({ ...productForm, brandId: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-gray-200 py-2 px-3 text-xs"
                >
                  <option value="apple">Apple</option>
                  <option value="samsung">Samsung</option>
                  <option value="google">Google</option>
                  <option value="asus">ASUS</option>
                  <option value="sony">Sony</option>
                  <option value="garmin">Garmin</option>
                  <option value="logitech">Logitech</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-neutral-500 uppercase">Product Image (File Upload to Firebase Storage)</label>
                <div className="mt-1 flex items-center gap-3 rounded-xl border border-dashed border-gray-300 p-3.5 bg-neutral-50 dark:bg-neutral-900/40 dark:border-neutral-800">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="text-xs cursor-pointer file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-neutral-900 file:text-white hover:file:bg-neutral-800"
                  />
                  {uploadProgress > 0 && (
                    <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-[10px]">
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      <span>{uploadProgress}%</span>
                    </div>
                  )}
                  {productForm.images && productForm.images[0] && (
                    <div className="flex items-center gap-1.5 ml-auto">
                      <img src={productForm.images[0]} alt="Preview" className="h-8 w-8 object-cover rounded border" />
                      <span className="text-[9px] text-gray-400 font-mono max-w-[120px] truncate">Uploaded!</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-neutral-500 uppercase">Specifications (One Key:Value per line)</label>
                <textarea
                  rows={3}
                  placeholder="E.g.&#10;Processor: M3 Max Chip&#10;RAM: 36GB Unified Memory"
                  value={productForm.specifications}
                  onChange={(e) => setProductForm({ ...productForm, specifications: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-gray-200 py-2 px-3 text-xs font-mono"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-neutral-500 uppercase">Description</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Type product showroom copy details..."
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-gray-200 py-2 px-3 text-xs"
                />
              </div>

              <div className="col-span-2 flex justify-end gap-2 border-t border-gray-100 pt-3">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-500 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-neutral-900 px-5 py-2 text-xs font-bold text-white hover:bg-neutral-800"
                >
                  Save Hardware Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: BULK EXCEL IMPORT */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-gray-100 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h3 className="text-sm font-bold text-neutral-900">Simulate Bulk Excel Import Tool</h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="rounded-full bg-neutral-100 p-1.5 text-neutral-500 hover:bg-neutral-200 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="text-xs text-neutral-500 space-y-2">
              <p>Paste tab-delimited columns directly copied from Excel, Sheets, or CSV tables.</p>
              <div className="bg-neutral-50 p-2.5 rounded font-mono text-[10px] leading-relaxed border">
                Format: <span className="font-bold">Name [TAB] Price [TAB] Stock [TAB] CategoryId [TAB] BrandId</span> <br />
                Example: <span className="text-emerald-700 font-bold">ASUS ROG Mouse	89.00	25	accessories	asus</span>
              </div>
            </div>

            <textarea
              rows={6}
              required
              placeholder="Paste tab-delimited rows..."
              value={excelPasteText}
              onChange={(e) => setExcelPasteText(e.target.value)}
              className="w-full rounded-xl border border-gray-200 p-3 text-xs font-mono"
            />

            <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
              <button
                onClick={() => setShowImportModal(false)}
                className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold text-neutral-500 hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkImport}
                disabled={!excelPasteText}
                className="rounded-xl bg-neutral-900 px-5 py-2 text-xs font-bold text-white hover:bg-neutral-800 transition disabled:opacity-50"
              >
                Confirm Bulk Import
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
