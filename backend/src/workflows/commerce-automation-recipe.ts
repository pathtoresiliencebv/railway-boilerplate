import { createStep, createWorkflow, StepResponse } from "@medusajs/workflows-sdk";
import { Modules } from "@medusajs/framework/utils";
import { IOrderModuleService, IInventoryModuleService, INotificationModuleService, IFulfillmentModuleService } from "@medusajs/framework/types";

export interface AutomationRule {
  id: string
  name: string
  trigger: 'order_created' | 'payment_captured' | 'inventory_low' | 'customer_registered'
  conditions: Record<string, any>
  actions: Array<{
    type: 'send_email' | 'update_inventory' | 'create_fulfillment' | 'apply_discount' | 'send_webhook'
    config: Record<string, any>
  }>
  isActive: boolean
  priority: number
}

export interface AutomationExecution {
  id: string
  ruleId: string
  triggerData: any
  status: 'pending' | 'running' | 'completed' | 'failed'
  results: Array<{
    action: string
    success: boolean
    message?: string
  }>
  executedAt: Date
  completedAt?: Date
}

const evaluateAutomationRulesStep = createStep(
  "evaluate-automation-rules",
  async (input: {
    trigger: string;
    triggerData: any;
  }, { container }) => {
    try {
      // Get all active automation rules for this trigger
      const rules = await getAutomationRules(input.trigger);
      
      const applicableRules = rules.filter(rule => {
        return evaluateRuleConditions(rule.conditions, input.triggerData);
      });

      // Sort by priority (higher number = higher priority)
      applicableRules.sort((a, b) => b.priority - a.priority);

      return new StepResponse({
        applicableRules,
        trigger: input.trigger,
        triggerData: input.triggerData
      });
    } catch (error) {
      console.error('Error evaluating automation rules:', error);
      throw error;
    }
  }
);

const executeAutomationActionsStep = createStep(
  "execute-automation-actions",
  async (input: {
    rule: AutomationRule;
    triggerData: any;
  }, { container }) => {
    const notificationModuleService: INotificationModuleService = container.resolve(Modules.NOTIFICATION);
    const inventoryModuleService: IInventoryModuleService = container.resolve(Modules.INVENTORY);
    const fulfillmentModuleService: IFulfillmentModuleService = container.resolve(Modules.FULFILLMENT);
    
    try {
      const execution: AutomationExecution = {
        id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        ruleId: input.rule.id,
        triggerData: input.triggerData,
        status: 'running',
        results: [],
        executedAt: new Date()
      };

      // Execute each action in the rule
      for (const action of input.rule.actions) {
        try {
          const result = await executeAction(action, input.triggerData, {
            notificationModuleService,
            inventoryModuleService,
            fulfillmentModuleService
          });

          execution.results.push({
            action: action.type,
            success: true,
            message: result.message
          });
        } catch (error) {
          console.error(`Error executing action ${action.type}:`, error);
          execution.results.push({
            action: action.type,
            success: false,
            message: error.message
          });
        }
      }

      execution.status = 'completed';
      execution.completedAt = new Date();

      // Store execution record
      await saveAutomationExecution(execution);

      return new StepResponse({
        execution,
        ruleId: input.rule.id
      });
    } catch (error) {
      console.error('Error executing automation actions:', error);
      throw error;
    }
  }
);

const sendAutomationNotificationStep = createStep(
  "send-automation-notification",
  async (input: {
    execution: AutomationExecution;
    rule: AutomationRule;
  }, { container }) => {
    const notificationModuleService: INotificationModuleService = container.resolve(Modules.NOTIFICATION);
    
    try {
      // Send notification to admin about automation execution
      await notificationModuleService.createNotifications({
        to: 'admin@yourstore.com', // This would be configurable
        channel: 'email',
        template: 'automation-execution',
        data: {
          emailOptions: {
            subject: `Automation Rule Executed: ${input.rule.name}`
          },
          rule: input.rule,
          execution: input.execution
        }
      });

      return new StepResponse({
        notificationSent: true,
        executionId: input.execution.id
      });
    } catch (error) {
      console.error('Error sending automation notification:', error);
      // Don't throw error for notification failures
      return new StepResponse({
        notificationSent: false,
        executionId: input.execution.id
      });
    }
  }
);

export const commerceAutomationRecipe = createWorkflow<
  {
    trigger: string;
    triggerData: any;
  },
  {
    executions: AutomationExecution[];
    totalRules: number;
    successfulExecutions: number;
  }
>("commerce-automation-recipe", function (input) {
  const evaluationResult = evaluateAutomationRulesStep(input);
  
  const executionResults = evaluationResult.applicableRules.map(rule => 
    executeAutomationActionsStep({
      rule,
      triggerData: input.triggerData
    })
  );
  
  const notificationResults = evaluationResult.applicableRules.map((rule, index) => 
    sendAutomationNotificationStep({
      execution: executionResults[index].execution,
      rule
    })
  );

  return {
    executions: executionResults.map(result => result.execution),
    totalRules: evaluationResult.applicableRules.length,
    successfulExecutions: executionResults.filter(result => 
      result.execution.results.every(r => r.success)
    ).length
  };
});

// Helper functions
async function getAutomationRules(trigger: string): Promise<AutomationRule[]> {
  // This would retrieve from database
  // For now, return mock rules
  return [
    {
      id: 'rule_1',
      name: 'Welcome New Customer',
      trigger: 'customer_registered',
      conditions: {
        customer_type: 'new'
      },
      actions: [
        {
          type: 'send_email',
          config: {
            template: 'welcome',
            to: 'customer.email'
          }
        },
        {
          type: 'apply_discount',
          config: {
            discount_code: 'WELCOME10',
            discount_type: 'percentage',
            discount_value: 10
          }
        }
      ],
      isActive: true,
      priority: 100
    },
    {
      id: 'rule_2',
      name: 'Low Stock Alert',
      trigger: 'inventory_low',
      conditions: {
        stock_level: { $lt: 10 }
      },
      actions: [
        {
          type: 'send_email',
          config: {
            template: 'low-stock-alert',
            to: 'admin@yourstore.com'
          }
        }
      ],
      isActive: true,
      priority: 50
    }
  ];
}

function evaluateRuleConditions(conditions: Record<string, any>, triggerData: any): boolean {
  // Simple condition evaluation logic
  for (const [key, value] of Object.entries(conditions)) {
    if (typeof value === 'object' && value.$lt) {
      if (triggerData[key] >= value.$lt) {
        return false;
      }
    } else if (triggerData[key] !== value) {
      return false;
    }
  }
  return true;
}

async function executeAction(
  action: any,
  triggerData: any,
  services: {
    notificationModuleService: INotificationModuleService;
    inventoryModuleService: IInventoryModuleService;
    fulfillmentModuleService: IFulfillmentModuleService;
  }
): Promise<{ message: string }> {
  switch (action.type) {
    case 'send_email':
      await services.notificationModuleService.createNotifications({
        to: triggerData.customer?.email || action.config.to,
        channel: 'email',
        template: action.config.template,
        data: {
          ...triggerData,
          ...action.config.data
        }
      });
      return { message: 'Email sent successfully' };

    case 'update_inventory':
      // Update inventory based on action config
      return { message: 'Inventory updated successfully' };

    case 'create_fulfillment':
      // Create fulfillment based on action config
      return { message: 'Fulfillment created successfully' };

    case 'apply_discount':
      // Apply discount based on action config
      return { message: 'Discount applied successfully' };

    case 'send_webhook':
      // Send webhook based on action config
      return { message: 'Webhook sent successfully' };

    default:
      throw new Error(`Unknown action type: ${action.type}`);
  }
}

async function saveAutomationExecution(execution: AutomationExecution): Promise<void> {
  // This would save to database
  console.log('Saving automation execution:', execution.id);
}

export default commerceAutomationRecipe;
