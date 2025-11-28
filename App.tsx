import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatInterface } from './components/ChatInterface';
import { Dashboard } from './components/Dashboard';
import { User, Message, TimeLog, GeminiIntentResponse, BotIntent } from './types';
import { calculateEmployeeStats } from './services/timeService';
import { subMinutes } from 'date-fns';

// Mock Data
const MOCK_USERS: User[] = [
  { id: 'u1', username: 'AlexEngineer', role: 'employee', avatar: 'https://picsum.photos/id/64/100/100' },
  { id: 'u2', username: 'SarahDesign', role: 'employee', avatar: 'https://picsum.photos/id/65/100/100' },
  { id: 'u3', username: 'MikeManager', role: 'admin', avatar: 'https://picsum.photos/id/103/100/100' },
  { id: 'u4', username: 'DevDave', role: 'employee', avatar: 'https://picsum.photos/id/177/100/100' }
];

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<'chat' | 'dashboard'>('chat');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [currentUser] = useState<User>(MOCK_USERS[0]); // Default to first user
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      userId: 'bot',
      content: '',
      timestamp: new Date().toISOString(),
      isBot: true,
      embed: {
        title: 'ChronoBot Online',
        description: 'I am ready to track your time. Type `!in` to clock in, `!out` to clock out, or just tell me what you are doing!',
        color: '#5865F2'
      }
    }
  ]);
  const [logs, setLogs] = useState<TimeLog[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Initialize some fake previous logs for chart data visualization
  useEffect(() => {
    const fakeLogs: TimeLog[] = [];
    const now = new Date();
    
    MOCK_USERS.forEach(u => {
        // Random hours between 6 and 10
        const workedHours = 6 + Math.random() * 4;
        const start = subMinutes(now, workedHours * 60 + (Math.random() * 300)); // Started earlier today/yesterday
        
        fakeLogs.push({
            id: Math.random().toString(),
            userId: u.id,
            type: 'CLOCK_IN',
            timestamp: start.toISOString()
        });

        // Only clock out some of them
        if (Math.random() > 0.3) {
             fakeLogs.push({
                id: Math.random().toString(),
                userId: u.id,
                type: 'CLOCK_OUT',
                timestamp: subMinutes(now, Math.random() * 60).toISOString()
            });
        }
    });
    setLogs(fakeLogs);
  }, []);

  const handleSendMessage = (content: string, user: User) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      userId: user.id,
      content,
      timestamp: new Date().toISOString(),
      isBot: false
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleBotResponse = (message: Message) => {
    setMessages(prev => [...prev, message]);
  };

  const executeCommand = async (intentRes: GeminiIntentResponse, user: User): Promise<string> => {
    const { intent, timeOffsetMinutes } = intentRes;
    const now = new Date();
    const effectiveTime = timeOffsetMinutes ? subMinutes(now, timeOffsetMinutes) : now;

    // Check last status
    const userLogs = logs.filter(l => l.userId === user.id).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const lastLog = userLogs[userLogs.length - 1];
    const isWorking = lastLog && lastLog.type === 'CLOCK_IN';

    if (intent === BotIntent.CLOCK_IN) {
        if (isWorking) return `You are already clocked in since ${new Date(lastLog.timestamp).toLocaleTimeString()}.`;
        
        const newLog: TimeLog = {
            id: Date.now().toString(),
            userId: user.id,
            type: 'CLOCK_IN',
            timestamp: effectiveTime.toISOString()
        };
        setLogs(prev => [...prev, newLog]);
        return `✅ **Clocked In** at ${effectiveTime.toLocaleTimeString()} \nHave a great shift, ${user.username}!`;
    }

    if (intent === BotIntent.CLOCK_OUT) {
        if (!isWorking) return `You aren't currently clocked in.`;

        const newLog: TimeLog = {
            id: Date.now().toString(),
            userId: user.id,
            type: 'CLOCK_OUT',
            timestamp: effectiveTime.toISOString()
        };
        setLogs(prev => [...prev, newLog]);
        
        // Calculate session duration
        const startTime = new Date(lastLog.timestamp);
        const durationMs = effectiveTime.getTime() - startTime.getTime();
        const durationHrs = (durationMs / (1000 * 60 * 60)).toFixed(2);

        return `👋 **Clocked Out** at ${effectiveTime.toLocaleTimeString()} \nSession Duration: **${durationHrs} hours**. See you next time!`;
    }

    if (intent === BotIntent.STATUS) {
        // Calculate current stats for this user
        const stats = calculateEmployeeStats(logs, MOCK_USERS);
        const myStats = stats.find(s => s.userId === user.id);
        
        if (!myStats) return "No data found.";
        
        return `**Stats for ${user.username}**\n` +
               `Status: ${myStats.status === 'working' ? '🟢 Working' : '🔴 Offline'}\n` +
               `Total Hours: **${myStats.totalHours.toFixed(2)}h**\n` +
               `Overtime: **${myStats.overtimeHours.toFixed(2)}h**`;
    }

    return "I didn't quite catch that. Try saying 'Clock in', 'Clock out', or check your 'Status'.";
  };

  // Memoize stats for dashboard
  const stats = calculateEmployeeStats(logs, MOCK_USERS);

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-discord-dark font-sans transition-colors duration-200">
      <Sidebar 
        activeView={activeView} 
        setActiveView={setActiveView} 
        theme={theme}
        toggleTheme={toggleTheme}
      />
      
      <div className="flex-1 flex flex-col min-w-0">
        {activeView === 'chat' ? (
          <ChatInterface 
            currentUser={currentUser}
            messages={messages}
            users={MOCK_USERS}
            onSendMessage={handleSendMessage}
            onBotResponse={handleBotResponse}
            isProcessing={isProcessing}
            setIsProcessing={setIsProcessing}
            handleCommand={executeCommand}
          />
        ) : (
          <Dashboard stats={stats} logs={logs} isDarkMode={theme === 'dark'} />
        )}
      </div>
    </div>
  );
};

export default App;