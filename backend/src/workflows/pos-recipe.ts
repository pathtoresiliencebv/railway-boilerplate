import { createStep, createWorkflow, StepResponse } from "@medusajs/workflows-sdk";
import { Modules } from "@medusajs/framework/utils";
import { IOrderModuleService, IInventoryModuleService, ICustomerModuleService, IPaymentModuleService } from "@medusajs/framework/types";

export interface POSDevice {
  id: string
  name: string
  location: string
  isActive: boolean
  lastSync: Date
  capabilities: string[]
}

export interface POSOrder {
  id: string
  deviceId: string
  customerId?: string
  items: Array<{
    productId: string
    variantId: string
    quantity: number
    unitPrice: number
    totalPrice: number
  }>
  subtotal: number
  tax: number
  discount: number
  total: number
  paymentMethod: string
  status: 'pending' | 'completed' | 'refunded'
  createdAt: Date
}

export interface Receipt {
  id: string
  orderId: string
  deviceId: string
  content: string
  printed: boolean
  printedAt?: Date
}

const processPOSOrderStep = createStep(
  "process-pos-order",
  async (input: {
    deviceId: string;
    customerId?: string;
    items: any[];
    paymentMethod: string;
    discount?: number;
  }, { container }) => {
    const orderModuleService: IOrderModuleService = container.resolve(Modules.ORDER);
    const inventoryModuleService: IInventoryModuleService = container.resolve(Modules.INVENTORY);
    
    try {
      // Calculate order totals
      const subtotal = input.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
      const discountAmount = input.discount || 0;
      const tax = (subtotal - discountAmount) * 0.08; // 8% tax rate
      const total = subtotal - discountAmount + tax;

      // Create POS order
      const posOrder: POSOrder = {
        id: `pos_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        deviceId: input.deviceId,
        customerId: input.customerId,
        items: input.items,
        subtotal,
        tax,
        discount: discountAmount,
        total,
        paymentMethod: input.paymentMethod,
        status: 'pending',
        createdAt: new Date()
      };

      // Check inventory availability
      const inventoryChecks = await Promise.all(
        input.items.map(async (item) => {
          const inventory = await inventoryModuleService.retrieveInventoryItem({
            inventory_item_id: item.variantId
          });
          
          const available = inventory.available_quantity || 0;
          return {
            productId: item.productId,
            variantId: item.variantId,
            required: item.quantity,
            available,
            sufficient: available >= item.quantity
          };
        })
      );

      const allItemsAvailable = inventoryChecks.every(check => check.sufficient);

      if (!allItemsAvailable) {
        throw new Error('Insufficient inventory for one or more items');
      }

      // Reserve inventory
      for (const item of input.items) {
        await inventoryModuleService.createReservationItems({
          inventory_item_id: item.variantId,
          location_id: 'pos_store', // POS store location
          quantity: item.quantity,
          description: `POS order ${posOrder.id}`,
          metadata: {
            pos_order_id: posOrder.id,
            device_id: input.deviceId
          }
        });
      }

      // Save POS order
      await savePOSOrder(posOrder);

      return new StepResponse({
        posOrder,
        inventoryChecks,
        processed: true
      });
    } catch (error) {
      console.error('Error processing POS order:', error);
      throw error;
    }
  }
);

const processPaymentStep = createStep(
  "process-payment",
  async (input: {
    posOrderId: string;
    paymentMethod: string;
    amount: number;
    deviceId: string;
  }, { container }) => {
    const paymentModuleService: IPaymentModuleService = container.resolve(Modules.PAYMENT);
    
    try {
      // Process payment based on method
      let paymentResult;
      
      switch (input.paymentMethod) {
        case 'cash':
          paymentResult = await processCashPayment(input.amount);
          break;
        case 'card':
          paymentResult = await processCardPayment(input.amount, input.deviceId);
          break;
        case 'mobile':
          paymentResult = await processMobilePayment(input.amount, input.deviceId);
          break;
        default:
          throw new Error(`Unsupported payment method: ${input.paymentMethod}`);
      }

      // Update POS order status
      await updatePOSOrderStatus(input.posOrderId, 'completed', {
        paymentResult,
        processedAt: new Date()
      });

      return new StepResponse({
        paymentResult,
        success: true
      });
    } catch (error) {
      console.error('Error processing payment:', error);
      throw error;
    }
  }
);

const generateReceiptStep = createStep(
  "generate-receipt",
  async (input: {
    posOrderId: string;
    deviceId: string;
  }, { container }) => {
    try {
      // Get POS order
      const posOrder = await getPOSOrder(input.posOrderId);
      if (!posOrder) {
        throw new Error(`POS order ${input.posOrderId} not found`);
      }

      // Generate receipt content
      const receiptContent = generateReceiptContent(posOrder);

      // Create receipt
      const receipt: Receipt = {
        id: `receipt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        orderId: input.posOrderId,
        deviceId: input.deviceId,
        content: receiptContent,
        printed: false,
        createdAt: new Date()
      };

      // Save receipt
      await saveReceipt(receipt);

      return new StepResponse({
        receipt,
        generated: true
      });
    } catch (error) {
      console.error('Error generating receipt:', error);
      throw error;
    }
  }
);

const printReceiptStep = createStep(
  "print-receipt",
  async (input: {
    receiptId: string;
    deviceId: string;
  }, { container }) => {
    try {
      // Get receipt
      const receipt = await getReceipt(input.receiptId);
      if (!receipt) {
        throw new Error(`Receipt ${input.receiptId} not found`);
      }

      // Send to POS printer
      const printResult = await sendToPrinter(receipt.content, input.deviceId);

      // Update receipt status
      await updateReceiptStatus(input.receiptId, {
        printed: true,
        printedAt: new Date()
      });

      return new StepResponse({
        printResult,
        printed: true
      });
    } catch (error) {
      console.error('Error printing receipt:', error);
      throw error;
    }
  }
);

const syncInventoryStep = createStep(
  "sync-inventory",
  async (input: {
    deviceId: string;
    productId: string;
    variantId: string;
    quantityChange: number;
  }, { container }) => {
    const inventoryModuleService: IInventoryModuleService = container.resolve(Modules.INVENTORY);
    
    try {
      // Update inventory
      const inventory = await inventoryModuleService.retrieveInventoryItem({
        inventory_item_id: input.variantId
      });

      const newQuantity = (inventory.available_quantity || 0) + quantityChange;

      await inventoryModuleService.updateInventoryItems(input.variantId, {
        available_quantity: newQuantity
      });

      // Update device sync timestamp
      await updateDeviceSync(input.deviceId);

      return new StepResponse({
        variantId: input.variantId,
        newQuantity,
        synced: true
      });
    } catch (error) {
      console.error('Error syncing inventory:', error);
      throw error;
    }
  }
);

const processRefundStep = createStep(
  "process-refund",
  async (input: {
    posOrderId: string;
    refundAmount: number;
    reason: string;
    deviceId: string;
  }, { container }) => {
    try {
      // Get original POS order
      const posOrder = await getPOSOrder(input.posOrderId);
      if (!posOrder) {
        throw new Error(`POS order ${input.posOrderId} not found`);
      }

      if (posOrder.status !== 'completed') {
        throw new Error('Can only refund completed orders');
      }

      // Process refund
      const refundResult = await processRefundPayment(posOrder.paymentMethod, input.refundAmount);

      // Update POS order status
      await updatePOSOrderStatus(input.posOrderId, 'refunded', {
        refundAmount: input.refundAmount,
        reason: input.reason,
        refundedAt: new Date()
      });

      // Restore inventory
      for (const item of posOrder.items) {
        await inventoryModuleService.createReservationItems({
          inventory_item_id: item.variantId,
          location_id: 'pos_store',
          quantity: -item.quantity, // Negative quantity to restore
          description: `Refund for POS order ${input.posOrderId}`,
          metadata: {
            refund_order_id: input.posOrderId,
            device_id: input.deviceId
          }
        });
      }

      return new StepResponse({
        refundResult,
        refunded: true
      });
    } catch (error) {
      console.error('Error processing refund:', error);
      throw error;
    }
  }
);

export const posRecipe = createWorkflow<
  {
    action: 'process_order' | 'process_payment' | 'generate_receipt' | 'print_receipt' | 'sync_inventory' | 'process_refund';
    data: any;
  },
  any
>("pos-recipe", function (input) {
  switch (input.action) {
    case 'process_order':
      return processPOSOrderStep(input.data);
    
    case 'process_payment':
      return processPaymentStep(input.data);
    
    case 'generate_receipt':
      return generateReceiptStep(input.data);
    
    case 'print_receipt':
      return printReceiptStep(input.data);
    
    case 'sync_inventory':
      return syncInventoryStep(input.data);
    
    case 'process_refund':
      return processRefundStep(input.data);
    
    default:
      throw new Error(`Unknown POS action: ${input.action}`);
  }
});

// Helper functions
async function savePOSOrder(posOrder: POSOrder): Promise<void> {
  // This would save to database
  console.log('Saving POS order:', posOrder.id);
}

async function getPOSOrder(posOrderId: string): Promise<POSOrder | null> {
  // This would retrieve from database
  return null;
}

async function updatePOSOrderStatus(posOrderId: string, status: string, metadata: any): Promise<void> {
  // This would update POS order status
  console.log(`Updating POS order ${posOrderId} status to ${status}`);
}

async function processCashPayment(amount: number): Promise<any> {
  // Process cash payment
  return {
    method: 'cash',
    amount,
    processed: true,
    transactionId: `cash_${Date.now()}`
  };
}

async function processCardPayment(amount: number, deviceId: string): Promise<any> {
  // Process card payment
  return {
    method: 'card',
    amount,
    processed: true,
    transactionId: `card_${Date.now()}`,
    deviceId
  };
}

async function processMobilePayment(amount: number, deviceId: string): Promise<any> {
  // Process mobile payment
  return {
    method: 'mobile',
    amount,
    processed: true,
    transactionId: `mobile_${Date.now()}`,
    deviceId
  };
}

function generateReceiptContent(posOrder: POSOrder): string {
  const header = `
    ================================
    RECEIPT #${posOrder.id}
    ================================
    Date: ${posOrder.createdAt.toLocaleDateString()}
    Time: ${posOrder.createdAt.toLocaleTimeString()}
    Device: ${posOrder.deviceId}
    ================================
  `;

  const items = posOrder.items.map(item => `
    ${item.productId} x${item.quantity}
    @ $${item.unitPrice.toFixed(2)} = $${item.totalPrice.toFixed(2)}
  `).join('');

  const totals = `
    ================================
    Subtotal: $${posOrder.subtotal.toFixed(2)}
    Discount: -$${posOrder.discount.toFixed(2)}
    Tax: $${posOrder.tax.toFixed(2)}
    ================================
    TOTAL: $${posOrder.total.toFixed(2)}
    ================================
    Payment: ${posOrder.paymentMethod.toUpperCase()}
    ================================
    Thank you for your business!
  `;

  return header + items + totals;
}

async function saveReceipt(receipt: Receipt): Promise<void> {
  // This would save to database
  console.log('Saving receipt:', receipt.id);
}

async function getReceipt(receiptId: string): Promise<Receipt | null> {
  // This would retrieve from database
  return null;
}

async function updateReceiptStatus(receiptId: string, updates: any): Promise<void> {
  // This would update receipt status
  console.log(`Updating receipt ${receiptId} status`);
}

async function sendToPrinter(content: string, deviceId: string): Promise<any> {
  // Send to POS printer
  console.log(`Printing receipt on device ${deviceId}:`, content);
  return { success: true, printed: true };
}

async function updateDeviceSync(deviceId: string): Promise<void> {
  // Update device sync timestamp
  console.log(`Updating device ${deviceId} sync timestamp`);
}

async function processRefundPayment(paymentMethod: string, amount: number): Promise<any> {
  // Process refund based on original payment method
  return {
    method: paymentMethod,
    amount,
    refunded: true,
    transactionId: `refund_${Date.now()}`
  };
}

export default posRecipe;
