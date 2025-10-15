import { MedusaService } from "@medusajs/framework/utils"
import { StoreConfig } from "./models/store-config"

class MultiStoreModuleService extends MedusaService({
  StoreConfig,
}) {}

export default MultiStoreModuleService
