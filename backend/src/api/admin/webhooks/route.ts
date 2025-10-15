import { MedusaRequest, MedusaResponse } from "@medusajs/framework"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const webhooksService = req.scope.resolve('webhooksService') as any
    const webhooks = await webhooksService.listWebhooks()
    res.json({ webhooks })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { url, events, secret } = req.body as any
    const webhooksService = req.scope.resolve('webhooksService') as any
    
    const webhook = await webhooksService.createWebhook({
      url,
      events,
      secret
    })
    
    res.status(201).json({ webhook })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
}
