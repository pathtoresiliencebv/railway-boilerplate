import {
  createWorkflow,
  WorkflowResponse,
  createStep,
  StepResponse,
} from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import { MULTI_STORE_MODULE } from "../modules/multi-store"

const updateStoreStep = createStep(
  "update-store-step",
  async ({ storeId, name, subdomain, is_active, metadata }, { container }) => {
    const storeModuleService = container.resolve(Modules.STORE)
    const multiStoreService = container.resolve(MULTI_STORE_MODULE)

    // Get original data for rollback
    const originalStore = await storeModuleService.retrieveStore(storeId)
    const [originalConfig] = await multiStoreService.listStoreConfigs({
      store_id: storeId,
    })

    // Update core store
    const store = await storeModuleService.updateStores(storeId, {
      name,
      metadata,
    })

    // Update store config
    const storeConfig = await multiStoreService.updateStoreConfigs(
      originalConfig.id,
      { subdomain, is_active }
    )

    return new StepResponse(
      { store, storeConfig },
      { originalStore, originalConfig }
    )
  },
  async ({ originalStore, originalConfig }, { container }) => {
    if (!originalStore) return

    const storeModuleService = container.resolve(Modules.STORE)
    const multiStoreService = container.resolve(MULTI_STORE_MODULE)

    await storeModuleService.updateStores(originalStore.id, {
      name: originalStore.name,
      metadata: originalStore.metadata,
    })

    if (originalConfig) {
      await multiStoreService.updateStoreConfigs(originalConfig.id, {
        subdomain: originalConfig.subdomain,
        is_active: originalConfig.is_active,
      })
    }
  }
)

export const updateStoreWorkflow = createWorkflow(
  "update-store-workflow",
  (input) => {
    const { store, storeConfig } = updateStoreStep(input)
    return new WorkflowResponse({ store, storeConfig })
  }
)