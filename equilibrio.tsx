import React, { useState, useEffect, createContext, useContext } from 'react';
import { 
  Home, Wallet, TrendingUp, User, Plus, 
  ChevronLeft, ChevronRight, LogOut, CheckCircle2, 
  Circle, Activity, Target, Zap, AlertTriangle
} from 'lucide-react';
import { initializeApp } from "firebase/app";
import { 
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, signInAnonymously, signOut,
  GoogleAuthProvider, signInWithPopup
} from "firebase/auth";
import { 
  getFirestore, collection, doc, setDoc, 
  onSnapshot, addDoc, deleteDoc, query, orderBy 
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

const Card = ({ children, className = '', delay = 0, onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-[#121212] rounded-[32px] p-6 transition-all duration-300 ${onClick ? 'cursor-pointer hover:bg-[#1a1a1a] active:scale-[0.98]' : ''} animate-in fade-in slide-in-from-bottom-4 fill-mode-both ${className}`}
    style={{ animationDelay: `${delay}ms` }}
  >
    {children}
  </div>
);

const ProgressBar = ({ progress, color = 'bg-red-500' }) => (
  <div className="h-3 w-full bg-[#2a2a2a] rounded-full overflow-hidden">
    <div 
      className={`h-full ${color} transition-all duration-1000 ease-out`} 
      style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} 
    />
  </div>
);

const NeonInput = ({ label, type = "text", value, onChange, placeholder }) => (
  <div className="flex flex-col gap-2">
    {label && <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider">{label}</label>}
    <input 
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full bg-[#0a0a0a] text-white border-2 border-zinc-800 rounded-2xl px-5 py-4 focus:outline-none focus:border-red-500/80 focus:shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all placeholder:text-zinc-700 font-medium"
    />
  </div>
);

const ErrorScreen = ({ error, onOffline }) => {
  const isConfigError = error && error.includes('auth/configuration-not-found');

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6" style={{fontFamily: 'Nunito, sans-serif'}}>
      <div className="bg-[#121212] rounded-[32px] p-8 max-w-md w-full shadow-[0_0_40px_rgba(239,68,68,0.15)] text-center animate-in zoom-in-95">
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
      if (err.code === 'auth/configuration-not-found' || err.code === 'auth/operation-not-supported-in-this-environment') {
        setError("Autenticação via Google desativada no console do Firebase.");
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError("O pop-up de login foi fechado.");
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
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden" style={{fontFamily: 'Nunito, sans-serif'}}>
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-600/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-8">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-red-600 rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(220,38,38,0.4)]">
            <Zap size={32} className="text-white" />
          </div>
          <h1 className="text-4xl font-black tracking-tight mb-2">Equilíbrio</h1>
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-sm">Administre sua vida</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#121212] p-8 rounded-[32px] space-y-6">
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
  const [loading, setLoading] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);
  const [authError, setAuthError] = useState(firebaseInitError);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // App Data
  const [transactions, setTransactions] = useState([]);
  const [habits, setHabits] = useState([]);

  // Setup Auth
  useEffect(() => {
    if (offlineMode || authError) {
      setLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
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
      setTransactions(p => [...p, { id: Date.now().toString(), ...tx }]);
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
      setHabits(p => [...p, { id: Date.now().toString(), ...habit }]);
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
    setSelectedDate(prev => {
      const nd = new Date(prev);
      nd.setMonth(prev.getMonth() + offset);
      return nd;
    });
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
      user, offlineMode, handleLogout,
      selectedDate, changeMonth,
      transactions, addTransaction, deleteTransaction,
      habits, addHabit, toggleHabit
    }}>
      {children}
    </AppContext.Provider>
  );
};

const DashboardView = () => {
  const { transactions, habits, selectedDate, changeMonth } = useContext(AppContext);
  const monthStr = selectedDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
  const filterMonth = selectedDate.toISOString().slice(0, 7);

  const monthTx = transactions.filter(t => t.date.startsWith(filterMonth));
  const incomes = monthTx.filter(t => t.type === 'income').reduce((a, b) => a + b.amount, 0);
  const expenses = monthTx.filter(t => t.type === 'expense');
  const totalExpenses = expenses.reduce((a, b) => a + b.amount, 0);
  
  const balance = incomes - totalExpenses;
  
  const needs = expenses.filter(t => t.category === 'needs').reduce((a, b) => a + b.amount, 0);
  const wants = expenses.filter(t => t.category === 'wants').reduce((a, b) => a + b.amount, 0);
  const future = expenses.filter(t => t.category === 'future').reduce((a, b) => a + b.amount, 0);

  const formatMoney = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-6 pb-24">
      {/* Header / Month Selector */}
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => changeMonth(-1)} className="p-3 bg-[#121212] rounded-2xl hover:bg-zinc-800 active:scale-95 transition-all"><ChevronLeft size={24} /></button>
        <h2 className="text-xl font-black uppercase tracking-widest text-white capitalize">{monthStr}</h2>
        <button onClick={() => changeMonth(1)} className="p-3 bg-[#121212] rounded-2xl hover:bg-zinc-800 active:scale-95 transition-all"><ChevronRight size={24} /></button>
      </div>

      {/* Main Balance Block */}
      <Card delay={100} className="relative overflow-hidden bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-zinc-800">
        <div className="relative z-10">
          <p className="text-sm font-bold text-zinc-500 tracking-[0.2em] mb-2 uppercase">Saldo Atual</p>
          <h1 className="text-5xl font-black text-white tracking-tight mb-6">{formatMoney(balance)}</h1>
          <div className="flex gap-4">
            <div className="bg-green-500/10 px-4 py-2 rounded-xl border border-green-500/20">
              <span className="text-xs font-bold text-green-500 uppercase tracking-wider block mb-1">Entradas</span>
              <span className="text-sm font-black text-white">{formatMoney(incomes)}</span>
            </div>
            <div className="bg-red-500/10 px-4 py-2 rounded-xl border border-red-500/20">
              <span className="text-xs font-bold text-red-500 uppercase tracking-wider block mb-1">Saídas</span>
              <span className="text-sm font-black text-white">{formatMoney(totalExpenses)}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* 50/30/20 Rule Blocks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card delay={200}>
          <div className="flex justify-between items-end mb-4">
            <div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Necessidades (50%)</p>
              <p className="text-2xl font-black text-white">{formatMoney(needs)}</p>
            </div>
            <div className="text-xs font-black text-zinc-600 bg-zinc-900 px-2 py-1 rounded-lg">
              {incomes > 0 ? Math.round((needs/incomes)*100) : 0}%
            </div>
          </div>
          <ProgressBar progress={incomes > 0 ? (needs/(incomes*0.5))*100 : 0} color="bg-blue-500" />
        </Card>

        <Card delay={300}>
          <div className="flex justify-between items-end mb-4">
            <div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Desejos (30%)</p>
              <p className="text-2xl font-black text-white">{formatMoney(wants)}</p>
            </div>
            <div className="text-xs font-black text-zinc-600 bg-zinc-900 px-2 py-1 rounded-lg">
              {incomes > 0 ? Math.round((wants/incomes)*100) : 0}%
            </div>
          </div>
          <ProgressBar progress={incomes > 0 ? (wants/(incomes*0.3))*100 : 0} color="bg-yellow-500" />
        </Card>

        <Card delay={400}>
          <div className="flex justify-between items-end mb-4">
            <div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Futuro (20%)</p>
              <p className="text-2xl font-black text-white">{formatMoney(future)}</p>
            </div>
            <div className="text-xs font-black text-zinc-600 bg-zinc-900 px-2 py-1 rounded-lg">
              {incomes > 0 ? Math.round((future/incomes)*100) : 0}%
            </div>
          </div>
          <ProgressBar progress={incomes > 0 ? (future/(incomes*0.2))*100 : 0} color="bg-green-500" />
        </Card>
      </div>
    </div>
  );
};

const FinancesView = () => {
  const { addTransaction, transactions, deleteTransaction, selectedDate } = useContext(AppContext);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: 'expense', amount: '', desc: '', category: 'needs', date: new Date().toISOString().slice(0,10) });

  const filterMonth = selectedDate.toISOString().slice(0, 7);
  const monthTx = transactions.filter(t => t.date.startsWith(filterMonth)).sort((a,b) => new Date(b.date) - new Date(a.date));

  const handleSave = (e) => {
    e.preventDefault();
    if(!form.amount || !form.desc) return;
    addTransaction({ ...form, amount: parseFloat(form.amount) });
    setShowForm(false);
    setForm({ ...form, amount: '', desc: '' });
  };

  return (
    <div className="space-y-6 pb-24 relative min-h-[80vh]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-black tracking-tight">Transações</h2>
        <button 
          onClick={() => setShowForm(!showForm)}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg ${showForm ? 'bg-zinc-800 text-white rotate-45' : 'bg-red-600 text-white hover:bg-red-500 shadow-red-600/30 active:scale-95'}`}
        >
          <Plus size={24} />
        </button>
      </div>

      {showForm && (
        <Card className="border border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.1)] mb-8">
          <form onSubmit={handleSave} className="space-y-4">
            <div className="flex gap-2 p-1 bg-black rounded-2xl mb-4">
              <button type="button" onClick={()=>setForm({...form, type:'expense'})} className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${form.type === 'expense' ? 'bg-red-600 text-white' : 'text-zinc-500'}`}>SAÍDA</button>
              <button type="button" onClick={()=>setForm({...form, type:'income'})} className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${form.type === 'income' ? 'bg-green-600 text-white' : 'text-zinc-500'}`}>ENTRADA</button>
            </div>
            
            <NeonInput type="number" placeholder="0.00" value={form.amount} onChange={e=>setForm({...form, amount:e.target.value})} />
            <NeonInput placeholder="Descrição (ex: Mercado)" value={form.desc} onChange={e=>setForm({...form, desc:e.target.value})} />
            
            {form.type === 'expense' && (
              <select value={form.category} onChange={e=>setForm({...form, category:e.target.value})} className="w-full bg-[#0a0a0a] text-white border-2 border-zinc-800 rounded-2xl px-5 py-4 focus:outline-none focus:border-red-500 font-bold appearance-none">
                <option value="needs">Necessidade (50%)</option>
                <option value="wants">Desejo (30%)</option>
                <option value="future">Futuro (20%)</option>
              </select>
            )}
            <NeonInput type="date" value={form.date} onChange={e=>setForm({...form, date:e.target.value})} />
            
            <button type="submit" className="w-full py-4 bg-white text-black font-black rounded-2xl hover:bg-zinc-200 active:scale-95 transition-all mt-4">
              SALVAR REGISTRO
            </button>
          </form>
        </Card>
      )}

      <div className="space-y-3">
        {monthTx.length === 0 ? (
          <div className="text-center py-12 text-zinc-600 font-bold uppercase tracking-widest text-sm">Nenhuma transação neste mês</div>
        ) : monthTx.map(tx => (
          <div key={tx.id} className="bg-[#121212] p-5 rounded-[24px] flex justify-between items-center group">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${tx.type === 'income' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                {tx.type === 'income' ? <TrendingUp size={20} /> : <Wallet size={20} />}
              </div>
              <div>
                <p className="font-bold text-white text-lg">{tx.desc}</p>
                <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest">{new Date(tx.date + 'T12:00:00').toLocaleDateString('pt-BR')} • {tx.type === 'expense' ? tx.category : 'Receita'}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <p className={`font-black text-lg ${tx.type === 'income' ? 'text-green-500' : 'text-white'}`}>
                {tx.type === 'income' ? '+' : '-'}{tx.amount.toLocaleString('pt-BR', {style:'currency', currency:'BRL'})}
              </p>
              <button onClick={() => deleteTransaction(tx.id)} className="text-zinc-700 hover:text-red-500 p-2 md:opacity-0 md:group-hover:opacity-100 transition-all">
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
  const { habits, addHabit, toggleHabit, selectedDate } = useContext(AppContext);
  const [newHabit, setNewHabit] = useState('');
  
  const todayStr = new Date().toISOString().slice(0, 10);

  const handleAdd = (e) => {
    e.preventDefault();
    if(newHabit.trim()) { addHabit(newHabit); setNewHabit(''); }
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="mb-8">
        <h2 className="text-3xl font-black tracking-tight mb-2">Hábitos</h2>
        <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Sua disciplina diária</p>
      </div>

      <form onSubmit={handleAdd} className="flex gap-2">
        <div className="flex-1">
          <NeonInput placeholder="Novo hábito..." value={newHabit} onChange={e=>setNewHabit(e.target.value)} />
        </div>
        <button type="submit" className="bg-red-600 text-white w-14 rounded-2xl flex items-center justify-center hover:bg-red-500 active:scale-95 transition-all">
          <Plus size={24} />
        </button>
      </form>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
        {habits.map(habit => {
          const isDoneToday = habit.logs.includes(todayStr);
          return (
            <div 
              key={habit.id} 
              onClick={() => toggleHabit(habit.id, todayStr, habit.logs)}
              className={`p-6 rounded-[32px] border-2 cursor-pointer transition-all duration-300 active:scale-95 flex items-center justify-between ${
                isDoneToday 
                  ? 'bg-red-600 border-red-500 shadow-[0_0_30px_rgba(220,38,38,0.3)]' 
                  : 'bg-[#121212] border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div>
                <h3 className={`font-black text-xl mb-1 ${isDoneToday ? 'text-white' : 'text-zinc-300'}`}>{habit.name}</h3>
                <p className={`text-xs font-bold uppercase tracking-widest ${isDoneToday ? 'text-red-200' : 'text-zinc-600'}`}>
                  {habit.logs.length} dias concluídos
                </p>
              </div>
              <div>
                {isDoneToday ? <CheckCircle2 size={32} className="text-white" /> : <Circle size={32} className="text-zinc-700" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ProfileView = () => {
  const { user, offlineMode, handleLogout } = useContext(AppContext);
  const [name, setName] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 pb-24">
      <Card>
        <div className="flex items-center gap-6 mb-8">
          <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-800 relative">
            <User size={32} className="text-zinc-500" />
            {offlineMode && <div className="absolute -bottom-2 -right-2 bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-wider">OFFLINE</div>}
          </div>
          <div>
            <h2 className="text-3xl font-black text-white">Meu Perfil</h2>
            <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest mt-1">
              ID: {user?.uid?.slice(0, 8)}
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <NeonInput label="Seu Nome" placeholder="Como quer ser chamado?" value={name} onChange={e=>setName(e.target.value)} />
          <NeonInput label="E-mail" value={user?.email || 'Modo Visitante/Offline'} onChange={()=>{}} />
          
          <div className="pt-4 space-y-3">
            <button type="submit" className="w-full bg-white text-black hover:bg-zinc-200 font-black py-4 rounded-2xl transition-all active:scale-95">
              {saved ? 'DADOS SALVOS ✓' : 'SALVAR ALTERAÇÕES'}
            </button>
            <button type="button" onClick={handleLogout} className="w-full bg-transparent border-2 border-zinc-800 text-zinc-400 hover:text-red-500 hover:border-red-900/50 font-black py-4 rounded-2xl transition-all active:scale-95">
              DESLOGAR (SAIR)
            </button>
          </div>
        </form>
      </Card>
      
      {!offlineMode && (
        <p className="text-center text-xs font-bold text-zinc-600 uppercase tracking-widest">
          Sincronizado na Nuvem • {firebaseConfig.projectId}
        </p>
      )}
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <AppProvider>
      <div className="min-h-screen bg-[#050505] text-white selection:bg-red-500/30 font-sans" style={{fontFamily: 'Nunito, sans-serif'}}>
        {/* Main Content Area */}
        <main className="max-w-2xl mx-auto p-6 pt-12">
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'finances' && <FinancesView />}
          {activeTab === 'evolution' && <EvolutionView />}
          {activeTab === 'profile' && <ProfileView />}
        </main>

        {/* Floating Bottom Navigation (Bento Style) */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-[calc(100%-3rem)] md:max-w-md z-50">
          <nav className="bg-[#121212]/90 backdrop-blur-xl border border-zinc-800/50 p-2 rounded-full flex justify-between items-center shadow-[0_20px_40px_rgba(0,0,0,0.8)]">
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
                  className={`relative flex items-center justify-center w-14 h-14 rounded-full transition-all duration-300 ${isActive ? 'bg-white text-black scale-100' : 'text-zinc-500 hover:text-white hover:bg-zinc-800/50 scale-95'}`}
                  aria-label={tab.label}
                >
                  <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </AppProvider>
  );
}
