import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const orderModuleService = req.scope.resolve(Modules.ORDER)
    const customerModuleService = req.scope.resolve(Modules.CUSTOMER)
    const productModuleService = req.scope.resolve(Modules.PRODUCT)

    // Get date range from query params (default to last 30 days)
    const days = parseInt(req.query.days as string) || 30
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    const endDate = new Date()

    // Get orders for the period
    const orders = await orderModuleService.listOrders({
      created_at: {
        gte: startDate,
        lte: endDate
      }
    })

    // Calculate analytics data
    const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0)
    const totalOrders = orders.length
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Get customer count
    const customers = await customerModuleService.listCustomers()
    const totalCustomers = customers.length

    // Get new customers in period
    const newCustomers = customers.filter(customer => 
      customer.created_at && new Date(customer.created_at) >= startDate
    ).length

    // Get product count
    const products = await productModuleService.listProducts()
    const totalProducts = products.length

    // Calculate conversion rate (simplified)
    const conversionRate = totalCustomers > 0 ? (totalOrders / totalCustomers) * 100 : 0

    // Get daily sales data for chart
    const dailySales = []
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dayStart = new Date(date)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(date)
      dayEnd.setHours(23, 59, 59, 999)

      const dayOrders = orders.filter(order => {
        const orderDate = new Date(order.created_at)
        return orderDate >= dayStart && orderDate <= dayEnd
      })

      const dayRevenue = dayOrders.reduce((sum, order) => sum + (order.total || 0), 0)
      
      dailySales.push({
        date: date.toISOString().split('T')[0],
        revenue: dayRevenue,
        orders: dayOrders.length
      })
    }

    // Get top products
    const productSales = new Map()
    orders.forEach(order => {
      order.items?.forEach(item => {
        if (item.product_id) {
          const current = productSales.get(item.product_id) || 0
          productSales.set(item.product_id, current + item.quantity)
        }
      })
    })

    const topProducts = Array.from(productSales.entries())
      .map(([productId, quantity]) => {
        const product = products.find(p => p.id === productId)
        return {
          id: productId,
          title: product?.title || 'Unknown Product',
          quantity,
          revenue: quantity * (product?.variants?.[0]?.prices?.[0]?.amount || 0)
        }
      })
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)

    // Get order status distribution
    const orderStatuses = {
      pending: orders.filter(o => o.status === 'pending').length,
      completed: orders.filter(o => o.status === 'completed').length,
      canceled: orders.filter(o => o.status === 'canceled').length,
      requires_action: orders.filter(o => o.status === 'requires_action').length
    }

    const analytics = {
      overview: {
        totalRevenue,
        totalOrders,
        totalCustomers,
        newCustomers,
        totalProducts,
        averageOrderValue,
        conversionRate: Math.round(conversionRate * 100) / 100
      },
      dailySales,
      topProducts,
      orderStatuses,
      period: {
        days,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }
    }

    res.json(analytics)
  } catch (error) {
    console.error('Error fetching analytics:', error)
    res.status(500).json({ error: 'Failed to fetch analytics data' })
  }
}
