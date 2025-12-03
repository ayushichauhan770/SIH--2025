import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  className?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function StatsCard({ title, value, description, icon: Icon, trend, className }: StatsCardProps) {
  return (
    <Card data-testid={`card-stat-${title.toLowerCase().replace(/\s+/g, '-')}`} className={`shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 bg-white dark:bg-slate-800/90 rounded-xl border-0 ${className || ""}`}>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20">
          <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold font-heading bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent" data-testid={`text-value-${title.toLowerCase().replace(/\s+/g, '-')}`}>
          {value}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        )}
        {trend && (
          <div className="flex items-center gap-1 mt-2">
            <span className={`text-xs font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
            </span>
            <span className="text-xs text-muted-foreground">from last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
