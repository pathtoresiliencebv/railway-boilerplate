import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { updateStoreWorkflow } from "../../../../workflows/update-store"
import { deleteStoreWorkflow } from "../../../../workflows/delete-store"
import { Modules } from "@medusajs/framework/utils"
import { MULTI_STORE_MODULE } from "../../../../modules/multi-store"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const storeModuleService = req.scope.resolve(Modules.STORE)
  const multiStoreService = req.scope.resolve(MULTI_STORE_MODULE)

  const store = await storeModuleService.retrieveStore(id)
  const [config] = await multiStoreService.listStoreConfigs({ store_id: id })

  res.json({ store: { ...store, config } })
}

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const { name, subdomain, is_active, metadata } = req.body as any

  const { result } = await updateStoreWorkflow(req.scope).run({
    input: { storeId: id, name, subdomain, is_active, metadata },
  })

  res.json(result)
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params

  await deleteStoreWorkflow(req.scope).run({
    input: { storeId: id },
  })

  res.json({ success: true })
}
