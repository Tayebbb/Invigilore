import { motion } from 'motion/react';
import { TrendingUp } from 'lucide-react';
import type { ElementType } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';

// ── Color token maps (full class strings so Tailwind can scan them) ───────────

const iconColors: Record<string, string> = {
  blue:    'text-blue-400 bg-blue-500/10',
  emerald: 'text-emerald-400 bg-emerald-500/10',
  amber:   'text-amber-400 bg-amber-500/10',
  purple:  'text-purple-400 bg-purple-500/10',
  rose:    'text-rose-400 bg-rose-500/10',
  slate:   'text-slate-400 bg-slate-600/20',
  violet:  'text-violet-400 bg-violet-500/10',
};

const trendColors: Record<string, string> = {
  blue:    'text-blue-400',
  emerald: 'text-emerald-400',
  amber:   'text-amber-400',
  purple:  'text-purple-400',
  rose:    'text-rose-400',
  slate:   'text-slate-400',
  violet:  'text-violet-400',
};

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DashboardCardProps {
  /** Lucide icon component */
  icon: ElementType;
  /** Card label shown below the value */
  title: string;
  /** Primary numeric / text value */
  value: string;
  /** Optional trend / subtitle line shown at the bottom */
  subtitle?: string;
  /** Colour theme token */
  color?: 'blue' | 'emerald' | 'amber' | 'purple' | 'rose' | 'slate' | 'violet';
  /** Stagger delay index for enter animation */
  index?: number;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * DashboardCard — reusable KPI tile used across all role dashboards.
 *
 * Usage:
 *   <DashboardCard
 *     icon={Users}
 *     title="Total Students"
 *     value="1 240"
 *     subtitle="+32 this week"
 *     color="blue"
 *     index={0}
 *   />
 */
export default function DashboardCard({
  icon: Icon,
  title,
  value,
  subtitle,
  color = 'blue',
  index = 0,
}: DashboardCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: index * 0.1 }}
      tabIndex={0}
      aria-label={title}
      className="focus-visible:ring-2 focus-visible:ring-primary outline-none"
    >
      <Card className="p-5 group cursor-default">
        <CardHeader className="flex items-start justify-between mb-4">
          <Badge variant="secondary" className={`w-10 h-10 flex items-center justify-center ${iconColors[color] ?? iconColors.blue}`} aria-label={title + ' icon'}>
            <Icon className="w-5 h-5" />
          </Badge>
          <TrendingUp className="w-4 h-4 text-gray-700 group-hover:text-emerald-400 transition-colors duration-300" aria-hidden="true" />
        </CardHeader>
        <CardTitle className="text-3xl font-bold text-card-foreground mb-1">{value}</CardTitle>
        <CardDescription className="text-xs text-muted-foreground mb-2">{title}</CardDescription>
        {subtitle && (
          <div className={`text-xs font-medium ${trendColors[color] ?? trendColors.blue}`}>{subtitle}</div>
        )}
      </Card>
    </motion.div>
  );
}
