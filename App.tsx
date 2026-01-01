
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, 
  PieChart as PieChartIcon, 
  Users, 
  ArrowLeftRight, 
  ChevronRight, 
  MapPin, 
  Calendar, 
  Camera, 
  Wallet, 
  CheckCircle2,
  Trash2,
  AlertCircle,
  Loader2,
  UserPlus,
  UserMinus,
  Briefcase,
  ChevronLeft,
  Edit2,
  Check,
  X,
  Info,
  Circle
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip,
  Legend
} from 'recharts';
import { Trip, Expense, Member, Category, Settlement } from './types';
import { SUPPORTED_CURRENCIES, CATEGORY_ICONS, MOCK_RATES } from './constants';
import { geminiService } from './services/geminiService';

const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#6B7280'];

// --- Components ---

const ExpenseDetailView = ({ 
  expense, 
  members, 
  onClose, 
  onDelete 
}: { 
  expense: Expense; 
  members: Member[]; 
  onClose: () => void;
  onDelete: (id: string) => void;
}) => {
  const payer = members.find(m => m.id === expense.payerId);
  const participants = members.filter(m => expense.participants.includes(m.id));

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200 flex items-end">
      <div className="bg-white w-full max-w-md mx-auto rounded-t-[40px] p-8 shadow-2xl animate-in slide-in-from-bottom-full duration-300">
        <div className="flex justify-between items-center mb-6">
          <div className="w-12 h-1 rounded-full bg-slate-200 mx-auto absolute top-3 left-1/2 -translate-x-1/2"></div>
          <button onClick={onClose} className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
          <h3 className="text-xl font-black text-slate-800">支出詳情</h3>
          <button 
            onClick={() => { onDelete(expense.id); onClose(); }} 
            className="p-2 bg-red-50 rounded-full text-red-400 hover:text-red-600"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-3xl bg-blue-50 flex items-center justify-center text-4xl mb-4 shadow-inner">
            {CATEGORY_ICONS[expense.category]}
          </div>
          <h4 className="text-2xl font-black text-slate-900 mb-1">{expense.title}</h4>
          <p className="text-3xl font-black text-blue-600 tracking-tighter">
            {expense.currency} {expense.amount.toLocaleString()}
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
            <Calendar className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">消費日期</p>
              <p className="font-bold text-slate-700">{expense.date}</p>
            </div>
          </div>
          {expense.location && (
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
              <MapPin className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">消費地點</p>
                <p className="font-bold text-slate-700">{expense.location}</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
            <div className="w-5 h-5 flex items-center justify-center">
              <img src={payer?.avatar} className="w-5 h-5 rounded-full" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">付錢的人</p>
              <p className="font-bold text-slate-700">{payer?.name}</p>
            </div>
          </div>
        </div>

        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">參與分帳的成員 ({participants.length})</p>
          <div className="flex flex-wrap gap-2">
            {participants.map(p => (
              <div key={p.id} className="flex items-center gap-2 bg-white border border-slate-100 px-3 py-1.5 rounded-full shadow-sm">
                <img src={p.avatar} className="w-4 h-4 rounded-full" />
                <span className="text-xs font-bold text-slate-600">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
        
        <button 
          onClick={onClose}
          className="w-full mt-8 py-4 bg-slate-900 text-white rounded-3xl font-black text-sm active:scale-95 transition-all shadow-xl"
        >
          返回清單
        </button>
      </div>
    </div>
  );
};

const ExpenseForm = ({ 
  trip, 
  onSave, 
  onCancel 
}: { 
  trip: Trip; 
  onSave: (exp: Omit<Expense, 'id'>) => void; 
  onCancel: () => void;
}) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(trip.baseCurrency);
  const [category, setCategory] = useState<Category>(Category.FOOD);
  const [payer, setPayer] = useState(trip.members[0]?.id || '');
  const [participants, setParticipants] = useState(trip.members.map(m => m.id));
  const [location, setLocation] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      try {
        const parsed = await geminiService.parseReceipt({ data: base64, mimeType: file.type });
        if (parsed) {
          if (parsed.title) setTitle(parsed.title);
          if (parsed.amount) setAmount(parsed.amount.toString());
          if (parsed.currency && SUPPORTED_CURRENCIES.includes(parsed.currency.toUpperCase())) {
            setCurrency(parsed.currency.toUpperCase());
          }
          if (parsed.location) setLocation(parsed.location);
          if (parsed.date) setDate(parsed.date);
          if (parsed.category) {
            const found = Object.values(Category).find(c => 
              parsed.category.includes(c) || c.includes(parsed.category)
            );
            if (found) setCategory(found);
          }
        }
      } catch (err) {
        console.error("AI Auto-fill failed", err);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="p-4 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex justify-between items-center">
        <button onClick={onCancel} className="p-2 text-slate-500 hover:text-slate-900"><ChevronLeft /></button>
        <h2 className="text-xl font-black text-slate-800">記一筆支出</h2>
        <button 
          disabled={!title || !amount || loading}
          onClick={() => onSave({ title, amount: parseFloat(amount), currency, category, payerId: payer, participants, location, date })}
          className={`px-6 py-2 rounded-full font-bold shadow-sm transition-all ${(!title || !amount || loading) ? 'bg-slate-200 text-slate-400' : 'bg-blue-600 text-white active:scale-95'}`}
        >
          完成
        </button>
      </div>

      <div className="relative overflow-hidden rounded-3xl border-2 border-dashed border-slate-200 bg-white hover:border-blue-400 transition-colors">
        <label className="flex flex-col items-center justify-center w-full h-32 cursor-pointer">
          {loading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <span className="text-sm font-black text-blue-600">AI 正在辨識並總結內容...</span>
            </div>
          ) : (
            <>
              <Camera className="w-8 h-8 text-slate-400 mb-2" />
              <span className="text-sm font-bold text-slate-500 uppercase tracking-tighter">拍照自動填單 (AI 智慧中文總結)</span>
            </>
          )}
          <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={loading} />
        </label>
      </div>

      <div className="space-y-4">
        <div className="bg-white p-5 rounded-[32px] shadow-sm border border-slate-100 space-y-4">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block px-1">支出名稱</label>
            <input 
              type="text" 
              placeholder="支出項目名稱" 
              className="w-full text-lg font-bold border border-slate-100 bg-slate-50 rounded-2xl px-4 py-3.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>
          
          <div className="flex gap-4">
            <div className="w-28">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block px-1">幣別</label>
              <select 
                className="w-full bg-slate-50 border border-slate-100 px-3 py-3.5 rounded-2xl text-sm font-bold outline-none"
                value={currency}
                onChange={e => setCurrency(e.target.value)}
              >
                {SUPPORTED_CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block px-1">金額</label>
              <input 
                type="number" 
                placeholder="0.00" 
                className="w-full text-xl font-black border border-slate-100 bg-slate-50 rounded-2xl px-4 py-3.5 focus:ring-2 focus:ring-blue-500/20 outline-none"
                value={amount}
                onChange={e => setAmount(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">類別</label>
            <select 
              className="w-full bg-slate-50 border border-slate-100 px-3 py-2.5 rounded-xl text-sm font-medium outline-none"
              value={category}
              onChange={e => setCategory(e.target.value as Category)}
            >
              {Object.values(Category).map(c => <option key={c} value={c}>{CATEGORY_ICONS[c]} {c}</option>)}
            </select>
          </div>
          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">日期</label>
            <input 
              type="date" 
              value={date} 
              onChange={e => setDate(e.target.value)} 
              className="w-full bg-slate-50 border border-slate-100 px-3 py-2.5 rounded-xl text-sm font-medium outline-none" 
            />
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3">
          <MapPin className="w-5 h-5 text-slate-400 shrink-0" />
          <input 
            type="text" 
            placeholder="地點 (選填)" 
            className="flex-1 bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-xl text-sm font-medium outline-none"
            value={location}
            onChange={e => setLocation(e.target.value)}
          />
        </div>

        <div className="space-y-3 px-1">
          <label className="text-sm font-black text-slate-600">付錢的人</label>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {trip.members.map(m => (
              <button
                key={m.id}
                onClick={() => setPayer(m.id)}
                className={`flex flex-col items-center p-3 rounded-[24px] border min-w-[85px] transition-all shadow-sm ${payer === m.id ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-100 text-slate-600 hover:border-blue-200'}`}
              >
                <img src={m.avatar} className="w-10 h-10 rounded-full mb-2 bg-slate-100" />
                <span className="text-[10px] font-black whitespace-nowrap uppercase tracking-tight">{m.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3 px-1">
          <div className="flex justify-between items-center">
            <label className="text-sm font-black text-slate-600">平分對象</label>
            <button 
              onClick={() => setParticipants(participants.length === trip.members.length ? [] : trip.members.map(m => m.id))}
              className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full uppercase tracking-widest"
            >
              {participants.length === trip.members.length ? '取消全選' : '全選'}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {trip.members.map(m => (
              <button
                key={m.id}
                onClick={() => setParticipants(prev => prev.includes(m.id) ? prev.filter(pid => pid !== m.id) : [...prev, m.id])}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-black transition-all shadow-sm ${participants.includes(m.id) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-100'}`}
              >
                <img src={m.avatar} className="w-5 h-5 rounded-full bg-slate-50" />
                {m.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const MembersView = ({ 
  members, 
  onAdd, 
  onRemove 
}: { 
  members: Member[]; 
  onAdd: (name: string) => void; 
  onRemove: (id: string) => void;
}) => {
  const [name, setName] = useState('');

  const handleAdd = () => {
    if (name.trim()) {
      onAdd(name.trim());
      setName('');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="bg-white p-6 rounded-[40px] shadow-sm border border-slate-100">
        <h3 className="font-black text-slate-800 mb-6 px-2 tracking-tight flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-blue-500" /> 新增旅伴
        </h3>
        <div className="flex gap-3">
          <input 
            type="text" 
            placeholder="輸入姓名..." 
            className="flex-1 bg-slate-50 border border-slate-100 px-5 py-3.5 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
          <button 
            onClick={handleAdd}
            disabled={!name.trim()}
            className="bg-blue-600 text-white p-4 rounded-2xl shadow-lg shadow-blue-200 active:scale-90 transition-transform disabled:opacity-50"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-black text-slate-800 px-4 flex justify-between items-center">
          <span>旅伴名單</span>
          <span className="text-xs bg-slate-200 text-slate-500 px-3 py-1 rounded-full">{members.length} 人</span>
        </h3>
        {members.map((m, idx) => (
          <div key={m.id} className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between group hover:border-blue-200 transition-all">
            <div className="flex items-center gap-4">
              <div className="relative">
                <img src={m.avatar} className="w-14 h-14 rounded-full bg-slate-50 border-2 border-slate-50 shadow-sm" />
                <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-[10px] text-white font-bold`} style={{ backgroundColor: COLORS[idx % COLORS.length] }}>
                  {idx + 1}
                </div>
              </div>
              <div>
                <p className="font-black text-slate-800 text-lg">{m.name}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {idx === 0 ? '管理員' : '成員'}
                </p>
              </div>
            </div>
            {idx !== 0 && (
              <button 
                onClick={() => onRemove(m.id)}
                className="p-3 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
              >
                <UserMinus className="w-5 h-5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const TripSelectorView = ({ 
  trips, 
  onSelect, 
  onAdd, 
  onDelete 
}: { 
  trips: Trip[]; 
  onSelect: (id: string) => void; 
  onAdd: (name: string) => void;
  onDelete: (id: string) => void;
}) => {
  const [newTripName, setNewTripName] = useState('');

  return (
    <div className="p-4 space-y-8 animate-in fade-in duration-300">
      <div className="space-y-2">
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">我的旅遊行程</h2>
        <p className="text-sm font-medium text-slate-400">選擇一個專案進行記帳與分帳</p>
      </div>

      <div className="grid gap-4">
        {trips.map(t => (
          <div key={t.id} className="bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm group hover:border-blue-300 transition-all active:scale-[0.98]">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3" onClick={() => onSelect(t.id)}>
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-black text-slate-800">{t.name}</h4>
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.members.length} 位成員 • {t.expenses.length} 筆支出</p>
                    {t.isFullySettled && (
                      <span className="bg-green-100 text-green-600 text-[8px] px-2 py-0.5 rounded-full font-black uppercase">已結清</span>
                    )}
                  </div>
                </div>
              </div>
              {trips.length > 1 && (
                <button onClick={() => onDelete(t.id)} className="p-2 text-slate-200 hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <button 
              onClick={() => onSelect(t.id)}
              className="w-full py-3 bg-blue-600 text-white rounded-2xl text-xs font-black shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
            >
              進入專案
            </button>
          </div>
        ))}
      </div>

      <div className="bg-slate-100 p-6 rounded-[32px] space-y-4">
        <p className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">建立新旅程</p>
        <div className="flex gap-3">
          <input 
            type="text" 
            placeholder="行程名稱，如：曼谷自由行" 
            className="flex-1 bg-white border border-slate-200 px-4 py-3 rounded-2xl font-bold outline-none"
            value={newTripName}
            onChange={e => setNewTripName(e.target.value)}
          />
          <button 
            onClick={() => {
              if (newTripName.trim()) {
                onAdd(newTripName.trim());
                setNewTripName('');
              }
            }}
            className="bg-slate-800 text-white p-3.5 rounded-2xl active:scale-90 transition-transform"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

const App: React.FC = () => {
  const [trips, setTrips] = useState<Trip[]>(() => {
    const saved = localStorage.getItem('travelsplit_trips');
    if (saved) return JSON.parse(saved);
    return [{
      id: 'default',
      name: '我的第一個行程',
      baseCurrency: 'TWD',
      members: [{ id: 'm1', name: '我', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=me' }],
      expenses: [],
      createdAt: new Date().toISOString(),
      completedSettlementKeys: []
    }];
  });

  const [activeTripId, setActiveTripId] = useState(() => {
    return localStorage.getItem('travelsplit_active_id') || trips[0].id;
  });

  const [view, setView] = useState<'expenses' | 'settlement' | 'analytics' | 'add' | 'members' | 'trip-selector'>('expenses');
  const [isEditingTripName, setIsEditingTripName] = useState(false);
  const [tempTripName, setTempTripName] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('全部');
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);
  
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('travelsplit_trips', JSON.stringify(trips));
    localStorage.setItem('travelsplit_active_id', activeTripId);
  }, [trips, activeTripId]);

  const activeTrip = useMemo(() => {
    return trips.find(t => t.id === activeTripId) || trips[0];
  }, [trips, activeTripId]);

  const convertAmount = (amount: number, from: string, to: string) => {
    return (amount * (MOCK_RATES[from] || 1)) / (MOCK_RATES[to] || 1);
  };

  const totalSpent = useMemo(() => {
    return activeTrip.expenses.reduce((acc, exp) => {
      return acc + convertAmount(exp.amount, exp.currency, activeTrip.baseCurrency);
    }, 0);
  }, [activeTrip.expenses, activeTrip.baseCurrency]);

  const categoryData = useMemo(() => {
    const data: Record<string, number> = {};
    activeTrip.expenses.forEach(exp => {
      const amt = convertAmount(exp.amount, exp.currency, activeTrip.baseCurrency);
      data[exp.category] = (data[exp.category] || 0) + amt;
    });
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [activeTrip.expenses, activeTrip.baseCurrency]);

  const filteredExpenses = useMemo(() => {
    if (filterCategory === '全部') return activeTrip.expenses;
    return activeTrip.expenses.filter(e => e.category === filterCategory);
  }, [activeTrip.expenses, filterCategory]);

  const selectedExpense = useMemo(() => {
    return activeTrip.expenses.find(e => e.id === selectedExpenseId) || null;
  }, [activeTrip.expenses, selectedExpenseId]);

  const settlements = useMemo(() => {
    const balances: Record<string, number> = {};
    activeTrip.members.forEach(m => (balances[m.id] = 0));

    activeTrip.expenses.forEach(exp => {
      const totalInBase = convertAmount(exp.amount, exp.currency, activeTrip.baseCurrency);
      const perPerson = totalInBase / (exp.participants.length || 1);
      if (balances[exp.payerId] !== undefined) balances[exp.payerId] += totalInBase;
      exp.participants.forEach(pId => {
        if (balances[pId] !== undefined) balances[pId] -= perPerson;
      });
    });

    const results: Settlement[] = [];
    const debtors = activeTrip.members.map(m => ({ ...m, balance: balances[m.id] || 0 })).filter(m => m.balance < -0.01).sort((a,b) => a.balance - b.balance);
    const creditors = activeTrip.members.map(m => ({ ...m, balance: balances[m.id] || 0 })).filter(m => m.balance > 0.01).sort((a,b) => b.balance - a.balance);

    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
      const amount = Math.min(Math.abs(debtors[i].balance), creditors[j].balance);
      if (amount > 0.01) {
        const key = `${debtors[i].name}-${creditors[j].name}-${amount.toFixed(0)}`;
        results.push({ from: debtors[i].name, to: creditors[j].name, amount, currency: activeTrip.baseCurrency, key });
      }
      debtors[i].balance += amount;
      creditors[j].balance -= amount;
      if (Math.abs(debtors[i].balance) < 0.01) i++;
      if (Math.abs(creditors[j].balance) < 0.01) j++;
    }

    // 更新專案是否全數結清狀態
    const completedKeys = activeTrip.completedSettlementKeys || [];
    const isFullySettled = results.length > 0 && results.every(s => completedKeys.includes(s.key));
    
    // 如果結果改變且偵測到全數結清，需要回流更新 trips 狀態 (這裡簡化，讓 UI 反映)
    return results;
  }, [activeTrip]);

  const isProjectFullySettled = useMemo(() => {
    if (settlements.length === 0) return false;
    const completedKeys = activeTrip.completedSettlementKeys || [];
    return settlements.every(s => completedKeys.includes(s.key));
  }, [settlements, activeTrip.completedSettlementKeys]);

  // Trip Handlers
  const addTrip = (name: string) => {
    const newTrip: Trip = {
      id: 't' + Date.now(),
      name,
      baseCurrency: 'TWD',
      members: [{ id: 'm1', name: '我', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=me' }],
      expenses: [],
      createdAt: new Date().toISOString(),
      completedSettlementKeys: []
    };
    setTrips(prev => [...prev, newTrip]);
    setActiveTripId(newTrip.id);
    setView('expenses');
  };

  const deleteTrip = (id: string) => {
    if (trips.length <= 1) return;
    const nextTrips = trips.filter(t => t.id !== id);
    setTrips(nextTrips);
    if (activeTripId === id) setActiveTripId(nextTrips[0].id);
  };

  const handleRenameTrip = () => {
    if (tempTripName.trim()) {
      setTrips(prev => prev.map(t => t.id === activeTripId ? { ...t, name: tempTripName.trim() } : t));
    }
    setIsEditingTripName(false);
  };

  const startEditingName = () => {
    setTempTripName(activeTrip.name);
    setIsEditingTripName(true);
    setTimeout(() => editInputRef.current?.focus(), 100);
  };

  const toggleSettlementAction = (key: string) => {
    setTrips(prev => prev.map(t => {
      if (t.id !== activeTripId) return t;
      const currentKeys = t.completedSettlementKeys || [];
      const newKeys = currentKeys.includes(key) 
        ? currentKeys.filter(k => k !== key)
        : [...currentKeys, key];
      
      // 重新計算是否全數結清
      // 這裡計算比較複雜，我們先只存 key
      return { ...t, completedSettlementKeys: newKeys };
    }));
  };

  useEffect(() => {
    // 當 settlement keys 改變，檢查是否達成全結清
    if (settlements.length > 0 && isProjectFullySettled && !activeTrip.isFullySettled) {
      setTrips(prev => prev.map(t => t.id === activeTripId ? { ...t, isFullySettled: true } : t));
    } else if ((settlements.length === 0 || !isProjectFullySettled) && activeTrip.isFullySettled) {
      setTrips(prev => prev.map(t => t.id === activeTripId ? { ...t, isFullySettled: false } : t));
    }
  }, [isProjectFullySettled, settlements.length]);

  // Expense Handlers
  const saveExpense = (newExp: Omit<Expense, 'id'>) => {
    setTrips(prev => prev.map(t => t.id === activeTripId ? {
      ...t,
      expenses: [{ ...newExp, id: 'e' + Date.now() }, ...t.expenses],
      isFullySettled: false, // 新增支出後重設結清狀態
      completedSettlementKeys: [] // 重置結算進度
    } : t));
    setView('expenses');
  };

  const deleteExpense = (id: string) => {
    setTrips(prev => prev.map(t => t.id === activeTripId ? {
      ...t,
      expenses: t.expenses.filter(e => e.id !== id),
      completedSettlementKeys: [] // 支出變動，結算需重新確認
    } : t));
  };

  // Member Handlers
  const addMember = (name: string) => {
    const newMember: Member = {
      id: 'm' + Date.now(),
      name,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`
    };
    setTrips(prev => prev.map(t => t.id === activeTripId ? {
      ...t,
      members: [...t.members, newMember]
    } : t));
  };

  const removeMember = (id: string) => {
    const isBusy = activeTrip.expenses.some(e => e.payerId === id || e.participants.includes(id));
    if (isBusy) { alert("該成員已有帳目關聯，無法刪除。"); return; }
    setTrips(prev => prev.map(t => t.id === activeTripId ? {
      ...t,
      members: t.members.filter(m => m.id !== id)
    } : t));
  };

  const updateBaseCurrency = (cur: string) => {
    setTrips(prev => prev.map(t => t.id === activeTripId ? { ...t, baseCurrency: cur } : t));
  };

  return (
    <div className="max-w-md mx-auto bg-slate-50 min-h-screen relative pb-28 shadow-2xl flex flex-col">
      {/* Header */}
      {view !== 'add' && view !== 'trip-selector' && (
        <header className="bg-blue-600 text-white p-6 rounded-b-[40px] shadow-xl relative z-10">
          <div className="flex justify-between items-center mb-6">
            <button 
              onClick={() => setView('trip-selector')}
              className="flex items-center gap-2 p-2 bg-white/20 rounded-2xl hover:bg-white/30 transition-all border border-white/10"
            >
              <Briefcase className="w-5 h-5" />
              <span className="text-xs font-black uppercase tracking-tight">換行程</span>
            </button>
            <div className="text-center flex-1 flex flex-col items-center">
              {isEditingTripName ? (
                <div className="flex items-center gap-2 w-full px-4">
                  <input
                    ref={editInputRef}
                    type="text"
                    className="bg-white/20 border border-white/40 text-white font-black px-3 py-1.5 rounded-xl outline-none w-full text-center placeholder:text-white/50"
                    value={tempTripName}
                    onChange={(e) => setTempTripName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleRenameTrip()}
                    onBlur={handleRenameTrip}
                  />
                  <button onClick={handleRenameTrip} className="p-2 bg-white/20 rounded-xl"><Check className="w-4 h-4" /></button>
                </div>
              ) : (
                <div className="group flex items-center gap-2 max-w-full cursor-pointer" onClick={startEditingName}>
                  <h1 className="text-xl font-black tracking-tight truncate px-1">{activeTrip.name}</h1>
                  <Edit2 className="w-3.5 h-3.5 text-white/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              )}
            </div>
            {/* 移除設定按鈕 */}
            <div className="w-10"></div> 
          </div>
          
          <div className="bg-white/10 p-5 rounded-3xl backdrop-blur-xl border border-white/20 shadow-inner">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] text-blue-100 font-black uppercase tracking-widest mb-1 opacity-80">累計總支出</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold text-blue-200">{activeTrip.baseCurrency}</span>
                  <h2 className="text-4xl font-black tracking-tighter">{totalSpent.toLocaleString(undefined, { minimumFractionDigits: 0 })}</h2>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-blue-100 font-bold mb-1 opacity-80 uppercase tracking-widest">結算幣別</p>
                <select 
                  className="bg-white/20 text-white border-none text-sm font-black rounded-xl px-3 py-1.5 outline-none appearance-none cursor-pointer"
                  value={activeTrip.baseCurrency}
                  onChange={e => updateBaseCurrency(e.target.value)}
                >
                  {SUPPORTED_CURRENCIES.map(c => <option key={c} value={c} className="text-slate-900">{c}</option>)}
                </select>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="mt-4 px-4 flex-1 overflow-y-auto pb-10">
        {view === 'expenses' && (
          <div className="space-y-4 pb-10">
            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-1">
              {['全部', ...Object.values(Category)].map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-black whitespace-nowrap transition-all border shadow-sm ${filterCategory === cat ? 'bg-blue-600 border-blue-600 text-white scale-105' : 'bg-white border-slate-100 text-slate-500 hover:border-blue-200'}`}
                >
                  {cat === '全部' ? '全部' : `${CATEGORY_ICONS[cat as Category]} ${cat}`}
                </button>
              ))}
            </div>

            <div className="flex justify-between items-center px-1">
              <h3 className="font-black text-slate-800 tracking-tight">支出明細</h3>
              {activeTrip.isFullySettled && (
                <div className="flex items-center gap-1 bg-green-50 text-green-600 px-3 py-1 rounded-full border border-green-100 animate-in fade-in zoom-in">
                  <CheckCircle2 className="w-3 h-3" />
                  <span className="text-[10px] font-black uppercase">已結清</span>
                </div>
              )}
            </div>

            {filteredExpenses.length === 0 ? (
              <div className="bg-white p-16 rounded-[40px] text-center border-2 border-dashed border-slate-200">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Wallet className="w-10 h-10 text-slate-300" />
                </div>
                <p className="text-slate-400 font-bold">目前無支出紀錄</p>
              </div>
            ) : (
              filteredExpenses.map(exp => (
                <div 
                  key={exp.id} 
                  onClick={() => setSelectedExpenseId(exp.id)}
                  className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4 group hover:shadow-md transition-all cursor-pointer active:scale-95"
                >
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-3xl shadow-inner">
                    {CATEGORY_ICONS[exp.category]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-900 truncate tracking-tight">{exp.title}</h4>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                      <span className="bg-slate-100 px-2 py-0.5 rounded-lg">{exp.category}</span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5"><Users className="w-3 h-3" /> {exp.participants.length}人</span>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <div>
                      <p className="font-black text-slate-900 leading-none mb-1">{exp.currency} {exp.amount.toLocaleString()}</p>
                      <p className="text-[10px] font-bold text-slate-400">≈ {activeTrip.baseCurrency} {convertAmount(exp.amount, exp.currency, activeTrip.baseCurrency).toFixed(0)}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-200 group-hover:text-blue-300" />
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {view === 'settlement' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {isProjectFullySettled ? (
              <div className="bg-green-600 p-6 rounded-[32px] text-white shadow-xl relative overflow-hidden animate-in zoom-in duration-300">
                <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
                <div className="flex flex-col items-center text-center py-4">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-10 h-10 text-white" />
                  </div>
                  <h4 className="font-black text-2xl tracking-tight mb-2">本行程已結清！</h4>
                  <p className="text-green-100 text-sm font-medium">所有成員的債務都已經清償完畢。</p>
                </div>
              </div>
            ) : (
              <div className="bg-indigo-600 p-5 rounded-[32px] text-white shadow-lg relative overflow-hidden">
                <div className="flex gap-4 items-center">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-black text-lg tracking-tight">結算確認清單</h4>
                    <p className="text-indigo-100 text-xs font-medium">請在轉帳完成後，勾選已完成的項目。</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {settlements.length === 0 ? (
                <div className="bg-white p-16 rounded-[40px] text-center shadow-sm">
                  <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <p className="text-slate-700 font-black">無須分帳！</p>
                  <p className="text-slate-400 text-xs mt-2">每位成員的收支都已平衡。</p>
                </div>
              ) : (
                settlements.map((s) => {
                  const isDone = activeTrip.completedSettlementKeys?.includes(s.key);
                  return (
                    <div 
                      key={s.key} 
                      onClick={() => toggleSettlementAction(s.key)}
                      className={`p-6 rounded-[32px] shadow-sm border transition-all relative group cursor-pointer active:scale-95 ${isDone ? 'bg-slate-50 border-slate-100' : 'bg-white border-blue-100'}`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isDone ? 'bg-green-100 text-green-600' : 'bg-indigo-50 text-indigo-400'}`}>
                            {isDone ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`font-black ${isDone ? 'text-slate-400' : 'text-slate-800'}`}>{s.from}</span>
                              <ArrowLeftRight className={`w-3 h-3 ${isDone ? 'text-slate-300' : 'text-indigo-400'}`} />
                              <span className={`font-black ${isDone ? 'text-slate-400' : 'text-slate-800'}`}>{s.to}</span>
                            </div>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none">
                              {isDone ? '結算完成' : '待轉帳'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-2xl font-black tracking-tighter ${isDone ? 'text-slate-300 line-through' : 'text-indigo-600'}`}>
                            {s.currency} {s.amount.toFixed(0)}
                          </p>
                          {isDone && <p className="text-[8px] font-black text-green-500 uppercase mt-1">PAID</p>}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {view === 'analytics' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-white p-6 rounded-[40px] shadow-sm">
              <h3 className="font-black text-slate-800 mb-6 px-2 tracking-tight">支出類別分布</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={70} outerRadius={95} paddingAngle={8} dataKey="value" stroke="none" cornerRadius={8}>
                      {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <RechartsTooltip contentStyle={{ borderRadius: '20px', border: 'none', fontWeight: 'bold' }} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {view === 'members' && <MembersView members={activeTrip.members} onAdd={addMember} onRemove={removeMember} />}
        {view === 'add' && <ExpenseForm trip={activeTrip} onSave={saveExpense} onCancel={() => setView('expenses')} />}
        {view === 'trip-selector' && (
          <TripSelectorView 
            trips={trips} 
            onSelect={(id) => { setActiveTripId(id); setView('expenses'); }} 
            onAdd={addTrip} 
            onDelete={deleteTrip} 
          />
        )}
      </main>

      {/* Expense Detail Modal */}
      {selectedExpense && (
        <ExpenseDetailView 
          expense={selectedExpense} 
          members={activeTrip.members} 
          onClose={() => setSelectedExpenseId(null)}
          onDelete={deleteExpense}
        />
      )}

      {/* Navigation */}
      {view !== 'trip-selector' && view !== 'add' && (
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/80 backdrop-blur-2xl border-t border-slate-100 px-8 py-5 flex justify-between items-center rounded-t-[40px] shadow-[0_-10px_40px_rgba(0,0,0,0.04)] z-50">
          <button onClick={() => setView('expenses')} className={`flex flex-col items-center gap-1.5 transition-all ${view === 'expenses' ? 'text-blue-600 scale-110' : 'text-slate-300 hover:text-slate-400'}`}>
            <Wallet className={`w-6 h-6 ${view === 'expenses' ? 'fill-blue-600/10' : ''}`} />
            <span className="text-[10px] font-black uppercase tracking-tight">清單</span>
          </button>
          <button onClick={() => setView('settlement')} className={`flex flex-col items-center gap-1.5 transition-all ${view === 'settlement' ? 'text-blue-600 scale-110' : 'text-slate-300 hover:text-slate-400'}`}>
            <ArrowLeftRight className="w-6 h-6" />
            <span className="text-[10px] font-black uppercase tracking-tight">結算</span>
          </button>
          
          <div className="relative -top-12">
            <button onClick={() => setView('add')} className="w-16 h-16 bg-blue-600 text-white rounded-[24px] flex items-center justify-center shadow-2xl shadow-blue-300 active:scale-90 transition-all hover:bg-blue-700">
              <Plus className="w-8 h-8" />
            </button>
          </div>

          <button onClick={() => setView('analytics')} className={`flex flex-col items-center gap-1.5 transition-all ${view === 'analytics' ? 'text-blue-600 scale-110' : 'text-slate-300 hover:text-slate-400'}`}>
            <PieChartIcon className="w-6 h-6" />
            <span className="text-[10px] font-black uppercase tracking-tight">圖表</span>
          </button>
          <button onClick={() => setView('members')} className={`flex flex-col items-center gap-1.5 transition-all ${view === 'members' ? 'text-blue-600 scale-110' : 'text-slate-300 hover:text-slate-400'}`}>
            <Users className="w-6 h-6" />
            <span className="text-[10px] font-black uppercase tracking-tight">成員</span>
          </button>
        </nav>
      )}
    </div>
  );
};

export default App;
