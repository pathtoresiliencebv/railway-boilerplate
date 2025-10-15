import { ModuleProviderExports } from "@medusajs/framework/types"
import ShipStationFulfillmentService from "./service"

const services = [ShipStationFulfillmentService]

const providerExport: ModuleProviderExports = {
  services,
}

export default providerExport
