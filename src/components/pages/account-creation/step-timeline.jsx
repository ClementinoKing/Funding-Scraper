import { STEPS } from '@/constants/account-creation'
import { cn } from '@/lib/utils'
import { CheckCircle2 } from 'lucide-react'

export default function StepTimeline({ currentStep }) {
  return (
    <div className="w-full max-w-4xl mx-auto mb-12">
      <div className="flex items-center justify-between relative px-4 sm:px-8">
        {/* Connection lines */}
        <div className="absolute top-6 left-8 right-8 h-[2px] bg-border -z-10">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500 ease-out"
            style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
          />
        </div>

        {STEPS.map((step) => {
          const isCompleted = step.number < currentStep
          const isActive = step.number === currentStep
          const isPending = step.number > currentStep

          return (
            <div key={step.number} className="flex flex-col items-center flex-1 relative z-10">
              {/* Step Circle */}
              <div className="relative">
                <div
                  className={cn(
                    "w-14 h-14 rounded-full flex items-center justify-center font-semibold transition-all duration-300",
                    (isCompleted || isActive) && "bg-white border-4 border-blue-400 dark:border-blue-500 shadow-md",
                    isPending && "bg-gray-100 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-7 h-7 text-purple-600 dark:text-purple-400" />
                  ) : (
                    <span
                      className={cn(
                        "text-lg font-semibold",
                        (isCompleted || isActive) && "text-purple-600 dark:text-purple-400",
                        isPending && "text-gray-500 dark:text-gray-400"
                      )}
                    >
                      {step.number}
                    </span>
                  )}
                </div>
              </div>

              {/* Step Labels */}
              <div className="mt-3 text-center max-w-[140px]">
                <div
                  className={cn(
                    "text-sm font-semibold transition-colors duration-300",
                    (isCompleted || isActive) && "text-purple-600 dark:text-purple-400",
                    isPending && "text-gray-600 dark:text-gray-400"
                  )}
                >
                  {step.title}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}