/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum Role {
  SUPER_ADMIN = "Super Admin",
  STORE_MANAGER = "Store Manager",
  SMARTPHONE_MANAGER = "Smartphone Manager",
  COMPUTER_MANAGER = "Computer Manager",
  SMART_WATCH_MANAGER = "Smart Watch Manager",
  ACCESSORIES_MANAGER = "Accessories Manager",
  ORDERS_MANAGER = "Orders Manager",
  CUSTOMER_SERVICE = "Customer Service",
  CUSTOMER = "Customer",
  GUEST = "Guest"
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  role: Role;
  loyaltyPoints: number;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
}

export interface SubCategory {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  discountPrice?: number;
  stock: number;
  minStockAlert: number;
  brandId: string;
  categoryId: string;
  subCategoryId?: string;
  specifications: Record<string, string>;
  description: string;
  rating: number;
  reviewCount: number;
  images: string[];
  videoUrl?: string;
  availability: boolean;
  warranty: string;
  barcode?: string;
}

export interface Order {
  id: string;
  userId?: string;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  paymentMethod: string;
  paymentStatus: "Pending" | "Paid" | "Failed" | "Refunded";
  shippingStatus: "Pending" | "Confirmed" | "Shipped" | "Delivered" | "Cancelled";
  deliveryCost: number;
  subtotal: number;
  total: number;
  notes?: string;
  whatsappSent: boolean;
  createdAt: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minPurchase: number;
  isActive: boolean;
  expiryDate: string;
}

export interface Review {
  id: string;
  productId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  type: "info" | "success" | "warning" | "error";
  createdAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  details: string;
  userId?: string;
  userName?: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "Open" | "In Progress" | "Resolved";
  createdAt: string;
  replies: Array<{
    id: string;
    sender: string;
    message: string;
    createdAt: string;
  }>;
}

export interface WebsiteSettings {
  storeName: string;
  whatsappNumber: string;
  storeEmail: string;
  storePhone: string;
  storeAddress: string;
  deliveryCost: number;
  allowCashOnDelivery: boolean;
  allowBankTransfer: boolean;
  enableLoyaltyPoints: boolean;
  pointsPerDollar: number;
}
