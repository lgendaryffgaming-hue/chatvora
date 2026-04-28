import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, Sparkles, User, Shield, Info, CreditCard, Clock, 
  Menu, X, Trash2, Download, MessageSquare, Bot, Phone,
  PlusCircle, History, ExternalLink, Code, Image as ImageIcon,
  Volume2, VolumeX, Layers, Activity, Cpu, Brain
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { getChatResponse, getSpeechResponse } from './services/geminiService';

const OWNER_EMAIL = 'elender2007@gmail.com';
const OWNER_NAME = 'Vallmdas Sai Pratik';
const UPI_NUMBER = '9000525645';

interface Message {
  role: 'user' | 'model';
  content: string;
}

interface Agent {
  id: string;
  name: string;
  topic: string;
  instructions: string;
  workspaceId: string;
}

interface Workspace {
  id: string;
  name: string;
  icon: string;
}

interface AgentBrain {
  globalInstructions: string;
  knowledgeBase: string[];
}

interface ChatSession {
  id: string;
  title: string;
  agentId?: string;
  workspaceId: string;
  messages: Message[];
  timestamp: number;
}

const ChatVoraLogo = ({ size = 40, className = "", hideText = false }: { size?: number, className?: string, hideText?: boolean }) => (
  <div className={`relative flex items-center gap-4 ${className}`}>
    <div className="relative group" style={{ width: size, height: size }}>
      {/* High-End Ambient Glow */}
      <div className="absolute inset-[-40%] rounded-full bg-gradient-to-tr from-[#7c6fff]/40 to-[#ff6b9d]/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      
      {/* Base Layer: Glass Prism */}
      <div className="absolute inset-0 rounded-[28%] bg-[#1a1a2e] border border-white/10 shadow-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
        <motion.div 
          animate={{ 
            x: ['-100%', '100%'],
            y: ['-100%', '100%']
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent skew-x-12"
        />
      </div>

      {/* SVG Symbol: The ChatVora "V" Prism */}
      <svg 
        viewBox="0 0 100 100" 
        className="relative z-10 w-full h-full p-2.5 drop-shadow-[0_0_8px_rgba(124,111,255,0.6)]"
      >
        <defs>
          <linearGradient id="voraGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7c6fff" />
            <stop offset="100%" stopColor="#ff6b9d" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        {/* Abstract "V" Neural Path */}
        <motion.path
          d="M20 30 L50 75 L80 30"
          stroke="url(#voraGrad)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
        />
        <circle cx="50" cy="75" r="5" fill="white" className="animate-pulse" />
        <circle cx="20" cy="30" r="3" fill="#7c6fff" />
        <circle cx="80" cy="30" r="3" fill="#ff6b9d" />
      </svg>
    </div>
    
    {!hideText && (
      <div className="flex flex-col">
        <div className="flex items-baseline overflow-hidden">
          <motion.span 
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            className="text-white font-display font-black tracking-tighter leading-none" 
            style={{ fontSize: size * 0.55 }}
          >
            CHAT
          </motion.span>
          <motion.span 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-[#7c6fff] font-display font-black tracking-tighter leading-none italic ml-0.5" 
            style={{ fontSize: size * 0.65 }}
          >
            VORA
          </motion.span>
        </div>
        <div className="h-0.5 w-full bg-gradient-to-r from-[#7c6fff] to-transparent mt-1" />
        <span className="text-[8px] text-[#7878a0] font-black tracking-[0.4em] uppercase mt-1">Advanced AGI Protocol</span>
      </div>
    )}
  </div>
);

export default function App() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOwnerMode, setIsOwnerMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [showBrainModal, setShowBrainModal] = useState(false);
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  const [workspaces, setWorkspaces] = useState<Workspace[]>([
    { id: 'default', name: 'Neural Home', icon: 'zap' }
  ]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState('default');
  const [brainData, setBrainData] = useState<AgentBrain>({
    globalInstructions: 'Be exceptionally precise, technical, and professional.',
    knowledgeBase: []
  });

  const [agents, setAgents] = useState<Agent[]>([]);
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);
  const [agentName, setAgentName] = useState('');
  const [agentTopic, setAgentTopic] = useState('');
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(29 * 24 * 60 * 60);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const savedSessions = localStorage.getItem('chatvora_sessions');
    const savedAgents = localStorage.getItem('chatvora_agents');
    const savedWorkspaces = localStorage.getItem('chatvora_workspaces');
    const savedBrain = localStorage.getItem('chatvora_brain');
    const onboarded = localStorage.getItem('chatvora_onboarded');
    
    if (!onboarded) {
      setShowOnboarding(true);
    }

    if (savedBrain) setBrainData(JSON.parse(savedBrain));
    if (savedWorkspaces) {
      const ws = JSON.parse(savedWorkspaces);
      setWorkspaces(ws);
      if (ws.length > 0) setActiveWorkspaceId(ws[0].id);
    }

    if (savedAgents) {
      try {
        setAgents(JSON.parse(savedAgents));
      } catch (e) {
        console.error("Failed to parse agents", e);
      }
    }

    if (savedSessions) {
      try {
        const parsed = JSON.parse(savedSessions);
        setSessions(parsed);
        if (parsed.length > 0) {
          setCurrentSessionId(parsed[0].id);
          setActiveAgentId(parsed[0].agentId || null);
        }
      } catch (e) {
        console.error("Failed to parse sessions", e);
      }
    } else {
      createNewChat();
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem('chatvora_sessions', JSON.stringify(sessions));
    }
    localStorage.setItem('chatvora_agents', JSON.stringify(agents));
    localStorage.setItem('chatvora_workspaces', JSON.stringify(workspaces));
    localStorage.setItem('chatvora_brain', JSON.stringify(brainData));
  }, [sessions, agents, workspaces, brainData]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const currentSession = sessions.find(s => s.id === currentSessionId);
  const messages = currentSession?.messages || [];

  useEffect(scrollToBottom, [messages]);

  const createNewChat = (agentId?: string) => {
    const agent = agents.find(a => a.id === agentId);
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: agent ? `Agent: ${agent.name}` : 'New Discussion',
      agentId: agentId,
      workspaceId: activeWorkspaceId,
      messages: [],
      timestamp: Date.now()
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setActiveAgentId(agentId || null);
    setIsSidebarOpen(false);
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    if (currentSessionId === id) {
      setCurrentSessionId(updated.length > 0 ? updated[0].id : null);
      setActiveAgentId(updated.length > 0 ? (updated[0].agentId || null) : null);
    }
  };

  const renameSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const session = sessions.find(s => s.id === id);
    const newTitle = prompt("Enter new protocol title:", session?.title);
    if (newTitle && newTitle.trim()) {
      setSessions(prev => prev.map(s => s.id === id ? { ...s, title: newTitle.trim() } : s));
    }
  };

  const completeOnboarding = () => {
    localStorage.setItem('chatvora_onboarded', 'true');
    setShowOnboarding(false);
  };

  const saveChatAsFile = () => {
    if (!currentSession) return;
    const content = currentSession.messages
      .map(m => `${m.role === 'user' ? 'USER' : 'AI'}: ${m.content}`)
      .join('\n\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentSession.title.replace(/\s+/g, '_')}_history.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatTime = (seconds: number) => {
    const d = Math.floor(seconds / (24 * 3600));
    const h = Math.floor((seconds % (24 * 3600)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${d}d ${h}h ${m}m remaining`;
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    // Subtle Owner Mode Activation
    const lowercaseInput = input.trim().toLowerCase();
    if (lowercaseInput === OWNER_EMAIL || lowercaseInput === 'saiashok19') {
      setIsOwnerMode(true);
      setInput('');
      const ownerMsg: Message = { role: 'model', content: `Identity Verified. Welcome back, **${OWNER_NAME}**. Unlimited capabilities unlocked.` };
      updateSessionMessages(ownerMsg);
      return;
    }

    const userMessage: Message = { role: 'user', content: input };
    updateSessionMessages(userMessage);
    setInput('');
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const activeAgent = agents.find(a => a.id === activeAgentId);
      const systemPrompt = activeAgent 
        ? `[GLOBAL_BRAIN_PROTOCOL]: ${brainData.globalInstructions}. \nYou are specialized Agent "${activeAgent.name}". Topic: ${activeAgent.topic}. Instructions: ${activeAgent.instructions}. Knowledge: ${brainData.knowledgeBase.join(', ')}`
        : `[GLOBAL_BRAIN_PROTOCOL]: ${brainData.globalInstructions}. \nYou are ChatVora AGI. Knowledge: ${brainData.knowledgeBase.join(', ')}`;

      const chatHistory = messages.map(m => ({ role: m.role, content: m.content }));
      const fullPrompt = [...chatHistory, userMessage];
      
      // Inject system prompt into the context
      if (activeAgent) {
        fullPrompt.unshift({ role: 'model', content: `[SYSTEM_PROTOCOL]: ${systemPrompt}` });
      }

      const response = await getChatResponse(fullPrompt);
      updateSessionMessages({ role: 'model', content: response });

      // Handle Voice
      if (isVoiceEnabled) {
        handleSpeech(response);
      }
    } catch (error) {
      console.error("Interaction failed:", error);
      setErrorMessage("Neural circuit failure. Please verify your Gemini API key in the Platform Settings.");
    } finally {
      setIsLoading(false);
    }
  };

  const audioContextRef = useRef<AudioContext | null>(null);

  const handleSpeech = async (text: string) => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    setIsSpeaking(true);
    
    // Clean text for speech (remove markdown)
    const cleanText = text.replace(/[*#_~`\[\]()]/g, '').slice(0, 1000);

    try {
      const base64Audio = await getSpeechResponse(cleanText);
      if (base64Audio) {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        
        const audioContext = audioContextRef.current;
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }

        const binaryString = atob(base64Audio);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        const int16Array = new Int16Array(bytes.buffer);
        const float32Array = new Float32Array(int16Array.length);
        for (let i = 0; i < int16Array.length; i++) {
          float32Array[i] = int16Array[i] / 32768;
        }

        const audioBuffer = audioContext.createBuffer(1, float32Array.length, 24000);
        audioBuffer.getChannelData(0).set(float32Array);
        
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.onended = () => setIsSpeaking(false);
        source.start();
      } else {
        throw new Error("No audio data received");
      }
    } catch (error) {
      console.error("Gemini TTS failed, falling back to Web Speech:", error);
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.1;
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const updateSessionMessages = (newMsg: Message) => {
    setSessions(prev => prev.map(s => {
      if (s.id === currentSessionId) {
        const updatedMessages = [...s.messages, newMsg];
        let newTitle = s.title;
        if (s.messages.length === 0 && newMsg.role === 'user') {
          newTitle = newMsg.content.slice(0, 30) + (newMsg.content.length > 30 ? '...' : '');
        }
        return { ...s, messages: updatedMessages, title: newTitle };
      }
      return s;
    }));
  };

  return (
    <div className="flex bg-[#080810] text-[#e8e8f5] font-sans h-screen overflow-hidden flex-col">
      {/* 85% Offer Banner */}
      <motion.div 
        initial={{ y: -50 }}
        animate={{ y: 0 }}
        className="bg-blue-600 p-1.5 text-center text-[11px] font-black uppercase tracking-[0.3em] text-white z-[100] shadow-xl"
      >
        🚀 85% DISCOUNT FOR LIMITED TIME • {formatTime(timeLeft)} REMAINING • PAY TO: {UPI_NUMBER} 🚀
      </motion.div>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Desktop Display */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-[#10101e] border-r border-[#252540] transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-[#252540] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ChatVoraLogo size={32} />
            </div>
            <button className="md:hidden" onClick={() => setIsSidebarOpen(false)}><X size={20}/></button>
          </div>

          <div className="px-4 py-3 border-b border-[#252540]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-[#7c6fff]">Workspaces</h3>
              <button 
                onClick={() => setShowWorkspaceModal(true)}
                className="p-1 hover:bg-[#252540] rounded text-[#7878a0] hover:text-white"
              >
                <PlusCircle size={14} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {workspaces.map(ws => (
                <button
                  key={ws.id}
                  onClick={() => setActiveWorkspaceId(ws.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-2 ${activeWorkspaceId === ws.id ? 'bg-[#7c6fff] border-[#7c6fff] text-white shadow-lg shadow-indigo-500/20' : 'bg-[#16162a] border-[#252540] text-[#7878a0] hover:border-[#7c6fff50]'}`}
                >
                  <Layers size={12} /> {ws.name}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 space-y-2">
            <button 
              onClick={() => createNewChat()}
              className="w-full flex items-center gap-2 justify-center py-2.5 px-4 bg-[#7c6fff] hover:bg-[#6a5eeb] text-white rounded-xl transition-all text-sm font-semibold shadow-lg shadow-indigo-500/10"
            >
              <PlusCircle size={18} /> Deep Chat
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => setShowAgentModal(true)}
                className="flex items-center gap-2 justify-center py-2.5 px-2 bg-[#16162a] border border-[#252540] hover:border-[#7c6fff]/50 hover:bg-[#1c1c36] text-[#7878a0] hover:text-[#7c6fff] rounded-xl transition-all text-[10px] font-black uppercase tracking-wider"
                title="Initialize a custom AI personality specialized in a specific knowledge domain"
              >
                <Bot size={14} /> New Agent
              </button>
              <button 
                onClick={() => setShowBrainModal(true)}
                className="flex items-center gap-2 justify-center py-2.5 px-2 bg-[#16162a] border border-[#252540] hover:border-[#ff6b9d]/50 hover:bg-[#1c1c36] text-[#7878a0] hover:text-[#ff6b9d] rounded-xl transition-all text-[10px] font-black uppercase tracking-wider"
                title="Manage the global neural knowledge of all agents"
              >
                <Cpu size={14} /> Agent Brain
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-6 custom-scrollbar">
            {/* Agent Management */}
            <div className="space-y-2">
              <h3 className="px-2 text-[9px] font-black uppercase tracking-[0.2em] text-[#7878a0]">Neural Agents</h3>
              {agents.filter(a => a.workspaceId === activeWorkspaceId || a.workspaceId === 'default').map(agent => (
                <div key={agent.id} className="space-y-1">
                  <div 
                    onClick={() => createNewChat(agent.id)}
                    className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${activeAgentId === agent.id ? 'bg-[#7c6fff10] border-[#7c6fff40]' : 'bg-[#16162a]/50 border-transparent hover:bg-[#16162a]'}`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className={`p-1.5 rounded-lg ${activeAgentId === agent.id ? 'bg-[#7c6fff] text-white' : 'bg-[#252540] text-[#7878a0]'}`}>
                        <Bot size={14} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className={`text-xs font-bold truncate ${activeAgentId === agent.id ? 'text-white' : 'text-[#7878a0]'}`}>
                          {agent.name}
                        </span>
                        <span className="text-[9px] text-pink-500 font-black tracking-tighter truncate uppercase">{agent.topic}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* History for this specific agent */}
                  <div className="ml-4 border-l border-[#252540] pl-2 space-y-1">
                    {sessions.filter(s => s.agentId === agent.id && s.workspaceId === activeWorkspaceId).map(s => (
                      <div 
                        key={s.id}
                        onClick={() => { setCurrentSessionId(s.id); setActiveAgentId(s.agentId || null); setIsSidebarOpen(false); }}
                        className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${currentSessionId === s.id ? 'bg-[#7c6fff10] text-white' : 'text-[#7878a0] hover:text-white hover:bg-[#16162a]'}`}
                      >
                        <span className="text-[11px] truncate max-w-[100px]">{s.title}</span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={(e) => renameSession(s.id, e)}
                            className="p-1 hover:text-[#7c6fff]"
                            title="Rename Protocol"
                          >
                            <Code size={10} />
                          </button>
                          <button 
                            onClick={(e) => deleteSession(s.id, e)}
                            className="p-1 hover:text-red-400"
                            title="Delete Protocol"
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Standard History */}
            <div className="space-y-2 text-sm">
              <h3 className="px-2 text-[9px] font-black uppercase tracking-[0.2em] text-[#7878a0]">General Intelligence</h3>
              {sessions.filter(s => !s.agentId && s.workspaceId === activeWorkspaceId).map(s => (
                <div 
                  key={s.id}
                  onClick={() => { setCurrentSessionId(s.id); setActiveAgentId(null); setIsSidebarOpen(false); }}
                  className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${currentSessionId === s.id ? 'bg-[#7c6fff20] border border-[#7c6fff20]' : 'hover:bg-[#16162a]'}`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <MessageSquare size={16} className={currentSessionId === s.id ? 'text-[#7c6fff]' : 'text-[#7878a0]'} />
                    <span className={`text-sm truncate ${currentSessionId === s.id ? 'text-white' : 'text-[#7878a0]'}`}>
                      {s.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => renameSession(s.id, e)}
                      className="p-1 hover:text-[#7c6fff]"
                      title="Rename Protocol"
                    >
                      <Code size={12} />
                    </button>
                    <button 
                      onClick={(e) => deleteSession(s.id, e)}
                      className="p-1 hover:text-red-400"
                      title="Delete Protocol"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 border-t border-[#252540]">
            <button 
              onClick={() => setShowPricing(true)}
              className="w-full py-2 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-purple-600/30 transition-all"
            >
              <CreditCard size={14} /> PREMIUM PLANS
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-[#10101e]/50 backdrop-blur-md border-b border-[#252540] px-4 flex items-center justify-between z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 text-[#7878a0]">
              <Menu size={24} />
            </button>
            <div className="flex items-center gap-3">
              <ChatVoraLogo size={36} />
              <div className="flex items-center bg-[#7c6fff10] border border-[#7c6fff20] rounded-full px-3 py-1 gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${isSpeaking ? 'bg-indigo-500 animate-pulse' : 'bg-[#7c6fff]'}`} />
                <span className="text-[10px] font-black uppercase tracking-widest text-[#7c6fff]">
                  {isSpeaking ? 'Model Speaking' : (isVoiceEnabled ? 'Voice Online' : 'Voice Offline')}
                  {activeAgentId && <span className="ml-2 text-pink-500 border-l border-[#7c6fff20] pl-2">{agents.find(a => a.id === activeAgentId)?.name} ACTIVED</span>}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden lg:flex flex-col items-end">
              <span className="text-[10px] font-bold text-red-500 animate-pulse">85% SPECIAL DISCOUNT</span>
              <span className="text-xs font-mono text-[#7878a0]">{formatTime(timeLeft)} left</span>
            </div>
            {isOwnerMode && (
              <div className="bg-[#00e5a020] border border-[#00e5a040] px-3 py-1 rounded-full flex items-center gap-2">
                <Shield size={14} className="text-[#00e5a0]" />
                <span className="text-[10px] font-bold text-[#00e5a0] tracking-widest uppercase">Owner Mode</span>
              </div>
            )}
            <button 
              onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
              className={`p-2 rounded-lg transition-colors ${isVoiceEnabled ? 'bg-[#7c6fff20] text-[#7c6fff] ring-1 ring-[#7c6fff]/30' : 'bg-[#252540] text-[#7878a0] hover:bg-[#2e2e4d]'}`}
              title={isVoiceEnabled ? "Mute neural vocal output" : "Enable neural vocal output – ChatVora will narrate its responses"}
            >
              {isVoiceEnabled ? (isSpeaking ? <Volume2 size={18} className="animate-pulse" /> : <Volume2 size={18} />) : <VolumeX size={18} />}
            </button>
            <button 
              onClick={() => window.open(window.location.href, '_blank')}
              className="p-2 bg-[#252540] text-[#7878a0] hover:bg-[#2e2e4d] hover:text-white rounded-lg transition-all"
              title="Open Neural Interface in New Window"
            >
              <ExternalLink size={18} />
            </button>
            <button 
              onClick={saveChatAsFile}
              disabled={!currentSession || messages.length === 0}
              className="p-2 bg-[#252540] text-[#7878a0] hover:bg-[#2e2e4d] hover:text-white rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              title="Save Protocol to local file"
            >
              <Download size={18} />
            </button>
            <button 
              onClick={() => setShowPricing(true)}
              className="p-2 bg-[#252540] rounded-lg hover:bg-[#2e2e4d] transition-colors"
            >
              <CreditCard size={18} />
            </button>
          </div>
        </header>

        {errorMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-6 mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-between z-10"
          >
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-lg bg-red-500 flex items-center justify-center text-white">
                <X size={14} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-red-400">{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-red-500/50 hover:text-red-500">
              <X size={14} />
            </button>
          </motion.div>
        )}

        {/* Chat Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center max-w-3xl mx-auto space-y-10 animate-in fade-in zoom-in duration-700">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                className="flex flex-col items-center space-y-6"
              >
                <ChatVoraLogo size={80} className="flex-col items-center gap-6" />
                <h2 className="text-3xl md:text-5xl font-display font-black tracking-tighter text-center">How can I assist your <span className="text-[#7c6fff]">evolution</span>?</h2>
              </motion.div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl px-4">
                {[
                  { icon: <Code size={16}/>, text: "Build a high-traffic AI chatbot for my brand", action: "I want to build a custom AI chatbot for my brand. What is the architecture and cost?" },
                  { icon: <Sparkles size={16}/>, text: "Explain Quantum Physics as a personal mentor", action: "Explain the core concepts of Quantum Physics like you are my high-level PhD mentor." },
                  { icon: <History size={16}/>, text: "Analyze the fall of the Roman Empire", action: "Give me a deep, multi-perspective analysis of why the Roman Empire eventually collapsed." },
                  { icon: <Bot size={16}/>, text: "Design a 30-day AI Engineering roadmap", action: "Design a 30-day intensive roadmap to become an expert AI Engineer." }
                ].map((item, i) => (
                  <button
                    key={i}
                    onClick={() => { setInput(item.action); }}
                    className="flex items-center gap-3 p-4 bg-[#16162a] border border-[#252540] rounded-2xl text-left hover:border-[#7c6fff]/50 hover:bg-[#1c1c36] transition-all group"
                  >
                    <div className="p-2 rounded-lg bg-[#252540] text-[#7878a0] group-hover:text-[#7c6fff] transition-colors">
                      {item.icon}
                    </div>
                    <span className="text-sm text-[#7878a0] group-hover:text-white transition-colors">{item.text}</span>
                  </button>
                ))}
              </div>
              
              <div className="flex flex-wrap justify-center gap-2 opacity-30 select-none">
                {["Quantum", "Neural", "Legal", "Global", "Code", "History"].map(s => (
                  <span key={s} className="px-3 py-1 bg-[#16162a] border border-[#252540] rounded-full text-[9px] font-bold uppercase tracking-widest">{s} MASTERED</span>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-3 max-w-[85%] md:max-w-[75%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center ${msg.role === 'user' ? 'bg-[#252540]' : 'bg-transparent'}`}>
                    {msg.role === 'user' ? <User size={16} /> : <ChatVoraLogo size={32} />}
                  </div>
                  <div className={`p-4 rounded-2xl shadow-lg border ${
                    msg.role === 'user' 
                      ? 'bg-[#7c6fff] border-[#7c6fff] text-white rounded-tr-none' 
                      : 'bg-[#16162a] border-[#252540] text-[#e8e8f5] rounded-tl-none'
                  }`}>
                    <div className="prose prose-invert prose-sm max-w-none prose-img:rounded-xl prose-img:shadow-2xl prose-img:border prose-img:border-white/10">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-[#16162a] border border-[#252540] rounded-2xl px-5 py-3 flex gap-2">
                <div className="w-2 h-2 bg-[#7c6fff] rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-[#7c6fff] rounded-full animate-bounce [animation-delay:-.3s]" />
                <div className="w-2 h-2 bg-[#7c6fff] rounded-full animate-bounce [animation-delay:-.5s]" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </main>

        {/* Input */}
        <footer className="p-4 md:p-6 bg-[#080810]/95 backdrop-blur-xl border-t border-[#252540]">
          <div className="max-w-4xl mx-auto relative group flex gap-2">
            <div className="relative flex-1">
              <input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Query the AGI consciousness..."
                className="w-full bg-[#16162a] border border-[#252540] rounded-2xl py-4 px-6 pr-14 outline-none focus:border-[#7c6fff] focus:ring-1 focus:ring-[#7c6fff]/30 transition-all text-white placeholder-[#7878a0]"
              />
              <button 
                onClick={handleSend}
                disabled={isLoading}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#7c6fff] hover:bg-[#6a5eeb] text-white rounded-xl flex items-center justify-center transition-all shadow-xl disabled:opacity-50"
              >
                <Send size={18} />
              </button>
            </div>
            <button 
              onClick={() => { setInput("Generate a stunning image of "); }}
              className="p-4 bg-[#16162a] border border-[#252540] rounded-2xl hover:border-[#7c6fff] hover:bg-[#1c1c36] text-[#7878a0] hover:text-[#7c6fff] transition-all"
              title="Generate AI Image"
            >
              <ImageIcon size={20} />
            </button>
          </div>
          <div className="mt-4 flex items-center justify-between px-2 text-[10px] text-[#7878a0] font-bold tracking-widest uppercase">
            <span>Powered by ChatVora AGI</span>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-[#00e5a0] rounded-full animate-pulse" />
              <span>Network Stable</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Onboarding Modal */}
      <AnimatePresence>
        {showOnboarding && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-[#0a0a14]/95 backdrop-blur-xl z-[100]" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.9 }} 
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#10101e] border border-[#7c6fff]/20 rounded-[3rem] p-12 z-[110] shadow-[0_0_100px_rgba(124,111,255,0.1)] custom-scrollbar"
            >
              <div className="flex flex-col items-center text-center mb-10">
                <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-tr from-[#7c6fff] to-[#ff6b9d] flex items-center justify-center mb-6 shadow-2xl">
                  <Sparkles size={48} className="text-white" />
                </div>
                <h2 className="text-4xl font-display font-black tracking-tight text-white mb-2">Welcome to ChatVora AGI</h2>
                <p className="text-[#7878a0] max-w-md">Your neural workspace for high-level intelligence and multi-agent coordination.</p>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-10">
                <div className="p-5 rounded-3xl bg-[#16162a] border border-[#252540]">
                  <div className="flex items-center gap-3 mb-2 text-[#7c6fff]">
                    <Bot size={18} />
                    <span className="text-xs font-black uppercase tracking-widest">Neural Agents</span>
                  </div>
                  <p className="text-xs text-[#7878a0] leading-relaxed">Build specialized AI personalities for research, coding, or creative subjects.</p>
                </div>
                <div className="p-5 rounded-3xl bg-[#16162a] border border-[#252540]">
                  <div className="flex items-center gap-3 mb-2 text-[#ff6b9d]">
                    <Cpu size={18} />
                    <span className="text-xs font-black uppercase tracking-widest">AgentBrain™</span>
                  </div>
                  <p className="text-xs text-[#7878a0] leading-relaxed">Manage global knowledge fragments that all your agents inherit and use.</p>
                </div>
                <div className="p-5 rounded-3xl bg-[#16162a] border border-[#252540]">
                  <div className="flex items-center gap-3 mb-2 text-[#00e5a0]">
                    <Layers size={18} />
                    <span className="text-xs font-black uppercase tracking-widest">Workspaces</span>
                  </div>
                  <p className="text-xs text-[#7878a0] leading-relaxed">Isolate your projects into neural zones for better organization and context.</p>
                </div>
                <div className="p-5 rounded-3xl bg-[#16162a] border border-[#252540]">
                  <div className="flex items-center gap-3 mb-2 text-indigo-400">
                    <Volume2 size={18} />
                    <span className="text-xs font-black uppercase tracking-widest">Neural Voice</span>
                  </div>
                  <p className="text-xs text-[#7878a0] leading-relaxed">Toggle high-quality vocal output for a truly immersive super-intelligent experience.</p>
                </div>
              </div>

              <button 
                onClick={completeOnboarding}
                className="w-full py-5 rounded-2xl bg-[#7c6fff] hover:bg-[#8d82ff] text-white font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/20 transition-all flex items-center justify-center gap-3"
              >
                Initiate Neural Session <Sparkles size={18} />
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Agent Creation Modal */}
      <AnimatePresence>
        {showAgentModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAgentModal(false)} className="fixed inset-0 bg-black/90 backdrop-blur-md z-[80]" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9, y: 20 }} 
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#10101e] border border-white/10 rounded-[2.5rem] p-10 z-[90] shadow-[0_0_100px_rgba(124,111,255,0.2)]"
            >
              <div className="flex flex-col items-center mb-8 text-center">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#7c6fff] to-[#ff6b9d] flex items-center justify-center mb-4 shadow-xl">
                  <Bot size={32} className="text-white" />
                </div>
                <h3 className="text-3xl font-display font-black tracking-tight">Build Neural Agent</h3>
                <p className="text-[#7878a0] text-sm mt-2">Design a specialized intelligence protocol.</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#7c6fff]">Agent Identity</label>
                  <input 
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    placeholder="e.g. Code Architect"
                    className="w-full bg-[#16162a] border border-[#252540] rounded-2xl py-4 px-6 outline-none focus:border-[#7c6fff] transition-all text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#7c6fff]">Expertiese Domain</label>
                  <input 
                    value={agentTopic}
                    onChange={(e) => setAgentTopic(e.target.value)}
                    placeholder="e.g. Next.js & TypeScript"
                    className="w-full bg-[#16162a] border border-[#252540] rounded-2xl py-4 px-6 outline-none focus:border-[#7c6fff] transition-all text-white"
                  />
                </div>
                <div className="pt-4">
                  <button 
                    onClick={() => {
                      if (!agentName || !agentTopic) return;
                      const newAgent: Agent = {
                        id: Date.now().toString(),
                        name: agentName,
                        topic: agentTopic,
                        instructions: `Expertise in ${agentTopic}. Professional, deep technical alignment.`,
                        workspaceId: activeWorkspaceId
                      };
                      setAgents(prev => [...prev, newAgent]);
                      setAgentName('');
                      setAgentTopic('');
                      setShowAgentModal(false);
                      createNewChat(newAgent.id);
                    }}
                    className="w-full py-4 bg-[#7c6fff] hover:bg-[#6a5eeb] text-white rounded-2xl font-bold tracking-tight transition-all shadow-xl shadow-indigo-500/20"
                  >
                    Initialize Agent
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Workspace Modal */}
      <AnimatePresence>
        {showWorkspaceModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowWorkspaceModal(false)} className="fixed inset-0 bg-black/95 backdrop-blur-md z-[80]" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9, y: 20 }} 
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#10101e] border border-white/10 rounded-[2.5rem] p-10 z-[90]"
            >
              <div className="flex flex-col items-center mb-8 text-center">
                <div className="w-16 h-16 rounded-3xl bg-indigo-500/20 flex items-center justify-center mb-4 border border-indigo-500/30">
                  <Layers size={32} className="text-[#7c6fff]" />
                </div>
                <h3 className="text-3xl font-display font-black tracking-tight">New Workspace</h3>
              </div>
              <input 
                placeholder="Workspace Name (e.g. Research Core)" 
                className="w-full bg-[#16162a] border border-[#252540] rounded-2xl py-4 px-6 outline-none focus:border-[#7c6fff] transition-all text-white mb-6"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const name = (e.currentTarget as HTMLInputElement).value;
                    if (!name) return;
                    const newWs: Workspace = { id: Date.now().toString(), name, icon: 'layers' };
                    setWorkspaces(prev => [...prev, newWs]);
                    setActiveWorkspaceId(newWs.id);
                    setShowWorkspaceModal(false);
                  }
                }}
              />
              <p className="text-[10px] text-[#7878a0] text-center font-bold uppercase tracking-widest">Press Enter to Neuralize</p>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Agent Brain Modal */}
      <AnimatePresence>
        {showBrainModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowBrainModal(false)} className="fixed inset-0 bg-black/95 backdrop-blur-md z-[80]" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9, y: 20 }} 
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-[#10101e] border border-white/10 rounded-[2.5rem] p-10 z-[90] shadow-[0_0_100px_rgba(255,107,157,0.15)]"
            >
              <div className="flex items-center gap-6 mb-10">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#ff6b9d] to-indigo-500 flex items-center justify-center shadow-2xl">
                  <Cpu size={40} className="text-white" />
                </div>
                <div>
                  <h3 className="text-4xl font-display font-black tracking-tight text-white mb-1">AgentBrain™ Dashboard</h3>
                  <p className="text-[#7878a0] text-sm">Configure global neural heuristics for all active agents.</p>
                </div>
              </div>

              <div className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#ff6b9d] flex items-center gap-2">
                    <Activity size={12} /> Global Heuristics (Inherited by all agents)
                  </label>
                  <textarea 
                    value={brainData.globalInstructions}
                    onChange={(e) => setBrainData(prev => ({ ...prev, globalInstructions: e.target.value }))}
                    className="w-full h-32 bg-[#16162a] border border-[#252540] rounded-2xl py-4 px-6 outline-none focus:border-[#ff6b9d] transition-all text-white resize-none text-sm leading-relaxed"
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#ff6b9d] flex items-center gap-2">
                    <Activity size={12} /> Knowledge Fragments
                  </label>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {brainData.knowledgeBase.map((k, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-2 bg-[#7c6fff20] border border-[#7c6fff30] rounded-xl text-xs font-bold text-white group">
                        {k}
                        <button onClick={() => setBrainData(p => ({ ...p, knowledgeBase: p.knowledgeBase.filter((_, idx) => idx !== i) }))} className="text-[#7878a0] hover:text-red-400">
                          <X size={12}/>
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input 
                      placeholder="Inject domain knowledge (e.g. 'Advanced React Design Patterns')"
                      className="flex-1 bg-[#16162a] border border-[#252540] rounded-2xl py-4 px-6 outline-none focus:border-[#ff6b9d] transition-all text-white"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const val = (e.currentTarget as HTMLInputElement).value;
                          if (!val) return;
                          setBrainData(prev => ({ ...prev, knowledgeBase: [...prev.knowledgeBase, val] }));
                          (e.currentTarget as HTMLInputElement).value = '';
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3 font-bold uppercase tracking-widest text-[10px]">
                  <span className="text-[#00e5a0]">Global Neural Sync: Active</span>
                  <div className="w-3 h-3 rounded-full bg-[#00e5a0] animate-pulse" />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Pricing Modal */}
      <AnimatePresence>
        {showPricing && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowPricing(false)} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl bg-[#10101e] border border-[#252540] rounded-[2rem] p-8 z-[70] shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-2xl font-display font-black">Plan Selections</h3>
                  <p className="text-[#7878a0] text-sm">Direct Payment to Official UPI: <span className="text-white font-mono">{UPI_NUMBER}</span></p>
                </div>
                <button onClick={() => setShowPricing(false)} className="p-2 hover:bg-[#252540] rounded-full transition-colors"><X size={20}/></button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: "Small App Chatbot", price: "₹190", original: "₹1,266", detail: "85% OFF" },
                  { label: "Website Chatbot", price: "₹700", original: "₹4,666", detail: "85% OFF" },
                  { label: "Monthly Access", price: "₹390", original: "₹2,600", detail: "85% OFF" },
                  { label: "Yearly Pass", price: "₹3,000", original: "₹20,000", detail: "85% OFF", best: true }
                ].map((plan, i) => (
                  <div key={i} className={`p-5 rounded-2xl border relative flex flex-col justify-between ${plan.best ? 'bg-[#7c6fff10] border-[#7c6fff] shadow-lg shadow-[#7c6fff]/10' : 'bg-[#16162a] border-[#252540]'}`}>
                    {plan.best && <span className="absolute -top-3 left-4 px-2 py-0.5 bg-[#7c6fff] text-[9px] font-black uppercase rounded-lg tracking-widest text-white">Best Value</span>}
                    <div>
                      <div className="text-[#7878a0] text-[10px] font-bold uppercase tracking-widest mb-1">{plan.label}</div>
                      <div className="flex items-baseline gap-2">
                        <div className="text-2xl font-black text-white leading-none">{plan.price}</div>
                        <div className="text-xs text-[#7878a0] line-through decoration-red-500/50">{plan.original}</div>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-[10px] text-red-500 font-bold">{plan.detail}</span>
                      <button className="text-[10px] bg-white text-black px-3 py-1 rounded-full font-black uppercase tracking-tighter hover:bg-[#7c6fff] hover:text-white transition-colors">Select</button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-[#252540] flex items-center gap-4 bg-[#7c6fff05] p-4 rounded-2xl">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center p-2">
                  <Phone className="text-[#7c6fff]" size={24} />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#7878a0] uppercase">Activation Support</div>
                  <div className="text-lg font-black text-white">{UPI_NUMBER}</div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}

