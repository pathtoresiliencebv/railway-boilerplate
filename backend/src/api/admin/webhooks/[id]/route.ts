import { MedusaRequest, MedusaResponse } from "@medusajs/framework"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { id } = req.params
    const webhooksService = req.scope.resolve('webhooksService') as any
    const webhook = await webhooksService.getWebhook(id)
    
    if (!webhook) {
      return res.status(404).json({ error: 'Webhook not found' })
    }
    
    res.json({ webhook })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
}

export const PUT = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { id } = req.params
    const updateData = req.body
    const webhooksService = req.scope.resolve('webhooksService') as any
    
    const webhook = await webhooksService.updateWebhook(id, updateData)
    res.json({ webhook })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
}

export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { id } = req.params
    const webhooksService = req.scope.resolve('webhooksService') as any
    
    await webhooksService.deleteWebhook(id)
    res.status(204).send()
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
}
