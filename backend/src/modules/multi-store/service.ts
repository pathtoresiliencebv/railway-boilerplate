import { MedusaService } from "@medusajs/framework/utils"
import { StoreConfig } from "./models/store-config"

class MultiStoreModuleService extends MedusaService({
  StoreConfig,
}) {
  // MedusaService automatically provides:
  // - createStoreConfigs(data)
  // - listStoreConfigs(filters)
  // - updateStoreConfigs(id, data)
  // - deleteStoreConfigs(ids)
  // No need to redefine them
}

export default MultiStoreModuleService
