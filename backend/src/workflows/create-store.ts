import {
  createWorkflow,
  WorkflowResponse,
  createStep,
  StepResponse,
} from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import { MULTI_STORE_MODULE } from "../modules/multi-store"

const createStoreStep = createStep(
  "create-store-step",
  async ({ name, subdomain, currencies, metadata }, { container }) => {
    const storeModuleService = container.resolve(Modules.STORE)
    const multiStoreService = container.resolve(MULTI_STORE_MODULE)

    // Create core store
    const store = await storeModuleService.createStores({
      name,
      supported_currencies: currencies || [{
        currency_code: "usd",
        is_default: true,
      }],
      metadata,
    })

    // Create store config
    const storeConfig = await multiStoreService.createStoreConfigs({
      store_id: store.id,
      subdomain,
      is_active: true,
    })

    return new StepResponse(
      { store, storeConfig },
      { storeId: store.id, configId: storeConfig.id }
    )
  },
  async ({ storeId, configId }, { container }) => {
    if (!storeId) return

    const storeModuleService = container.resolve(Modules.STORE)
    const multiStoreService = container.resolve(MULTI_STORE_MODULE)

    await storeModuleService.deleteStores([storeId])
    if (configId) {
      await multiStoreService.deleteStoreConfigs([configId])
    }
  }
)

export const createStoreWorkflow = createWorkflow(
  "create-store-workflow",
  (input) => {
    const { store, storeConfig } = createStoreStep(input)
    return new WorkflowResponse({ store, storeConfig })
  }
)