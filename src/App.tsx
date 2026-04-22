import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  VenetianMask, 
  RefreshCcw, 
  MessageSquare, 
  AlertTriangle, 
  ChevronRight, 
  Eye, 
  Star,
  Skull,
  Search,
  Play,
  Gamepad2,
  Info,
  Dna,
  Lock,
  Globe,
  Coffee,
  Smartphone,
  Trophy,
  Ghost
} from 'lucide-react';
import { CATEGORIES, WORD_BANK } from './words';

type GamePhase = 'landing' | 'setup' | 'transition' | 'reveal' | 'debate';

interface GameState {
  playerCount: number;
  word: string;
  roles: string[];
  currentPlayerIndex: number;
  phase: GamePhase;
}

const FloatingIcon = ({ delay = 0, x = "0%", y = "0%", icon: Icon }: any) => (
  <motion.div
    initial={{ opacity: 0, scale: 0 }}
    animate={{ 
      opacity: [0, 0.4, 0],
      scale: [0.5, 1.2, 0.5],
      x: ["-10%", "10%", "-10%"],
      y: ["-10%", "10%", "-10%"],
    }}
    transition={{ 
      duration: 8 + Math.random() * 4, 
      repeat: Infinity, 
      delay,
      ease: "easeInOut"
    }}
    style={{ left: x, top: y }}
    className="absolute pointer-events-none text-primary/40 blur-[1px]"
  >
    <Icon size={40 + Math.random() * 40} />
  </motion.div>
);

export default function App() {
  const [game, setGame] = useState<GameState>({
    playerCount: 3,
    word: '',
    roles: [],
    currentPlayerIndex: 0,
    phase: 'landing'
  });

  const initGame = useCallback(() => {
    const pool = WORD_BANK;
    const randomWord = pool[Math.floor(Math.random() * pool.length)];
    
    // Improved Randomization: Shuffle indices
    const indices = Array.from({ length: game.playerCount }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    
    const impostorIndex = indices[0];
    const newRoles = Array(game.playerCount).fill(randomWord);
    newRoles[impostorIndex] = "IMPOSTOR";

    setGame(prev => ({
      ...prev,
      word: randomWord,
      roles: newRoles,
      currentPlayerIndex: 0,
      phase: 'transition'
    }));
  }, [game.playerCount]);

  const handleNextPlayer = () => {
    if (game.currentPlayerIndex < game.playerCount - 1) {
      setGame(prev => ({
        ...prev,
        currentPlayerIndex: prev.currentPlayerIndex + 1,
        phase: 'transition'
      }));
    } else {
      setGame(prev => ({ ...prev, phase: 'debate' }));
    }
  };

  const resetGame = () => {
    setGame(prev => ({
      ...prev,
      word: '',
      roles: [],
      currentPlayerIndex: 0,
      phase: 'setup'
    }));
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 sm:p-8 bg-bg overflow-hidden touch-none relative">
      
      {/* Interactive Background with Floating Icons */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <FloatingIcon x="10%" y="20%" delay={0} icon={Search} />
        <FloatingIcon x="80%" y="15%" delay={2} icon={VenetianMask} />
        <FloatingIcon x="70%" y="80%" delay={4} icon={Skull} />
        <FloatingIcon x="15%" y="75%" delay={1} icon={Lock} />
        <FloatingIcon x="50%" y="10%" delay={3} icon={Globe} />
        <FloatingIcon x="40%" y="90%" delay={5} icon={Ghost} />
        
        <div className="absolute top-10 right-10 w-64 h-64 bg-primary/20 rounded-full blur-glow" />
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-accent/20 rounded-full blur-glow" style={{ animationDelay: '2s' }} />
      </div>

      <div className="w-full max-w-md bg-card/85 backdrop-blur-2xl rounded-[40px] p-8 shadow-2xl border border-white/10 relative z-10 overflow-hidden">
        
        <AnimatePresence mode="wait">
          {game.phase === 'landing' && (
            <motion.div
              key="landing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center text-center space-y-12 py-6"
            >
              <div className="relative">
                <motion.div
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  className="w-24 h-24 bg-gradient-to-tr from-primary to-accent rounded-[32px] flex items-center justify-center shadow-2xl shadow-primary/50 relative z-10"
                >
                  <VenetianMask className="w-12 h-12 text-white" />
                </motion.div>
                <div className="absolute -top-3 -right-3 w-10 h-10 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg border-2 border-card animate-bounce">
                  <Search className="w-5 h-5 text-white" />
                </div>
              </div>

              <div className="space-y-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <h2 className="text-accent font-black tracking-[0.4em] uppercase text-[10px] mb-2">The Hidden Agent Game</h2>
                  <h1 className="text-5xl font-black text-white tracking-tighter leading-none">
                    Quem é o<br/>
                    <span className="text-primary italic">Impostor?</span>
                  </h1>
                </motion.div>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-slate-400 text-sm max-w-[240px] mx-auto font-semibold leading-relaxed"
                >
                  Reúna seus amigos, identifique o infiltrado e proteja a base.
                </motion.p>
              </div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="w-full flex flex-col gap-6"
              >
                <button 
                  onClick={() => setGame(prev => ({ ...prev, phase: 'setup' }))}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-black py-6 rounded-3xl shadow-2xl shadow-primary/40 flex items-center justify-center gap-3 group transition-all active:scale-95 text-lg"
                >
                  <Play className="w-6 h-6 fill-white" />
                  INICIAR MISSÃO
                </button>
              </motion.div>
            </motion.div>
          )}

          {game.phase === 'setup' && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8 flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 bg-slate-800/50 rounded-2xl flex items-center justify-center border border-white/5">
                <Dna className="w-8 h-8 text-primary" />
              </div>
              
              <div>
                <h1 className="text-3xl font-black tracking-tight mb-2 italic uppercase">Configurações</h1>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest opacity-60">Parâmetros de Missão</p>
              </div>

              <div className="w-full space-y-4">
                {/* Player Count */}
                <div className="bg-slate-800 p-8 rounded-[32px] border border-white/10 flex flex-col gap-6 shadow-inner">
                   <div className="flex items-center gap-3 text-slate-500 text-[12px] font-black uppercase tracking-[0.2em] pl-1 justify-center">
                      <Users size={16} className="text-primary" /> Equipe de Agentes
                   </div>
                   <div className="flex items-center justify-between px-2">
                      <button 
                        onClick={() => setGame(prev => ({ ...prev, playerCount: Math.max(3, prev.playerCount - 1) }))}
                        className="w-14 h-14 rounded-2xl bg-slate-700 flex items-center justify-center hover:bg-slate-600 active:scale-90 transition-all text-3xl font-black text-white shadow-lg shadow-black/20"
                      >
                        -
                      </button>
                      <div className="flex flex-col items-center">
                        <span className="text-6xl font-black text-accent leading-none drop-shadow-[0_0_15px_rgba(56,189,248,0.3)]">{game.playerCount}</span>
                        <span className="text-[10px] font-black text-slate-500 mt-2 uppercase tracking-widest">Agentes</span>
                      </div>
                      <button 
                        onClick={() => setGame(prev => ({ ...prev, playerCount: Math.min(20, prev.playerCount + 1) }))}
                        className="w-14 h-14 rounded-2xl bg-slate-700 flex items-center justify-center hover:bg-slate-600 active:scale-90 transition-all text-3xl font-black text-white shadow-lg shadow-black/20"
                      >
                        +
                      </button>
                   </div>
                </div>
              </div>

              <button 
                onClick={initGame}
                className="w-full bg-primary hover:bg-primary/90 text-white font-black py-6 rounded-3xl shadow-xl shadow-primary/30 flex items-center justify-center gap-3 transition-all active:scale-95 text-lg"
              >
                DISTRIBUIR ORDENS
                <ChevronRight className="w-6 h-6" />
              </button>

              <button 
                onClick={() => setGame(prev => ({ ...prev, phase: 'landing' }))}
                className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] hover:text-slate-400 transition-colors"
              >
                Abortar Operação
              </button>
            </motion.div>
          )}

          {game.phase === 'transition' && (
            <motion.div
              key="transition"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              className="space-y-8 flex flex-col items-center text-center py-6"
            >
              <div className="px-5 py-2 bg-slate-800 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                Canal Crítico: Agente
              </div>
              
              <h2 className="text-7xl font-black text-white italic tracking-tighter">#{game.currentPlayerIndex + 1}</h2>
              
              <motion.div 
                animate={{ scale: [1, 1.03, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="p-10 bg-amber-500/10 border border-amber-500/30 rounded-[40px] space-y-4 shadow-2xl"
              >
                <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
                <div>
                  <h3 className="text-amber-500 font-black uppercase text-xs tracking-widest mb-3">Protocolo de Privacidade</h3>
                  <p className="text-slate-400 text-xs leading-relaxed font-bold uppercase tracking-tight">
                    Transfira o terminal para o próximo agente em silêncio.
                  </p>
                </div>
              </motion.div>

              <button 
                onClick={() => setGame(prev => ({ ...prev, phase: 'reveal' }))}
                className="w-full bg-white text-bg font-black py-6 rounded-3xl shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all text-lg uppercase"
              >
                <Eye className="w-6 h-6" />
                Descriptografar
              </button>
            </motion.div>
          )}

          {game.phase === 'reveal' && (
            <motion.div
              key="reveal"
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -40 }}
              className="space-y-10 flex flex-col items-center text-center py-4"
            >
              <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Seu Código Operacional</h2>

              <motion.div 
                layoutId="secret-card"
                className={`w-full py-20 px-6 rounded-[40px] border-4 border-dashed relative overflow-hidden flex flex-col items-center justify-center gap-8 shadow-2xl ${
                  game.roles[game.currentPlayerIndex] === 'IMPOSTOR' 
                    ? 'border-danger bg-danger/10 shadow-danger/20' 
                    : 'border-primary bg-primary/10 shadow-primary/20'
                }`}
              >
                <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
                
                {game.roles[game.currentPlayerIndex] === 'IMPOSTOR' ? (
                  <>
                    <motion.div
                      animate={{ scale: [1, 1.25, 1], rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 0.4, repeat: Infinity }}
                    >
                      <Skull className="w-20 h-20 text-danger" />
                    </motion.div>
                    <span className="text-4xl font-black text-danger tracking-tighter uppercase italic leading-none text-center">
                      ALVO IDENTIFICADO:<br/>VOCÊ É O IMPOSTOR
                    </span>
                  </>
                ) : (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    >
                      <Star className="w-20 h-20 text-accent fill-accent" />
                    </motion.div>
                    <span className="text-6xl font-black text-accent tracking-tighter uppercase italic leading-none">
                      {game.roles[game.currentPlayerIndex]}
                    </span>
                  </>
                )}
              </motion.div>

              <div className="bg-slate-900/50 p-6 rounded-2xl text-[10px] text-slate-400 font-black leading-relaxed border border-white/5 uppercase tracking-wider">
                {game.roles[game.currentPlayerIndex] === 'IMPOSTOR' 
                  ? "❌ VOCÊ NÃO TEM O CÓDIGO. ESCUTE OS OUTROS AGENTES, MAPEIE O TEMA E INFILTRE-SE SEM SER DETECTADO."
                  : "✅ VOCÊ TEM O CÓDIGO. EMITA UM SINAL DISCRETO. SEJA VAGO O SUFICIENTE PARA O IMPOSTOR NÃO DESCOBRIR O TEMA."}
              </div>

              <button 
                onClick={handleNextPlayer}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-black py-6 rounded-3xl active:scale-95 transition-all border border-white/10 text-lg uppercase shadow-xl"
              >
                CONFIRMAR LEITURA
              </button>
            </motion.div>
          )}

          {game.phase === 'debate' && (
            <motion.div
              key="debate"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-12 flex flex-col items-center text-center py-4"
            >
              <div className="w-20 h-20 bg-accent/20 rounded-full flex items-center justify-center animate-pulse shadow-2xl shadow-accent/20">
                <MessageSquare className="w-10 h-10 text-accent fill-accent" />
              </div>
              
              <div className="space-y-8">
                <h1 className="text-5xl font-black uppercase italic tracking-tighter leading-none">INTERROGATÓRIO<br/><span className="text-accent underline decoration-primary underline-offset-8">ATIVADO</span></h1>
                
                <div className="flex flex-col gap-3 text-left">
                  {[
                    "CADA AGENTE PROFERE UMA ÚNICA PALAVRA DE SINAL.",
                    "DISCUTAM COMPORTAMENTOS SUSPEITOS E ANOMALIAS.",
                    "IDENTIFIQUEM O IMPOSTOR E ELIMINEM A AMEAÇA!"
                  ].map((step, i) => (
                    <div key={i} className="flex gap-6 items-center bg-slate-800/60 backdrop-blur-md p-5 rounded-[24px] border border-white/5 shadow-inner">
                      <span className="bg-primary text-white w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center font-black italic shadow-xl shadow-primary/30 text-lg">
                         {i+1}
                      </span>
                      <p className="text-slate-300 text-[10px] font-black leading-tight uppercase tracking-widest">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="w-full pt-4 flex flex-col gap-4">
                <button 
                  onClick={resetGame}
                  className="w-full bg-primary py-6 rounded-[32px] font-black flex items-center justify-center gap-3 active:scale-95 transition-all shadow-2xl shadow-primary/30 text-lg uppercase tracking-widest"
                >
                  <RefreshCcw className="w-6 h-6" />
                  REINICIAR PROTOCOLO
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Footer / Credits */}
      <div className="fixed bottom-6 flex flex-col items-center gap-2 opacity-40 select-none z-20">
         <div className="flex items-center gap-4">
           <div className="w-16 h-[1px] bg-slate-600" />
           <span className="text-[9px] uppercase tracking-[0.4em] font-black text-slate-500 whitespace-nowrap">
             Developed by Marcus_vab
           </span>
           <div className="w-16 h-[1px] bg-slate-600" />
         </div>
         <span className="text-[8px] font-black text-slate-600 tracking-[0.2em] uppercase">
           Secure Terminal v2.5.9
         </span>
      </div>
    </div>
  );
}
