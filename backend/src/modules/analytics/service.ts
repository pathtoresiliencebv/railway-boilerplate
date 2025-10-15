import {
  ICartModuleService,
  ICustomerModuleService,
  IOrderModuleService,
  IProductModuleService,
  Modules,
} from "@medusajs/types"

export interface AnalyticsData {
  revenue: {
    total: number
    period: number
    growth: number
  }
  orders: {
    total: number
    period: number
    growth: number
  }
  customers: {
    total: number
    period: number
    growth: number
  }
  conversionRate: {
    current: number
    previous: number
    growth: number
  }
  dailySales: Array<{
    date: string
    revenue: number
    orders: number
  }>
  topProducts: Array<{
    id: string
    title: string
    sales: number
    revenue: number
  }>
  orderStatus: {
    pending: number
    completed: number
    cancelled: number
    returned: number
  }
}

export default class AnalyticsService {
  constructor(private container: any) {}

  async getAnalyticsData(period: '7d' | '30d' | '90d' = '30d'): Promise<AnalyticsData> {
    const orderModuleService: IOrderModuleService = this.container.resolve(Modules.ORDER)
    const customerModuleService: ICustomerModuleService = this.container.resolve(Modules.CUSTOMER)
    const productModuleService: IProductModuleService = this.container.resolve(Modules.PRODUCT)

    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    const previousStartDate = new Date()
    previousStartDate.setDate(previousStartDate.getDate() - (days * 2))

    try {
      // Get orders for current period
      const currentOrders = await orderModuleService.listOrders({
        created_at: { gte: startDate },
        status: { in: ['pending', 'completed', 'cancelled', 'returned'] }
      })

      // Get orders for previous period
      const previousOrders = await orderModuleService.listOrders({
        created_at: { gte: previousStartDate, lt: startDate },
        status: { in: ['pending', 'completed', 'cancelled', 'returned'] }
      })

      // Get customers for current period
      const currentCustomers = await customerModuleService.listCustomers({
        created_at: { gte: startDate }
      })

      // Get customers for previous period
      const previousCustomers = await customerModuleService.listCustomers({
        created_at: { gte: previousStartDate, lt: startDate }
      })

      // Calculate revenue
      const currentRevenue = currentOrders
        .filter(order => order.status === 'completed')
        .reduce((sum, order) => sum + (order.total || 0), 0)

      const previousRevenue = previousOrders
        .filter(order => order.status === 'completed')
        .reduce((sum, order) => sum + (order.total || 0), 0)

      const revenueGrowth = previousRevenue > 0 
        ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 
        : 0

      // Calculate orders
      const currentOrderCount = currentOrders.length
      const previousOrderCount = previousOrders.length
      const orderGrowth = previousOrderCount > 0 
        ? ((currentOrderCount - previousOrderCount) / previousOrderCount) * 100 
        : 0

      // Calculate customers
      const currentCustomerCount = currentCustomers.length
      const previousCustomerCount = previousCustomers.length
      const customerGrowth = previousCustomerCount > 0 
        ? ((currentCustomerCount - previousCustomerCount) / previousCustomerCount) * 100 
        : 0

      // Calculate conversion rate (simplified)
      const totalVisitors = currentCustomerCount + (currentCustomerCount * 0.3) // Estimate
      const conversionRate = totalVisitors > 0 ? (currentOrderCount / totalVisitors) * 100 : 0
      const previousConversionRate = previousCustomerCount > 0 
        ? (previousOrderCount / (previousCustomerCount + (previousCustomerCount * 0.3))) * 100 
        : 0
      const conversionGrowth = previousConversionRate > 0 
        ? ((conversionRate - previousConversionRate) / previousConversionRate) * 100 
        : 0

      // Generate daily sales data
      const dailySales = this.generateDailySalesData(currentOrders, days)

      // Get top products
      const topProducts = await this.getTopProducts(currentOrders, productModuleService)

      // Calculate order status distribution
      const orderStatus = {
        pending: currentOrders.filter(order => order.status === 'pending').length,
        completed: currentOrders.filter(order => order.status === 'completed').length,
        cancelled: currentOrders.filter(order => order.status === 'cancelled').length,
        returned: currentOrders.filter(order => order.status === 'returned').length
      }

      return {
        revenue: {
          total: currentRevenue,
          period: currentRevenue,
          growth: revenueGrowth
        },
        orders: {
          total: currentOrderCount,
          period: currentOrderCount,
          growth: orderGrowth
        },
        customers: {
          total: currentCustomerCount,
          period: currentCustomerCount,
          growth: customerGrowth
        },
        conversionRate: {
          current: conversionRate,
          previous: previousConversionRate,
          growth: conversionGrowth
        },
        dailySales,
        topProducts,
        orderStatus
      }
    } catch (error) {
      console.error('Error getting analytics data:', error)
      throw error
    }
  }

  private generateDailySalesData(orders: any[], days: number): Array<{date: string, revenue: number, orders: number}> {
    const dailyData: {[key: string]: {revenue: number, orders: number}} = {}
    
    // Initialize all days with zero values
    for (let i = 0; i < days; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      dailyData[dateStr] = { revenue: 0, orders: 0 }
    }

    // Aggregate order data by date
    orders.forEach(order => {
      const orderDate = new Date(order.created_at).toISOString().split('T')[0]
      if (dailyData[orderDate]) {
        dailyData[orderDate].orders++
        if (order.status === 'completed') {
          dailyData[orderDate].revenue += order.total || 0
        }
      }
    })

    // Convert to array and sort by date
    return Object.entries(dailyData)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  private async getTopProducts(orders: any[], productModuleService: IProductModuleService): Promise<Array<{id: string, title: string, sales: number, revenue: number}>> {
    const productSales: {[key: string]: {sales: number, revenue: number, title: string}} = {}

    // Aggregate sales by product
    orders.forEach(order => {
      if (order.status === 'completed' && order.items) {
        order.items.forEach((item: any) => {
          const productId = item.product_id
          if (productSales[productId]) {
            productSales[productId].sales += item.quantity
            productSales[productId].revenue += (item.unit_price * item.quantity)
          } else {
            productSales[productId] = {
              sales: item.quantity,
              revenue: item.unit_price * item.quantity,
              title: item.title || 'Unknown Product'
            }
          }
        })
      }
    })

    // Convert to array and sort by revenue
    return Object.entries(productSales)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10) // Top 10 products
  }

  async getRevenueData(period: '7d' | '30d' | '90d' = '30d'): Promise<Array<{date: string, revenue: number}>> {
    const orderModuleService: IOrderModuleService = this.container.resolve(Modules.ORDER)
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    try {
      const orders = await orderModuleService.listOrders({
        created_at: { gte: startDate },
        status: 'completed'
      })

      return this.generateDailySalesData(orders, days).map(day => ({
        date: day.date,
        revenue: day.revenue
      }))
    } catch (error) {
      console.error('Error getting revenue data:', error)
      throw error
    }
  }

  async getTopProductsData(period: '7d' | '30d' | '90d' = '30d'): Promise<Array<{id: string, title: string, sales: number, revenue: number}>> {
    const orderModuleService: IOrderModuleService = this.container.resolve(Modules.ORDER)
    const productModuleService: IProductModuleService = this.container.resolve(Modules.PRODUCT)
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    try {
      const orders = await orderModuleService.listOrders({
        created_at: { gte: startDate },
        status: 'completed'
      })

      return await this.getTopProducts(orders, productModuleService)
    } catch (error) {
      console.error('Error getting top products data:', error)
      throw error
    }
  }
}
