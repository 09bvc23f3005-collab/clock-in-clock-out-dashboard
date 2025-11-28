import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Clock, TrendingUp, CheckCircle, X, Calendar, ChevronRight } from 'lucide-react';
import { EmployeeStats, TimeLog } from '../types';
import { calculateDailyStats } from '../services/timeService';
import { format, parseISO } from 'date-fns';

interface DashboardProps {
  stats: EmployeeStats[];
  logs: TimeLog[];
  isDarkMode: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({ stats, logs, isDarkMode }) => {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  
  const totalHoursWorked = useMemo(() => stats.reduce((acc, curr) => acc + curr.totalHours, 0), [stats]);
  const totalOvertime = useMemo(() => stats.reduce((acc, curr) => acc + curr.overtimeHours, 0), [stats]);
  const activeEmployees = useMemo(() => stats.filter(s => s.status === 'working').length, [stats]);

  // Sort by hours for the chart
  const chartData = [...stats].sort((a, b) => b.totalHours - a.totalHours);

  // Get selected user details
  const selectedUserStats = useMemo(() => stats.find(s => s.userId === selectedUserId), [stats, selectedUserId]);
  const dailyStats = useMemo(() => selectedUserId ? calculateDailyStats(selectedUserId, logs) : [], [selectedUserId, logs]);

  return (
    <div className="flex-1 bg-gray-50 dark:bg-discord-dark overflow-y-auto p-6 md:p-10 relative transition-colors duration-200">
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Manager Dashboard</h1>
        <p className="text-gray-500 dark:text-discord-muted">Overview of employee work hours and overtime for the current month.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-discord-darker rounded-xl p-6 shadow-sm border border-gray-100 dark:border-discord-darkest transition-colors">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-500 dark:text-discord-muted font-medium text-sm uppercase tracking-wider">Total Hours</h3>
                <Clock className="text-discord-brand" size={20} />
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{totalHoursWorked.toFixed(1)} <span className="text-lg text-gray-400 font-normal">hrs</span></div>
        </div>

        <div className="bg-white dark:bg-discord-darker rounded-xl p-6 shadow-sm border border-gray-100 dark:border-discord-darkest transition-colors">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-500 dark:text-discord-muted font-medium text-sm uppercase tracking-wider">Total Overtime</h3>
                <TrendingUp className="text-discord-red" size={20} />
            </div>
            <div className="text-3xl font-bold text-discord-red">{totalOvertime.toFixed(1)} <span className="text-lg text-gray-400 font-normal">hrs</span></div>
            <div className="text-xs text-discord-muted mt-2">Exceeding 8h/day</div>
        </div>

        <div className="bg-white dark:bg-discord-darker rounded-xl p-6 shadow-sm border border-gray-100 dark:border-discord-darkest transition-colors">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-500 dark:text-discord-muted font-medium text-sm uppercase tracking-wider">Active Now</h3>
                <div className="relative">
                    <div className="w-3 h-3 bg-discord-green rounded-full animate-ping absolute top-0 right-0 opacity-75"></div>
                    <div className="w-3 h-3 bg-discord-green rounded-full relative"></div>
                </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{activeEmployees} <span className="text-lg text-gray-400 font-normal">/ {stats.length}</span></div>
        </div>

        <div className="bg-white dark:bg-discord-darker rounded-xl p-6 shadow-sm border border-gray-100 dark:border-discord-darkest transition-colors">
             <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-500 dark:text-discord-muted font-medium text-sm uppercase tracking-wider">Top Performer</h3>
                <CheckCircle className="text-yellow-500" size={20} />
            </div>
            <div className="flex items-center">
                 <img src={chartData[0]?.avatar} alt="" className="w-8 h-8 rounded-full mr-3" />
                 <div>
                    <div className="font-bold text-gray-900 dark:text-white truncate max-w-[120px]">{chartData[0]?.username || 'N/A'}</div>
                    <div className="text-xs text-gray-500 dark:text-discord-muted">{chartData[0]?.totalHours.toFixed(1) || 0} hours</div>
                 </div>
            </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-white dark:bg-discord-darker rounded-xl p-6 shadow-sm border border-gray-100 dark:border-discord-darkest h-[400px] transition-colors">
             <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Work Hours Distribution</h2>
             <ResponsiveContainer width="100%" height="85%">
                <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#40444b" : "#e5e7eb"} />
                    <XAxis dataKey="username" stroke={isDarkMode ? "#9ca3af" : "#6b7280"} tick={{fill: isDarkMode ? '#9ca3af' : '#6b7280'}} />
                    <YAxis stroke={isDarkMode ? "#9ca3af" : "#6b7280"} tick={{fill: isDarkMode ? '#9ca3af' : '#6b7280'}} />
                    <Tooltip 
                        contentStyle={{ 
                            backgroundColor: isDarkMode ? '#2f3136' : '#ffffff', 
                            borderColor: isDarkMode ? '#202225' : '#e5e7eb',
                            color: isDarkMode ? '#fff' : '#111827',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }}
                        itemStyle={{ color: isDarkMode ? '#fff' : '#111827' }}
                        cursor={{fill: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}}
                    />
                    <Bar dataKey="totalHours" name="Regular Hours" stackId="a" fill="#5865F2" radius={[0, 0, 4, 4]} />
                    <Bar dataKey="overtimeHours" name="Overtime" stackId="a" fill="#ED4245" radius={[4, 4, 0, 0]} />
                </BarChart>
             </ResponsiveContainer>
        </div>

        {/* Employee List */}
        <div className="bg-white dark:bg-discord-darker rounded-xl p-6 shadow-sm border border-gray-100 dark:border-discord-darkest h-[400px] overflow-hidden flex flex-col transition-colors">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Employee Status</h2>
            <p className="text-xs text-gray-500 dark:text-discord-muted mb-4">Click an employee to view daily breakdown.</p>
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                {stats.map(emp => (
                    <div 
                        key={emp.userId} 
                        onClick={() => setSelectedUserId(emp.userId)}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-discord-dark transition-colors cursor-pointer group"
                    >
                        <div className="flex items-center">
                            <div className="relative mr-3">
                                <img src={emp.avatar} alt={emp.username} className="w-10 h-10 rounded-full" />
                                <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-discord-darker ${emp.status === 'working' ? 'bg-discord-green' : 'bg-gray-500'}`}></div>
                            </div>
                            <div>
                                <div className="font-semibold text-gray-900 dark:text-white group-hover:text-discord-brand transition-colors">{emp.username}</div>
                                <div className="text-xs text-gray-500 dark:text-discord-muted flex items-center">
                                    {emp.status === 'working' ? 'Clocked In' : 'Clocked Out'}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center">
                             <div className="text-right mr-3">
                                <div className="text-sm font-bold text-gray-900 dark:text-white">{emp.totalHours.toFixed(1)}h</div>
                                {emp.overtimeHours > 0 && (
                                    <div className="text-xs text-discord-red font-semibold">+{emp.overtimeHours.toFixed(1)}h OT</div>
                                )}
                             </div>
                             <ChevronRight size={16} className="text-gray-400 dark:text-discord-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    </div>
                ))}
            </div>
        </div>

      </div>

      {/* User Detail Modal */}
      {selectedUserId && selectedUserStats && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-discord-dark rounded-xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[85vh] animate-in fade-in zoom-in duration-200 transition-colors">
                {/* Modal Header */}
                <div className="p-6 border-b border-gray-100 dark:border-discord-darkest flex items-center justify-between bg-white dark:bg-discord-darker rounded-t-xl transition-colors">
                    <div className="flex items-center gap-4">
                        <img src={selectedUserStats.avatar} alt="avatar" className="w-14 h-14 rounded-full border-4 border-gray-50 dark:border-discord-dark" />
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedUserStats.username}</h2>
                            <div className="flex gap-3 text-sm mt-1">
                                <span className="text-gray-500 dark:text-discord-muted">ID: {selectedUserStats.userId}</span>
                                <span className={`${selectedUserStats.status === 'working' ? 'text-discord-green' : 'text-gray-500'} font-medium flex items-center gap-1`}>
                                    <div className={`w-2 h-2 rounded-full ${selectedUserStats.status === 'working' ? 'bg-discord-green' : 'bg-gray-500'}`} />
                                    {selectedUserStats.status === 'working' ? 'Working Now' : 'Offline'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={() => setSelectedUserId(null)}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-discord-dark transition-colors text-gray-500 dark:text-discord-muted hover:text-gray-900 dark:hover:text-discord-text"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    <h3 className="text-sm font-bold uppercase text-gray-500 dark:text-discord-muted mb-4 flex items-center gap-2">
                        <Calendar size={16} /> Daily Breakdown
                    </h3>
                    
                    {dailyStats.length === 0 ? (
                         <div className="text-center py-10 text-gray-500 dark:text-discord-muted">No activity recorded for this period.</div>
                    ) : (
                        <div className="space-y-3">
                            {dailyStats.map((stat, idx) => (
                                <div key={idx} className="bg-gray-50 dark:bg-discord-darker rounded-lg border border-gray-100 dark:border-discord-darkest p-4 transition-all hover:border-discord-brand/50">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-discord-brand/10 text-discord-brand p-2 rounded-lg font-bold text-center min-w-[60px]">
                                                <div className="text-xs uppercase">{format(parseISO(stat.date), 'MMM')}</div>
                                                <div className="text-xl leading-none">{format(parseISO(stat.date), 'd')}</div>
                                            </div>
                                            <div>
                                                <div className="font-semibold text-gray-900 dark:text-white">{format(parseISO(stat.date), 'EEEE')}</div>
                                                <div className="text-xs text-gray-500 dark:text-discord-muted">
                                                    {stat.logs.length} activity logs
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <div className="text-xs text-gray-500 dark:text-discord-muted uppercase font-bold">Hours</div>
                                                <div className="font-mono font-bold text-gray-900 dark:text-white text-lg">
                                                    {stat.totalHours.toFixed(2)}h
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs text-gray-500 dark:text-discord-muted uppercase font-bold">Overtime</div>
                                                <div className={`font-mono font-bold text-lg ${stat.overtimeHours > 0 ? 'text-discord-red' : 'text-gray-400'}`}>
                                                    {stat.overtimeHours > 0 ? '+' : ''}{stat.overtimeHours.toFixed(2)}h
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Logs Timeline */}
                                    <div className="pl-4 border-l-2 border-gray-200 dark:border-discord-light/30 space-y-2 pt-1">
                                        {stat.logs.map((log) => (
                                            <div key={log.id} className="text-xs flex items-center justify-between text-gray-700 dark:text-discord-text/80">
                                                <span className="flex items-center gap-2">
                                                    <span className={`w-1.5 h-1.5 rounded-full ${log.type === 'CLOCK_IN' ? 'bg-discord-green' : 'bg-discord-red'}`}></span>
                                                    {log.type === 'CLOCK_IN' ? 'Clock In' : 'Clock Out'}
                                                </span>
                                                <span className="font-mono text-gray-500 dark:text-discord-muted">
                                                    {format(parseISO(log.timestamp), 'HH:mm:ss')}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="p-4 border-t border-gray-100 dark:border-discord-darkest bg-gray-50 dark:bg-discord-darker rounded-b-xl text-center text-xs text-gray-500 dark:text-discord-muted transition-colors">
                     Time calculated based on 8-hour work day standard.
                </div>
            </div>
        </div>
      )}

    </div>
  );
};