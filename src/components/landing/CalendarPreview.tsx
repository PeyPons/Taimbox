import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, AlertTriangle, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WeekData {
  week: string;
  dates: string;
  estimated: number;
  real?: number;
  computed?: number;
  gain?: number;
  loss?: number;
  status: 'completed' | 'pending' | 'free';
  capacity: number;
  used: number;
  pending?: number;
}

const weeks: WeekData[] = [
  {
    week: 'S1',
    dates: '1-5 dic',
    estimated: 42,
    real: 31.5,
    computed: 32,
    gain: 0.5,
    status: 'completed',
    capacity: 40,
    used: 42,
    pending: 1
  },
  {
    week: 'S2',
    dates: '8-12 dic',
    estimated: 30,
    status: 'pending',
    capacity: 40,
    used: 30
  },
  {
    week: 'S3',
    dates: '15-19 dic',
    estimated: 42,
    real: 41.5,
    computed: 40,
    loss: 1.5,
    status: 'completed',
    capacity: 40,
    used: 42
  },
  {
    week: 'S4',
    dates: '22-26 dic',
    status: 'free',
    capacity: 40,
    used: 0
  },
  {
    week: 'S5',
    dates: '29-31 dic',
    status: 'free',
    capacity: 40,
    used: 0
  }
];

const totalMonth = weeks.reduce((sum, w) => sum + (w.used || 0), 0);
const totalCapacity = weeks.reduce((sum, w) => sum + w.capacity, 0);
const monthPercentage = Math.round((totalMonth / totalCapacity) * 100);

export function CalendarPreview() {
  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100 px-6 py-4">
        <h3 className="text-xl font-bold text-slate-900">Mi calendario</h3>
      </div>

      {/* User Profile */}
      <div className="px-6 py-4 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 border-2 border-indigo-200">
            <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-bold">
              MA
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-bold text-slate-900">María González</div>
            <div className="text-xs text-slate-500 uppercase tracking-wide">SEO Specialist</div>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-6 bg-slate-50">
        <div className="grid grid-cols-6 gap-3">
          {/* Week Headers */}
          {weeks.map((week) => (
            <div key={week.week} className="text-center">
              <div className="text-xs font-bold text-slate-600 mb-1">{week.week}</div>
              <div className="text-[10px] text-slate-500">{week.dates}</div>
            </div>
          ))}
          <div className="text-center">
            <div className="text-xs font-bold text-slate-600 mb-1">TOTAL MES</div>
          </div>

          {/* Week Cards */}
          {weeks.map((week) => {
            const percentage = Math.round((week.used / week.capacity) * 100);
            const isOver = week.used > week.capacity;
            
            return (
              <div
                key={week.week}
                className={cn(
                  "rounded-lg border-2 p-3 space-y-2 transition-all hover:shadow-md",
                  week.status === 'completed' && !isOver
                    ? "bg-emerald-50 border-emerald-200"
                    : week.status === 'pending'
                    ? "bg-amber-50 border-amber-200"
                    : "bg-slate-100 border-slate-300"
                )}
              >
                {/* Progress Bar */}
                <Progress 
                  value={Math.min(percentage, 100)} 
                  className={cn(
                    "h-1.5",
                    isOver ? "[&>div]:bg-red-500" :
                    week.status === 'completed' ? "[&>div]:bg-emerald-500" :
                    week.status === 'pending' ? "[&>div]:bg-amber-500" :
                    "[&>div]:bg-slate-400"
                  )}
                />

                {/* Estimated Hours */}
                {week.estimated > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 text-slate-600">
                      <Clock className="h-3 w-3" />
                      <span>Est.</span>
                    </div>
                    <span className="font-mono font-semibold text-slate-900">{week.estimated}h</span>
                  </div>
                )}

                {/* Real and Computed */}
                {week.real !== undefined && week.computed !== undefined && (
                  <div className="text-xs space-y-0.5">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Real</span>
                      <span className="font-mono font-semibold text-blue-700">{week.real}h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Comp.</span>
                      <span className="font-mono font-semibold text-emerald-700">{week.computed}h</span>
                    </div>
                  </div>
                )}

                {/* Gain/Loss Badge */}
                {week.gain !== undefined && (
                  <Badge className="w-full justify-center bg-emerald-500 text-white border-0 text-[10px] py-1">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Ganancia +{week.gain}h
                  </Badge>
                )}
                {week.loss !== undefined && (
                  <Badge className="w-full justify-center bg-red-500 text-white border-0 text-[10px] py-1">
                    <TrendingDown className="h-3 w-3 mr-1" />
                    Pérdida {week.loss}h
                  </Badge>
                )}

                {/* Free Status */}
                {week.status === 'free' && (
                  <div className="text-center text-xs font-medium text-slate-500 py-2">
                    LIBRE
                  </div>
                )}

                {/* Pending Tasks */}
                {week.pending && (
                  <div className="text-[10px] text-amber-600 font-medium">
                    +{week.pending} pendiente
                  </div>
                )}

                {/* Bottom Status */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                  {week.status === 'completed' && !isOver ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  )}
                  <span className={cn(
                    "text-[10px] font-mono font-bold",
                    isOver ? "text-red-600" :
                    week.status === 'completed' ? "text-emerald-600" :
                    "text-amber-600"
                  )}>
                    {week.used}/{week.capacity}h
                  </span>
                </div>
              </div>
            );
          })}

          {/* Total Month Card */}
          <div className="rounded-lg border-2 border-emerald-200 bg-emerald-50 p-4 flex flex-col items-center justify-center space-y-2">
            <div className="text-2xl font-bold text-emerald-700">{totalMonth}h</div>
            <div className="text-xs text-slate-600">/ {totalCapacity}h</div>
            <div className="text-sm font-bold text-emerald-600">{monthPercentage}%</div>
          </div>
        </div>
      </div>
    </div>
  );
}
