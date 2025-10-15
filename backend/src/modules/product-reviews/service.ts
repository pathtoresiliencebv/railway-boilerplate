import { ICustomerModuleService, IProductModuleService } from '@medusajs/framework/types'
import { Modules } from '@medusajs/framework/utils'

export interface ProductReview {
  id: string
  productId: string
  customerId: string
  rating: number
  title: string
  content: string
  isApproved: boolean
  createdAt: Date
  updatedAt: Date
}

export default class ProductReviewsService {
  constructor(
    private container: any
  ) {}

  async createReview(productId: string, customerId: string, reviewData: {
    rating: number
    title: string
    content: string
  }) {
    const productModuleService: IProductModuleService = this.container.resolve(Modules.PRODUCT)
    
    try {
      const product = await productModuleService.retrieveProduct(productId)
      const reviews: ProductReview[] = (product.metadata?.reviews as ProductReview[]) || []
      
      const newReview: ProductReview = {
        id: `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        productId,
        customerId,
        rating: reviewData.rating,
        title: reviewData.title,
        content: reviewData.content,
        isApproved: false, // Requires admin approval
        createdAt: new Date(),
        updatedAt: new Date()
      }

      reviews.push(newReview)

      await productModuleService.updateProducts(productId, {
        metadata: {
          ...product.metadata,
          reviews: reviews
        }
      })

      return newReview
    } catch (error) {
      console.error('Error creating review:', error)
      throw error
    }
  }

  async approveReview(productId: string, reviewId: string) {
    const productModuleService: IProductModuleService = this.container.resolve(Modules.PRODUCT)
    
    try {
      const product = await productModuleService.retrieveProduct(productId)
      const reviews: ProductReview[] = (product.metadata?.reviews as ProductReview[]) || []
      
      const reviewIndex = reviews.findIndex((review: ProductReview) => review.id === reviewId)
      if (reviewIndex !== -1) {
        reviews[reviewIndex].isApproved = true
        reviews[reviewIndex].updatedAt = new Date()

        await productModuleService.updateProducts(productId, {
          metadata: {
            ...product.metadata,
            reviews: reviews
          }
        })
      }

      return reviews[reviewIndex]
    } catch (error) {
      console.error('Error approving review:', error)
      throw error
    }
  }

  async getProductReviews(productId: string, approvedOnly: boolean = true) {
    const productModuleService: IProductModuleService = this.container.resolve(Modules.PRODUCT)
    
    try {
      const product = await productModuleService.retrieveProduct(productId)
      const reviews: ProductReview[] = (product.metadata?.reviews as ProductReview[]) || []
      
      if (approvedOnly) {
        return reviews.filter((review: ProductReview) => review.isApproved)
      }
      
      return reviews
    } catch (error) {
      console.error('Error retrieving product reviews:', error)
      throw error
    }
  }

  async getAverageRating(productId: string) {
    const reviews = await this.getProductReviews(productId)
    
    if (reviews.length === 0) {
      return 0
    }

    const totalRating = reviews.reduce((sum: number, review: ProductReview) => sum + review.rating, 0)
    return totalRating / reviews.length
  }
}
