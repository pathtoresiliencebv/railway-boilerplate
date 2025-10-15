import { MedusaService } from "@medusajs/framework/utils"
import { StoreConfig } from "./models/store-config"

class MultiStoreModuleService extends MedusaService({
  StoreConfig,
}) {
  async createStoreConfigs(data: any) {
    return this.createStoreConfigs_(data)
  }

  async listStoreConfigs(filters: any = {}) {
    return this.listStoreConfigs_(filters)
  }

  async updateStoreConfigs(id: string, data: any) {
    return this.updateStoreConfigs_(id, data)
  }

  async deleteStoreConfigs(ids: string[]) {
    return this.deleteStoreConfigs_(ids)
  }
}

export default MultiStoreModuleService
