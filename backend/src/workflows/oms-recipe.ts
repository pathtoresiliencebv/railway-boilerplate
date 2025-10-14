import { createStep, createWorkflow, StepResponse } from "@medusajs/workflows-sdk";
import { Modules } from "@medusajs/framework/utils";
import { IOrderModuleService, IFulfillmentModuleService, IInventoryModuleService, IStockLocationModuleService } from "@medusajs/framework/types";

export interface Warehouse {
  id: string
  name: string
  address: any
  isActive: boolean
  capacity: number
  currentStock: number
  priority: number
}

export interface OrderRoute {
  orderId: string
  warehouseId: string
  items: Array<{
    productId: string
    variantId: string
    quantity: number
    warehouseId: string
  }>
  estimatedFulfillment: Date
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'
}

export interface SplitShipment {
  id: string
  orderId: string
  shipments: Array<{
    warehouseId: string
    items: any[]
    trackingNumber?: string
    status: 'pending' | 'shipped' | 'delivered'
  }>
  createdAt: Date
}

const analyzeOrderRequirementsStep = createStep(
  "analyze-order-requirements",
  async (input: {
    orderId: string;
    items: any[];
  }, { container }) => {
    const inventoryModuleService: IInventoryModuleService = container.resolve(Modules.INVENTORY);
    const stockLocationModuleService: IStockLocationModuleService = container.resolve(Modules.STOCK_LOCATION);
    
    try {
      // Analyze each item in the order
      const itemAnalysis = await Promise.all(
        input.items.map(async (item) => {
          // Check inventory across all warehouses
          const inventory = await inventoryModuleService.retrieveInventoryItem({
            inventory_item_id: item.variantId
          });

          // Find available warehouses for this item
          const warehouses = await getWarehousesForItem(item.variantId);
          
          return {
            productId: item.productId,
            variantId: item.variantId,
            requiredQuantity: item.quantity,
            availableWarehouses: warehouses,
            totalAvailable: warehouses.reduce((sum, w) => sum + w.availableQuantity, 0),
            canFulfill: warehouses.reduce((sum, w) => sum + w.availableQuantity, 0) >= item.quantity
          };
        })
      );

      // Determine if order can be fulfilled from single warehouse
      const singleWarehouseFulfillment = findSingleWarehouseFulfillment(itemAnalysis);
      
      // Determine if order needs to be split across warehouses
      const splitFulfillment = singleWarehouseFulfillment ? null : findSplitFulfillment(itemAnalysis);

      return new StepResponse({
        orderId: input.orderId,
        itemAnalysis,
        singleWarehouseFulfillment,
        splitFulfillment,
        canFulfill: itemAnalysis.every(item => item.canFulfill)
      });
    } catch (error) {
      console.error('Error analyzing order requirements:', error);
      throw error;
    }
  }
);

const assignOrderToWarehouseStep = createStep(
  "assign-order-to-warehouse",
  async (input: {
    orderId: string;
    warehouseId: string;
    items: any[];
    priority: string;
  }, { container }) => {
    try {
      // Create order route
      const orderRoute: OrderRoute = {
        orderId: input.orderId,
        warehouseId: input.warehouseId,
        items: input.items.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          warehouseId: input.warehouseId
        })),
        estimatedFulfillment: calculateEstimatedFulfillment(input.warehouseId, input.items),
        priority: input.priority as any,
        status: 'assigned'
      };

      // Save order route
      await saveOrderRoute(orderRoute);

      // Reserve inventory at warehouse
      await reserveInventoryAtWarehouse(input.warehouseId, input.items);

      return new StepResponse({
        orderRoute,
        assigned: true
      });
    } catch (error) {
      console.error('Error assigning order to warehouse:', error);
      throw error;
    }
  }
);

const createSplitShipmentStep = createStep(
  "create-split-shipment",
  async (input: {
    orderId: string;
    splitFulfillment: any;
  }, { container }) => {
    try {
      // Create split shipment
      const splitShipment: SplitShipment = {
        id: `split_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        orderId: input.orderId,
        shipments: input.splitFulfillment.warehouses.map((warehouse: any) => ({
          warehouseId: warehouse.warehouseId,
          items: warehouse.items,
          status: 'pending'
        })),
        createdAt: new Date()
      };

      // Save split shipment
      await saveSplitShipment(splitShipment);

      // Reserve inventory at each warehouse
      for (const shipment of splitShipment.shipments) {
        await reserveInventoryAtWarehouse(shipment.warehouseId, shipment.items);
      }

      return new StepResponse({
        splitShipment,
        created: true
      });
    } catch (error) {
      console.error('Error creating split shipment:', error);
      throw error;
    }
  }
);

const optimizeOrderRoutingStep = createStep(
  "optimize-order-routing",
  async (input: {
    orderId: string;
    itemAnalysis: any[];
  }, { container }) => {
    try {
      // Optimize routing based on:
      // 1. Warehouse capacity
      // 2. Distance to customer
      // 3. Shipping costs
      // 4. Priority level
      
      const optimization = {
        orderId: input.orderId,
        recommendedWarehouses: await getRecommendedWarehouses(input.itemAnalysis),
        estimatedShippingCost: await calculateShippingCost(input.itemAnalysis),
        estimatedDeliveryTime: await calculateDeliveryTime(input.itemAnalysis),
        optimizationScore: await calculateOptimizationScore(input.itemAnalysis)
      };

      return new StepResponse({
        optimization,
        optimized: true
      });
    } catch (error) {
      console.error('Error optimizing order routing:', error);
      throw error;
    }
  }
);

const updateOrderStatusStep = createStep(
  "update-order-status",
  async (input: {
    orderId: string;
    status: string;
    warehouseId?: string;
    trackingNumber?: string;
  }, { container }) => {
    const orderModuleService: IOrderModuleService = container.resolve(Modules.ORDER);
    
    try {
      // Update order status
      await orderModuleService.updateOrders(input.orderId, {
        status: input.status,
        metadata: {
          warehouse_id: input.warehouseId,
          tracking_number: input.trackingNumber,
          status_updated_at: new Date()
        }
      });

      // Update order route status if applicable
      if (input.warehouseId) {
        await updateOrderRouteStatus(input.orderId, input.warehouseId, input.status);
      }

      return new StepResponse({
        orderId: input.orderId,
        status: input.status,
        updated: true
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }
);

export const omsRecipe = createWorkflow<
  {
    orderId: string;
    items: any[];
    priority?: string;
  },
  {
    orderId: string;
    canFulfill: boolean;
    orderRoute?: OrderRoute;
    splitShipment?: SplitShipment;
    optimization?: any;
  }
>("oms-recipe", function (input) {
  const analysisResult = analyzeOrderRequirementsStep({
    orderId: input.orderId,
    items: input.items
  });
  
  const optimizationResult = optimizeOrderRoutingStep({
    orderId: input.orderId,
    itemAnalysis: analysisResult.itemAnalysis
  });

  // Branch based on fulfillment type
  if (analysisResult.singleWarehouseFulfillment) {
    const assignmentResult = assignOrderToWarehouseStep({
      orderId: input.orderId,
      warehouseId: analysisResult.singleWarehouseFulfillment.warehouseId,
      items: input.items,
      priority: input.priority || 'medium'
    });

    return {
      orderId: input.orderId,
      canFulfill: analysisResult.canFulfill,
      orderRoute: assignmentResult.orderRoute,
      optimization: optimizationResult.optimization
    };
  } else if (analysisResult.splitFulfillment) {
    const splitResult = createSplitShipmentStep({
      orderId: input.orderId,
      splitFulfillment: analysisResult.splitFulfillment
    });

    return {
      orderId: input.orderId,
      canFulfill: analysisResult.canFulfill,
      splitShipment: splitResult.splitShipment,
      optimization: optimizationResult.optimization
    };
  } else {
    return {
      orderId: input.orderId,
      canFulfill: false,
      optimization: optimizationResult.optimization
    };
  }
});

// Helper functions
async function getWarehousesForItem(variantId: string): Promise<Array<{
  warehouseId: string;
  availableQuantity: number;
  distance: number;
}>> {
  // This would retrieve warehouse availability for item
  return [
    {
      warehouseId: 'warehouse_1',
      availableQuantity: 10,
      distance: 5.2
    },
    {
      warehouseId: 'warehouse_2',
      availableQuantity: 5,
      distance: 8.7
    }
  ];
}

function findSingleWarehouseFulfillment(itemAnalysis: any[]): any | null {
  // Find a single warehouse that can fulfill all items
  const warehouseMap = new Map();
  
  for (const item of itemAnalysis) {
    for (const warehouse of item.availableWarehouses) {
      if (!warehouseMap.has(warehouse.warehouseId)) {
        warehouseMap.set(warehouse.warehouseId, {
          warehouseId: warehouse.warehouseId,
          items: [],
          totalDistance: 0
        });
      }
      
      const warehouseData = warehouseMap.get(warehouse.warehouseId);
      warehouseData.items.push({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.requiredQuantity,
        availableQuantity: warehouse.availableQuantity
      });
      warehouseData.totalDistance += warehouse.distance;
    }
  }

  // Find warehouse that can fulfill all items
  for (const [warehouseId, data] of warehouseMap) {
    if (data.items.every((item: any) => item.availableQuantity >= item.quantity)) {
      return {
        warehouseId,
        items: data.items,
        totalDistance: data.totalDistance
      };
    }
  }

  return null;
}

function findSplitFulfillment(itemAnalysis: any[]): any {
  // Create split fulfillment plan
  const warehouses = new Map();
  
  for (const item of itemAnalysis) {
    for (const warehouse of item.availableWarehouses) {
      if (!warehouses.has(warehouse.warehouseId)) {
        warehouses.set(warehouse.warehouseId, {
          warehouseId: warehouse.warehouseId,
          items: []
        });
      }
      
      const warehouseData = warehouses.get(warehouse.warehouseId);
      const fulfillQuantity = Math.min(item.requiredQuantity, warehouse.availableQuantity);
      
      if (fulfillQuantity > 0) {
        warehouseData.items.push({
          productId: item.productId,
          variantId: item.variantId,
          quantity: fulfillQuantity
        });
      }
    }
  }

  return {
    warehouses: Array.from(warehouses.values())
  };
}

function calculateEstimatedFulfillment(warehouseId: string, items: any[]): Date {
  // Calculate estimated fulfillment time based on warehouse capacity and items
  const baseTime = 2; // 2 days base
  const itemComplexity = items.length * 0.5; // 0.5 days per item
  const totalDays = baseTime + itemComplexity;
  
  return new Date(Date.now() + totalDays * 24 * 60 * 60 * 1000);
}

async function saveOrderRoute(orderRoute: OrderRoute): Promise<void> {
  // This would save to database
  console.log('Saving order route:', orderRoute.orderId);
}

async function saveSplitShipment(splitShipment: SplitShipment): Promise<void> {
  // This would save to database
  console.log('Saving split shipment:', splitShipment.id);
}

async function reserveInventoryAtWarehouse(warehouseId: string, items: any[]): Promise<void> {
  // This would reserve inventory at warehouse
  console.log(`Reserving inventory at warehouse ${warehouseId}:`, items);
}

async function getRecommendedWarehouses(itemAnalysis: any[]): Promise<string[]> {
  // This would return recommended warehouses based on optimization
  return ['warehouse_1', 'warehouse_2'];
}

async function calculateShippingCost(itemAnalysis: any[]): Promise<number> {
  // This would calculate shipping cost
  return 15.99;
}

async function calculateDeliveryTime(itemAnalysis: any[]): Promise<number> {
  // This would calculate delivery time in days
  return 3;
}

async function calculateOptimizationScore(itemAnalysis: any[]): Promise<number> {
  // This would calculate optimization score (0-100)
  return 85;
}

async function updateOrderRouteStatus(orderId: string, warehouseId: string, status: string): Promise<void> {
  // This would update order route status
  console.log(`Updating order route status for ${orderId} at ${warehouseId}: ${status}`);
}

export default omsRecipe;
