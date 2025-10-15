import {
  createWorkflow,
  WorkflowResponse,
  createStep,
  StepResponse,
} from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import { MULTI_STORE_MODULE } from "../modules/multi-store"

const deleteStoreStep = createStep(
  "delete-store-step",
  async ({ storeId }, { container }) => {
    const storeModuleService = container.resolve(Modules.STORE)
    const multiStoreService = container.resolve(MULTI_STORE_MODULE)

    // Get data for rollback
    const store = await storeModuleService.retrieveStore(storeId)
    const [storeConfig] = await multiStoreService.listStoreConfigs({
      store_id: storeId,
    })

    // Delete store config first
    if (storeConfig) {
      await multiStoreService.deleteStoreConfigs([storeConfig.id])
    }

    // Delete core store
    await storeModuleService.deleteStores([storeId])

    return new StepResponse(
      { success: true },
      { store, storeConfig }
    )
  },
  async ({ store, storeConfig }, { container }) => {
    if (!store) return

    const storeModuleService = container.resolve(Modules.STORE)
    const multiStoreService = container.resolve(MULTI_STORE_MODULE)

    // Recreate store
    const restoredStore = await storeModuleService.createStores({
      id: store.id,
      name: store.name,
      supported_currencies: store.supported_currencies,
      metadata: store.metadata,
    })

    // Recreate config
    if (storeConfig) {
      await multiStoreService.createStoreConfigs({
        id: storeConfig.id,
        store_id: restoredStore.id,
        subdomain: storeConfig.subdomain,
        is_active: storeConfig.is_active,
      })
    }
  }
)

export const deleteStoreWorkflow = createWorkflow(
  "delete-store-workflow",
  (input) => {
    const result = deleteStoreStep(input)
    return new WorkflowResponse(result)
  }
)
