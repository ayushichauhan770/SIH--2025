import { Check } from "lucide-react";

interface StatusStep {
  label: string;
  date?: string;
}

interface StatusStepperProps {
  currentStatus: string;
  history: Array<{ status: string; updatedAt: string | Date; comment?: string }>;
}

const statusOrder = ["Submitted", "Assigned", "In Progress", "Approved"];

export function StatusStepper({ currentStatus, history }: StatusStepperProps) {
  const currentIndex = statusOrder.indexOf(currentStatus);

  return (
    <div className="w-full" data-testid="status-stepper">
      <div className="hidden md:flex items-center justify-between">
        {statusOrder.map((status, index) => {
          const isActive = index === currentIndex;
          const isComplete = index < currentIndex;
          const historyItem = history.find(h => h.status === status);

          return (
            <div key={status} className="flex flex-col items-center flex-1">
              <div className="flex items-center w-full">
                {index > 0 && (
                  <div className={`flex-1 h-0.5 ${isComplete || isActive ? 'bg-primary' : 'bg-border'}`} />
                )}
                <div
                  className={`
                    flex items-center justify-center w-10 h-10 rounded-full border-2 
                    ${isComplete ? 'bg-primary border-primary text-primary-foreground' : ''}
                    ${isActive ? 'border-primary bg-background text-primary' : ''}
                    ${!isComplete && !isActive ? 'border-border bg-background text-muted-foreground' : ''}
                  `}
                  data-testid={`step-${status.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {isComplete ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                </div>
                {index < statusOrder.length - 1 && (
                  <div className={`flex-1 h-0.5 ${isComplete ? 'bg-primary' : 'bg-border'}`} />
                )}
              </div>
              <div className="mt-2 text-center">
                <p className={`text-sm font-medium ${isActive ? 'text-primary' : isComplete ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {status}
                </p>
                {historyItem && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(historyItem.updatedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="md:hidden space-y-4">
        {statusOrder.map((status, index) => {
          const isActive = index === currentIndex;
          const isComplete = index < currentIndex;
          const historyItem = history.find(h => h.status === status);

          return (
            <div key={status} className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div
                  className={`
                    flex items-center justify-center w-8 h-8 rounded-full border-2 
                    ${isComplete ? 'bg-primary border-primary text-primary-foreground' : ''}
                    ${isActive ? 'border-primary bg-background text-primary' : ''}
                    ${!isComplete && !isActive ? 'border-border bg-background text-muted-foreground' : ''}
                  `}
                >
                  {isComplete ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <span className="text-xs font-semibold">{index + 1}</span>
                  )}
                </div>
                {index < statusOrder.length - 1 && (
                  <div className={`w-0.5 h-16 mt-2 ${isComplete ? 'bg-primary' : 'bg-border'}`} />
                )}
              </div>
              <div className="flex-1 pb-8">
                <p className={`text-sm font-medium ${isActive ? 'text-primary' : isComplete ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {status}
                </p>
                {historyItem && (
                  <>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(historyItem.updatedAt).toLocaleDateString()} at {new Date(historyItem.updatedAt).toLocaleTimeString()}
                    </p>
                    {historyItem.comment && (
                      <p className="text-xs text-muted-foreground mt-2 bg-muted p-2 rounded-md">
                        {historyItem.comment}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
