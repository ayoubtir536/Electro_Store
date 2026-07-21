/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function generateWhatsAppLink(whatsappNumber: string, storeName: string, order: any) {
  const formattedDate = new Date(order.createdAt).toLocaleDateString();
  const formattedTime = new Date(order.createdAt).toLocaleTimeString();

  const itemsList = order.items
    .map((it: any) => `• ${it.name} (x${it.quantity}) - $${(it.price * it.quantity).toFixed(2)}`)
    .join("\n");

  const text = `*🛍️ NEW ORDER FROM ${storeName.toUpperCase()}*

*Order Details:*
• *Order ID:* ${order.id}
• *Date:* ${formattedDate}
• *Time:* ${formattedTime}

*Customer Information:*
• *Name:* ${order.customerName}
• *Phone:* ${order.phone}
• *Address:* ${order.address}
• *City:* ${order.city}

*Ordered Items:*
${itemsList}

*Financial Summary:*
• *Subtotal:* $${order.subtotal.toFixed(2)}
• *Delivery Cost:* $${order.deliveryCost.toFixed(2)}
• *Total Amount:* $${order.total.toFixed(2)}

*Payment details:*
• *Method:* ${order.paymentMethod}
• *Status:* ${order.paymentStatus}

*Notes:* ${order.notes || "None"}

_Please confirm receipt of my e-commerce order. Thank you!_`;

  return `https://wa.me/${whatsappNumber.replace(/[^0-9+]/g, "")}?text=${encodeURIComponent(text)}`;
}

export function generateSingleProductWhatsAppLink(whatsappNumber: string, storeName: string, product: any) {
  const text = `*👋 INQUIRY FROM ${storeName.toUpperCase()}*

Hello! I would like to order this item immediately:
• *Device:* ${product.name}
• *SKU:* ${product.sku}
• *Price:* $${(product.discountPrice || product.price).toFixed(2)}
• *Warranty:* ${product.warranty}

_Please let me know if this is in stock and ready for delivery. Thank you!_`;

  return `https://wa.me/${whatsappNumber.replace(/[^0-9+]/g, "")}?text=${encodeURIComponent(text)}`;
}

export function generateCartWhatsAppLink(whatsappNumber: string, storeName: string, cartItems: any[], subtotal: number) {
  const itemsList = cartItems
    .map((it: any) => `• ${it.name} (x${it.quantity}) - $${((it.discountPrice || it.price) * it.quantity).toFixed(2)}`)
    .join("\n");

  const text = `*🛒 CART CHECKOUT INQUIRY FROM ${storeName.toUpperCase()}*

Hello! I have these items in my cart and would like to order them:
${itemsList}

• *Estimated Subtotal:* $${subtotal.toFixed(2)}

_Please confirm the availability of these products. Thank you!_`;

  return `https://wa.me/${whatsappNumber.replace(/[^0-9+]/g, "")}?text=${encodeURIComponent(text)}`;
}
