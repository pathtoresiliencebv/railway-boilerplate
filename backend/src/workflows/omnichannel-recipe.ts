import { createStep, createWorkflow, StepResponse } from "@medusajs/workflows-sdk";
import { Modules } from "@medusajs/framework/utils";
import { IOrderModuleService, IInventoryModuleService, ICustomerModuleService, ISalesChannelModuleService } from "@medusajs/framework/types";

export interface Channel {
  id: string
  name: string
  type: 'online' | 'store' | 'marketplace' | 'social'
  isActive: boolean
  inventorySync: boolean
  orderSync: boolean
  customerSync: boolean
}

export interface OmnichannelOrder {
  id: string
  channelId: string
  customerId: string
  items: Array<{
    productId: string
    variantId: string
    quantity: number
    channel: string
  }>
  status: 'pending' | 'confirmed' | 'fulfilled' | 'cancelled'
  createdAt: Date
}

export interface InventorySync {
  productId: string
  variantId: string
  channels: Array<{
    channelId: string
    availableQuantity: number
    reservedQuantity: number
  }>
  lastSynced: Date
}

const syncInventoryAcrossChannelsStep = createStep(
  "sync-inventory-across-channels",
  async (input: {
    productId: string;
    variantId: string;
    quantityChange: number;
  }, { container }) => {
    const inventoryModuleService: IInventoryModuleService = container.resolve(Modules.INVENTORY);
    const salesChannelModuleService: ISalesChannelModuleService = container.resolve(Modules.SALES_CHANNEL);
    
    try {
      // Get all active channels
      const channels = await getActiveChannels();
      const inventorySyncs: InventorySync[] = [];

      for (const channel of channels) {
        if (channel.inventorySync) {
          // Update inventory for this channel
          const inventoryItem = await inventoryModuleService.retrieveInventoryItem({
            inventory_item_id: input.variantId
          });

          const currentQuantity = inventoryItem.available_quantity || 0;
          const newQuantity = currentQuantity + input.quantityChange;

          // Update inventory
          await inventoryModuleService.updateInventoryItems(input.variantId, {
            available_quantity: newQuantity
          });

          inventorySyncs.push({
            productId: input.productId,
            variantId: input.variantId,
            channels: [{
              channelId: channel.id,
              availableQuantity: newQuantity,
              reservedQuantity: inventoryItem.reserved_quantity || 0
            }],
            lastSynced: new Date()
          });
        }
      }

      return new StepResponse({
        inventorySyncs,
        totalChannels: channels.length,
        syncedChannels: inventorySyncs.length
      });
    } catch (error) {
      console.error('Error syncing inventory across channels:', error);
      throw error;
    }
  }
);

const syncCustomerDataStep = createStep(
  "sync-customer-data",
  async (input: {
    customerId: string;
    channelId: string;
    customerData: any;
  }, { container }) => {
    const customerModuleService: ICustomerModuleService = container.resolve(Modules.CUSTOMER);
    
    try {
      // Get customer
      const customer = await customerModuleService.retrieveCustomer(input.customerId);
      
      // Update customer metadata with channel-specific data
      const channelData = customer.metadata?.channel_data || {};
      channelData[input.channelId] = {
        ...input.customerData,
        lastSynced: new Date()
      };

      await customerModuleService.updateCustomers(input.customerId, {
        metadata: {
          ...customer.metadata,
          channel_data: channelData
        }
      });

      return new StepResponse({
        customerId: input.customerId,
        channelId: input.channelId,
        synced: true
      });
    } catch (error) {
      console.error('Error syncing customer data:', error);
      throw error;
    }
  }
);

const processOmnichannelOrderStep = createStep(
  "process-omnichannel-order",
  async (input: {
    orderId: string;
    channelId: string;
    customerId: string;
    items: any[];
  }, { container }) => {
    const orderModuleService: IOrderModuleService = container.resolve(Modules.ORDER);
    
    try {
      // Create omnichannel order
      const omnichannelOrder: OmnichannelOrder = {
        id: `omni_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        channelId: input.channelId,
        customerId: input.customerId,
        items: input.items.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          channel: input.channelId
        })),
        status: 'pending',
        createdAt: new Date()
      };

      // Update original order with omnichannel metadata
      await orderModuleService.updateOrders(input.orderId, {
        metadata: {
          omnichannel_order_id: omnichannelOrder.id,
          channel_id: input.channelId,
          omnichannel_processed: true
        }
      });

      // Save omnichannel order
      await saveOmnichannelOrder(omnichannelOrder);

      return new StepResponse({
        omnichannelOrder,
        orderId: input.orderId,
        processed: true
      });
    } catch (error) {
      console.error('Error processing omnichannel order:', error);
      throw error;
    }
  }
);

const syncOrderStatusStep = createStep(
  "sync-order-status",
  async (input: {
    orderId: string;
    status: string;
    channelId: string;
  }, { container }) => {
    const orderModuleService: IOrderModuleService = container.resolve(Modules.ORDER);
    
    try {
      // Update order status
      await orderModuleService.updateOrders(input.orderId, {
        status: input.status,
        metadata: {
          last_status_sync: new Date(),
          sync_channel: input.channelId
        }
      });

      // Sync status across all channels
      const channels = await getActiveChannels();
      const syncResults = [];

      for (const channel of channels) {
        if (channel.orderSync) {
          try {
            await syncOrderStatusToChannel(input.orderId, input.status, channel.id);
            syncResults.push({
              channelId: channel.id,
              success: true
            });
          } catch (error) {
            console.error(`Error syncing to channel ${channel.id}:`, error);
            syncResults.push({
              channelId: channel.id,
              success: false,
              error: error.message
            });
          }
        }
      }

      return new StepResponse({
        orderId: input.orderId,
        status: input.status,
        syncResults,
        syncedChannels: syncResults.filter(r => r.success).length
      });
    } catch (error) {
      console.error('Error syncing order status:', error);
      throw error;
    }
  }
);

const generateOmnichannelReportStep = createStep(
  "generate-omnichannel-report",
  async (input: {
    startDate: Date;
    endDate: Date;
    channelId?: string;
  }, { container }) => {
    try {
      // Generate omnichannel performance report
      const report = {
        period: {
          startDate: input.startDate,
          endDate: input.endDate
        },
        channels: await getChannelPerformance(input.startDate, input.endDate),
        totalOrders: await getTotalOrders(input.startDate, input.endDate),
        totalRevenue: await getTotalRevenue(input.startDate, input.endDate),
        customerMetrics: await getCustomerMetrics(input.startDate, input.endDate),
        generatedAt: new Date()
      };

      return new StepResponse({
        report,
        generated: true
      });
    } catch (error) {
      console.error('Error generating omnichannel report:', error);
      throw error;
    }
  }
);

export const omnichannelRecipe = createWorkflow<
  {
    action: 'sync_inventory' | 'sync_customer' | 'process_order' | 'sync_status' | 'generate_report';
    data: any;
  },
  any
>("omnichannel-recipe", function (input) {
  switch (input.action) {
    case 'sync_inventory':
      return syncInventoryAcrossChannelsStep(input.data);
    
    case 'sync_customer':
      return syncCustomerDataStep(input.data);
    
    case 'process_order':
      return processOmnichannelOrderStep(input.data);
    
    case 'sync_status':
      return syncOrderStatusStep(input.data);
    
    case 'generate_report':
      return generateOmnichannelReportStep(input.data);
    
    default:
      throw new Error(`Unknown omnichannel action: ${input.action}`);
  }
});

// Helper functions
async function getActiveChannels(): Promise<Channel[]> {
  // This would retrieve from database
  return [
    {
      id: 'online',
      name: 'Online Store',
      type: 'online',
      isActive: true,
      inventorySync: true,
      orderSync: true,
      customerSync: true
    },
    {
      id: 'store_1',
      name: 'Main Store',
      type: 'store',
      isActive: true,
      inventorySync: true,
      orderSync: true,
      customerSync: true
    },
    {
      id: 'marketplace_amazon',
      name: 'Amazon Marketplace',
      type: 'marketplace',
      isActive: true,
      inventorySync: true,
      orderSync: false,
      customerSync: false
    }
  ];
}

async function saveOmnichannelOrder(order: OmnichannelOrder): Promise<void> {
  // This would save to database
  console.log('Saving omnichannel order:', order.id);
}

async function syncOrderStatusToChannel(orderId: string, status: string, channelId: string): Promise<void> {
  // This would sync order status to external channel
  console.log(`Syncing order ${orderId} status ${status} to channel ${channelId}`);
}

async function getChannelPerformance(startDate: Date, endDate: Date): Promise<any[]> {
  // This would retrieve channel performance data
  return [];
}

async function getTotalOrders(startDate: Date, endDate: Date): Promise<number> {
  // This would count total orders in period
  return 0;
}

async function getTotalRevenue(startDate: Date, endDate: Date): Promise<number> {
  // This would calculate total revenue in period
  return 0;
}

async function getCustomerMetrics(startDate: Date, endDate: Date): Promise<any> {
  // This would retrieve customer metrics
  return {};
}

export default omnichannelRecipe;
