import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export function RiskScore({ score }: { score: number }) {
  const getColorClass = (score: number) => {
    if (score < 30) return "bg-green-500";
    if (score < 70) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">Risk Score</span>
        <span className={cn(
          "text-sm font-bold",
          score < 30 ? "text-green-500" : score < 70 ? "text-yellow-500" : "text-red-500"
        )}>
          {score}%
        </span>
      </div>
      <Progress
        value={score}
        className={cn("h-2", getColorClass(score))}
      />
    </div>
  );
}