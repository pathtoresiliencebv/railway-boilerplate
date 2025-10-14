import { 
  createStep,
  createWorkflow,
  StepResponse,
} from "@medusajs/workflows-sdk"

const calculatePointsStep = createStep("calculate-points", async (input: { orderTotal: number }) => {
  // Calculate points based on order total (1 point per dollar)
  const points = Math.floor(input.orderTotal / 100)
  return new StepResponse(points)
})

const awardPointsStep = createStep("award-points", async (input: { customerId: string, points: number }) => {
  // Award points to customer
  console.log(`Awarding ${input.points} points to customer ${input.customerId}`)
  return new StepResponse(`Awarded ${input.points} points`)
})

type WorkflowInput = {
  customerId: string
  orderTotal: number
}

type WorkflowOutput = {
  pointsAwarded: number
  message: string
}

const loyaltyPointsAwardWorkflow = createWorkflow<
  WorkflowInput,
  WorkflowOutput
>("loyalty-points-award", function (input) {
  const points = calculatePointsStep({ orderTotal: input.orderTotal })
  const result = awardPointsStep({ customerId: input.customerId, points })

  return {
    pointsAwarded: points,
    message: `Awarded ${points} loyalty points`,
  }
})

export default loyaltyPointsAwardWorkflow
