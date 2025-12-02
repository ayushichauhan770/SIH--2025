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
  colorScheme?: "blue" | "purple" | "green" | "red" | "yellow" | "orange" | "indigo" | "pink";
}

const colorSchemes = {
  blue: {
    bg: "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50",
    iconBg: "bg-gradient-to-br from-blue-500/10 to-blue-600/10 dark:from-blue-500/20 dark:to-blue-600/20",
    icon: "text-blue-600 dark:text-blue-400",
    value: "bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-400 dark:to-blue-500",
  },
  purple: {
    bg: "bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50",
    iconBg: "bg-gradient-to-br from-purple-500/10 to-purple-600/10 dark:from-purple-500/20 dark:to-purple-600/20",
    icon: "text-purple-600 dark:text-purple-400",
    value: "bg-gradient-to-r from-purple-600 to-purple-700 dark:from-purple-400 dark:to-purple-500",
  },
  green: {
    bg: "bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50",
    iconBg: "bg-gradient-to-br from-green-500/10 to-green-600/10 dark:from-green-500/20 dark:to-green-600/20",
    icon: "text-green-600 dark:text-green-400",
    value: "bg-gradient-to-r from-green-600 to-green-700 dark:from-green-400 dark:to-green-500",
  },
  red: {
    bg: "bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/50 dark:to-red-900/50",
    iconBg: "bg-gradient-to-br from-red-500/10 to-red-600/10 dark:from-red-500/20 dark:to-red-600/20",
    icon: "text-red-600 dark:text-red-400",
    value: "bg-gradient-to-r from-red-600 to-red-700 dark:from-red-400 dark:to-red-500",
  },
  yellow: {
    bg: "bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950/50 dark:to-yellow-900/50",
    iconBg: "bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 dark:from-yellow-500/20 dark:to-yellow-600/20",
    icon: "text-yellow-600 dark:text-yellow-400",
    value: "bg-gradient-to-r from-yellow-600 to-yellow-700 dark:from-yellow-400 dark:to-yellow-500",
  },
  orange: {
    bg: "bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/50 dark:to-orange-900/50",
    iconBg: "bg-gradient-to-br from-orange-500/10 to-orange-600/10 dark:from-orange-500/20 dark:to-orange-600/20",
    icon: "text-orange-600 dark:text-orange-400",
    value: "bg-gradient-to-r from-orange-600 to-orange-700 dark:from-orange-400 dark:to-orange-500",
  },
  indigo: {
    bg: "bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950/50 dark:to-indigo-900/50",
    iconBg: "bg-gradient-to-br from-indigo-500/10 to-indigo-600/10 dark:from-indigo-500/20 dark:to-indigo-600/20",
    icon: "text-indigo-600 dark:text-indigo-400",
    value: "bg-gradient-to-r from-indigo-600 to-indigo-700 dark:from-indigo-400 dark:to-indigo-500",
  },
  pink: {
    bg: "bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-950/50 dark:to-pink-900/50",
    iconBg: "bg-gradient-to-br from-pink-500/10 to-pink-600/10 dark:from-pink-500/20 dark:to-pink-600/20",
    icon: "text-pink-600 dark:text-pink-400",
    value: "bg-gradient-to-r from-pink-600 to-pink-700 dark:from-pink-400 dark:to-pink-500",
  },
};

export function StatsCard({ title, value, description, icon: Icon, trend, className, colorScheme = "blue" }: StatsCardProps) {
  const colors = colorSchemes[colorScheme];
  
  return (
    <Card data-testid={`card-stat-${title.toLowerCase().replace(/\s+/g, '-')}`} className={`shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 rounded-xl border-0 ${colors.bg} ${className || ""}`}>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`p-2 rounded-lg ${colors.iconBg}`}>
          <Icon className={`h-4 w-4 ${colors.icon}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-bold font-heading ${colors.value} bg-clip-text text-transparent`} data-testid={`text-value-${title.toLowerCase().replace(/\s+/g, '-')}`}>
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
