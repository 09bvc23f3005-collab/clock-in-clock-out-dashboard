import { TimeLog, EmployeeStats, User, DailyStat } from "../types";
import { differenceInMinutes, parseISO, startOfDay, isSameDay } from "date-fns";

const STANDARD_WORK_DAY_HOURS = 8;

export const calculateEmployeeStats = (logs: TimeLog[], users: User[]): EmployeeStats[] => {
  const stats: EmployeeStats[] = [];

  users.forEach(user => {
    const userLogs = logs
      .filter(log => log.userId === user.id)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    let totalMinutes = 0;
    let currentSessionStart: string | null = null;
    let status: 'working' | 'offline' = 'offline';
    let lastAction = undefined;

    // We can reuse the daily logic for accurate totals, 
    // but for the summary stats, we aggregate the daily totals to ensure consistency with the breakdown.
    const dailyStats = calculateDailyStats(user.id, logs);
    
    // Sum up from daily stats
    const totalWorkedMinutes = dailyStats.reduce((acc, day) => acc + (day.totalHours * 60), 0);
    const totalOvertimeMinutes = dailyStats.reduce((acc, day) => acc + (day.overtimeHours * 60), 0);
    
    // Determine current status based on last log
    const lastLog = userLogs[userLogs.length - 1];
    if (lastLog) {
        lastAction = lastLog.timestamp;
        if (lastLog.type === 'CLOCK_IN') {
            status = 'working';
        }
    }

    stats.push({
      userId: user.id,
      username: user.username,
      avatar: user.avatar,
      totalHours: parseFloat((totalWorkedMinutes / 60).toFixed(2)),
      overtimeHours: parseFloat((totalOvertimeMinutes / 60).toFixed(2)),
      status,
      lastAction
    });
  });

  return stats;
};

export const calculateDailyStats = (userId: string, logs: TimeLog[]): DailyStat[] => {
  const userLogs = logs
    .filter(l => l.userId === userId)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const dailyMap = new Map<string, { totalMinutes: number, logs: TimeLog[] }>();

  let currentSessionStart: TimeLog | null = null;

  userLogs.forEach(log => {
    const time = parseISO(log.timestamp);
    const dayKey = startOfDay(time).toISOString();
    
    if (!dailyMap.has(dayKey)) {
        dailyMap.set(dayKey, { totalMinutes: 0, logs: [] });
    }
    dailyMap.get(dayKey)!.logs.push(log);

    if (log.type === 'CLOCK_IN') {
        currentSessionStart = log;
    } else if (log.type === 'CLOCK_OUT' && currentSessionStart) {
        const start = parseISO(currentSessionStart.timestamp);
        // Attribute duration to the day the session STARTED
        const startDayKey = startOfDay(start).toISOString();
        
        // Ensure that day exists in map (it should, because we processed the start log)
        if (!dailyMap.has(startDayKey)) {
             dailyMap.set(startDayKey, { totalMinutes: 0, logs: [] });
        }

        const diff = differenceInMinutes(time, start);
        dailyMap.get(startDayKey)!.totalMinutes += diff;
        
        currentSessionStart = null;
    }
  });

  // Handle active session for today (Real-time calculation)
  if (currentSessionStart) {
      const start = parseISO(currentSessionStart.timestamp);
      // Only count ongoing time if it started today (or calculate partial)
      // For simplicity, if they are still clocked in, we add time up to NOW.
      const now = new Date();
      if (isSameDay(start, now)) {
          const diff = differenceInMinutes(now, start);
          const startDayKey = startOfDay(start).toISOString();
          if (dailyMap.has(startDayKey)) {
              dailyMap.get(startDayKey)!.totalMinutes += diff;
          }
      }
  }

  return Array.from(dailyMap.entries()).map(([date, data]) => {
      const totalHours = data.totalMinutes / 60;
      const overtimeHours = Math.max(0, totalHours - STANDARD_WORK_DAY_HOURS);
      return {
          date,
          totalHours,
          overtimeHours,
          logs: data.logs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      };
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const formatDuration = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h}h ${m}m`;
};