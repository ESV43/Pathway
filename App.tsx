
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MemoryRouter, Routes, Route, NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  GraduationCap, 
  Calendar as CalendarIcon, 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  CheckCircle2, 
  Circle, 
  Sparkles,
  Clock,
  Trash2,
  X,
  Edit2,
  Save,
  Check,
  Download,
  Upload,
  RefreshCw,
  Settings,
  StickyNote,
  Zap,
  Target,
  Trophy,
  Lightbulb,
  ArrowUpRight,
  Key,
  Wand2,
  Layers,
  Activity,
  MoreVertical,
  AlertCircle,
  AlertTriangle
} from 'lucide-react';

import { 
  AppState, 
  Course, 
  AcademicProject, 
  ProgressStatus, 
  AcademicTaskStatus, 
  Topic, 
  Module,
  UserProfile,
  Task
} from './types.ts';
import { 
  parseSyllabus, 
  generateTopicAssistance, 
  generateCourseRoadmap, 
  generatePipelineTasks 
} from './services/geminiService.ts';

const STORAGE_KEY = 'pathways_academic_v3_final';

const StorageService = {
  save: (data: AppState) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },
  load: (): AppState => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return {
        user: { name: 'Scholar', role: 'Student' },
        courses: [],
        academicProjects: []
      };
      return JSON.parse(saved);
    } catch (e) {
      console.error("Storage error:", e);
      return { user: { name: 'Scholar', role: 'Student' }, courses: [], academicProjects: [] };
    }
  }
};

const generateId = () => Math.random().toString(36).substr(2, 9);

// Helper to calculate deadline urgency
const getUrgency = (dateStr: string) => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dateStr);
  due.setHours(0, 0, 0, 0);
  const diffTime = due.getTime() - now.getTime();
  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (days < 0) return { label: `Overdue ${Math.abs(days)}d`, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', days, icon: AlertCircle };
  if (days === 0) return { label: 'Due Today', color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20', days, icon: AlertTriangle };
  if (days <= 3) return { label: `${days}d Left`, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', days, icon: Clock };
  if (days <= 7) return { label: `${days}d Left`, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', days, icon: Clock };
  return { label: null, color: 'text-slate-500', bg: 'bg-white/5', border: 'border-white/5', days, icon: CalendarIcon };
};

const CircularProgress: React.FC<{ percentage: number; size?: number; strokeWidth?: number; color?: string; children?: React.ReactNode, onClick?: (e: React.MouseEvent) => void }> = ({ percentage, size = 32, strokeWidth = 3, color = "text-indigo-500", children, onClick }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <button onClick={onClick} className="relative flex items-center justify-center group" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90 w-full h-full">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-white/10"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`${color} transition-all duration-500 ease-out`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </button>
  );
};

const ACADEMIC_TIPS = [
  "Active Recall: Test yourself instead of just re-reading.",
  "Spaced Repetition: 30 mins over 5 days is better than 5 hours in 1 day.",
  "5-Minute Rule: Tell yourself you'll do just 5 minutes to get started.",
  "Feynman Technique: Explain it simply to a rubber duck to master it.",
  "Sleep is Study: Your brain consolidates learning while you rest.",
  "Interleaving: Mix subjects in one session to boost retention."
];

const GlassCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={`glass rounded-3xl p-4 md:p-6 transition-all duration-300 ${className}`}>
    {children}
  </div>
);

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 md:p-4">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <GlassCard className="w-full max-w-lg relative z-10 shadow-2xl border-white/20 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center mb-4 px-1">
          <h3 className="text-lg font-bold flex items-center gap-2">{title}</h3>
          <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-full transition-colors text-slate-400"><X size={20}/></button>
        </div>
        <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-4">
          {children}
        </div>
      </GlassCard>
    </div>
  );
};

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input 
    {...props} 
    className={`w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-white placeholder:text-slate-600 ${props.className || ''}`}
  />
);

const Label: React.FC<{children: React.ReactNode}> = ({children}) => (
  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 ml-2">{children}</label>
);

const Sidebar: React.FC<{ user: UserProfile; onSettings: () => void }> = ({ user, onSettings }) => {
  const navItems = [
    { to: "/", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/courses", icon: BookOpen, label: "Curriculum" },
    { to: "/pipeline", icon: Layers, label: "Pipeline" },
    { to: "/calendar", icon: CalendarIcon, label: "Timeline" },
  ];

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-72 bg-[#020617] border-r border-white/5 p-8 hidden lg:flex flex-col z-50">
      <div className="flex items-center gap-3 mb-12 px-2">
        <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Zap size={22} className="text-white" fill="white" />
        </div>
        <div>
          <h1 className="text-lg font-black tracking-tighter text-white">PATHWAYS</h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">v3.0 Academic</p>
        </div>
      </div>
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => `flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 group ${isActive ? 'bg-indigo-600/10 text-indigo-400' : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'}`}>
            <item.icon size={20} className="transition-transform group-hover:scale-110" />
            <span className="text-xs font-bold uppercase tracking-widest">{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="pt-8 border-t border-white/5">
        <button onClick={onSettings} className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-slate-500 hover:bg-white/5 hover:text-slate-300 transition-all group">
          <Settings size={20} className="group-hover:rotate-45 transition-transform" />
          <span className="text-xs font-bold uppercase tracking-widest">Settings</span>
        </button>
      </div>
    </aside>
  );
};

const MobileNav: React.FC<{ user: UserProfile; onSettings: () => void }> = ({ onSettings }) => {
  const navItems = [
    { to: "/", icon: LayoutDashboard },
    { to: "/courses", icon: BookOpen },
    { to: "/pipeline", icon: Layers },
    { to: "/calendar", icon: CalendarIcon },
  ];

  return (
    <nav className="fixed bottom-4 left-4 right-4 h-16 glass-dark border border-white/10 rounded-3xl flex items-center justify-around px-2 lg:hidden z-50 shadow-2xl">
      {navItems.map((item) => (
        <NavLink key={item.to} to={item.to} className={({ isActive }) => `p-3 rounded-2xl transition-all ${isActive ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}>
          <item.icon size={22} />
        </NavLink>
      ))}
      <button onClick={onSettings} className="p-3 text-slate-500 hover:text-white transition-colors"><Settings size={22} /></button>
    </nav>
  );
};

const Dashboard: React.FC<{ data: AppState }> = ({ data }) => {
  const currentTip = useMemo(() => ACADEMIC_TIPS[Math.floor(Math.random() * ACADEMIC_TIPS.length)], []);

  const stats = useMemo(() => {
    let totalTopics = 0, masteredTopics = 0, inProgressTopics = 0;
    data.courses.forEach(c => c.modules.forEach(m => m.topics.forEach(t => { 
      totalTopics++; 
      if (t.status === ProgressStatus.MASTERED) masteredTopics++; 
      else if (t.status === ProgressStatus.IN_PROGRESS) inProgressTopics++;
    })));
    return { 
      totalTopics, masteredTopics, inProgressTopics,
      pct: totalTopics === 0 ? 0 : Math.round((masteredTopics / totalTopics) * 100),
      pipelineCount: data.academicProjects.filter(p => p.status !== AcademicTaskStatus.SUBMITTED).length
    };
  }, [data]);

  const urgentDeadlines = useMemo(() => {
    // Collect both pipeline projects and course tasks
    const pipelineItems = data.academicProjects
      .filter(p => p.status !== AcademicTaskStatus.SUBMITTED)
      .map(p => ({...p, type: 'Project'}));
      
    const taskItems: any[] = [];
    data.courses.forEach(c => c.modules.forEach(m => m.topics.forEach(t => t.tasks.forEach(task => {
        if (!task.completed && task.deadline) {
            taskItems.push({
                id: task.id,
                title: task.title,
                deadline: task.deadline,
                type: 'Study Task',
                context: `${c.title} - ${t.title}`
            });
        }
    }))));

    const allItems = [...pipelineItems, ...taskItems]
      .map(p => ({...p, urgency: getUrgency(p.deadline)}))
      .filter(p => p.urgency.days <= 7)
      .sort((a, b) => a.urgency.days - b.urgency.days)
      .slice(0, 4); // Show top 4

    return allItems;
  }, [data]);

  const strategicNextStep = useMemo(() => {
    let bestCandidate = null;
    for (const course of data.courses) {
      for (const module of course.modules) {
        for (const topic of module.topics) {
          if (topic.status === ProgressStatus.IN_PROGRESS) {
            return { courseTitle: course.title, topicTitle: topic.title };
          }
          if (topic.status === ProgressStatus.NOT_STARTED && !bestCandidate) {
            bestCandidate = { courseTitle: course.title, topicTitle: topic.title };
          }
        }
      }
    }
    return bestCandidate;
  }, [data.courses]);

  return (
    <div className="space-y-6 animate-in fade-in duration-1000">
      <div className="px-1 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight">Focus Station</h2>
          <p className="text-sm text-slate-400 mt-1">Status: {stats.pct}% Syllabus Coverage</p>
        </div>
        <div className="flex gap-2">
            <GlassCard className="py-2 px-4 flex items-center gap-2 border-none bg-indigo-600/10">
                <Zap size={14} className="text-indigo-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Peak Focus</span>
            </GlassCard>
        </div>
      </div>

      {urgentDeadlines.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-4 md:p-6">
           <div className="flex items-center gap-2 mb-3">
             <AlertCircle size={20} className="text-red-400" />
             <h3 className="text-sm font-black uppercase tracking-widest text-red-200">Deadline Watch</h3>
           </div>
           <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
             {urgentDeadlines.map(item => (
                <div key={item.id} className="bg-black/20 rounded-2xl p-3 flex items-start gap-3">
                   <div className={`mt-1 w-2 h-2 rounded-full ${item.urgency.days < 0 ? 'bg-red-500' : 'bg-orange-500'}`} />
                   <div>
                      <p className="text-xs font-bold text-white break-words">{item.title}</p>
                      <p className={`text-[10px] font-black uppercase tracking-widest ${item.urgency.color} flex items-center gap-1`}>
                        {item.type === 'Study Task' && <BookOpen size={8}/>}
                        {item.urgency.label}
                      </p>
                   </div>
                </div>
             ))}
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard className="bg-indigo-600 text-white border-none p-6 md:p-8 flex flex-col justify-between shadow-indigo-500/20 overflow-hidden relative min-h-[180px]">
           <div className="absolute top-0 right-0 p-8 opacity-10 scale-150 rotate-12"><Activity size={100} /></div>
           <div className="relative z-10">
             <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">Total Coverage</p>
             <h4 className="text-5xl font-black tracking-tighter">{stats.pct}%</h4>
           </div>
           <div className="relative z-10 space-y-3 pt-4">
             <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest opacity-80">
               <span>Mastered Topics</span>
               <span>{stats.masteredTopics} / {stats.totalTopics}</span>
             </div>
             <div className="h-2 w-full bg-black/20 rounded-full overflow-hidden">
               <div className="h-full bg-white transition-all duration-1000" style={{width: `${stats.pct}%`}} />
             </div>
           </div>
        </GlassCard>

        <GlassCard className="bg-gradient-to-br from-white/5 to-white/[0.02] border-white/10 lg:col-span-2 flex flex-col justify-center p-6 min-h-[180px]">
           <div className="flex items-center gap-2 mb-4">
             <Target className="text-indigo-400" size={18} />
             <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Strategic Next Step</h3>
           </div>
           {strategicNextStep ? (
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1 truncate">{strategicNextStep.courseTitle}</p>
                  <h4 className="text-xl md:text-2xl font-black text-white truncate">{strategicNextStep.topicTitle}</h4>
                </div>
                <NavLink to="/courses" className="bg-indigo-600 px-6 py-3.5 rounded-2xl text-[10px] font-black text-white uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2 w-full md:w-auto">
                  CONTINUE <ArrowUpRight size={14}/>
                </NavLink>
             </div>
           ) : (
             <p className="text-xs text-slate-500 italic">No tasks active. Start a new course below.</p>
           )}
        </GlassCard>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4 flex flex-col items-center text-center">
          <BookOpen className="text-indigo-400 mb-2" size={20} />
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Units</p>
          <p className="text-2xl font-black text-white">{data.courses.length}</p>
        </GlassCard>
        <GlassCard className="p-4 flex flex-col items-center text-center">
          <Layers className="text-emerald-400 mb-2" size={20} />
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pipeline</p>
          <p className="text-2xl font-black text-white">{stats.pipelineCount}</p>
        </GlassCard>
        <GlassCard className="p-4 flex flex-col items-center text-center">
          <Clock className="text-purple-400 mb-2" size={20} />
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">In Progress</p>
          <p className="text-2xl font-black text-white">{stats.inProgressTopics}</p>
        </GlassCard>
        <GlassCard className="p-4 flex flex-col items-center text-center bg-white/5 border-none">
          <Lightbulb className="text-yellow-400 mb-2" size={18} />
          <p className="text-[9px] font-medium text-slate-300 italic leading-tight">{currentTip}</p>
        </GlassCard>
      </div>
    </div>
  );
};

const TopicDeepDive: React.FC<{
  isOpen: boolean;
  topic: Topic;
  courseTitle: string;
  onClose: () => void;
  onUpdate: (updatedTopic: Topic) => void;
  userApiKey?: string;
}> = ({ isOpen, topic, courseTitle, onClose, onUpdate, userApiKey }) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'resources'>('overview');
  const [taskText, setTaskText] = useState('');
  const [taskDeadline, setTaskDeadline] = useState('');

  const handleGenerateAssistance = async () => {
    setLoading(true);
    try {
      const assistance = await generateTopicAssistance(topic.title, courseTitle, userApiKey);
      const updatedTopic = { ...topic };
      
      if (assistance.explanation) {
         updatedTopic.resources = [
             ...updatedTopic.resources, 
             {
                 id: generateId(),
                 type: 'markdown',
                 title: 'AI Summary',
                 content: assistance.explanation
             }
         ];
      }

      if (assistance.suggestedTasks && Array.isArray(assistance.suggestedTasks)) {
          const newTasks = assistance.suggestedTasks.map((t: string) => ({
              id: generateId(),
              title: t,
              completed: false,
              priority: 'Medium'
          }));
          updatedTopic.tasks = [...updatedTopic.tasks, ...newTasks];
      }

      onUpdate(updatedTopic);
      setActiveTab('tasks');
    } catch (e) {
      console.error(e);
      alert("AI Assistance Failed. Check API Key.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = () => {
    if (taskText.trim()) {
        onUpdate({
            ...topic,
            tasks: [...topic.tasks, { 
                id: generateId(), 
                title: taskText, 
                completed: false, 
                priority: 'Medium',
                deadline: taskDeadline 
            }]
        });
        setTaskText('');
        setTaskDeadline('');
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Topic Deep Dive">
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-black text-white">{topic.title}</h2>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{courseTitle}</p>
          </div>
          <button 
            onClick={handleGenerateAssistance} 
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600/10 text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-xl transition-all disabled:opacity-50"
          >
            {loading ? <RefreshCw className="animate-spin" size={16} /> : <Sparkles size={16} />}
            <span className="text-[10px] font-black uppercase tracking-widest">AI Assist</span>
          </button>
        </div>

        <div className="flex gap-4 border-b border-white/10">
            {(['overview', 'tasks', 'resources'] as const).map(tab => (
                <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-3 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === tab ? 'text-indigo-400 border-indigo-400' : 'text-slate-500 border-transparent hover:text-white'}`}
                >
                    {tab}
                </button>
            ))}
        </div>

        <div className="min-h-[300px]">
            {activeTab === 'overview' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                        <span className="text-xs font-bold text-slate-400">Current Status</span>
                        <button
                            onClick={() => onUpdate({...topic, status: topic.status === ProgressStatus.MASTERED ? ProgressStatus.NOT_STARTED : ProgressStatus.MASTERED})}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${topic.status === ProgressStatus.MASTERED ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700/50 text-slate-400'}`}
                        >
                            {topic.status}
                        </button>
                    </div>
                    {topic.resources.filter(r => r.type === 'markdown').map(r => (
                        <div key={r.id} className="p-4 bg-indigo-900/10 border border-indigo-500/20 rounded-2xl">
                            <div className="flex items-center gap-2 mb-2 text-indigo-400">
                                <Sparkles size={14} />
                                <span className="text-[10px] font-black uppercase tracking-widest">{r.title}</span>
                            </div>
                            <p className="text-sm text-slate-300 leading-relaxed">{r.content}</p>
                        </div>
                    ))}
                    {topic.resources.filter(r => r.type === 'markdown').length === 0 && (
                        <div className="p-8 text-center border border-dashed border-white/10 rounded-2xl">
                            <p className="text-xs text-slate-500 italic">No summary available. Click "AI Assist" to generate one.</p>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'tasks' && (
                <div className="space-y-4">
                    <form 
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleAddTask();
                        }}
                        className="flex gap-2"
                    >
                        <div className="flex-1 space-y-2">
                            <Input 
                                value={taskText} 
                                onChange={e => setTaskText(e.target.value)} 
                                placeholder="Add a specific study task..." 
                            />
                        </div>
                        <input 
                            type="date" 
                            className="w-12 bg-white/5 border border-white/10 rounded-2xl px-2 text-center text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer" 
                            value={taskDeadline}
                            onChange={e => setTaskDeadline(e.target.value)}
                            title="Set Deadline"
                        />
                        <button type="submit" className="w-12 bg-white/10 rounded-2xl flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all">
                            <Plus size={20} />
                        </button>
                    </form>
                    
                    <div className="space-y-2">
                        {topic.tasks.map(task => {
                            const urgency = task.deadline ? getUrgency(task.deadline) : null;
                            return (
                            <div key={task.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl group hover:bg-white/10 transition-colors">
                                <button
                                    onClick={() => onUpdate({...topic, tasks: topic.tasks.map(t => t.id === task.id ? {...t, completed: !t.completed} : t)})}
                                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${task.completed ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600 hover:border-slate-400'}`}
                                >
                                    {task.completed && <Check size={12} className="text-white" />}
                                </button>
                                <div className="flex-1 min-w-0">
                                    <span className={`block text-sm break-words ${task.completed ? 'text-slate-500 line-through' : 'text-slate-200'}`}>{task.title}</span>
                                    {urgency && !task.completed && (
                                        <span className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-widest mt-1 ${urgency.color}`}>
                                            <urgency.icon size={10} />
                                            {urgency.label}
                                        </span>
                                    )}
                                </div>
                                <button 
                                    onClick={() => onUpdate({...topic, tasks: topic.tasks.filter(t => t.id !== task.id)})}
                                    className="opacity-0 group-hover:opacity-100 p-2 text-slate-500 hover:text-red-400 transition-all"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        )})}
                        {topic.tasks.length === 0 && (
                            <div className="text-center py-12 text-slate-600 italic text-xs">No tasks. Use AI Assist to generate study plan.</div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'resources' && (
                <div className="space-y-4">
                     <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-start gap-3">
                        <AlertTriangle className="text-orange-400 shrink-0" size={18} />
                        <div>
                            <h5 className="text-xs font-bold text-orange-200 uppercase tracking-widest mb-1">Under Construction</h5>
                            <p className="text-xs text-orange-200/60">Resource library management is coming in v3.1 update.</p>
                        </div>
                     </div>
                </div>
            )}
        </div>
      </div>
    </Modal>
  );
};

const Curriculum: React.FC<{ data: AppState; onUpdate: (d: AppState) => void }> = ({ data, onUpdate }) => {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [aiModal, setAiModal] = useState(false);
  const [activeTopic, setActiveTopic] = useState<{cId: string, mId: string, topic: Topic} | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [syllabus, setSyllabus] = useState('');
  
  const [addModal, setAddModal] = useState<{ type: 'course' | 'module' | 'topic', p1?: string, p2?: string, editId?: string } | null>(null);
  const [formValue, setFormValue] = useState('');

  const handleToggleTopic = (cId: string, mId: string, tId: string) => {
    const newData = structuredClone(data);
    const topic = newData.courses.find(c => c.id === cId)?.modules.find(m => m.id === mId)?.topics.find(t => t.id === tId);
    if (topic) {
      topic.status = topic.status === ProgressStatus.MASTERED ? ProgressStatus.NOT_STARTED : ProgressStatus.MASTERED;
      onUpdate(newData);
    }
  };

  const handleAction = () => {
    if (!formValue.trim() || !addModal) return;
    const newData = structuredClone(data);
    
    if (addModal.editId) {
        if (addModal.type === 'course') {
            const c = newData.courses.find(x => x.id === addModal.editId);
            if (c) c.title = formValue;
        } else if (addModal.type === 'module') {
            const m = newData.courses.find(x => x.id === addModal.p1)?.modules.find(x => x.id === addModal.editId);
            if (m) m.title = formValue;
        } else if (addModal.type === 'topic') {
            const t = newData.courses.find(x => x.id === addModal.p1)?.modules.find(x => x.id === addModal.p2)?.topics.find(x => x.id === addModal.editId);
            if (t) t.title = formValue;
        }
    } else {
        if (addModal.type === 'course') {
            newData.courses.push({ id: generateId(), title: formValue, description: '', modules: [] });
        } else if (addModal.type === 'module' && addModal.p1) {
            const c = newData.courses.find(x => x.id === addModal.p1);
            if (c) c.modules.push({ id: generateId(), title: formValue, topics: [] });
        } else if (addModal.type === 'topic' && addModal.p1 && addModal.p2) {
            const c = newData.courses.find(x => x.id === addModal.p1);
            const m = c?.modules.find(x => x.id === addModal.p2);
            if (m) {
                m.topics.push({ id: generateId(), title: formValue, status: ProgressStatus.NOT_STARTED, tasks: [], resources: [] });
            }
        }
    }
    
    onUpdate(newData); setFormValue(''); setAddModal(null);
  };

  const handleAIParse = async () => {
    if (!syllabus.trim()) return;
    setIsAiLoading(true);
    try {
      const res = await parseSyllabus(syllabus, data.user.apiKey);
      const newCourse: Course = {
        id: generateId(), title: res.courseTitle, description: 'AI Generated',
        modules: res.modules.map((m: any) => ({
          id: generateId(), title: m.title,
          topics: m.topics.map((t: any) => ({ id: generateId(), title: t.title, status: ProgressStatus.NOT_STARTED, tasks: [], resources: [] }))
        }))
      };
      const newData = structuredClone(data);
      newData.courses.push(newCourse);
      onUpdate(newData); 
      setAiModal(false); setSyllabus('');
    } catch { alert("Parsing failed."); } finally { setIsAiLoading(false); }
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="flex justify-between items-center px-1">
        <h2 className="text-2xl font-black text-white">Curriculum</h2>
        <div className="flex gap-2">
          <button onClick={() => setAiModal(true)} className="glass-dark p-3 rounded-2xl text-indigo-400 hover:bg-white/10 active:scale-90 transition-all"><Sparkles size={20}/></button>
          <button onClick={() => { setFormValue(''); setAddModal({ type: 'course' }); }} className="bg-indigo-600 px-4 py-3 rounded-2xl text-[10px] font-black text-white uppercase tracking-widest shadow-lg">+ COURSE</button>
        </div>
      </div>

      <div className="space-y-4">
        {data.courses.map(course => {
            // Calculate course-specific stats inline
            let total = 0;
            let completed = 0;
            course.modules.forEach(m => m.topics.forEach(t => {
                total++;
                if (t.status === ProgressStatus.MASTERED) completed++;
            }));
            const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

            return (
          <GlassCard key={course.id} className="p-0 overflow-hidden border-white/5 bg-white/[0.01]">
            <div className="p-4 flex items-center justify-between cursor-pointer active:bg-white/5 transition-all" onClick={() => setExpanded(expanded === course.id ? null : course.id)}>
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 bg-indigo-600/10 rounded-xl flex items-center justify-center text-indigo-400 shrink-0">
                  <BookOpen size={20}/>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between items-center pr-4 mb-1">
                     <h4 className="text-base font-bold text-white break-words pr-2">{course.title}</h4>
                     <span className={`text-[10px] font-black ${progress === 100 ? 'text-emerald-400' : 'text-indigo-400'}`}>{progress}%</span>
                  </div>
                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden mb-2 mr-4 max-w-[95%]">
                     <div className={`h-full transition-all duration-700 ease-out ${progress === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{width: `${progress}%`}} />
                  </div>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{course.modules.length} Modules • {completed}/{total} Topics</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={(e) => { e.stopPropagation(); setFormValue(course.title); setAddModal({ type: 'course', editId: course.id }); }} className="p-2 text-slate-600 hover:text-white"><Edit2 size={16}/></button>
                <button onClick={(e) => { e.stopPropagation(); if(confirm("Delete Course?")) onUpdate({ ...data, courses: data.courses.filter(c => c.id !== course.id) }); }} className="p-2 text-slate-600 hover:text-red-500"><Trash2 size={16}/></button>
                {expanded === course.id ? <ChevronDown size={18} className="text-slate-500"/> : <ChevronRight size={18} className="text-slate-500"/>}
              </div>
            </div>

            {expanded === course.id && (
              <div className="px-3 pb-5 space-y-4 animate-in slide-in-from-top-2">
                {course.modules.map(module => (
                  <div key={module.id} className="glass-dark rounded-2xl border border-white/5 overflow-hidden">
                    <div className="bg-white/5 px-4 py-3 flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest break-words flex-1">{module.title}</span>
                      <div className="flex items-center gap-1">
                         <button onClick={() => { setFormValue(''); setAddModal({type: 'topic', p1: course.id, p2: module.id}); }} className="p-1.5 text-indigo-400 hover:text-white"><Plus size={16}/></button>
                         <button onClick={() => { setFormValue(module.title); setAddModal({type: 'module', p1: course.id, editId: module.id}); }} className="p-1.5 text-slate-500"><Edit2 size={14}/></button>
                         <button onClick={() => { if(confirm("Delete Module?")) { const newData = structuredClone(data); const c = newData.courses.find(x=>x.id===course.id); if(c) c.modules = c.modules.filter(m=>m.id!==module.id); onUpdate(newData); } }} className="p-1.5 text-slate-600"><Trash2 size={14}/></button>
                      </div>
                    </div>
                    <div className="divide-y divide-white/5">
                      {module.topics.map(topic => {
                        const completedTasks = topic.tasks.filter(t => t.completed).length;
                        const totalTasks = topic.tasks.length;
                        const taskProgress = totalTasks > 0 
                            ? Math.round((completedTasks / totalTasks) * 100) 
                            : (topic.status === ProgressStatus.MASTERED ? 100 : 0);

                        return (
                        <div key={topic.id} className="p-3.5 flex items-center justify-between hover:bg-white/5 transition-all gap-4">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                             <CircularProgress 
                                percentage={taskProgress} 
                                size={32} 
                                color={topic.status === ProgressStatus.MASTERED || taskProgress === 100 ? 'text-emerald-500' : 'text-indigo-500'}
                                onClick={(e) => {
                                   e.stopPropagation();
                                   handleToggleTopic(course.id, module.id, topic.id);
                                }}
                             >
                                <Check size={14} className={topic.status === ProgressStatus.MASTERED || taskProgress === 100 ? 'text-emerald-500' : 'text-slate-600'} />
                             </CircularProgress>
                             <div className="min-w-0 flex-1">
                               <p className={`text-sm font-bold break-words pr-1 ${topic.status === ProgressStatus.MASTERED ? 'text-slate-400 line-through' : 'text-slate-200'}`}>{topic.title}</p>
                               <div className="flex items-center gap-2">
                                   <p className={`text-[8px] font-black uppercase tracking-tighter ${topic.status === ProgressStatus.MASTERED ? 'text-emerald-500' : topic.status === ProgressStatus.IN_PROGRESS ? 'text-indigo-400' : 'text-slate-500'}`}>
                                       {topic.status === ProgressStatus.IN_PROGRESS && totalTasks > 0 ? `${completedTasks}/${totalTasks} Tasks` : topic.status}
                                   </p>
                                   {/* If next task has deadline, show small dot indicator */}
                               </div>
                             </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={() => { setFormValue(topic.title); setAddModal({type: 'topic', p1: course.id, p2: module.id, editId: topic.id}); }} className="p-2 text-slate-600 hover:text-white"><Edit2 size={14}/></button>
                            <button onClick={() => setActiveTopic({cId: course.id, mId: module.id, topic})} className="p-2 text-slate-500 hover:text-white bg-white/5 rounded-lg"><MoreVertical size={14}/></button>
                          </div>
                        </div>
                      )})}
                    </div>
                  </div>
                ))}
                <button onClick={() => { setFormValue(''); setAddModal({type: 'module', p1: course.id}); }} className="w-full py-3.5 bg-white/5 border border-dashed border-white/10 rounded-2xl text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-all">+ NEW MODULE</button>
              </div>
            )}
          </GlassCard>
        )})
        }
      </div>

      <Modal isOpen={!!addModal} onClose={() => setAddModal(null)} title={`${addModal?.editId ? 'Edit' : 'Create'} ${addModal?.type}`}>
         <div className="space-y-4">
           <Label>{addModal?.type} Name</Label>
           <Input value={formValue} onChange={e => setFormValue(e.target.value)} placeholder="Type name here..." autoFocus onKeyDown={e => e.key === 'Enter' && handleAction()} />
           <button onClick={handleAction} className="w-full h-14 bg-indigo-600 rounded-2xl font-black text-white shadow-lg active:scale-95 transition-all">
             {addModal?.editId ? 'SAVE CHANGES' : 'CONFIRM ADD'}
           </button>
         </div>
      </Modal>

      <Modal isOpen={aiModal} onClose={() => setAiModal(false)} title="AI Synergy Import">
         <textarea className="w-full h-40 bg-white/5 border border-white/10 rounded-2xl p-4 text-xs text-slate-200 resize-none" placeholder="Paste syllabus text here..." value={syllabus} onChange={e => setSyllabus(e.target.value)} />
         <button onClick={handleAIParse} disabled={isAiLoading || !syllabus} className="w-full h-14 mt-4 bg-indigo-600 rounded-2xl font-black text-white flex items-center justify-center gap-2 active:scale-95 transition-all">
            {isAiLoading ? <RefreshCw className="animate-spin" size={18}/> : <Sparkles size={18}/>} 
            {isAiLoading ? 'SCANNING...' : 'START SCAN'}
         </button>
      </Modal>

      {activeTopic && (
        <TopicDeepDive 
          isOpen={true} topic={activeTopic.topic} courseTitle={data.courses.find(c=>c.id===activeTopic.cId)?.title || ''} onClose={() => setActiveTopic(null)}
          onUpdate={(ut) => {
            const newData = structuredClone(data);
            const t = newData.courses.find(c => c.id === activeTopic.cId)?.modules.find(m => m.id === activeTopic.mId)?.topics.find(top => top.id === ut.id);
            if(t) Object.assign(t, ut);
            onUpdate(newData); setActiveTopic({...activeTopic, topic: ut});
          }}
          userApiKey={data.user.apiKey}
        />
      )}
    </div>
  );
};

const Pipeline: React.FC<{ data: AppState; onUpdate: (d: AppState) => void }> = ({ data, onUpdate }) => {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newProject, setNewProject] = useState<Partial<AcademicProject>>({ status: AcademicTaskStatus.UPCOMING });

  const handleAdd = () => {
    if (newProject.title && newProject.deadline) {
      const project: AcademicProject = {
        id: generateId(),
        title: newProject.title!,
        category: newProject.category || 'Assignment',
        deadline: newProject.deadline!,
        status: newProject.status as AcademicTaskStatus,
        notes: newProject.notes || ''
      };
      onUpdate({ ...data, academicProjects: [...data.academicProjects, project] });
      setIsAddOpen(false);
      setNewProject({ status: AcademicTaskStatus.UPCOMING });
    }
  };

  const handleDelete = (id: string) => {
    if(confirm("Delete project?")) {
        onUpdate({ ...data, academicProjects: data.academicProjects.filter(p => p.id !== id) });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center px-1">
        <h2 className="text-2xl font-black text-white">Pipeline</h2>
        <button onClick={() => setIsAddOpen(true)} className="bg-emerald-600 px-4 py-3 rounded-2xl text-[10px] font-black text-white uppercase tracking-widest shadow-lg">+ PROJECT</button>
      </div>

      <div className="grid gap-4">
        {data.academicProjects.map(project => {
            const urgency = getUrgency(project.deadline);
            return (
                <GlassCard key={project.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                             <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${project.status === AcademicTaskStatus.SUBMITTED ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/20 text-indigo-400'}`}>{project.category}</span>
                             <span className={`text-[9px] font-black uppercase tracking-widest ${urgency.color}`}>{urgency.label}</span>
                        </div>
                        <h4 className="text-lg font-bold text-white">{project.title}</h4>
                        <p className="text-xs text-slate-500 mt-1">{project.notes}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <select 
                            value={project.status}
                            onChange={(e) => onUpdate({...data, academicProjects: data.academicProjects.map(p => p.id === project.id ? {...p, status: e.target.value as AcademicTaskStatus} : p)})}
                            className="bg-black/20 text-xs text-white rounded-xl px-3 py-2 border border-white/10 outline-none"
                        >
                            {Object.values(AcademicTaskStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <button onClick={() => handleDelete(project.id)} className="p-3 bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-xl transition-all"><Trash2 size={18}/></button>
                    </div>
                </GlassCard>
            );
        })}
        {data.academicProjects.length === 0 && (
            <div className="text-center py-20 text-slate-600 italic">No active projects. Add one to get started.</div>
        )}
      </div>

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="New Project">
          <div className="space-y-4">
              <div>
                  <Label>Title</Label>
                  <Input value={newProject.title || ''} onChange={e => setNewProject({...newProject, title: e.target.value})} placeholder="Project Name" />
              </div>
              <div>
                  <Label>Category</Label>
                  <Input value={newProject.category || ''} onChange={e => setNewProject({...newProject, category: e.target.value})} placeholder="e.g. Thesis, Lab Report" />
              </div>
              <div>
                  <Label>Deadline</Label>
                  <Input type="date" value={newProject.deadline || ''} onChange={e => setNewProject({...newProject, deadline: e.target.value})} />
              </div>
              <div>
                  <Label>Notes</Label>
                  <textarea 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-white placeholder:text-slate-600 min-h-[100px]"
                    value={newProject.notes || ''} 
                    onChange={e => setNewProject({...newProject, notes: e.target.value})} 
                    placeholder="Key details..."
                  />
              </div>
              <button onClick={handleAdd} className="w-full h-14 bg-indigo-600 rounded-2xl font-black text-white shadow-lg active:scale-95 transition-all">CREATE PROJECT</button>
          </div>
      </Modal>
    </div>
  );
};

const Timeline: React.FC<{ data: AppState }> = ({ data }) => {
    const events = useMemo(() => {
        const all: any[] = [];
        data.academicProjects.forEach(p => all.push({
            id: p.id, title: p.title, date: p.deadline, type: 'Project', color: 'text-emerald-400'
        }));
        data.courses.forEach(c => c.modules.forEach(m => m.topics.forEach(t => t.tasks.forEach(task => {
            if(task.deadline) all.push({
                id: task.id, title: task.title, date: task.deadline, type: 'Task', context: `${c.title}`, color: 'text-indigo-400'
            });
        }))));
        return all.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [data]);

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-black text-white px-1">Timeline</h2>
            <div className="space-y-2">
                {events.map(event => {
                    const urgency = getUrgency(event.date);
                    return (
                        <GlassCard key={event.id} className="flex items-center gap-4 py-4">
                            <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center border border-white/5 ${urgency.bg}`}>
                                <span className={`text-[10px] font-black uppercase ${urgency.color}`}>{new Date(event.date).getDate()}</span>
                                <span className="text-[8px] font-bold text-slate-500 uppercase">{new Date(event.date).toLocaleDateString('en-US', {month: 'short'})}</span>
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-bold text-white">{event.title}</h4>
                                <div className="flex gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                                    <span className={event.color}>{event.type}</span>
                                    {event.context && <span>• {event.context}</span>}
                                    <span className={urgency.color}>• {urgency.label}</span>
                                </div>
                            </div>
                        </GlassCard>
                    );
                })}
                {events.length === 0 && <div className="text-center py-20 text-slate-600 italic">No upcoming deadlines.</div>}
            </div>
        </div>
    );
};

const SettingsModal: React.FC<{ isOpen: boolean; onClose: () => void; data: AppState; onUpdate: (d: AppState) => void }> = ({ isOpen, onClose, data, onUpdate }) => {
    const [localUser, setLocalUser] = useState(data.user);
    
    // Update local state when data changes (e.g. if updated from outside or on re-open)
    useEffect(() => setLocalUser(data.user), [data.user, isOpen]);

    const handleSave = () => {
        onUpdate({ ...data, user: localUser });
        onClose();
    };

    const handleExport = () => {
        const blob = new Blob([JSON.stringify(data)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'pathways_backup.json';
        a.click();
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
       const f = e.target.files?.[0]; 
       if(!f) return;
       const r = new FileReader(); 
       r.onload = (ev) => { 
           try {
             const parsed = JSON.parse(ev.target?.result as string);
             if (parsed && typeof parsed === 'object') {
                 onUpdate(parsed); 
                 onClose(); 
                 alert("System restored successfully.");
             } else {
                 alert("Invalid backup file");
             }
           } catch (err) {
               alert("Corrupted file. Cannot import.");
           }
       }; 
       r.readAsText(f);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="System Config">
            <div className="space-y-6">
                <div className="space-y-4">
                    <div><Label>Scholar Name</Label><Input value={localUser.name} onChange={e => setLocalUser({...localUser, name: e.target.value})} /></div>
                    <div><Label>Academic Level</Label><Input value={localUser.role} onChange={e => setLocalUser({...localUser, role: e.target.value})} /></div>
                </div>
                 <div className="space-y-4">
                     <Label>API Identity</Label>
                     <div className="relative">
                        <Input type="password" value={localUser.apiKey || ''} onChange={e => setLocalUser({...localUser, apiKey: e.target.value})} placeholder="Gemini Key" className="pl-12" />
                        <Key size={16} className="absolute left-4 top-4.5 text-slate-500" />
                     </div>
                  </div>
                <button onClick={handleSave} className="w-full h-14 bg-indigo-600 rounded-2xl font-black text-white shadow-lg active:scale-95 transition-all">REBOOT SYSTEM</button>
                
                <div className="flex gap-2 pt-4 border-t border-white/5">
                    <button onClick={handleExport} className="flex-1 py-4 glass-dark rounded-2xl text-[10px] font-black uppercase text-indigo-400 hover:bg-white/5 transition-colors">Export Data</button>
                    <label className="flex-1 py-4 glass-dark rounded-2xl text-[10px] font-black uppercase text-emerald-400 text-center cursor-pointer hover:bg-white/5 transition-colors">
                        Import Data
                        <input type="file" className="hidden" onChange={handleImport} />
                    </label>
                </div>
            </div>
        </Modal>
    );
};

const App: React.FC = () => {
  const [data, setData] = useState<AppState>(StorageService.load());
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    StorageService.save(data);
  }, [data]);

  return (
    <MemoryRouter>
      <div className="flex min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-indigo-500/30">
        <Sidebar user={data.user} onSettings={() => setSettingsOpen(true)} />
        <main className="flex-1 lg:ml-72 pb-24 lg:pb-8 p-4 md:p-8 max-w-7xl mx-auto w-full">
           <Routes>
             <Route path="/" element={<Dashboard data={data} />} />
             <Route path="/courses" element={<Curriculum data={data} onUpdate={(d) => setData(d)} />} />
             <Route path="/pipeline" element={<Pipeline data={data} onUpdate={(d) => setData(d)} />} />
             <Route path="/calendar" element={<Timeline data={data} />} />
           </Routes>
        </main>
        <MobileNav user={data.user} onSettings={() => setSettingsOpen(true)} />
        <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} data={data} onUpdate={setData} />
      </div>
    </MemoryRouter>
  );
};

export default App;
