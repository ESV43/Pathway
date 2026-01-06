
import React, { useState, useEffect, useMemo } from 'react';
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
  Link as LinkIcon,
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
  ArrowUpRight
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, Tooltip
} from 'recharts';

import { 
  AppState, 
  Course, 
  AcademicProject, 
  ProgressStatus, 
  AcademicTaskStatus, 
  Topic, 
  Module,
  UserProfile
} from './types.ts';
import { parseSyllabus } from './services/geminiService.ts';

const STORAGE_KEY = 'pathways_academic_v2_final';

const StorageService = {
  save: (data: AppState) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },
  load: (): AppState => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return {
      user: { name: 'Scholar', role: 'Student' },
      courses: [],
      academicProjects: []
    };
    try {
      return JSON.parse(saved);
    } catch (e) {
      return { user: { name: 'Scholar', role: 'Student' }, courses: [], academicProjects: [] };
    }
  }
};

const generateId = () => Math.random().toString(36).substr(2, 9);

const ACADEMIC_TIPS = [
  "Use Active Recall: Test yourself instead of just re-reading notes.",
  "Space your study sessions: 30 mins over 5 days is better than 5 hours in 1 day.",
  "The 5-Minute Rule: If you don't want to start, tell yourself you'll do just 5 minutes.",
  "Teach it to a 'Rubber Duck': If you can't explain it simply, you don't know it well enough.",
  "Prioritize sleep: Your brain consolidates learning while you rest.",
  "Interleaving: Mix up different subjects in one study session to boost retention."
];

const GlassCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={`glass rounded-3xl p-5 md:p-6 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/5 ${className}`}>
    {children}
  </div>
);

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 md:p-4">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <GlassCard className="w-full max-w-lg relative z-10 shadow-2xl border-white/20 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center mb-4 px-1">
          <h3 className="text-lg font-bold flex items-center gap-2">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400"><X size={20}/></button>
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
    className={`w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-white placeholder:text-slate-600 ${props.className || ''}`}
  />
);

const Label: React.FC<{children: React.ReactNode}> = ({children}) => (
  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 ml-2">{children}</label>
);

const Sidebar: React.FC<{ user: UserProfile; onSettings: () => void }> = ({ user, onSettings }) => {
  const links = [
    { to: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { to: '/courses', icon: <BookOpen size={20} />, label: 'Curriculum' },
    { to: '/pipeline', icon: <GraduationCap size={20} />, label: 'Pipeline' },
    { to: '/calendar', icon: <CalendarIcon size={20} />, label: 'Timeline' },
  ];

  return (
    <aside className="hidden md:flex w-72 h-screen glass border-r border-white/10 fixed left-0 top-0 z-50 p-8 flex flex-col">
      <div className="flex items-center gap-3 mb-12">
        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/40">
          <Sparkles className="text-white" size={26} />
        </div>
        <h1 className="text-2xl font-black tracking-tighter bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent">Pathways</h1>
      </div>
      <nav className="flex-1 space-y-3">
        {links.map((link) => (
          <NavLink key={link.to} to={link.to} className={({ isActive }) => `flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${isActive ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 shadow-inner' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
            {link.icon} <span className="font-semibold">{link.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto pt-8 border-t border-white/5">
        <button onClick={onSettings} className="w-full glass-dark rounded-2xl p-4 flex items-center gap-4 hover:bg-white/10 transition-all text-left">
          <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold shrink-0 shadow-lg">{user.name.charAt(0).toUpperCase()}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate text-white">{user.name}</p>
            <p className="text-[10px] text-slate-500 truncate uppercase tracking-tighter font-medium">{user.role}</p>
          </div>
          <Settings size={14} className="text-slate-500" />
        </button>
      </div>
    </aside>
  );
};

const MobileNav: React.FC<{ user: UserProfile; onSettings: () => void }> = ({ user, onSettings }) => {
  const links = [
    { to: '/', icon: <LayoutDashboard size={20} />, label: 'Home' },
    { to: '/courses', icon: <BookOpen size={20} />, label: 'Courses' },
    { to: '/pipeline', icon: <GraduationCap size={20} />, label: 'Pipeline' },
    { to: '/calendar', icon: <CalendarIcon size={20} />, label: 'Timeline' },
  ];
  return (
    <nav className="md:hidden fixed bottom-4 left-4 right-4 z-[60] bg-[#1e1b4b]/95 backdrop-blur-2xl border border-white/10 px-4 py-3 rounded-[2rem] flex justify-between items-center shadow-2xl shadow-black/50">
      {links.map((link) => (
        <NavLink key={link.to} to={link.to} className={({ isActive }) => `flex flex-col items-center gap-1 transition-all flex-1 ${isActive ? 'text-indigo-400 scale-105' : 'text-slate-500'}`}>
          {link.icon}
          <span className="text-[9px] font-bold uppercase tracking-widest leading-none">{link.label}</span>
        </NavLink>
      ))}
      <button onClick={onSettings} className="flex flex-col items-center gap-1 flex-1 transition-all text-slate-500">
        <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white uppercase shadow-lg mb-0.5">{user.name.charAt(0)}</div>
        <span className="text-[9px] font-bold uppercase tracking-widest leading-none">Profile</span>
      </button>
    </nav>
  );
};

const TopicDetailsModal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  topic: Topic;
  onUpdate: (updatedTopic: Topic) => void;
}> = ({ isOpen, onClose, topic, onUpdate }) => {
  const [newTask, setNewTask] = useState('');
  const [activeTaskNotes, setActiveTaskNotes] = useState<{id: string, notes: string} | null>(null);

  const addTask = () => {
    if (!newTask.trim()) return;
    onUpdate({ ...topic, tasks: [...topic.tasks, { id: generateId(), title: newTask, completed: false, priority: 'Medium', notes: '' }] });
    setNewTask('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Unit Explorer">
      <div className="space-y-6 pb-6">
        <h4 className="text-xl font-bold text-white mb-2">{topic.title}</h4>
        
        <section className="space-y-4">
          <Label>Tasks & Active Notes</Label>
          <div className="flex gap-2">
            <Input value={newTask} onChange={e => setNewTask(e.target.value)} placeholder="Action item..." onKeyDown={e => e.key === 'Enter' && addTask()} />
            <button onClick={addTask} className="p-3 bg-indigo-600 rounded-2xl shrink-0 text-white"><Plus size={20}/></button>
          </div>
          <div className="space-y-3">
            {topic.tasks.map(t => (
              <div key={t.id} className="space-y-2">
                <div className="flex items-center gap-3 p-4 glass-dark rounded-2xl border border-white/5">
                  <button onClick={() => onUpdate({ ...topic, tasks: topic.tasks.map(x => x.id === t.id ? { ...x, completed: !x.completed } : x) })} className="shrink-0 p-1">
                    {t.completed ? <CheckCircle2 size={22} className="text-emerald-500"/> : <Circle size={22} className="text-slate-600"/>}
                  </button>
                  <span className={`text-sm flex-1 break-words ${t.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>{t.title}</span>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => setActiveTaskNotes({id: t.id, notes: t.notes || ''})} className="text-slate-500 hover:text-indigo-400 p-2"><StickyNote size={18}/></button>
                    <button onClick={() => onUpdate({ ...topic, tasks: topic.tasks.filter(x => x.id !== t.id) })} className="text-slate-500 hover:text-red-500 p-2"><Trash2 size={18}/></button>
                  </div>
                </div>
                {t.notes && !activeTaskNotes && <p className="text-[10px] text-slate-500 ml-12 italic border-l border-white/10 pl-2">Note: {t.notes}</p>}
              </div>
            ))}
          </div>
        </section>

        {activeTaskNotes && (
          <div className="glass-dark p-4 rounded-2xl border border-indigo-500/30 space-y-3 animate-in fade-in zoom-in-95">
            <Label>Observation</Label>
            <textarea 
              className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-200 h-24 resize-none"
              value={activeTaskNotes.notes}
              onChange={e => setActiveTaskNotes({...activeTaskNotes, notes: e.target.value})}
            />
            <div className="flex gap-2">
              <button onClick={() => { onUpdate({ ...topic, tasks: topic.tasks.map(t => t.id === activeTaskNotes.id ? { ...t, notes: activeTaskNotes.notes } : t) }); setActiveTaskNotes(null); }} className="flex-1 bg-indigo-600 py-3 rounded-xl text-xs font-bold text-white active:scale-95 transition-transform">Save</button>
              <button onClick={() => setActiveTaskNotes(null)} className="flex-1 bg-white/5 py-3 rounded-xl text-xs font-bold text-slate-400">Cancel</button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

const Dashboard: React.FC<{ data: AppState }> = ({ data }) => {
  const currentTip = useMemo(() => ACADEMIC_TIPS[Math.floor(Math.random() * ACADEMIC_TIPS.length)], []);

  const stats = useMemo(() => {
    let total = 0, mastered = 0, inProgress = 0;
    data.courses.forEach(c => c.modules.forEach(m => m.topics.forEach(t => { 
      total++; 
      if (t.status === ProgressStatus.MASTERED) mastered++; 
      else if (t.status === ProgressStatus.IN_PROGRESS) inProgress++;
    })));
    return { total, mastered, inProgress, pct: total === 0 ? 0 : Math.round((mastered / total) * 100) };
  }, [data]);

  const topPriority = useMemo(() => {
    const projects = data.academicProjects
      .filter(p => p.status !== AcademicTaskStatus.SUBMITTED)
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
    
    return projects.slice(0, 2);
  }, [data.academicProjects]);

  const pipelineChart = useMemo(() => {
    const counts = { [AcademicTaskStatus.UPCOMING]: 0, [AcademicTaskStatus.IN_PROGRESS]: 0, [AcademicTaskStatus.REVIEW]: 0, [AcademicTaskStatus.SUBMITTED]: 0 };
    data.academicProjects.forEach(p => counts[p.status]++);
    return Object.entries(counts).map(([name, value]) => ({ name: name.split(' ')[0], value }));
  }, [data.academicProjects]);

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-1000">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="px-1">
          <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight">Focus Station</h2>
          <p className="text-sm md:text-base text-slate-400 mt-0.5 font-medium">Ready for your academic sprint, {data.user.name.split(' ')[0]}?</p>
        </div>
        <div className="flex gap-2">
           <div className="glass-dark px-3 py-1.5 md:px-4 md:py-2 rounded-2xl flex items-center gap-2 border border-white/5">
              <Zap size={14} className="text-yellow-400 animate-pulse" />
              <span className="text-[10px] md:text-xs font-bold text-slate-300 uppercase tracking-widest">{stats.mastered} Mastered</span>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard className="bg-gradient-to-br from-indigo-600/20 to-purple-600/10 border-indigo-500/20 order-1 lg:order-1">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="text-yellow-400 shrink-0" size={18} />
            <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-300">Daily Tip</h3>
          </div>
          <p className="text-base md:text-lg font-medium leading-relaxed text-white">{currentTip}</p>
          <div className="mt-8 flex justify-between items-end">
            <div>
              <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">Mastery Progress</p>
              <p className="text-2xl font-black text-indigo-400">{stats.pct}%</p>
            </div>
            <div className="w-14 h-14">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={[{v: stats.mastered}, {v: Math.max(0.1, stats.total - stats.mastered)}]} cx="50%" cy="50%" innerRadius={18} outerRadius={26} paddingAngle={2} dataKey="v">
                    <Cell fill="#6366f1" />
                    <Cell fill="rgba(255,255,255,0.05)" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="lg:col-span-2 order-2 lg:order-2">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Target className="text-red-400 shrink-0" size={18} />
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Next Priority</h3>
            </div>
            <NavLink to="/pipeline" className="text-[10px] font-bold uppercase text-indigo-400 flex items-center gap-1 hover:underline">Pipeline <ArrowUpRight size={12}/></NavLink>
          </div>
          <div className="space-y-3">
            {topPriority.map(p => (
              <div key={p.id} className="group p-4 glass-dark rounded-2xl flex justify-between items-center border border-white/5 hover:border-indigo-500/30 transition-all active:scale-[0.98]">
                <div className="min-w-0 pr-3">
                  <p className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors truncate">{p.title}</p>
                  <p className="text-[9px] text-slate-500 mt-0.5 uppercase font-bold tracking-tighter truncate">{p.category} • {p.status}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[10px] font-black text-slate-300 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5 whitespace-nowrap">
                    {new Date(p.deadline).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                  </p>
                </div>
              </div>
            ))}
            {topPriority.length === 0 && <div className="text-center py-10 opacity-30"><Trophy size={32} className="mx-auto mb-2"/><p className="text-[10px] uppercase tracking-widest font-bold">Workspace Clear</p></div>}
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="order-4 lg:order-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-6">Pipeline Breakdown</h3>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipelineChart}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 9, fontWeight: 'bold'}} />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.05)'}}
                  contentStyle={{backgroundColor:'#1e1b4b', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'12px', fontSize:'11px', color: '#fff'}} 
                />
                <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="order-3 lg:order-4">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Academic Hub</h3>
            <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-lg font-bold border border-emerald-500/20 uppercase tracking-tighter">Live Session</span>
          </div>
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <div className="p-3 md:p-4 glass-dark rounded-2xl border-l-2 md:border-l-4 border-indigo-500">
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Units</p>
              <p className="text-2xl md:text-3xl font-black text-white mt-0.5">{data.courses.reduce((acc, c) => acc + c.modules.length, 0)}</p>
            </div>
            <div className="p-3 md:p-4 glass-dark rounded-2xl border-l-2 md:border-l-4 border-emerald-500">
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Mastered</p>
              <p className="text-2xl md:text-3xl font-black text-emerald-400 mt-0.5">{stats.mastered}</p>
            </div>
            <div className="p-3 md:p-4 glass-dark rounded-2xl border-l-2 md:border-l-4 border-purple-500">
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Studying</p>
              <p className="text-2xl md:text-3xl font-black text-purple-400 mt-0.5">{stats.inProgress}</p>
            </div>
            <div className="p-3 md:p-4 glass-dark rounded-2xl border-l-2 md:border-l-4 border-orange-500">
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Tasks</p>
              <p className="text-2xl md:text-3xl font-black text-orange-400 mt-0.5">{data.academicProjects.length}</p>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

const Curriculum: React.FC<{ data: AppState; onUpdate: (d: AppState) => void }> = ({ data, onUpdate }) => {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [aiModal, setAiModal] = useState(false);
  const [addModal, setAddModal] = useState<{ type: 'course' | 'module' | 'topic', p1?: string, p2?: string } | null>(null);
  const [formName, setFormName] = useState('');
  const [syllabus, setSyllabus] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [activeTopic, setActiveTopic] = useState<{cId: string, mId: string, topic: Topic} | null>(null);

  const handleAdd = () => {
    if (!formName.trim() || !addModal) return;
    const newData = { ...data };
    if (addModal.type === 'course') newData.courses.push({ id: generateId(), title: formName, description: '', modules: [] });
    else if (addModal.type === 'module' && addModal.p1) {
      const c = newData.courses.find(x => x.id === addModal.p1);
      if (c) c.modules.push({ id: generateId(), title: formName, topics: [] });
    } else if (addModal.type === 'topic' && addModal.p1 && addModal.p2) {
      const c = newData.courses.find(x => x.id === addModal.p1);
      const m = c?.modules.find(x => x.id === addModal.p2);
      if (m) m.topics.push({ id: generateId(), title: formName, status: ProgressStatus.NOT_STARTED, tasks: [], resources: [] });
    }
    onUpdate(newData); setFormName(''); setAddModal(null);
  };

  const handleAI = async () => {
    setIsParsing(true);
    try {
      const res = await parseSyllabus(syllabus);
      const c: Course = {
        id: generateId(), title: res.courseTitle, description: 'AI Generated',
        modules: res.modules.map((m: any) => ({
          id: generateId(), title: m.title,
          topics: m.topics.map((t: any) => ({ id: generateId(), title: t.title, status: ProgressStatus.NOT_STARTED, tasks: [], resources: [] }))
        }))
      };
      onUpdate({ ...data, courses: [...data.courses, c] }); setAiModal(false); setSyllabus('');
    } finally { setIsParsing(false); }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center gap-2">
        <h2 className="text-2xl md:text-3xl font-extrabold truncate">Curriculum</h2>
        <div className="flex gap-2 shrink-0">
          <button onClick={() => setAiModal(true)} className="glass-dark p-2.5 rounded-2xl text-indigo-400 hover:bg-white/10 active:scale-95 transition-all"><Sparkles size={20}/></button>
          <button onClick={() => setAddModal({ type: 'course' })} className="bg-indigo-600 px-4 md:px-5 py-3 rounded-2xl text-[10px] md:text-xs font-bold text-white shadow-lg active:scale-95 transition-all uppercase tracking-widest">+ Course</button>
        </div>
      </div>

      <div className="space-y-4 pb-4">
        {data.courses.map(c => (
          <GlassCard key={c.id} className="p-0 overflow-hidden border border-white/5">
            <div className="p-4 md:p-6 flex items-center justify-between group">
              <button onClick={() => setExpanded(expanded === c.id ? null : c.id)} className="flex items-center gap-3 md:gap-4 flex-1 text-left min-w-0">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-600/10 rounded-2xl flex items-center justify-center text-indigo-400 shrink-0"><BookOpen size={20}/></div>
                <div className="min-w-0 pr-2">
                   <h4 className="font-bold text-white text-base md:text-lg truncate">{c.title}</h4>
                   <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">{c.modules.length} Modules</p>
                </div>
              </button>
              <div className="flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                 <button onClick={() => setAddModal({type: 'module', p1: c.id})} className="p-2 text-indigo-400 hover:bg-white/5 rounded-xl"><Plus size={18}/></button>
                 <button onClick={() => onUpdate({...data, courses: data.courses.filter(x => x.id !== c.id)})} className="p-2 text-red-500 hover:bg-white/5 rounded-xl"><Trash2 size={18}/></button>
              </div>
              {expanded === c.id ? <ChevronDown size={20} className="ml-2 text-slate-500" /> : <ChevronRight size={20} className="ml-2 text-slate-500" />}
            </div>
            {expanded === c.id && (
              <div className="px-4 md:px-6 pb-6 space-y-4 animate-in slide-in-from-top-2">
                 {c.modules.map(m => (
                   <div key={m.id} className="glass-dark rounded-3xl border border-white/5 overflow-hidden">
                      <div className="bg-white/10 px-4 py-3 flex items-center justify-between">
                         <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 truncate pr-4">{m.title}</span>
                         <button onClick={() => setAddModal({type: 'topic', p1: c.id, p2: m.id})} className="p-1 hover:text-white transition-colors shrink-0"><Plus size={16}/></button>
                      </div>
                      <div className="divide-y divide-white/5">
                        {m.topics.map(t => (
                          <div key={t.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors group">
                            <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1 pr-2">
                              <button 
                                onClick={() => {
                                  const newData = {...data};
                                  const flow = [ProgressStatus.NOT_STARTED, ProgressStatus.IN_PROGRESS, ProgressStatus.MASTERED];
                                  const tRef = newData.courses.find(x => x.id === c.id)?.modules.find(x => x.id === m.id)?.topics.find(x => x.id === t.id);
                                  if (tRef) tRef.status = flow[(flow.indexOf(tRef.status) + 1) % flow.length];
                                  onUpdate(newData);
                                }}
                                className="shrink-0 active:scale-90 transition-transform p-0.5"
                              >
                                {t.status === 'Mastered' ? <CheckCircle2 size={24} className="text-emerald-500"/> : t.status === 'In Progress' ? <Clock size={24} className="text-indigo-400"/> : <Circle size={24} className="text-slate-700"/>}
                              </button>
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-slate-200 truncate">{t.title}</p>
                                <p className="text-[8px] text-slate-500 uppercase tracking-tighter font-bold">{t.status}</p>
                              </div>
                            </div>
                            <button onClick={() => setActiveTopic({cId: c.id, mId: m.id, topic: t})} className="p-2 text-slate-500 hover:text-white transition-colors shrink-0"><Edit2 size={16}/></button>
                          </div>
                        ))}
                      </div>
                   </div>
                 ))}
                 {c.modules.length === 0 && <p className="text-center py-6 text-xs text-slate-600 italic">No modules defined yet.</p>}
              </div>
            )}
          </GlassCard>
        ))}
        {data.courses.length === 0 && (
          <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-3xl text-slate-600 opacity-50">
             <BookOpen size={40} className="mb-2"/>
             <p className="text-xs uppercase font-bold tracking-[0.2em]">Curriculum is empty</p>
          </div>
        )}
      </div>

      <Modal isOpen={!!addModal} onClose={() => setAddModal(null)} title={`Add ${addModal?.type}`}>
         <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Entry Title..." autoFocus onKeyDown={e => e.key === 'Enter' && handleAdd()} />
         <button onClick={handleAdd} className="w-full mt-4 bg-indigo-600 py-4 rounded-2xl font-bold text-white shadow-lg active:scale-[0.98] transition-all">Confirm Entry</button>
      </Modal>

      <Modal isOpen={aiModal} onClose={() => setAiModal(false)} title="Syllabus AI Parser">
         <textarea className="w-full h-44 bg-black/40 border border-white/10 rounded-2xl p-4 text-xs md:text-sm font-mono mb-4 resize-none text-slate-200 placeholder:text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500" placeholder="Paste syllabus text content here..." value={syllabus} onChange={e => setSyllabus(e.target.value)} />
         <button onClick={handleAI} disabled={isParsing} className="w-full bg-indigo-600 py-4 rounded-2xl font-bold text-white disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
            {isParsing ? <RefreshCw className="animate-spin" size={18}/> : <Sparkles size={18}/>}
            {isParsing ? 'Analyzing Syllabus...' : 'Import to Curriculum'}
         </button>
      </Modal>

      {activeTopic && (
        <TopicDetailsModal 
          isOpen={true} topic={activeTopic.topic} onClose={() => setActiveTopic(null)}
          onUpdate={(ut) => {
            const newData = {...data};
            const topicRef = newData.courses.find(x => x.id === activeTopic.cId)?.modules.find(x => x.id === activeTopic.mId)?.topics.find(x => x.id === ut.id);
            if (topicRef) Object.assign(topicRef, ut);
            onUpdate(newData); setActiveTopic({...activeTopic, topic: ut});
          }}
        />
      )}
    </div>
  );
};

const AcademicPipeline: React.FC<{ data: AppState; onUpdate: (d: AppState) => void }> = ({ data, onUpdate }) => {
  const [modal, setModal] = useState<{isOpen: boolean, editItem?: AcademicProject}>({isOpen: false});
  const [form, setForm] = useState({ title: '', category: '', deadline: '', notes: '' });

  useEffect(() => {
    if (modal.editItem) setForm({...modal.editItem});
    else setForm({ title: '', category: '', deadline: '', notes: '' });
  }, [modal.editItem]);

  const columns = [
    { title: 'Upcoming', status: AcademicTaskStatus.UPCOMING },
    { title: 'Working', status: AcademicTaskStatus.IN_PROGRESS },
    { title: 'Final Review', status: AcademicTaskStatus.REVIEW },
    { title: 'Done', status: AcademicTaskStatus.SUBMITTED },
  ];

  const handleSave = () => {
    if (!form.title || !form.deadline) return;
    const newData = {...data};
    if (modal.editItem) {
       const idx = newData.academicProjects.findIndex(x => x.id === modal.editItem?.id);
       if (idx !== -1) newData.academicProjects[idx] = { ...newData.academicProjects[idx], ...form };
    } else {
       newData.academicProjects.push({ id: generateId(), ...form, status: AcademicTaskStatus.UPCOMING });
    }
    onUpdate(newData); setModal({isOpen: false});
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center gap-2">
        <h2 className="text-2xl md:text-3xl font-extrabold truncate">Pipeline</h2>
        <button onClick={() => setModal({isOpen: true})} className="bg-emerald-600 px-4 md:px-5 py-3 rounded-2xl text-[10px] md:text-xs font-bold text-white shadow-lg shrink-0 flex items-center gap-2 active:scale-95 transition-all uppercase tracking-widest">+ Project</button>
      </div>

      <div className="flex md:grid md:grid-cols-4 gap-4 md:gap-6 min-h-[60vh] overflow-x-auto pb-10 no-scrollbar snap-x snap-mandatory px-1">
        {columns.map(col => (
          <div key={col.status} className="space-y-4 min-w-[280px] md:min-w-0 snap-center">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-2 border-b border-white/5 pb-2">{col.title}</h4>
            <div className="space-y-3">
              {data.academicProjects.filter(p => p.status === col.status).map(item => (
                <GlassCard key={item.id} className="p-5 border border-white/5 hover:border-indigo-500/30 group transition-all active:scale-[0.98]">
                   <div className="flex justify-between items-start mb-2">
                      <p className="text-[9px] text-indigo-400 font-bold uppercase truncate pr-4 tracking-tighter">{item.category || 'General'}</p>
                      <button onClick={() => setModal({isOpen: true, editItem: item})} className="md:opacity-0 md:group-hover:opacity-100 p-2 text-slate-500 hover:text-white transition-all"><Edit2 size={14}/></button>
                   </div>
                   <h5 className="text-sm font-bold text-slate-200 mb-4 line-clamp-2">{item.title}</h5>
                   <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] text-slate-500 font-bold flex items-center gap-1"><CalendarIcon size={12}/> {new Date(item.deadline).toLocaleDateString()}</span>
                        <span className="text-[8px] text-indigo-400/80 uppercase font-black tracking-widest">{item.status.split(' ')[0]}</span>
                      </div>
                      <div className="flex gap-2 mt-1">
                        {columns.map(c => (
                          <button 
                            key={c.status} 
                            onClick={() => onUpdate({...data, academicProjects: data.academicProjects.map(p => p.id === item.id ? {...p, status: c.status as AcademicTaskStatus} : p)})} 
                            className={`h-1.5 rounded-full transition-all ${item.status === c.status ? 'bg-indigo-500 w-6 shadow-sm' : 'bg-white/10 w-2 hover:bg-white/20'}`} 
                            title={c.title}
                          />
                        ))}
                      </div>
                   </div>
                </GlassCard>
              ))}
              {data.academicProjects.filter(p => p.status === col.status).length === 0 && <div className="border border-dashed border-white/5 rounded-3xl p-10 flex flex-col items-center justify-center opacity-20 italic text-[9px] uppercase font-bold text-slate-600 text-center">Empty Column</div>}
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={modal.isOpen} onClose={() => setModal({isOpen: false})} title={modal.editItem ? "Update Milestones" : "New Task Record"}>
         <div className="space-y-5 pb-2">
            <div><Label>Task Title</Label><Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Mid-term Research" /></div>
            <div className="grid grid-cols-2 gap-3">
               <div><Label>Tag</Label><Input value={form.category} onChange={e => setForm({...form, category: e.target.value})} placeholder="Lab, Thesis..." /></div>
               <div><Label>Deadline</Label><Input type="date" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} /></div>
            </div>
            <div><Label>Context / Details</Label>
               <textarea className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white h-24 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Specific objectives or notes..." />
            </div>
            <button onClick={handleSave} className="w-full bg-emerald-600 py-4 rounded-2xl font-bold text-white shadow-lg active:scale-[0.98] transition-all">Submit Details</button>
            {modal.editItem && (
               <button onClick={() => { if(confirm("Discard this project permanently?")) { onUpdate({...data, academicProjects: data.academicProjects.filter(p => p.id !== modal.editItem?.id)}); setModal({isOpen: false}); }}} className="w-full py-3 border border-red-500/20 text-red-500 rounded-2xl text-[9px] font-bold uppercase tracking-widest hover:bg-red-500/10 transition-all">Delete Record</button>
            )}
         </div>
      </Modal>
    </div>
  );
};

const CalendarView: React.FC<{ data: AppState }> = ({ data }) => {
  const sorted = useMemo(() => [...data.academicProjects].sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()), [data.academicProjects]);

  return (
    <div className="space-y-6 md:space-y-8 animate-in slide-in-from-bottom-2 duration-500">
      <h2 className="text-2xl md:text-3xl font-extrabold px-1">Timeline</h2>
      <GlassCard className="p-6 md:p-8">
         <div className="space-y-6">
            {sorted.map((p, idx) => (
              <div key={p.id} className="relative pl-10 md:pl-12">
                 {idx !== sorted.length - 1 && <div className="absolute left-[13px] md:left-[15px] top-8 bottom-0 w-[2px] bg-indigo-500/10" />}
                 <div className={`absolute left-0 top-1 w-7 h-7 md:w-8 md:h-8 rounded-2xl border-2 flex items-center justify-center shadow-lg shrink-0 ${p.status === AcademicTaskStatus.SUBMITTED ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-indigo-950 border-indigo-500 text-indigo-400'}`}>
                    {p.status === AcademicTaskStatus.SUBMITTED ? <Check size={14}/> : <span className="text-[10px] font-black">{idx+1}</span>}
                 </div>
                 <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-3 p-4 md:p-5 glass-dark rounded-[1.5rem] md:rounded-3xl border border-white/5 group hover:border-indigo-500/30 transition-all active:scale-[0.99]">
                    <div className="min-w-0 pr-2">
                      <h5 className="font-bold text-white text-sm md:text-base group-hover:text-indigo-300 transition-colors truncate">{p.title}</h5>
                      <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">{p.category}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                       <span className="text-[9px] font-mono font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1.5 md:px-4 md:py-2 rounded-xl border border-indigo-500/10">
                         {new Date(p.deadline).toLocaleDateString(undefined, {weekday:'short', month:'short', day:'numeric'})}
                       </span>
                    </div>
                 </div>
              </div>
            ))}
            {sorted.length === 0 && (
              <div className="text-center py-20 text-slate-600 flex flex-col items-center opacity-30">
                <CalendarIcon size={48} className="mb-2"/>
                <p className="text-[10px] uppercase tracking-[0.3em] font-black">Timeline Inactive</p>
              </div>
            )}
         </div>
      </GlassCard>
    </div>
  );
};

const App: React.FC = () => {
  const [data, setData] = useState<AppState>(StorageService.load);
  const [showSettings, setShowSettings] = useState(false);
  const [profileForm, setProfileForm] = useState(data.user);

  useEffect(() => { StorageService.save(data); }, [data]);

  return (
    <MemoryRouter>
      <div className="flex min-h-screen bg-[#020617] text-slate-200 selection:bg-indigo-500/30 font-sans">
        <Sidebar user={data.user} onSettings={() => setShowSettings(true)} />
        <MobileNav user={data.user} onSettings={() => setShowSettings(true)} />
        <main className="flex-1 md:ml-72 p-4 md:p-12 min-h-screen pb-28 md:pb-12 transition-all duration-500 overflow-x-hidden">
          <div className="max-w-5xl mx-auto">
            <Routes>
              <Route path="/" element={<Dashboard data={data} />} />
              <Route path="/courses" element={<Curriculum data={data} onUpdate={setData} />} />
              <Route path="/pipeline" element={<AcademicPipeline data={data} onUpdate={setData} />} />
              <Route path="/calendar" element={<CalendarView data={data} />} />
            </Routes>
          </div>
        </main>
        
        <Modal isOpen={showSettings} onClose={() => setShowSettings(false)} title="Student Profile">
          <div className="space-y-6 pb-2">
            <section className="space-y-4">
              <Label>Academic Identity</Label>
              <Input value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} placeholder="Display Name" />
              <Input value={profileForm.role} onChange={e => setProfileForm({...profileForm, role: e.target.value})} placeholder="Field of Study" />
              <button onClick={() => { setData({...data, user: profileForm}); setShowSettings(false); }} className="w-full bg-indigo-600 py-4 rounded-2xl font-bold text-white shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"><Save size={18}/> Update Identity</button>
            </section>
            
            <section className="space-y-4 border-t border-white/5 pt-8">
              <Label>Governance</Label>
              <div className="grid grid-cols-2 gap-3">
                 <button onClick={() => { const blob = new Blob([JSON.stringify(data)], {type:'application/json'}); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download='pathways_academic.json'; a.click(); }} className="glass-dark p-4 rounded-2xl flex flex-col items-center gap-3 hover:bg-white/10 transition-all text-white border border-white/5 active:scale-95">
                    <Download size={22} className="text-indigo-400" /><span className="text-[9px] font-bold uppercase tracking-widest">Backup</span>
                 </button>
                 <label className="glass-dark p-4 rounded-2xl flex flex-col items-center gap-3 hover:bg-white/10 transition-all cursor-pointer text-white border border-white/5 active:scale-95">
                    <Upload size={22} className="text-emerald-400" /><span className="text-[9px] font-bold uppercase tracking-widest">Restore</span>
                    <input type="file" className="hidden" accept=".json" onChange={e => { const f = e.target.files?.[0]; if(f){ const r=new FileReader(); r.onload=ev=>{ try{setData(JSON.parse(ev.target?.result as string))}catch(err){alert("Invalid data file")}}; r.readAsText(f); }}} />
                 </label>
              </div>
              <button onClick={() => { if(confirm("Erase all local records? This action is permanent.")) { localStorage.removeItem(STORAGE_KEY); window.location.reload(); } }} className="w-full py-3 border border-red-500/20 text-red-500 rounded-2xl text-[9px] font-bold uppercase tracking-widest mt-4 hover:bg-red-500/10 transition-all">Clear Local Session</button>
            </section>
            <p className="text-[8px] text-slate-600 text-center uppercase tracking-[0.2em] font-bold pt-2">Pathways Academic v2.1</p>
          </div>
        </Modal>
      </div>
    </MemoryRouter>
  );
};

export default App;