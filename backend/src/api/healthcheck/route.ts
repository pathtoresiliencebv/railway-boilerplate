import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  return res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "medusa-backend",
    version: "2.10.2"
  }, { status: 200 })
}
