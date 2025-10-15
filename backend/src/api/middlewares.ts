import type {
  MiddlewaresConfig,
  MedusaRequest,
  MedusaResponse,
  MedusaNextFunction,
} from "@medusajs/medusa"
import { Modules } from "@medusajs/framework/utils"
import { MULTI_STORE_MODULE } from "../modules/multi-store"

async function storeContextMiddleware(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  try {
    const host = req.get("host") || ""
    const subdomain = host.split(".")[0]

    // Skip for admin and api subdomains
    if (subdomain === "admin" || subdomain === "api") {
      return next()
    }

    // Resolve services
    const multiStoreService = req.scope.resolve(MULTI_STORE_MODULE)
    const storeModuleService = req.scope.resolve(Modules.STORE)

    // Find store by subdomain
    const [storeConfig] = await multiStoreService.listStoreConfigs({
      subdomain,
      is_active: true,
    })

    if (!storeConfig) {
      return res.status(404).json({
        message: `Store not found for subdomain: ${subdomain}`,
      })
    }

    // Get full store data
    const store = await storeModuleService.retrieveStore(storeConfig.store_id)

    // Inject store context into request
    req.scope.register({
      currentStore: { asValue: store },
      currentStoreConfig: { asValue: storeConfig },
    })

    next()
  } catch (error) {
    console.error("Store context middleware error:", error)
    next()
  }
}

export const config: MiddlewaresConfig = {
  routes: [
    {
      matcher: "/store/*",
      middlewares: [storeContextMiddleware],
    },
  ],
}
