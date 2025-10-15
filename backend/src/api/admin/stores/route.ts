import { MedusaRequest, MedusaResponse } from "@medusajs/medusa"
import { createStoreWorkflow } from "../../../workflows/create-store"
import { Modules } from "@medusajs/framework/utils"
import { MULTI_STORE_MODULE } from "../../../modules/multi-store"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const storeModuleService = req.scope.resolve(Modules.STORE)
  const multiStoreService = req.scope.resolve(MULTI_STORE_MODULE)

  const stores = await storeModuleService.listStores()
  const storeConfigs = await multiStoreService.listStoreConfigs()

  // Merge store data with configs
  const storesWithConfig = stores.map((store) => {
    const config = storeConfigs.find((c) => c.store_id === store.id)
    return { ...store, config }
  })

  res.json({ stores: storesWithConfig })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { name, subdomain, currencies, metadata } = req.body

  const { result } = await createStoreWorkflow(req.scope).run({
    input: { name, subdomain, currencies, metadata },
  })

  res.json(result)
}
