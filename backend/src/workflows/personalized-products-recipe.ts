import { createStep, createWorkflow, StepResponse } from "@medusajs/workflows-sdk";
import { Modules } from "@medusajs/framework/utils";
import { IProductModuleService, ICartModuleService, ICustomerModuleService } from "@medusajs/framework/types";

export interface PersonalizationOption {
  id: string
  name: string
  type: 'text' | 'image' | 'color' | 'size' | 'material'
  required: boolean
  priceModifier: number
  validation?: {
    minLength?: number
    maxLength?: number
    pattern?: string
    allowedValues?: string[]
  }
}

export interface PersonalizedProduct {
  id: string
  baseProductId: string
  personalizationOptions: PersonalizationOption[]
  isActive: boolean
  createdAt: Date
}

export interface PersonalizationRequest {
  productId: string
  customerId: string
  personalizations: Record<string, any>
  customizations: Record<string, any>
}

const validatePersonalizationStep = createStep(
  "validate-personalization",
  async (input: PersonalizationRequest, { container }) => {
    const productModuleService: IProductModuleService = container.resolve(Modules.PRODUCT);
    
    try {
      // Get personalized product configuration
      const personalizedProduct = await getPersonalizedProduct(input.productId);
      if (!personalizedProduct) {
        throw new Error(`Personalized product ${input.productId} not found`);
      }

      if (!personalizedProduct.isActive) {
        throw new Error(`Personalized product ${input.productId} is not active`);
      }

      // Validate each personalization
      const validationResults = [];
      let totalPriceModifier = 0;

      for (const option of personalizedProduct.personalizationOptions) {
        const value = input.personalizations[option.id];
        
        if (option.required && (!value || value === '')) {
          throw new Error(`${option.name} is required`);
        }

        if (value) {
          // Validate based on option type
          const validation = validatePersonalizationValue(option, value);
          if (!validation.isValid) {
            throw new Error(validation.error);
          }

          totalPriceModifier += option.priceModifier;
        }

        validationResults.push({
          optionId: option.id,
          optionName: option.name,
          value,
          isValid: true,
          priceModifier: option.priceModifier
        });
      }

      return new StepResponse({
        personalizedProduct,
        validationResults,
        totalPriceModifier,
        isValid: true
      });
    } catch (error) {
      console.error('Error validating personalization:', error);
      throw error;
    }
  }
);

const calculatePersonalizedPricingStep = createStep(
  "calculate-personalized-pricing",
  async (input: {
    productId: string;
    totalPriceModifier: number;
    quantity: number;
  }, { container }) => {
    const productModuleService: IProductModuleService = container.resolve(Modules.PRODUCT);
    
    try {
      const product = await productModuleService.retrieveProduct(input.productId);
      const basePrice = product.variants?.[0]?.prices?.[0]?.amount || 0;
      
      // Calculate personalized pricing
      const personalizedPrice = basePrice + input.totalPriceModifier;
      const totalPrice = personalizedPrice * input.quantity;
      
      return new StepResponse({
        basePrice,
        personalizedPrice,
        totalPrice,
        priceModifier: input.totalPriceModifier,
        quantity: input.quantity
      });
    } catch (error) {
      console.error('Error calculating personalized pricing:', error);
      throw error;
    }
  }
);

const createPersonalizedCartItemStep = createStep(
  "create-personalized-cart-item",
  async (input: {
    productId: string;
    customerId: string;
    personalizations: Record<string, any>;
    customizations: Record<string, any>;
    pricing: any;
    cartId: string;
  }, { container }) => {
    const cartModuleService: ICartModuleService = container.resolve(Modules.CART);
    
    try {
      // Create personalized cart item
      const lineItem = {
        variant_id: input.productId, // This would be the personalized variant ID
        quantity: 1,
        unit_price: input.pricing.personalizedPrice,
        metadata: {
          personalized: true,
          personalizations: input.personalizations,
          customizations: input.customizations,
          price_modifier: input.pricing.priceModifier,
          base_price: input.pricing.basePrice
        }
      };

      await cartModuleService.addLineItems(input.cartId, [lineItem]);

      return new StepResponse({
        cartId: input.cartId,
        personalizedItem: lineItem,
        totalPrice: input.pricing.totalPrice
      });
    } catch (error) {
      console.error('Error creating personalized cart item:', error);
      throw error;
    }
  }
);

const generatePersonalizationPreviewStep = createStep(
  "generate-personalization-preview",
  async (input: {
    productId: string;
    personalizations: Record<string, any>;
    customizations: Record<string, any>;
  }, { container }) => {
    try {
      // Generate preview of personalized product
      const preview = {
        productId: input.productId,
        personalizations: input.personalizations,
        customizations: input.customizations,
        previewImage: await generatePreviewImage(input.productId, input.personalizations),
        previewText: generatePreviewText(input.personalizations),
        createdAt: new Date()
      };

      return new StepResponse({
        preview,
        previewGenerated: true
      });
    } catch (error) {
      console.error('Error generating personalization preview:', error);
      throw error;
    }
  }
);

const savePersonalizationStep = createStep(
  "save-personalization",
  async (input: {
    customerId: string;
    productId: string;
    personalizations: Record<string, any>;
    customizations: Record<string, any>;
    pricing: any;
  }, { container }) => {
    try {
      // Save personalization for future reference
      const personalization = {
        id: `pers_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        customerId: input.customerId,
        productId: input.productId,
        personalizations: input.personalizations,
        customizations: input.customizations,
        pricing: input.pricing,
        createdAt: new Date()
      };

      await savePersonalization(personalization);

      return new StepResponse({
        personalizationId: personalization.id,
        saved: true
      });
    } catch (error) {
      console.error('Error saving personalization:', error);
      throw error;
    }
  }
);

export const personalizedProductsRecipe = createWorkflow<
  PersonalizationRequest & {
    cartId: string;
    quantity: number;
  },
  {
    cartId: string;
    personalizedItem: any;
    totalPrice: number;
    personalizationId: string;
    preview: any;
  }
>("personalized-products-recipe", function (input) {
  const validationResult = validatePersonalizationStep({
    productId: input.productId,
    customerId: input.customerId,
    personalizations: input.personalizations,
    customizations: input.customizations
  });
  
  const pricingResult = calculatePersonalizedPricingStep({
    productId: input.productId,
    totalPriceModifier: validationResult.totalPriceModifier,
    quantity: input.quantity
  });
  
  const cartItemResult = createPersonalizedCartItemStep({
    productId: input.productId,
    customerId: input.customerId,
    personalizations: input.personalizations,
    customizations: input.customizations,
    pricing: pricingResult,
    cartId: input.cartId
  });
  
  const previewResult = generatePersonalizationPreviewStep({
    productId: input.productId,
    personalizations: input.personalizations,
    customizations: input.customizations
  });
  
  const saveResult = savePersonalizationStep({
    customerId: input.customerId,
    productId: input.productId,
    personalizations: input.personalizations,
    customizations: input.customizations,
    pricing: pricingResult
  });

  return {
    cartId: cartItemResult.cartId,
    personalizedItem: cartItemResult.personalizedItem,
    totalPrice: cartItemResult.totalPrice,
    personalizationId: saveResult.personalizationId,
    preview: previewResult.preview
  };
});

// Helper functions
async function getPersonalizedProduct(productId: string): Promise<PersonalizedProduct | null> {
  // This would retrieve from database
  // For now, return a mock personalized product
  return {
    id: productId,
    baseProductId: productId,
    personalizationOptions: [
      {
        id: 'engraving',
        name: 'Engraving Text',
        type: 'text',
        required: true,
        priceModifier: 5.00,
        validation: {
          minLength: 1,
          maxLength: 50
        }
      },
      {
        id: 'color',
        name: 'Color',
        type: 'color',
        required: false,
        priceModifier: 0,
        validation: {
          allowedValues: ['red', 'blue', 'green', 'black']
        }
      }
    ],
    isActive: true,
    createdAt: new Date()
  };
}

function validatePersonalizationValue(option: PersonalizationOption, value: any): {
  isValid: boolean;
  error?: string;
} {
  if (option.validation) {
    if (option.validation.minLength && value.length < option.validation.minLength) {
      return { isValid: false, error: `${option.name} must be at least ${option.validation.minLength} characters` };
    }
    
    if (option.validation.maxLength && value.length > option.validation.maxLength) {
      return { isValid: false, error: `${option.name} must be no more than ${option.validation.maxLength} characters` };
    }
    
    if (option.validation.pattern && !new RegExp(option.validation.pattern).test(value)) {
      return { isValid: false, error: `${option.name} format is invalid` };
    }
    
    if (option.validation.allowedValues && !option.validation.allowedValues.includes(value)) {
      return { isValid: false, error: `${option.name} must be one of: ${option.validation.allowedValues.join(', ')}` };
    }
  }
  
  return { isValid: true };
}

async function generatePreviewImage(productId: string, personalizations: Record<string, any>): Promise<string> {
  // This would generate a preview image based on personalizations
  // For now, return a placeholder URL
  return `${process.env.BACKEND_URL}/static/previews/${productId}_${Date.now()}.jpg`;
}

function generatePreviewText(personalizations: Record<string, any>): string {
  const parts = [];
  
  for (const [key, value] of Object.entries(personalizations)) {
    if (value) {
      parts.push(`${key}: ${value}`);
    }
  }
  
  return parts.join(', ');
}

async function savePersonalization(personalization: any): Promise<void> {
  // This would save to database
  console.log('Saving personalization:', personalization.id);
}

export default personalizedProductsRecipe;
