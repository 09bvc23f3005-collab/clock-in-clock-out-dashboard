import React, { useState, useEffect, useRef } from 'react';
import { Bot, PlusCircle, Gift, Sticker, Smile } from 'lucide-react';
import { Message, User, GeminiIntentResponse, BotIntent } from '../types';
import { GeminiService } from '../services/geminiService';

interface ChatInterfaceProps {
  currentUser: User;
  messages: Message[];
  onSendMessage: (content: string, user: User) => void;
  onBotResponse: (response: Message) => void;
  users: User[];
  isProcessing: boolean;
  setIsProcessing: (loading: boolean) => void;
  handleCommand: (intent: GeminiIntentResponse, user: User) => Promise<string>;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  currentUser,
  messages,
  onSendMessage,
  onBotResponse,
  users,
  isProcessing,
  setIsProcessing,
  handleCommand
}) => {
  const [inputValue, setInputValue] = useState('');
  const [activeUser, setActiveUser] = useState<User>(currentUser);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isProcessing) return;

    const content = inputValue;
    setInputValue('');
    onSendMessage(content, activeUser);
    setIsProcessing(true);

    try {
      // 1. Check for slash commands first (simple regex)
      let intentResponse: GeminiIntentResponse = { intent: BotIntent.UNKNOWN, confidence: 0 };
      
      if (content.startsWith('!in')) intentResponse = { intent: BotIntent.CLOCK_IN, confidence: 1 };
      else if (content.startsWith('!out')) intentResponse = { intent: BotIntent.CLOCK_OUT, confidence: 1 };
      else if (content.startsWith('!stats')) intentResponse = { intent: BotIntent.STATUS, confidence: 1 };
      else {
        // 2. Use Gemini for natural language
        intentResponse = await GeminiService.parseMessageIntent(content);
      }

      // 3. Execute logic
      const botReplyText = await handleCommand(intentResponse, activeUser);
      
      // 4. Create Bot Message Embed
      const botMessage: Message = {
        id: Date.now().toString(),
        userId: 'bot',
        content: '',
        timestamp: new Date().toISOString(),
        isBot: true,
        embed: {
            title: intentResponse.intent === BotIntent.CLOCK_IN ? 'Clock In Successful' : 
                   intentResponse.intent === BotIntent.CLOCK_OUT ? 'Clock Out Successful' :
                   intentResponse.intent === BotIntent.STATUS ? 'Employee Status' : 'ChronoBot Help',
            description: botReplyText,
            color: intentResponse.intent === BotIntent.UNKNOWN ? '#ED4245' : '#3BA55C'
        }
      };

      onBotResponse(botMessage);

    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-discord-dark w-full transition-colors duration-200">
      {/* Header */}
      <div className="h-12 border-b border-gray-200 dark:border-discord-darkest flex items-center px-4 shadow-sm bg-white dark:bg-discord-dark transition-colors">
        <div className="text-xl font-bold text-gray-400 dark:text-discord-muted mr-2">#</div>
        <div className="font-bold text-gray-900 dark:text-white mr-4">time-tracking</div>
        <div className="text-xs text-gray-500 dark:text-discord-muted border-l border-gray-300 dark:border-discord-light pl-4">
          Clock in and out here using commands or natural language.
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => {
          const isSequence = index > 0 && messages[index - 1].userId === msg.userId && 
                             (new Date(msg.timestamp).getTime() - new Date(messages[index-1].timestamp).getTime() < 60000);
          
          const messageUser = msg.isBot ? { username: 'ChronoBot', avatar: '', role: 'bot' } : users.find(u => u.id === msg.userId) || users[0];

          return (
            <div key={msg.id} className={`flex group hover:bg-gray-100 dark:hover:bg-[#32353b] -mx-4 px-4 py-1 transition-colors ${isSequence ? 'mt-0.5' : 'mt-4'}`}>
              {!isSequence ? (
                <div className="w-10 h-10 rounded-full bg-gray-600 shrink-0 mr-4 overflow-hidden flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity">
                    {msg.isBot ? <Bot size={24} className="text-white" /> : (
                       <img src={messageUser.avatar} alt="avatar" className="w-full h-full object-cover" /> 
                    )}
                </div>
              ) : (
                 <div className="w-10 mr-4 shrink-0 text-[10px] text-gray-400 dark:text-discord-muted text-right opacity-0 group-hover:opacity-100 self-center">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                 </div>
              )}

              <div className="flex-1 min-w-0">
                {!isSequence && (
                  <div className="flex items-center">
                    <span className={`font-medium mr-2 cursor-pointer hover:underline ${msg.isBot ? 'text-discord-brand' : 'text-gray-900 dark:text-white'}`}>
                        {messageUser.username}
                    </span>
                    {msg.isBot && <span className="bg-discord-brand text-white text-[10px] px-1 rounded flex items-center h-4 uppercase font-bold">Bot</span>}
                    <span className="text-xs text-gray-500 dark:text-discord-muted ml-2">
                        {new Date(msg.timestamp).toLocaleDateString()} at {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}
                
                <div className={`text-gray-800 dark:text-discord-text leading-snug whitespace-pre-wrap ${!isSequence ? 'mt-1' : ''}`}>
                    {msg.content}
                    {msg.embed && (
                        <div className="mt-2 rounded bg-gray-100 dark:bg-discord-darker border-l-4 p-3 max-w-md" style={{ borderLeftColor: msg.embed.color }}>
                            <div className="font-bold text-gray-900 dark:text-white mb-1">{msg.embed.title}</div>
                            <div className="text-sm">{msg.embed.description}</div>
                            {msg.embed.fields && (
                                <div className="mt-2 grid grid-cols-2 gap-2">
                                    {msg.embed.fields.map((f, i) => (
                                        <div key={i} className={f.inline ? '' : 'col-span-2'}>
                                            <div className="font-bold text-xs text-gray-500 dark:text-discord-muted">{f.name}</div>
                                            <div className="text-sm">{f.value}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="px-4 pb-6 pt-2">
        {/* Simulator Controls (User Switcher) */}
        <div className="flex items-center gap-2 mb-2 text-xs text-gray-500 dark:text-discord-muted">
             <span>Simulating as:</span>
             <select 
                className="bg-gray-100 dark:bg-discord-darker text-gray-900 dark:text-white border border-gray-300 dark:border-discord-darkest rounded px-2 py-1 outline-none transition-colors"
                value={activeUser.id}
                onChange={(e) => {
                    const user = users.find(u => u.id === e.target.value);
                    if (user) setActiveUser(user);
                }}
             >
                 {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
             </select>
             <span className="ml-auto opacity-50 italic">Try: "Clock in now", "I left 5 mins ago", "!stats"</span>
        </div>

        <div className="bg-gray-100 dark:bg-discord-light rounded-lg px-4 py-2.5 flex items-center shadow-sm transition-colors">
          <button className="text-gray-500 dark:text-discord-muted hover:text-gray-900 dark:hover:text-white mr-3 transition-colors">
            <PlusCircle size={20} />
          </button>
          <form onSubmit={handleSubmit} className="flex-1">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={`Message #${"time-tracking"}`}
              className="w-full bg-transparent text-gray-900 dark:text-discord-text placeholder-gray-500 dark:placeholder-discord-muted outline-none font-light"
              disabled={isProcessing}
            />
          </form>
          <div className="flex items-center space-x-3 ml-2 text-gray-500 dark:text-discord-muted">
            <Gift size={20} className="hover:text-gray-900 dark:hover:text-white cursor-pointer transition-colors" />
            <Sticker size={20} className="hover:text-gray-900 dark:hover:text-white cursor-pointer transition-colors" />
            <Smile size={20} className="hover:text-gray-900 dark:hover:text-white cursor-pointer transition-colors" />
            {isProcessing && <div className="animate-spin h-4 w-4 border-2 border-discord-brand border-t-transparent rounded-full"></div>}
          </div>
        </div>
      </div>
    </div>
  );
};