import React, { useState, useEffect, createContext, useContext } from 'react';
import { 
  Home, Wallet, TrendingUp, User, Plus, 
  ChevronLeft, ChevronRight, LogOut, CheckCircle2, 
  Circle, Activity, Zap, AlertTriangle,
  ArrowUpRight, ArrowDownRight, ArrowRight, Sparkles,
  CalendarDays, ReceiptText
} from 'lucide-react';
import { initializeApp } from "firebase/app";
import { 
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, signInAnonymously, signOut,
  GoogleAuthProvider, signInWithPopup, updateProfile
} from "firebase/auth";
import { 
  getFirestore, collection, doc, setDoc, 
  onSnapshot, addDoc, deleteDoc
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAhAIbpEX8BMqzpbZQx7H_a0vWQuisSAcY",
  authDomain: "equilibrio-dgo.firebaseapp.com",
  projectId: "equilibrio-dgo",
  storageBucket: "equilibrio-dgo.firebasestorage.app",
  messagingSenderId: "687014870737",
  appId: "1:687014870737:web:6344c19fae0b538e768ff0",
  measurementId: "G-D1CK02PJ11"
};

let app, auth, db;
let firebaseInitError = null;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) {
  console.error("Firebase Init Error:", error);
  firebaseInitError = error.message;
}

const AppContext = createContext();

const dateKey = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const monthKey = (date) => dateKey(date).slice(0, 7);

const Card = ({ children, className = '', delay = 0, onClick }) => (
  <div 
    onClick={onClick}
    className={`surface-card ${onClick ? 'surface-card--interactive' : ''} ${className}`}
    style={{ animationDelay: `${delay}ms` }}
  >
    {children}
  </div>
);

const ProgressBar = ({ progress, color = 'bg-red-500' }) => (
  <div className="progress-track">
    <div 
      className={`progress-fill ${color}`}
      style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} 
    />
  </div>
);

const NeonInput = ({ label, type = "text", value, onChange, placeholder, ...inputProps }) => (
  <div className="flex flex-col gap-2">
    {label && <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{label}</label>}
    <input 
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      {...inputProps}
      className="form-input"
    />
  </div>
);

const ErrorScreen = ({ error, onOffline }) => {
  const isConfigError = error && error.includes('auth/configuration-not-found');

  return (
    <div className="auth-shell min-h-screen text-white flex flex-col items-center justify-center p-6">
      <div className="auth-card bg-[#121212] rounded-[32px] p-8 max-w-md w-full shadow-[0_0_40px_rgba(239,68,68,0.15)] text-center animate-in zoom-in-95">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
          <AlertTriangle size={40} />
        </div>
        <h2 className="text-2xl font-black text-white mb-4">
          {isConfigError ? 'Autenticação Desativada' : 'Erro de Conexão Firebase'}
        </h2>
        
        {isConfigError ? (
          <div className="text-sm text-zinc-400 mb-8 leading-relaxed text-left bg-black/50 p-6 rounded-2xl">
            <strong className="text-red-400 block mb-2">O Firebase Auth não está ativado.</strong>
            1. Acesse o <strong>Firebase Console</strong>.<br/>
            2. Vá em <strong>Authentication</strong> e clique em <strong>Get Started</strong>.<br/>
            3. Ative <strong>E-mail/Senha</strong> e <strong>Anônimo</strong>.<br/>
            4. Recarregue a página.
          </div>
        ) : (
          <div className="text-sm text-zinc-400 mb-8 leading-relaxed">
            Houve um problema ao conectar com a nuvem. Verifique as chaves ou teste offline.
            <br/><br/>
            <code className="text-xs text-red-500/70 bg-black/50 p-2 rounded block">{error}</code>
          </div>
        )}
        
        <button 
          onClick={onOffline}
          className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-black py-4 rounded-2xl transition-all active:scale-95"
        >
          TESTAR MODO OFFLINE
        </button>
      </div>
    </div>
  );
};

const LoginScreen = ({ onOffline }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      if (err.code === 'auth/unauthorized-domain') {
        setError(`Segurança do Firebase: Adicione o domínio "${window.location.hostname}" na lista de Domínios Autorizados no seu console.`);
      } else if (err.code === 'auth/configuration-not-found' || err.code === 'auth/operation-not-supported-in-this-environment') {
        setError("Autenticação via Google desativada no console do Firebase.");
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError("O pop-up de login foi bloqueado pelo navegador ou fechado.");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!email || !password) return setError("Preencha todos os campos.");
    setLoading(true);
    setError('');
    try {
      if (isLogin) await signInWithEmailAndPassword(auth, email, password);
      else await createUserWithEmailAndPassword(auth, email, password);
    } catch (err) {
      if (err.message.includes('auth/configuration-not-found')) {
        setError("Autenticação desativada. Ative E-mail/Senha no console do Firebase.");
      } else {
        setError(err.message.includes('auth/invalid') ? "Credenciais incorretas." : err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = async () => {
    setLoading(true);
    try {
      await signInAnonymously(auth);
    } catch (err) {
      if(err.message.includes('configuration-not-found')) {
         setError("Autenticação desativada. Ative o modo Anônimo no console do Firebase.");
      } else {
         setError(err.message);
      }
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell min-h-screen text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-600/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-8">
        <div className="text-center mb-10">
          <div className="brand-symbol auth-brand mx-auto mb-6" aria-hidden="true"><span /></div>
          <h1 className="text-4xl font-black tracking-tight mb-2">Equilíbrio</h1>
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-sm">Administre sua vida</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-card bg-[#121212] p-8 rounded-[32px] space-y-6">
          {error && <div className="bg-red-950/50 border border-red-500/50 text-red-400 p-4 rounded-2xl text-sm text-center font-bold">{error}</div>}
          
          <NeonInput label="E-mail" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="seu@email.com" />
          <NeonInput label="Senha" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" />
          
          <button type="submit" disabled={loading} className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-4 rounded-2xl transition-all active:scale-95 shadow-[0_0_20px_rgba(220,38,38,0.3)] disabled:opacity-50">
            {loading ? 'AGUARDE...' : isLogin ? 'ENTRAR' : 'CRIAR CONTA'}
          </button>
          
          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-zinc-800"></div>
            <span className="flex-shrink-0 mx-4 text-zinc-600 text-xs font-bold uppercase tracking-wider">ou</span>
            <div className="flex-grow border-t border-zinc-800"></div>
          </div>

          <button 
            type="button" 
            onClick={handleGoogleLogin} 
            disabled={loading} 
            className="w-full bg-white hover:bg-zinc-200 text-black font-black py-4 rounded-2xl transition-all active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.1)] flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            CONTINUAR COM GOOGLE
          </button>
          
          <div className="text-center pt-2">
            <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-zinc-500 hover:text-white text-sm font-bold transition-colors">
              {isLogin ? 'Não tem conta? Criar agora' : 'Já tem conta? Entrar'}
            </button>
          </div>
        </form>

        <div className="mt-8 space-y-4">
          <button onClick={handleGuest} disabled={loading} className="w-full bg-transparent border-2 border-zinc-800 hover:border-zinc-700 text-zinc-400 font-bold py-4 rounded-2xl transition-all active:scale-95">
            ENTRAR COMO VISITANTE
          </button>
          <button onClick={onOffline} className="w-full text-zinc-600 hover:text-zinc-400 text-sm font-bold py-2 transition-all">
            FORÇAR MODO OFFLINE
          </button>
        </div>
      </div>
    </div>
  );
};

const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!firebaseInitError);
  const [offlineMode, setOfflineMode] = useState(false);
  const [authError, setAuthError] = useState(firebaseInitError);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // App Data
  const [transactions, setTransactions] = useState([]);
  const [habits, setHabits] = useState([]);
  const [profileName, setProfileName] = useState('');

  // Setup Auth
  useEffect(() => {
    if (offlineMode || authError) return;
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setProfileName(u?.displayName || '');
      setLoading(false);
    }, (err) => {
      setAuthError(err.message);
      setLoading(false);
    });
    return () => unsub && unsub();
  }, [offlineMode, authError]);

  // Setup Realtime Sync
  useEffect(() => {
    if (!user || offlineMode) return;

    const txRef = collection(db, 'users', user.uid, 'transactions');
    const unsubTx = onSnapshot(txRef, (snap) => {
      setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const habRef = collection(db, 'users', user.uid, 'habits');
    const unsubHab = onSnapshot(habRef, (snap) => {
      setHabits(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubTx(); unsubHab(); };
  }, [user, offlineMode]);

  const addTransaction = async (data) => {
    const tx = { ...data, createdAt: new Date().toISOString() };
    if (offlineMode) {
      setTransactions(p => [...p, { id: crypto.randomUUID(), ...tx }]);
      return;
    }
    await addDoc(collection(db, 'users', user.uid, 'transactions'), tx);
  };

  const deleteTransaction = async (id) => {
    if (offlineMode) {
      setTransactions(p => p.filter(t => t.id !== id));
      return;
    }
    await deleteDoc(doc(db, 'users', user.uid, 'transactions', id));
  };

  const addHabit = async (name) => {
    const habit = { name, logs: [], createdAt: new Date().toISOString() };
    if (offlineMode) {
      setHabits(p => [...p, { id: crypto.randomUUID(), ...habit }]);
      return;
    }
    await addDoc(collection(db, 'users', user.uid, 'habits'), habit);
  };

  const toggleHabit = async (habitId, dateStr, currentLogs) => {
    const newLogs = currentLogs.includes(dateStr) 
      ? currentLogs.filter(d => d !== dateStr) 
      : [...currentLogs, dateStr];
    
    if (offlineMode) {
      setHabits(p => p.map(h => h.id === habitId ? { ...h, logs: newLogs } : h));
      return;
    }
    await setDoc(doc(db, 'users', user.uid, 'habits', habitId), { logs: newLogs }, { merge: true });
  };

  const changeMonth = (offset) => {
    setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };

  const saveProfileName = async (name) => {
    const trimmedName = name.trim();
    if (!trimmedName) throw new Error('Informe seu nome.');
    if (!offlineMode) await updateProfile(auth.currentUser, { displayName: trimmedName });
    setProfileName(trimmedName);
  };

  const startOffline = () => {
    setAuthError(null);
    setOfflineMode(true);
    setUser({ uid: 'offline-mode', email: 'Offline' });
    setLoading(false);
  };

  const handleLogout = async () => {
    if (!offlineMode && auth) await signOut(auth);
    window.location.reload();
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (authError && !offlineMode) return <ErrorScreen error={authError} onOffline={startOffline} />;
  if (!user) return <LoginScreen onOffline={startOffline} />;

  return (
    <AppContext.Provider value={{
      user, offlineMode, handleLogout, profileName, saveProfileName,
      selectedDate, changeMonth,
      transactions, addTransaction, deleteTransaction,
      habits, addHabit, toggleHabit
    }}>
      {children}
    </AppContext.Provider>
  );
};

const DashboardView = ({ onNavigate }) => {
  const { transactions, habits, selectedDate, changeMonth } = useContext(AppContext);
  const monthName = selectedDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
  const monthStr = monthName.charAt(0).toUpperCase() + monthName.slice(1);
  const filterMonth = monthKey(selectedDate);
  const monthTx = transactions.filter(t => t.date?.startsWith(filterMonth));
  const incomes = monthTx.filter(t => t.type === 'income').reduce((sum, tx) => sum + tx.amount, 0);
  const expenses = monthTx.filter(t => t.type === 'expense');
  const totalExpenses = expenses.reduce((sum, tx) => sum + tx.amount, 0);
  const balance = incomes - totalExpenses;
  const formatMoney = value => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const budget = [
    { label: 'Necessidades', rule: '50%', category: 'needs', target: 0.5, color: 'bg-red-500' },
    { label: 'Desejos', rule: '30%', category: 'wants', target: 0.3, color: 'bg-white' },
    { label: 'Futuro', rule: '20%', category: 'future', target: 0.2, color: 'bg-red-300' },
  ].map(item => ({
    ...item,
    amount: expenses.filter(tx => tx.category === item.category).reduce((sum, tx) => sum + tx.amount, 0),
  }));
  const recent = [...monthTx].sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 3);
  const completedToday = habits.filter(habit => habit.logs?.includes(dateKey())).length;
  const habitPercent = habits.length ? Math.round(completedToday / habits.length * 100) : 0;

  return (
    <div className="view-stack">
      <header className="dashboard-intro">
        <div className="brand-symbol" aria-hidden="true"><span /></div>
        <div>
          <p className="eyebrow">EQUILÍBRIO <span className="eyebrow-dot" /> VISÃO GERAL</p>
          <h1>Seu mês <span>em foco.</span></h1>
          <p className="intro-copy">Clareza para suas escolhas, todos os dias.</p>
        </div>
      </header>

      <div className="month-switcher">
        <button type="button" onClick={() => changeMonth(-1)} aria-label="Mês anterior"><ChevronLeft size={20} /></button>
        <div><CalendarDays size={16} /><span>{monthStr}</span></div>
        <button type="button" onClick={() => changeMonth(1)} aria-label="Próximo mês"><ChevronRight size={20} /></button>
      </div>

      <Card className="hero-card" delay={70}>
        <div className="hero-orbit" aria-hidden="true" />
        <div className="hero-topline"><span>01 / PAINEL FINANCEIRO</span><Sparkles size={18} /></div>
        <p className="hero-label">Saldo do mês</p>
        <h2 className="hero-amount">{formatMoney(balance)}</h2>
        <p className="hero-caption">Entradas menos saídas neste período</p>
        <div className="hero-bottomline">
          <span><Activity size={16} /> Seu panorama em tempo real</span>
          <button type="button" onClick={() => onNavigate('finances')}>Novo registro <ArrowUpRight size={16} /></button>
        </div>
      </Card>

      <div className="metric-grid">
        <Card className="metric-card metric-card--income" delay={120}>
          <div className="metric-icon"><ArrowDownRight size={20} /></div>
          <span>Entradas</span>
          <strong>{formatMoney(incomes)}</strong>
          <small>{monthTx.filter(tx => tx.type === 'income').length} registros no mês</small>
        </Card>
        <Card className="metric-card metric-card--expense" delay={170}>
          <div className="metric-icon"><ArrowUpRight size={20} /></div>
          <span>Saídas</span>
          <strong>{formatMoney(totalExpenses)}</strong>
          <small>{expenses.length} registros no mês</small>
        </Card>
      </div>

      <Card className="budget-card" delay={220}>
        <div className="section-heading">
          <div><p className="eyebrow">PLANEJAMENTO</p><h2>Regra 50 / 30 / 20</h2></div>
          <span className="section-badge">DO MÊS</span>
        </div>
        <p className="section-description">Veja como cada categoria ocupa sua receita.</p>
        <div className="budget-list">
          {budget.map(item => {
            const revenueShare = incomes ? Math.round(item.amount / incomes * 100) : null;
            const targetUse = incomes ? item.amount / (incomes * item.target) * 100 : 0;
            return (
              <div className="budget-row" key={item.category}>
                <div className="budget-row-top">
                  <div><span className={`budget-dot budget-dot--${item.category}`} /><span>{item.label}</span><small>{item.rule}</small></div>
                  <strong>{formatMoney(item.amount)}</strong>
                </div>
                <ProgressBar progress={targetUse} color={item.color} />
                <p>{revenueShare === null ? 'Adicione uma entrada para calcular' : `${revenueShare}% da receita utilizada`}</p>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="dashboard-grid">
        <Card className="activity-card" delay={270}>
          <div className="section-heading">
            <div><p className="eyebrow">MOVIMENTO</p><h2>Últimos registros</h2></div>
            <ReceiptText size={20} />
          </div>
          {recent.length ? (
            <div className="recent-list">
              {recent.map(tx => (
                <div className="recent-row" key={tx.id}>
                  <span className={tx.type === 'income' ? 'recent-icon recent-icon--income' : 'recent-icon'}>{tx.type === 'income' ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}</span>
                  <div><strong>{tx.desc}</strong><small>{new Date(`${tx.date}T12:00:00`).toLocaleDateString('pt-BR')}</small></div>
                  <b>{tx.type === 'income' ? '+' : '-'}{formatMoney(tx.amount)}</b>
                </div>
              ))}
            </div>
          ) : (
            <div className="soft-empty"><ReceiptText size={24} /><p>Seus registros vão aparecer aqui.</p></div>
          )}
          <button type="button" className="text-action" onClick={() => onNavigate('finances')}>Abrir caixa <ArrowRight size={17} /></button>
        </Card>

        <Card className="habit-teaser" delay={320}>
          <div className="section-heading"><div><p className="eyebrow">CONSTÂNCIA</p><h2>Hábitos de hoje</h2></div><Zap size={20} /></div>
          <div className="habit-teaser-main">
            <div><strong>{completedToday}<span> / {habits.length}</span></strong><p>{habits.length ? 'hábitos concluídos hoje' : 'Seu próximo passo começa aqui'}</p></div>
            <div className="habit-ring" style={{ '--habit-progress': `${habitPercent}%` }}><span>{habitPercent}%</span></div>
          </div>
          <button type="button" className="text-action" onClick={() => onNavigate('evolution')}>Ver hábitos <ArrowRight size={17} /></button>
        </Card>
      </div>
    </div>
  );
};

const FinancesView = () => {
  const { addTransaction, transactions, deleteTransaction, selectedDate } = useContext(AppContext);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: 'expense', amount: '', desc: '', category: 'needs', date: dateKey() });
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);

  const filterMonth = monthKey(selectedDate);
  const monthTx = transactions.filter(t => t.date?.startsWith(filterMonth)).sort((a,b) => new Date(b.date) - new Date(a.date));
  const incomeTotal = monthTx.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0);
  const expenseTotal = monthTx.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0);
  const formatMoney = value => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const categoryLabels = { needs: 'Necessidade', wants: 'Desejo', future: 'Futuro' };

  const handleSave = async (e) => {
    e.preventDefault();
    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0 || !form.desc.trim()) {
      setSaveError('Informe uma descrição e um valor maior que zero.');
      return;
    }
    setSaveError('');
    setSaving(true);
    try {
      await addTransaction({ ...form, desc: form.desc.trim(), amount });
      setShowForm(false);
      setForm(current => ({ ...current, amount: '', desc: '' }));
    } catch (error) {
      setSaveError(error.message || 'Não foi possível salvar a transação.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="view-stack">
      <div className="page-header">
        <div><p className="eyebrow">SEU DINHEIRO, COM CLAREZA</p><h1>Caixa<span>.</span></h1><p>Todos os movimentos do seu mês, em um só lugar.</p></div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className={`round-add ${showForm ? 'round-add--open' : ''}`}
          aria-label={showForm ? 'Fechar formulário' : 'Adicionar transação'}
        >
          <Plus size={24} />
        </button>
      </div>

      <Card className="finance-summary" delay={70}>
        <div className="finance-summary-top"><span>RESUMO DO MÊS</span><Wallet size={18} /></div>
        <p>Saldo do período</p>
        <strong>{formatMoney(incomeTotal - expenseTotal)}</strong>
        <div className="finance-summary-grid">
          <div><ArrowDownRight size={17} /><span>Entradas</span><b>{formatMoney(incomeTotal)}</b></div>
          <div><ArrowUpRight size={17} /><span>Saídas</span><b>{formatMoney(expenseTotal)}</b></div>
        </div>
      </Card>

      {showForm && (
        <Card className="form-card">
          <form onSubmit={handleSave} className="space-y-4">
            <div><p className="eyebrow">NOVO MOVIMENTO</p><h2 className="form-title">Adicionar registro</h2></div>
            {saveError && <p role="alert" className="text-sm text-red-400">{saveError}</p>}
            <div className="flex gap-2 p-1 bg-black rounded-2xl mb-4">
              <button type="button" onClick={()=>setForm({...form, type:'expense'})} className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${form.type === 'expense' ? 'bg-red-600 text-white' : 'text-zinc-500'}`}>SAÍDA</button>
              <button type="button" onClick={()=>setForm({...form, type:'income'})} className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${form.type === 'income' ? 'bg-white text-black' : 'text-zinc-500'}`}>ENTRADA</button>
            </div>
            
            <NeonInput type="number" min="0.01" step="0.01" placeholder="0.00" value={form.amount} onChange={e=>setForm({...form, amount:e.target.value})} />
            <NeonInput placeholder="Descrição (ex: Mercado)" value={form.desc} onChange={e=>setForm({...form, desc:e.target.value})} />
            
            {form.type === 'expense' && (
              <select value={form.category} onChange={e=>setForm({...form, category:e.target.value})} className="w-full bg-[#0a0a0a] text-white border-2 border-zinc-800 rounded-2xl px-5 py-4 focus:outline-none focus:border-red-500 font-bold appearance-none">
                <option value="needs">Necessidade (50%)</option>
                <option value="wants">Desejo (30%)</option>
                <option value="future">Futuro (20%)</option>
              </select>
            )}
            <NeonInput type="date" value={form.date} onChange={e=>setForm({...form, date:e.target.value})} />
            
            <button type="submit" disabled={saving} className="w-full py-4 bg-white text-black font-black rounded-2xl hover:bg-zinc-200 active:scale-95 transition-all mt-4 disabled:opacity-50">
              {saving ? 'SALVANDO...' : 'SALVAR REGISTRO'}
            </button>
          </form>
        </Card>
      )}

      <div className="transaction-list">
        {monthTx.length === 0 ? (
          <Card className="empty-state" delay={130}>
            <div className="empty-state-icon"><ReceiptText size={27} /></div>
            <p className="eyebrow">SEU HISTÓRICO COMEÇA AQUI</p>
            <h2>Nenhuma transação ainda</h2>
            <p>Adicione uma entrada ou saída para ver seu mês ganhar forma.</p>
            <button type="button" onClick={() => setShowForm(true)}>Adicionar registro <ArrowRight size={17} /></button>
          </Card>
        ) : monthTx.map(tx => (
          <div key={tx.id} className="surface-card transaction-card group">
            <div className="flex items-center gap-4">
              <div className={`transaction-icon ${tx.type === 'income' ? 'transaction-icon--income' : ''}`}>
                {tx.type === 'income' ? <TrendingUp size={20} /> : <Wallet size={20} />}
              </div>
              <div>
                <p className="font-bold text-white text-lg">{tx.desc}</p>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{new Date(tx.date + 'T12:00:00').toLocaleDateString('pt-BR')} • {tx.type === 'expense' ? categoryLabels[tx.category] || 'Despesa' : 'Receita'}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <p className="font-black text-lg text-white">
                {tx.type === 'income' ? '+' : '-'}{tx.amount.toLocaleString('pt-BR', {style:'currency', currency:'BRL'})}
              </p>
              <button onClick={() => deleteTransaction(tx.id)} aria-label={`Excluir ${tx.desc}`} className="text-zinc-500 hover:text-red-400 p-2 md:opacity-0 md:group-hover:opacity-100 transition-all">
                <LogOut size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const EvolutionView = () => {
  const { habits, addHabit, toggleHabit } = useContext(AppContext);
  const [newHabit, setNewHabit] = useState('');
  const [habitError, setHabitError] = useState('');
  const [savingHabit, setSavingHabit] = useState(false);
  
  const todayStr = dateKey();
  const completedToday = habits.filter(habit => habit.logs?.includes(todayStr)).length;
  const progress = habits.length ? completedToday / habits.length * 100 : 0;

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newHabit.trim()) return;
    setSavingHabit(true);
    setHabitError('');
    try {
      await addHabit(newHabit.trim());
      setNewHabit('');
    } catch (error) {
      setHabitError(error.message || 'Não foi possível criar o hábito.');
    } finally {
      setSavingHabit(false);
    }
  };

  return (
    <div className="view-stack">
      <div className="page-header">
        <div><p className="eyebrow">PEQUENOS PASSOS, GRANDES MUDANÇAS</p><h1>Hábitos<span>.</span></h1><p>Transforme constância em progresso.</p></div>
      </div>

      <Card className="habit-summary" delay={70}>
        <div className="habit-summary-top"><div><p className="eyebrow">SEU RITMO</p><h2>Hoje é dia de continuar.</h2></div><Zap size={21} /></div>
        <div className="habit-summary-count"><strong>{completedToday}<span> / {habits.length}</span></strong><p>concluídos hoje</p></div>
        <ProgressBar progress={progress} color="bg-red-500" />
        <small>{progress === 100 && habits.length ? 'Você completou todos os hábitos de hoje.' : 'Cada marcação conta para a sua sequência.'}</small>
      </Card>

      <form onSubmit={handleAdd} className="habit-form">
        <div className="flex-1">
          <NeonInput placeholder="Nome do novo hábito..." value={newHabit} onChange={e=>setNewHabit(e.target.value)} aria-label="Nome do novo hábito" />
        </div>
        <button type="submit" disabled={savingHabit} aria-label="Adicionar hábito" className="round-add disabled:opacity-50">
          <Plus size={24} />
        </button>
      </form>
      {habitError && <p role="alert" className="text-sm text-red-400">{habitError}</p>}

      <div className="habit-list">
        {habits.length === 0 && (
          <Card className="empty-state" delay={130}>
            <div className="empty-state-icon"><Sparkles size={27} /></div>
            <p className="eyebrow">COMECE NO SEU TEMPO</p>
            <h2>Seu primeiro hábito espera por você</h2>
            <p>Escreva algo simples acima, como ler, caminhar ou beber água.</p>
          </Card>
        )}
        {habits.map(habit => {
          const isDoneToday = habit.logs.includes(todayStr);
          return (
            <button type="button"
              key={habit.id} 
              onClick={() => toggleHabit(habit.id, todayStr, habit.logs)}
              aria-pressed={isDoneToday}
              className={`habit-card ${isDoneToday ? 'habit-card--done' : ''}`}
            >
              <div>
                <h3>{habit.name}</h3>
                <p>
                  {habit.logs.length} {habit.logs.length === 1 ? 'dia concluído' : 'dias concluídos'}
                </p>
              </div>
              <div>
                {isDoneToday ? <CheckCircle2 size={28} /> : <Circle size={28} />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const ProfileView = () => {
  const { user, offlineMode, handleLogout, profileName, saveProfileName } = useContext(AppContext);
  const [name, setName] = useState(profileName);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    try {
      await saveProfileName(name);
      setSaved(true);
    } catch (error) {
      setSaveError(error.message || 'Não foi possível salvar o nome.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="view-stack">
      <div className="page-header"><div><p className="eyebrow">SEU ESPAÇO</p><h1>Perfil<span>.</span></h1><p>Personalize sua experiência no Equilíbrio.</p></div></div>
      <Card className="profile-card" delay={70}>
        <div className="profile-identity">
          <div className="profile-avatar">
            <User size={32} />
          </div>
          <div>
            <p className="eyebrow">CONTA ATIVA</p>
            <h2>{profileName || 'Seu espaço'}</h2>
            <span className="profile-status">{offlineMode ? 'Modo offline' : 'Sincronizado na nuvem'}</span>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6 profile-form">
          <NeonInput label="Seu Nome" placeholder="Como quer ser chamado?" value={name} onChange={e=>{ setName(e.target.value); setSaved(false); }} />
          <NeonInput label="E-mail" value={user?.email || 'Modo Visitante/Offline'} readOnly />
          {saveError && <p role="alert" className="text-sm text-red-400">{saveError}</p>}
          
          <div className="pt-4 space-y-3">
            <button type="submit" disabled={saving} className="w-full bg-white text-black hover:bg-zinc-200 font-black py-4 rounded-2xl transition-all active:scale-95 disabled:opacity-50">
              {saving ? 'SALVANDO...' : saved ? 'DADOS SALVOS ✓' : 'SALVAR ALTERAÇÕES'}
            </button>
            <button type="button" onClick={handleLogout} className="w-full bg-transparent border-2 border-zinc-800 text-zinc-400 hover:text-red-500 hover:border-red-900/50 font-black py-4 rounded-2xl transition-all active:scale-95">
              DESLOGAR (SAIR)
            </button>
          </div>
        </form>
      </Card>
      <Card className="profile-note" delay={130}>
        <Sparkles size={21} />
        <div><h3>{offlineMode ? 'Uma pausa para experimentar' : 'Seus dados, em sintonia'}</h3><p>{offlineMode ? 'No modo offline, seus registros ficam apenas nesta sessão e somem ao recarregar.' : `Sua conta está conectada ao projeto ${firebaseConfig.projectId}.`}</p></div>
      </Card>
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <AppProvider>
      <div className="app-shell text-white selection:bg-red-500/30">
        <main className="app-main">
          <div key={activeTab} className="view-enter">
            {activeTab === 'dashboard' && <DashboardView onNavigate={setActiveTab} />}
            {activeTab === 'finances' && <FinancesView />}
            {activeTab === 'evolution' && <EvolutionView />}
            {activeTab === 'profile' && <ProfileView />}
          </div>
        </main>

        <div className="nav-wrap">
          <nav className="nav-dock" aria-label="Navegação principal">
            {[
              { id: 'dashboard', icon: Home, label: 'Início' },
              { id: 'finances', icon: Wallet, label: 'Caixa' },
              { id: 'evolution', icon: Activity, label: 'Hábitos' },
              { id: 'profile', icon: User, label: 'Perfil' }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`nav-item ${isActive ? 'nav-item--active' : ''}`}
                  aria-label={tab.label}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon size={21} strokeWidth={isActive ? 2.5 : 2} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </AppProvider>
  );
}
