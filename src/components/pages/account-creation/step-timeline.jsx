import { STEPS } from "@/constants/account-creation";
import { cn } from "@/lib/utils";
import { CheckCircle2, LogOut, User } from "lucide-react";
import { ThemeToggle } from '@/components/ui/theme-toggle'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { signOut } from '@/lib/auth'
import { useNavigate } from 'react-router-dom'

export default function StepTimeline({ currentStep }) {
  const navigate = useNavigate()
  async function logout() {
      await signOut()
      navigate('/login', { replace: true })
    }
  return (
    <>
      <div className="w-full flex justify-end p-4">
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
              <User className="h-5 w-5" />
              <span className="sr-only">User menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="w-full max-w-4xl mx-auto mb-12">
        <div className="flex items-center justify-between relative px-4 sm:px-8">
          {/* Connection lines */}
          <div className="absolute top-6 left-8 right-8 h-[2px] bg-border -z-10">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-primary transition-all duration-500 ease-out"
              style={{
                width: currentStep === 1 ? '15%' : 
                      currentStep === 2 ? '40%' :
                      currentStep === 3 ? '60%' : 
                      currentStep === 4 ? '90%' : '100%',
              }}
            />
          </div>

          {STEPS.map((step) => {
            const isCompleted = step.number < currentStep;
            const isActive = step.number === currentStep;
            const isPending = step.number > currentStep;

            return (
              <div
                key={step.number}
                className="flex flex-col items-center flex-1 relative z-10"
              >
                {/* Step Circle */}
                <div className="relative">
                  <div
                    className={cn(
                      "w-14 h-14 rounded-full flex items-center justify-center font-semibold transition-all duration-300",
                      (isCompleted || isActive) &&
                        "bg-white border-4 border-primary shadow-md",
                      isPending &&
                        "bg-gray-100 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700",
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-7 h-7 text-primary" />
                    ) : (
                      <span
                        className={cn(
                          "text-lg font-semibold",
                          (isCompleted || isActive) &&
                            "text-primary",
                          isPending && "text-gray-500 dark:text-gray-400",
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
                      (isCompleted || isActive) &&
                        "text-primary",
                      isPending && "text-gray-600 dark:text-gray-400",
                    )}
                  >
                    <span className="hidden lg:flex">{step.title}</span>
                    <span className="lg:hidden flex">{step.shortTitle}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
