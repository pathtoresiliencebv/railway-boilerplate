import { MedusaRequest, MedusaResponse } from "@medusajs/framework"

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { id } = req.params
    const webhooksService = req.scope.resolve('webhooksService') as any
    
    const success = await webhooksService.testWebhook(id)
    
    if (success) {
      res.json({ message: 'Webhook test successful' })
    } else {
      res.status(400).json({ error: 'Webhook test failed' })
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
}
