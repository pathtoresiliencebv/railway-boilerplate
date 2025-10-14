import { createStep, createWorkflow, StepResponse } from "@medusajs/workflows-sdk";
import { Modules } from "@medusajs/framework/utils";
import { IProductModuleService, ICartModuleService, IInventoryModuleService } from "@medusajs/framework/types";

export interface BundleProduct {
  id: string
  name: string
  description: string
  products: Array<{
    productId: string
    variantId: string
    quantity: number
    isRequired: boolean
  }>
  bundlePrice: number
  discountPercentage: number
  isActive: boolean
  createdAt: Date
}

export interface BundleOrderInput {
  bundleId: string
  customerId: string
  quantity: number
  customizations?: Record<string, any>
}

const validateBundleAvailabilityStep = createStep(
  "validate-bundle-availability",
  async (input: BundleOrderInput, { container }) => {
    const productModuleService: IProductModuleService = container.resolve(Modules.PRODUCT);
    const inventoryModuleService: IInventoryModuleService = container.resolve(Modules.INVENTORY);
    
    try {
      // Get bundle configuration (this would be stored in product metadata or separate collection)
      const bundle = await getBundleConfiguration(input.bundleId);
      if (!bundle) {
        throw new Error(`Bundle ${input.bundleId} not found`);
      }

      if (!bundle.isActive) {
        throw new Error(`Bundle ${input.bundleId} is not active`);
      }

      // Check inventory for all required products
      const availabilityChecks = await Promise.all(
        bundle.products.map(async (bundleProduct) => {
          if (bundleProduct.isRequired) {
            const inventory = await inventoryModuleService.retrieveInventoryItem({
              inventory_item_id: bundleProduct.variantId
            });
            
            const availableQuantity = inventory.available_quantity || 0;
            const requiredQuantity = bundleProduct.quantity * input.quantity;
            
            if (availableQuantity < requiredQuantity) {
              throw new Error(
                `Insufficient inventory for product ${bundleProduct.productId}. ` +
                `Required: ${requiredQuantity}, Available: ${availableQuantity}`
              );
            }
          }
          
          return {
            productId: bundleProduct.productId,
            variantId: bundleProduct.variantId,
            available: true
          };
        })
      );

      return new StepResponse({
        bundle,
        availabilityChecks,
        isValid: true
      });
    } catch (error) {
      console.error('Error validating bundle availability:', error);
      throw error;
    }
  }
);

const calculateBundlePricingStep = createStep(
  "calculate-bundle-pricing",
  async (input: { bundle: BundleProduct; quantity: number }, { container }) => {
    const productModuleService: IProductModuleService = container.resolve(Modules.PRODUCT);
    
    try {
      const { bundle, quantity } = input;
      
      // Calculate individual product prices
      const productPrices = await Promise.all(
        bundle.products.map(async (bundleProduct) => {
          const product = await productModuleService.retrieveProduct(bundleProduct.productId);
          const variant = product.variants?.find(v => v.id === bundleProduct.variantId);
          const price = variant?.prices?.[0]?.amount || 0;
          
          return {
            productId: bundleProduct.productId,
            variantId: bundleProduct.variantId,
            unitPrice: price,
            quantity: bundleProduct.quantity,
            totalPrice: price * bundleProduct.quantity
          };
        })
      );

      // Calculate total individual prices
      const totalIndividualPrice = productPrices.reduce((sum, item) => sum + item.totalPrice, 0);
      
      // Calculate bundle discount
      const bundleDiscount = (totalIndividualPrice * bundle.discountPercentage) / 100;
      const bundlePrice = totalIndividualPrice - bundleDiscount;
      
      // Calculate final pricing
      const finalPrice = bundlePrice * quantity;
      const totalSavings = bundleDiscount * quantity;

      return new StepResponse({
        productPrices,
        totalIndividualPrice,
        bundleDiscount,
        bundlePrice,
        finalPrice,
        totalSavings,
        quantity
      });
    } catch (error) {
      console.error('Error calculating bundle pricing:', error);
      throw error;
    }
  }
);

const createBundleOrderStep = createStep(
  "create-bundle-order",
  async (input: {
    bundleId: string;
    customerId: string;
    quantity: number;
    pricing: any;
    customizations?: Record<string, any>;
  }, { container }) => {
    const cartModuleService: ICartModuleService = container.resolve(Modules.CART);
    
    try {
      // Create or get customer cart
      let cart = await cartModuleService.createCarts({
        customer_id: input.customerId
      });

      // Add bundle items to cart
      const lineItems = input.pricing.productPrices.map((item: any) => ({
        variant_id: item.variantId,
        quantity: item.quantity * input.quantity,
        unit_price: item.unitPrice,
        metadata: {
          bundle_id: input.bundleId,
          bundle_item: true,
          customizations: input.customizations
        }
      }));

      await cartModuleService.addLineItems(cart.id, lineItems);

      // Apply bundle discount
      await cartModuleService.updateCarts(cart.id, {
        metadata: {
          ...cart.metadata,
          bundle_discount: input.pricing.totalSavings,
          bundle_id: input.bundleId,
          bundle_quantity: input.quantity
        }
      });

      return new StepResponse({
        cartId: cart.id,
        bundleId: input.bundleId,
        totalSavings: input.pricing.totalSavings,
        finalPrice: input.pricing.finalPrice
      });
    } catch (error) {
      console.error('Error creating bundle order:', error);
      throw error;
    }
  }
);

const reserveBundleInventoryStep = createStep(
  "reserve-bundle-inventory",
  async (input: {
    bundleId: string;
    quantity: number;
    cartId: string;
  }, { container }) => {
    const inventoryModuleService: IInventoryModuleService = container.resolve(Modules.INVENTORY);
    
    try {
      const bundle = await getBundleConfiguration(input.bundleId);
      if (!bundle) {
        throw new Error(`Bundle ${input.bundleId} not found`);
      }

      // Reserve inventory for all bundle products
      const reservations = await Promise.all(
        bundle.products.map(async (bundleProduct) => {
          if (bundleProduct.isRequired) {
            const reservation = await inventoryModuleService.createReservationItems({
              inventory_item_id: bundleProduct.variantId,
              location_id: "default", // This would be dynamic based on business logic
              quantity: bundleProduct.quantity * input.quantity,
              description: `Bundle ${input.bundleId} reservation`,
              metadata: {
                bundle_id: input.bundleId,
                cart_id: input.cartId
              }
            });
            
            return reservation;
          }
          return null;
        })
      );

      return new StepResponse({
        reservations: reservations.filter(r => r !== null),
        bundleId: input.bundleId,
        quantity: input.quantity
      });
    } catch (error) {
      console.error('Error reserving bundle inventory:', error);
      throw error;
    }
  }
);

export const productBundleRecipe = createWorkflow<
  BundleOrderInput,
  {
    cartId: string;
    bundleId: string;
    totalSavings: number;
    finalPrice: number;
    reservations: any[];
  }
>("product-bundle-recipe", function (input) {
  const validationResult = validateBundleAvailabilityStep(input);
  
  const pricingResult = calculateBundlePricingStep({
    bundle: validationResult.bundle,
    quantity: input.quantity
  });
  
  const orderResult = createBundleOrderStep({
    bundleId: input.bundleId,
    customerId: input.customerId,
    quantity: input.quantity,
    pricing: pricingResult,
    customizations: input.customizations
  });
  
  const inventoryResult = reserveBundleInventoryStep({
    bundleId: input.bundleId,
    quantity: input.quantity,
    cartId: orderResult.cartId
  });

  return {
    cartId: orderResult.cartId,
    bundleId: input.bundleId,
    totalSavings: orderResult.totalSavings,
    finalPrice: orderResult.finalPrice,
    reservations: inventoryResult.reservations
  };
});

// Helper function to get bundle configuration
async function getBundleConfiguration(bundleId: string): Promise<BundleProduct | null> {
  // This would retrieve from database or product metadata
  // For now, return a mock bundle
  return {
    id: bundleId,
    name: "Sample Bundle",
    description: "A sample product bundle",
    products: [
      {
        productId: "prod_123",
        variantId: "variant_123",
        quantity: 1,
        isRequired: true
      },
      {
        productId: "prod_456",
        variantId: "variant_456",
        quantity: 2,
        isRequired: false
      }
    ],
    bundlePrice: 99.99,
    discountPercentage: 15,
    isActive: true,
    createdAt: new Date()
  };
}

export default productBundleRecipe;
