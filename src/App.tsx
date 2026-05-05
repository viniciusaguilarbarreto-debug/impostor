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
  Ghost,
  Target,
  Brain,
  Sword,
  ShieldCheck,
  Megaphone,
  UserX,
  Rocket
} from 'lucide-react';
import { CATEGORIES, WORD_BANK } from './words';

type GameVersion = 1 | 2;
type GamePhase = 'landing' | 'setup' | 'transition' | 'reveal' | 'debate' | 'vote' | 'ejection' | 'gameOver';

interface Player {
  id: number;
  role: string;
  isAlive: boolean;
}

interface GameState {
  version: GameVersion;
  playerCount: number;
  impostorCount: number;
  word: string;
  roles: string[];
  players: Player[];
  voterIndex: number; // For manual sequential voting if needed, but let's stick to a pool of votes
  playerVotes: Record<number, number | null>; // voterId -> votedTargetId
  currentPlayerIndex: number;
  phase: GamePhase;
  lastEjected?: Player;
  winner?: 'crew' | 'impostor';
}

const FloatingIcon = ({ delay = 0, x = "0%", y = "0%", icon: Icon }: any) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ 
      opacity: [0, 0.4, 0],
      scale: [0.8, 1.2, 0.8],
    }}
    transition={{ 
      duration: 12, 
      repeat: Infinity, 
      delay,
      ease: "linear"
    }}
    style={{ left: x, top: y, willChange: 'transform' }}
    className="absolute pointer-events-none text-primary/20 blur-[1px]"
  >
    <Icon size={32} />
  </motion.div>
);

export default function App() {
  const [game, setGame] = useState<GameState>({
    version: 1,
    playerCount: 3,
    impostorCount: 1,
    word: '',
    roles: [],
    players: [],
    voterIndex: 0,
    playerVotes: {},
    currentPlayerIndex: 0,
    phase: 'landing'
  });

  const [activeVoterId, setActiveVoterId] = useState<number | null>(null);

  const initGame = useCallback(() => {
    const pool = WORD_BANK;
    const randomWord = pool[Math.floor(Math.random() * pool.length)];
    
    const count = game.playerCount;
    // Determine actual impostor count for v2 (could be random)
    let actualImpostorCount = game.impostorCount;
    if (game.version === 2 && game.impostorCount === -1) {
      // Random mode: Between 1 and (playerCount-1)/2, minimum 1
      actualImpostorCount = Math.max(1, Math.floor(Math.random() * (Math.floor((count - 1) / 2))) + 1);
    } else if (game.version === 1) {
      actualImpostorCount = 1;
    }

    const indices = Array.from({ length: count }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    
    const impostorIndices = indices.slice(0, actualImpostorCount);
    const newRoles = Array(count).fill(randomWord);
    impostorIndices.forEach(idx => {
      newRoles[idx] = "IMPOSTOR";
    });

    const newPlayers: Player[] = newRoles.map((role, idx) => ({
      id: idx + 1,
      role,
      isAlive: true
    }));

    const initialVotes: Record<number, number | null> = {};
    newPlayers.forEach(p => {
      initialVotes[p.id] = null;
    });

    setGame(prev => ({
      ...prev,
      word: randomWord,
      roles: newRoles,
      players: newPlayers,
      playerVotes: initialVotes,
      voterIndex: 0,
      currentPlayerIndex: 0,
      phase: 'transition'
    }));
  }, [game.playerCount, game.impostorCount, game.version]);

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
      players: [],
      playerVotes: {},
      voterIndex: 0,
      currentPlayerIndex: 0,
      phase: 'setup',
      lastEjected: undefined,
      winner: undefined
    }));
  };

  const handleVote = (voterId: number, targetId: number) => {
    setGame(prev => ({
      ...prev,
      playerVotes: {
        ...prev.playerVotes,
        [voterId]: targetId
      }
    }));
  };

  const clearVote = (voterId: number) => {
    setGame(prev => ({
      ...prev,
      playerVotes: {
        ...prev.playerVotes,
        [voterId]: null
      }
    }));
  };

  const handleConfirmVote = () => {
    // Count votes
    const voteCounts: Record<number, number> = {};
    Object.entries(game.playerVotes).forEach(([_, targetId]) => {
      if (targetId !== null) {
        const id = Number(targetId);
        voteCounts[id] = (voteCounts[id] || 0) + 1;
      }
    });

    // Find player with most votes
    let maxVotes = 0;
    let ejectedId = -1;
    let tie = false;

    Object.entries(voteCounts).forEach(([id, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        ejectedId = parseInt(id);
        tie = false;
      } else if (count === maxVotes) {
        tie = true;
      }
    });

    if (tie || ejectedId === -1) {
      // No one ejected or tie
      setGame(prev => ({ ...prev, phase: 'debate', playerVotes: {} }));
      // Or maybe show a message "Empate, ninguém ejetado"
      return;
    }

    const player = game.players.find(p => p.id === ejectedId);
    if (!player) return;

    const updatedPlayers = game.players.map(p => 
      p.id === ejectedId ? { ...p, isAlive: false } : p
    );

    const remainingImpostors = updatedPlayers.filter(p => p.isAlive && p.role === 'IMPOSTOR').length;
    const remainingCrew = updatedPlayers.filter(p => p.isAlive && p.role !== 'IMPOSTOR').length;

    let winner: 'crew' | 'impostor' | undefined = undefined;
    if (remainingImpostors === 0) {
      winner = 'crew';
    } else if (remainingImpostors >= remainingCrew) {
      winner = 'impostor';
    }

    setGame(prev => ({
      ...prev,
      players: updatedPlayers,
      lastEjected: player,
      phase: 'ejection',
      winner,
      // Clear votes for next round
      playerVotes: Object.fromEntries(updatedPlayers.filter(p => p.isAlive).map(p => [p.id, null]))
    }));
  };

  const stageVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.15, ease: "easeIn" } }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 bg-bg relative overflow-y-auto overflow-x-hidden">
      
      {/* Background stays static to save CPU */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-40">
        <FloatingIcon x="10%" y="20%" delay={0} icon={Target} />
        <FloatingIcon x="80%" y="15%" delay={2} icon={Brain} />
        <FloatingIcon x="70%" y="80%" delay={4} icon={Skull} />
        <FloatingIcon x="15%" y="75%" delay={1} icon={Search} />
        <FloatingIcon x="50%" y="30%" delay={3} icon={VenetianMask} />
        
        <div className="absolute top-10 right-10 w-64 h-64 bg-primary/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-accent/5 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-md bg-card/95 backdrop-blur-xl rounded-[40px] p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/5 relative z-10 overflow-hidden">
        
        <AnimatePresence mode="wait" initial={false}>
          {game.phase === 'landing' && (
            <motion.div
              key="landing"
              variants={stageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex flex-col items-center text-center space-y-4 py-2 relative"
            >
              {/* Top Logo from Image */}
              <div className="flex flex-col items-center scale-90 mb-4">
                <div className="relative w-16 h-16 mb-2">
                  <div className="absolute inset-0 border-2 border-primary rounded-full" />
                  <div className="absolute inset-2 border-2 border-primary rounded-full animate-pulse" />
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-1 bg-primary" />
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 bg-primary" />
                  <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-1 h-4 bg-primary" />
                  <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-1 h-4 bg-primary" />
                  <Skull className="absolute inset-0 m-auto w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-black text-white tracking-widest">IMPOSTOR</h1>
                <p className="text-[8px] font-black tracking-[0.2em] text-white/60">
                  DESCUBRA. DESCONFIE. <span className="text-primary">SOBREVIVA.</span>
                </p>
              </div>

              <div className="flex w-full items-center justify-between gap-4 px-2">
                {/* Left Side Menu Icons from Image */}
                <div className="flex flex-col gap-8 items-center py-4">
                   {[
                     { icon: Eye, label: "OBSERVE", sub: "CADA DETALHE" },
                     { icon: Brain, label: "ANALISE", sub: "COM INTELIGÊNCIA" },
                     { icon: Sword, label: "DESCUBRA", sub: "O IMPOSTOR" }
                   ].map((item, idx) => (
                     <div key={idx} className="flex flex-col items-center gap-1">
                        <div className="w-10 h-10 rounded-full bg-card border-2 border-white/10 flex items-center justify-center relative shadow-lg">
                           <item.icon className={`w-5 h-5 ${idx === 2 ? 'text-primary' : 'text-white'}`} />
                           {idx === 2 && <div className="absolute inset-[-4px] border border-primary/40 rounded-full animate-ping" />}
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-[6px] font-black text-white leading-tight">{item.label}</span>
                          <span className="text-[5px] text-slate-500 font-bold leading-tight">{item.sub}</span>
                        </div>
                     </div>
                   ))}
                </div>

                {/* Main Mascot Area */}
                <div className="flex-1 flex justify-center relative">
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="w-56 h-72 flex items-center justify-center relative"
                  >
                    {/* The exact mascot image uploaded by user */}
                    <img 
                      src="mascot.png" 
                      alt="Detective Mascot" 
                      className="w-full h-full object-contain drop-shadow-[0_0_50px_rgba(255,0,0,0.5)] z-10"
                      onError={(e) => {
                        // Fallback to a visual placeholder if image not found
                        (e.target as any).style.display = 'none';
                        if ((e.target as any).nextSibling) {
                          (e.target as any).nextSibling.style.display = 'flex';
                        }
                      }}
                    />
                    
                    {/* Visual Floor from Image */}
                    <div className="absolute -bottom-4 w-48 h-8 bg-primary/20 blur-[20px] rounded-full" />
                  </motion.div>
                </div>
              </div>

              {/* Version Selection */}
              <div className="w-full relative z-10 pt-4 px-6 flex flex-col gap-4">
                <motion.button 
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setGame(prev => ({ ...prev, phase: 'setup', version: 1 }))}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white font-black py-5 rounded-2xl shadow-xl flex items-center justify-center gap-3 active:brightness-110 transition-all text-xl uppercase tracking-widest border-b-4 border-black/30"
                >
                  <Gamepad2 className="w-6 h-6" />
                  VERSÃO 1.0
                </motion.button>
                
                <motion.button 
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setGame(prev => ({ ...prev, phase: 'setup', version: 2 }))}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-black py-5 rounded-2xl shadow-[0_0_30px_rgba(255,0,0,0.4)] flex items-center justify-center gap-3 active:brightness-110 transition-all text-xl uppercase tracking-widest border-b-4 border-black/30"
                >
                  <Rocket className="w-6 h-6" />
                  VERSÃO 2.0
                </motion.button>
              </div>
            </motion.div>
          )}

          {game.phase === 'setup' && (
            <motion.div
              key="setup"
              variants={stageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-10 flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center border border-white/5">
                <Users className="w-8 h-8 text-primary" />
              </div>
              
              <div>
                <h1 className="text-3xl font-black tracking-tight mb-2 italic uppercase">Equipe</h1>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest opacity-60">
                  {game.version === 2 ? 'Parâmetros da Nave' : 'Selecione o contingente'}
                </p>
              </div>

              <div className="w-full space-y-4">
                <div className="bg-slate-800 p-6 rounded-[32px] border border-white/5 flex flex-col gap-4 shadow-inner">
                   <div className="flex items-center justify-between px-2">
                      <motion.button 
                        whileTap={{ scale: 0.85 }}
                        onClick={() => setGame(prev => ({ ...prev, playerCount: Math.max(3, prev.playerCount - 1) }))}
                        className="w-12 h-12 rounded-xl bg-slate-700 flex items-center justify-center text-2xl font-black text-white"
                      >
                        -
                      </motion.button>
                      <div className="flex flex-col items-center">
                        <span className="text-5xl font-black text-accent leading-none">{game.playerCount}</span>
                        <span className="text-[9px] font-black text-slate-500 mt-1 uppercase tracking-widest">Agentes</span>
                      </div>
                      <motion.button 
                        whileTap={{ scale: 0.85 }}
                        onClick={() => setGame(prev => ({ ...prev, playerCount: Math.min(20, prev.playerCount + 1) }))}
                        className="w-12 h-12 rounded-xl bg-slate-700 flex items-center justify-center text-2xl font-black text-white"
                      >
                        +
                      </motion.button>
                   </div>
                </div>

                {game.version === 2 && (
                  <div className="bg-slate-800 p-6 rounded-[32px] border border-white/5 flex flex-col gap-4 shadow-inner">
                    <div className="flex items-center justify-between px-2">
                       <motion.button 
                         whileTap={{ scale: 0.85 }}
                         onClick={() => setGame(prev => ({ 
                           ...prev, 
                           impostorCount: prev.impostorCount === -1 ? 1 : Math.max(1, prev.impostorCount - 1) 
                         }))}
                         className="w-12 h-12 rounded-xl bg-slate-700 flex items-center justify-center text-2xl font-black text-white"
                       >
                         -
                       </motion.button>
                       <div className="flex flex-col items-center">
                         <span className="text-4xl font-black text-primary leading-none">
                           {game.impostorCount === -1 ? '?' : game.impostorCount}
                         </span>
                         <span className="text-[9px] font-black text-slate-500 mt-1 uppercase tracking-widest">Impostores</span>
                       </div>
                       <motion.button 
                         whileTap={{ scale: 0.85 }}
                         onClick={() => setGame(prev => ({ 
                           ...prev, 
                           impostorCount: prev.impostorCount >= Math.floor(game.playerCount / 2) ? -1 : prev.impostorCount + 1 
                         }))}
                         className="w-12 h-12 rounded-xl bg-slate-700 flex items-center justify-center text-2xl font-black text-white"
                       >
                         +
                       </motion.button>
                    </div>
                    {game.impostorCount === -1 && (
                      <p className="text-[8px] font-black text-primary uppercase tracking-widest">Modo Aleatório Ativado</p>
                    )}
                  </div>
                )}
              </div>

              <motion.button 
                whileTap={{ scale: 0.96 }}
                onClick={initGame}
                className="w-full bg-primary hover:bg-primary/90 text-white font-black py-6 rounded-3xl shadow-xl flex items-center justify-center gap-3 transition-all text-lg uppercase tracking-widest"
              >
                DISTRIBUIR ORDENS
                <ChevronRight className="w-6 h-6 " />
              </motion.button>

              <button 
                onClick={() => setGame(prev => ({ ...prev, phase: 'landing' }))}
                className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] p-2"
              >
                Abortar
              </button>
            </motion.div>
          )}

          {game.phase === 'transition' && (
            <motion.div
              key="transition"
              variants={stageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-8 flex flex-col items-center text-center py-6"
            >
              <div className="px-5 py-2 bg-slate-800 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                Agente Identificado
              </div>
              
              <h2 className="text-7xl font-black text-white italic tracking-tighter">#{game.currentPlayerIndex + 1}</h2>
              
              <div className="p-10 bg-amber-500/10 border border-amber-500/30 rounded-[40px] space-y-4">
                <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
                <p className="text-slate-400 text-xs leading-relaxed font-bold uppercase tracking-tight">
                  Transfira o terminal para o próximo agente em segredo.
                </p>
              </div>

              <motion.button 
                whileTap={{ scale: 0.96 }}
                onClick={() => setGame(prev => ({ ...prev, phase: 'reveal' }))}
                className="w-full bg-white text-bg font-black py-6 rounded-3xl shadow-2xl flex items-center justify-center gap-3 text-lg uppercase tracking-widest"
              >
                <Eye className="w-6 h-6" />
                DESCRIPTOGRAFAR
              </motion.button>
            </motion.div>
          )}

          {game.phase === 'reveal' && (
            <motion.div
              key="reveal"
              variants={stageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-8 flex flex-col items-center text-center py-4"
            >
              <div className="px-5 py-2 bg-primary/20 border border-primary/30 rounded-full text-[10px] font-black text-primary uppercase tracking-[0.3em]">
                Status: {game.roles[game.currentPlayerIndex] === 'IMPOSTOR' ? 'AMEAÇA DETECTADA' : 'AGENTE VERIFICADO'}
              </div>

              <motion.div 
                layoutId="secret-card"
                className={`w-full py-20 px-6 rounded-[40px] border-4 border-dashed relative overflow-hidden flex flex-col items-center justify-center gap-8 ${
                  game.roles[game.currentPlayerIndex] === 'IMPOSTOR' 
                    ? 'border-primary bg-primary/10' 
                    : 'border-accent bg-accent/10'
                }`}
              >
                {game.roles[game.currentPlayerIndex] === 'IMPOSTOR' ? (
                  <>
                    <Target className="w-20 h-20 text-primary animate-pulse" />
                    <span className="text-4xl font-black text-primary tracking-tighter uppercase italic leading-tight text-center">
                      ALVO:<br/>IMPOSTOR
                    </span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-20 h-20 text-accent" />
                    <span className="text-5xl font-black text-accent tracking-tighter uppercase italic leading-none">
                      {game.roles[game.currentPlayerIndex]}
                    </span>
                  </>
                )}
              </motion.div>

              <div className="bg-slate-900 border border-white/5 p-6 rounded-3xl text-[10px] text-slate-400 font-bold leading-relaxed uppercase tracking-widest italic">
                {game.roles[game.currentPlayerIndex] === 'IMPOSTOR' 
                  ? "OBSERVAR. ANALISAR. ELIMINAR."
                  : "PROTEJA O CÓDIGO. NÃO SEJA DETECTADO."}
              </div>

              <motion.button 
                whileTap={{ scale: 0.96 }}
                onClick={handleNextPlayer}
                className="w-full bg-slate-100 text-bg font-black py-6 rounded-2xl text-lg uppercase tracking-widest shadow-xl"
              >
                ORDEM RECEBIDA
              </motion.button>
            </motion.div>
          )}

          {game.phase === 'debate' && (
            <motion.div
              key="debate"
              variants={stageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-8 flex flex-col items-center text-center py-4"
            >
              <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(255,0,0,0.2)] border border-primary/40 relative">
                <Target className="w-10 h-10 text-primary animate-pulse" />
                <div className="absolute inset-0 border-2 border-primary/20 rounded-full animate-ping" />
              </div>
              
              <div className="space-y-4">
                <h1 className="text-4xl font-black uppercase italic tracking-tighter leading-tight">INVESTIGAÇÃO<br/><span className="text-primary underline decoration-white underline-offset-8">EM CURSO</span></h1>
                
                {game.version === 2 && (
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                     Vivos: {game.players.filter(p => p.isAlive).length} | Infiltrados: {game.players.filter(p => p.isAlive && p.role === 'IMPOSTOR').length}
                   </p>
                )}
              </div>

              {game.version === 2 ? (
                <div className="w-full space-y-4">
                   <motion.button 
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setGame(prev => ({ ...prev, phase: 'vote' }))}
                    className="w-full bg-primary py-6 rounded-2xl font-black flex items-center justify-center gap-3 shadow-2xl text-lg uppercase tracking-widest border-b-4 border-black/30"
                  >
                    <Megaphone className="w-6 h-6 animate-bounce" />
                    REUNIÃO DE EMERGÊNCIA
                  </motion.button>
                   <p className="text-[9px] font-bold text-slate-400 leading-relaxed uppercase tracking-tight italic">
                    Pressione quando estiver pronto para expulsar um suspeito.
                  </p>
                </div>
              ) : (
                <div className="w-full space-y-6">
                  <div className="flex flex-col gap-3 text-left">
                    {[
                      "OBSERVE CADA DETALHE DO RELATO.",
                      "ANALISE COM INTELIGÊNCIA AS RESPOSTAS.",
                      "DESCONFIE DE TODOS. SOBREVIVA."
                     ].map((step, i) => (
                      <div key={i} className="flex gap-4 items-center bg-slate-900 p-5 rounded-[24px] border border-white/5">
                        <span className="bg-primary text-white w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center font-black italic">
                           {i+1}
                        </span>
                        <p className="text-slate-300 text-[10px] font-black uppercase tracking-tight leading-none">{step}</p>
                      </div>
                    ))}
                  </div>

                  <motion.button 
                    whileTap={{ scale: 0.96 }}
                    onClick={resetGame}
                    className="w-full bg-primary py-6 rounded-2xl font-black flex items-center justify-center gap-3 shadow-2xl text-lg uppercase tracking-widest"
                  >
                    <RefreshCcw className="w-6 h-6" />
                    REINICIAR BUSCA
                  </motion.button>
                </div>
              )}
            </motion.div>
          )}

          {game.phase === 'vote' && (
            <motion.div
              key="vote"
              variants={stageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-6 flex flex-col items-center text-center w-full"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                <Users className="w-8 h-8 text-primary" />
              </div>
              
              <div>
                <h2 className="text-2xl font-black italic uppercase tracking-tight">Votação</h2>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest opacity-60">
                   {activeVoterId ? `Agente ${activeVoterId}, escolha seu alvo` : "Selecione um agente para votar"}
                </p>
              </div>

              {activeVoterId ? (
                /* Target Selection Grid */
                <div className="w-full space-y-4">
                  <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {game.players.filter(p => p.isAlive).map((player) => (
                      <motion.button
                        key={player.id}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          handleVote(activeVoterId, player.id);
                          setActiveVoterId(null);
                        }}
                        className="bg-slate-800 hover:bg-slate-700 border border-white/5 p-4 rounded-2xl flex flex-col items-center gap-2 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                          <span className="font-black text-white text-sm">{player.id}</span>
                        </div>
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Alvo #{player.id}</span>
                      </motion.button>
                    ))}
                  </div>
                  <button 
                    onClick={() => setActiveVoterId(null)}
                    className="text-primary text-[10px] font-black uppercase tracking-widest p-2"
                  >
                    Voltar
                  </button>
                </div>
              ) : (
                /* Voter List Grid */
                <div className="w-full space-y-6">
                  <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {game.players.filter(p => p.isAlive).map((player) => {
                      // Count current votes FOR this player
                      const receivedVotes = Object.values(game.playerVotes).filter(vid => vid === player.id).length;
                      const hasVoted = game.playerVotes[player.id] !== null;

                      return (
                        <motion.button
                          key={player.id}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setActiveVoterId(player.id)}
                          className={`border p-4 rounded-2xl flex flex-col items-center gap-2 transition-all relative overflow-hidden ${
                            hasVoted ? 'bg-slate-900 border-accent/20 shadow-[inset_0_0_10px_rgba(0,251,255,0.1)]' : 'bg-slate-800 border-white/5'
                          }`}
                        >
                          {hasVoted && (
                             <div className="absolute top-0 right-0 p-2">
                                <ShieldCheck className="w-4 h-4 text-accent" />
                             </div>
                          )}
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black ${hasVoted ? 'bg-accent text-bg' : 'bg-slate-700 text-white'}`}>
                              {player.id}
                            </div>
                            <AnimatePresence>
                              {receivedVotes > 0 && (
                                <motion.div 
                                  initial={{ scale: 0, x: -10 }}
                                  animate={{ scale: 1, x: 0 }}
                                  exit={{ scale: 0 }}
                                  className="bg-primary text-white text-[10px] font-black px-2 py-1 rounded-lg"
                                >
                                  {receivedVotes} {receivedVotes === 1 ? 'VOTO' : 'VOTOS'}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                          <span className="text-[8px] font-black text-slate-400 mt-1 uppercase tracking-widest">
                            {hasVoted ? `Indicou: #${game.playerVotes[player.id]}` : 'Clique para votar'}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>

                  <div className="space-y-4 pt-2">
                    <motion.button 
                      whileTap={{ scale: Object.values(game.playerVotes).some(v => v === null) ? 1 : 0.96 }}
                      disabled={Object.values(game.playerVotes).some(v => v === null)}
                      onClick={handleConfirmVote}
                      className="w-full bg-primary disabled:opacity-30 disabled:grayscale py-6 rounded-2xl font-black flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(255,0,0,0.3)] text-lg uppercase tracking-widest border-b-4 border-black/30 transition-all text-white"
                    >
                      <Rocket className="w-6 h-6" />
                      CONFIRMAR EXPULSÃO
                    </motion.button>
                    
                    <button 
                      onClick={() => setGame(prev => ({ ...prev, phase: 'debate' }))}
                      className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] p-2 hover:text-white transition-colors"
                    >
                      Cancelar e Voltar
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {game.phase === 'ejection' && (
            <motion.div
              key="ejection"
              variants={stageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex flex-col items-center text-center space-y-12 py-10"
            >
              <div className="relative w-full h-[150px] flex items-center justify-center overflow-hidden">
                <motion.div
                  initial={{ x: -200, rotate: -20 }}
                  animate={{ x: 500, rotate: 360 }}
                  transition={{ duration: 3, ease: "linear" }}
                  className="absolute"
                >
                  <div className="flex flex-col items-center gap-2">
                     <Ghost className={`w-16 h-16 ${game.lastEjected?.role === 'IMPOSTOR' ? 'text-primary' : 'text-accent'}`} />
                     <span className="text-[8px] font-black text-white uppercase tracking-[0.4em] whitespace-nowrap">Agente #{game.lastEjected?.id}</span>
                  </div>
                </motion.div>
                
                {/* Stars/Space effect */}
                <div className="absolute inset-0 z-[-1]">
                   {[...Array(20)].map((_, i) => (
                     <div 
                      key={i} 
                      className="absolute w-1 h-1 bg-white rounded-full opacity-30 animate-pulse" 
                      style={{ 
                        left: `${Math.random() * 100}%`, 
                        top: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 2}s`
                      }} 
                     />
                   ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-3xl font-black italic uppercase tracking-tighter">
                    Agente #{game.lastEjected?.id} foi ejetado.
                  </h2>
                  <p className={`text-lg font-black uppercase tracking-widest ${game.lastEjected?.role === 'IMPOSTOR' ? 'text-primary' : 'text-accent'}`}>
                    Ele {game.lastEjected?.role === 'IMPOSTOR' ? 'era o Impostor.' : 'não era o Impostor.'}
                  </p>
                </div>
                
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                  Restam {game.players.filter(p => p.isAlive && p.role === 'IMPOSTOR').length} impostores.
                </p>

                <motion.button 
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    if (game.winner) {
                      setGame(prev => ({ ...prev, phase: 'gameOver' }));
                    } else {
                      setGame(prev => ({ ...prev, phase: 'debate' }));
                    }
                  }}
                  className="w-full bg-white text-bg font-black py-5 rounded-2xl text-lg uppercase tracking-widest transition-all hover:bg-slate-200"
                >
                  Continuar Missão
                </motion.button>
              </div>
            </motion.div>
          )}

          {game.phase === 'gameOver' && (
            <motion.div
              key="gameOver"
              variants={stageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex flex-col items-center text-center space-y-12 py-8"
            >
              <div className={`w-24 h-24 rounded-[32px] flex items-center justify-center shadow-2xl relative ${game.winner === 'crew' ? 'bg-accent' : 'bg-primary'}`}>
                {game.winner === 'crew' ? <Trophy className="w-12 h-12 text-white" /> : <Skull className="w-12 h-12 text-white" />}
              </div>

              <div className="space-y-4">
                <h1 className={`text-6xl font-black italic tracking-tighter uppercase leading-none ${game.winner === 'crew' ? 'text-accent' : 'text-primary'}`}>
                  Vitória da<br/>{game.winner === 'crew' ? 'Tripulação' : 'Invasão'}
                </h1>
                <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">
                  {game.winner === 'crew' ? 'Todos os impostores foram eliminados.' : 'Os impostores tomaram o controle da nave.'}
                </p>
              </div>

              <div className="w-full pt-4">
                <motion.button 
                  whileTap={{ scale: 0.96 }}
                  onClick={resetGame}
                  className="w-full bg-primary/20 border-2 border-primary text-primary font-black py-6 rounded-2xl text-xl uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-lg"
                >
                  Reiniciar Terminal
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Footer / Credits - Moved into flow for better responsiveness */}
      <div className="mt-8 mb-4 flex flex-col items-center gap-2 opacity-40 select-none z-20 pointer-events-none">
         <div className="flex items-center gap-4">
           <div className="w-12 h-[1px] bg-slate-600" />
           <span className="text-[9px] uppercase tracking-[0.4em] font-black text-slate-500 whitespace-nowrap">
             Developed by Marcus_vab
           </span>
           <div className="w-12 h-[1px] bg-slate-600" />
         </div>
         <span className="text-[8px] font-black text-slate-600 tracking-[0.2em] uppercase">
           Secure Terminal v2.5.9
         </span>
      </div>
    </div>
  );
}
