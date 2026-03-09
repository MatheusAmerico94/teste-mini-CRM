"use client";

import { Section } from "@/components/Section";
import { PhotoGallery } from "@/components/PhotoGallery";
import { useState } from "react";
import { motion } from "framer-motion";
import { Flower2, Heart, PlayCircle, Lock, Unlock, ArrowRight } from "lucide-react";

// TELA DE BLOQUEIO E MENSAGEM DO DIA DAS MULHERES
function WomensDayLockScreen({ onUnlock }: { onUnlock: () => void }) {
  const [showPassword, setShowPassword] = useState(false);
  const [guess, setGuess] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [hint, setHint] = useState("");

  const CORRECT_DATE = "18/10/2018";

  const formatDateString = (value: string) => {
    // Remove tudo que não for número
    const onlyNums = value.replace(/\D/g, "");

    // Formata como DD/MM/AAAA
    if (onlyNums.length <= 2) return onlyNums;
    if (onlyNums.length <= 4) return `${onlyNums.slice(0, 2)}/${onlyNums.slice(2)}`;
    return `${onlyNums.slice(0, 2)}/${onlyNums.slice(2, 4)}/${onlyNums.slice(4, 8)}`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatDateString(e.target.value);
    setGuess(formatted);
  };

  const handleGuess = () => {
    if (guess === CORRECT_DATE) {
      onUnlock();
      return;
    }

    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    if (newAttempts >= 3) {
      setHint(`Não consegue lembrar? Tudo bem, o dia que a nossa história começou foi: ${CORRECT_DATE}`);
    } else if (newAttempts === 1) {
      setHint("Dica: Foi no mês das crianças (Outubro)...");
    } else if (newAttempts === 2) {
      setHint("Dica: Foi no final de 2018... perto do dia 18.");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleGuess();
    }
  };

  if (!showPassword) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gradient-to-br from-[#FFFdf2] to-[#FFF9E6] text-center overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="max-w-2xl bg-white p-10 sm:p-14 rounded-3xl shadow-xl border border-sunflower/20 relative"
        >
          <Flower2 className="w-16 h-16 text-red-400 mb-6 mx-auto animate-pulse" strokeWidth={1.5} />
          <h1 className="text-3xl sm:text-5xl font-serif text-gray-800 mb-8 leading-tight">
            Feliz Dia da Mulher!
          </h1>
          <p className="text-lg text-gray-600 font-light leading-relaxed mb-6">
            Taynara, hoje é o seu dia. <br /><br />
            E eu não poderia deixar de passar aqui para agradecer pela mulher incrível, batalhadora, forte e maravilhosa que você é. Você tem uma luz única. Você é uma mãe extraordinária, uma mulher que sempre me ensinou muito. <br /><br />
            Obrigado por tudo o que você é.
          </p>

          <p className="text-gray-400 italic font-serif text-sm mt-12 mb-6">
            Mas, na verdade... eu preparei uma pequena surpresa para você.
          </p>

          <button
            onClick={() => setShowPassword(true)}
            className="mt-4 px-10 py-4 rounded-full bg-gradient-to-r from-red-400 to-rose-400 text-white hover:shadow-xl transition-all shadow-lg text-sm tracking-widest uppercase font-medium flex items-center gap-3 mx-auto"
          >
            Ver Surpresa <ArrowRight size={18} />
          </button>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-[#FFFdf2] text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white p-10 rounded-3xl shadow-lg border border-sunflower/20 flex flex-col items-center"
      >
        <Lock className="w-12 h-12 text-sunflowerBright mb-6" />
        <h2 className="text-2xl font-serif text-gray-800 mb-4">Apenas para você</h2>
        <p className="text-sm text-gray-500 mb-8">
          Para ver a surpresa, me responda uma pergunta simples:<br />
          <strong className="text-gray-700 font-medium">Qual dia, mês e ano nós começamos a namorar?</strong>
        </p>

        <div className="w-full relative mb-4">
          <input
            type="text"
            value={guess}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ex: DD/MM/AAAA"
            maxLength={10}
            className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-gray-200 text-center text-lg focus:outline-none focus:border-sunflower focus:ring-2 focus:ring-sunflower/20 transition-all font-mono tracking-widest text-gray-700"
          />
        </div>

        {hint && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-sm mb-6 max-w-xs ${attempts >= 3 ? "text-sunflower font-medium" : "text-red-400"}`}
          >
            {hint}
          </motion.p>
        )}

        <button
          onClick={handleGuess}
          className="w-full px-8 py-4 rounded-full bg-sunflower text-white hover:bg-sunflowerBright transition-all shadow-md font-medium tracking-wide uppercase flex justify-center items-center gap-2"
        >
          {guess === CORRECT_DATE ? <Unlock size={18} /> : "Tentar"}
        </button>

        {attempts >= 3 && (
          <button
            onClick={onUnlock}
            className="mt-6 text-sm text-gray-400 hover:text-gray-600 underline underline-offset-4"
          >
            Prosseguir com a data acima
          </button>
        )}
      </motion.div>
    </main>
  );
}

export default function Home() {
  const [showFinalMessage, setShowFinalMessage] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);

  // Se não tem acesso ainda, exibe a tela de Dia das Mulheres + Senha
  if (!hasAccess) {
    return <WomensDayLockScreen onUnlock={() => setHasAccess(true)} />;
  }

  // Arrays com o caminho direto para as imagens que foram trazidas
  const taynaraImages = [
    "/taynara/WhatsApp Image 2026-03-07 at 22.54.07.jpeg",
    "/taynara/WhatsApp Image 2026-03-07 at 23.01.53.jpeg",
    "/taynara/WhatsApp Image 2026-03-07 at 23.04.21 (1).jpeg",
    "/taynara/WhatsApp Image 2026-03-07 at 23.04.21 (2).jpeg",
    "/taynara/WhatsApp Image 2026-03-07 at 23.04.21 (3).jpeg",
    "/taynara/WhatsApp Image 2026-03-07 at 23.04.21 (4).jpeg",
    "/taynara/WhatsApp Image 2026-03-07 at 23.04.21.jpeg"
  ];
  const matheusTaynaraImages = [
    "/matheus e taynara/WhatsApp Image 2026-03-07 at 22.56.07.jpeg",
    "/matheus e taynara/WhatsApp Image 2026-03-07 at 23.07.04 (1).jpeg",
    "/matheus e taynara/WhatsApp Image 2026-03-07 at 23.07.04 (2).jpeg",
    "/matheus e taynara/WhatsApp Image 2026-03-07 at 23.07.04 (3).jpeg",
    "/matheus e taynara/WhatsApp Image 2026-03-07 at 23.07.04 (4).jpeg",
    "/matheus e taynara/WhatsApp Image 2026-03-07 at 23.07.04.jpeg",
    "/matheus e taynara/WhatsApp Image 2026-03-07 at 23.07.05 (1).jpeg",
    "/matheus e taynara/WhatsApp Image 2026-03-07 at 23.07.05 (2).jpeg",
    "/matheus e taynara/WhatsApp Image 2026-03-07 at 23.07.05 (3).jpeg",
    "/matheus e taynara/WhatsApp Image 2026-03-07 at 23.07.05.jpeg"
  ];
  const isabellaImages = [
    "/isabella/WhatsApp Image 2026-03-07 at 23.12.17.jpeg",
    "/isabella/WhatsApp Image 2026-03-07 at 23.12.18 (1).jpeg",
    "/isabella/WhatsApp Image 2026-03-07 at 23.12.18 (2).jpeg",
    "/isabella/WhatsApp Image 2026-03-07 at 23.12.18 (3).jpeg",
    "/isabella/WhatsApp Image 2026-03-07 at 23.12.18.jpeg"
  ];
  const familiaImages = [
    "/familia/WhatsApp Image 2026-03-07 at 22.58.05.jpeg",
    "/familia/WhatsApp Image 2026-03-07 at 22.58.45.jpeg",
    "/familia/WhatsApp Image 2026-03-07 at 22.59.07.jpeg"
  ];
  const zoeImages = [
    "/zoe/WhatsApp Image 2026-03-07 at 23.26.58 (1).jpeg",
    "/zoe/WhatsApp Image 2026-03-07 at 23.26.58 (2).jpeg",
    "/zoe/WhatsApp Image 2026-03-07 at 23.26.58 (3).jpeg",
    "/zoe/WhatsApp Image 2026-03-07 at 23.26.58 (4).jpeg",
    "/zoe/WhatsApp Image 2026-03-07 at 23.26.58 (5).jpeg",
    "/zoe/WhatsApp Image 2026-03-07 at 23.26.58 (6).jpeg",
    "/zoe/WhatsApp Image 2026-03-07 at 23.26.58.jpeg"
  ];

  return (
    <main className="flex min-h-screen flex-col items-center bg-[#FFFdf2] text-foreground overflow-hidden selection:bg-sunflowerBright selection:text-foreground pb-32">
      {/* 1. Tela inicial */}
      <section className="relative w-full h-screen flex flex-col items-center justify-center text-center px-6 border-b border-sunflower/20 bg-gradient-to-b from-[#FFFdf2] to-[#FFF9E6]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="max-w-2xl flex flex-col items-center"
        >
          <Flower2 className="w-16 h-16 text-sunflowerBright mb-6 animate-pulse" strokeWidth={1.5} />

          <h1 className="text-3xl sm:text-5xl font-serif text-gray-800 mb-8 leading-tight">
            Taynara…<br />
          </h1>
          <p className="text-xl sm:text-2xl text-gray-600 italic font-serif">
            Nossa história começou de uma forma que poucas pessoas acreditariam.
          </p>

          <p className="text-sm sm:text-base text-gray-500 mt-12 mb-12 tracking-wide font-light">
            Se você puder, leia até o final.
          </p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 1 }}
          >
            <a
              href="#historia"
              className="px-8 py-3 rounded-full bg-sunflower text-white hover:bg-sunflowerBright shadow-lg shadow-sunflower/30 transition-all duration-500 font-medium tracking-wide text-sm flex items-center gap-2"
            >
              Começar
            </a>
          </motion.div>
        </motion.div>
      </section>

      {/* 2. Como tudo começou */}
      <div id="historia" className="w-full">
        <Section className="mt-20">
          <Flower2 className="w-10 h-10 text-sunflower mb-6" strokeWidth={1.5} />
          <h2 className="text-2xl sm:text-4xl mb-8 text-yellow-800">Como tudo começou</h2>
          <div className="space-y-6 text-gray-700 text-lg leading-relaxed font-light">
            <p>A gente se conheceu através de um jogo.<br />Algo simples… algo que parecia apenas uma coincidência da vida.</p>
            <p>Eu em São José.<br />Você em Betim.</p>
            <p>Dois lugares diferentes.<br />Duas vidas diferentes.</p>
            <p className="font-medium text-yellow-700">Mas mesmo assim… alguma coisa ali começou.</p>
            <p>Eu lembro até hoje da primeira vez que tomei coragem de ir te ver.<br />Foi uma daquelas decisões que você toma sem saber exatamente o que vai acontecer.</p>
            <p>Mas eu fui.</p>
            <p>E quando eu cheguei lá…<br />eu conheci a mulher mais incrível que eu já tinha visto.</p>
            <p className="font-serif italic text-xl mt-8">"Sabe quando você sente que aquela pessoa tem algo diferente?"</p>
            <p className="text-sunflowerBright font-medium text-2xl pt-2 pb-4">Era você.</p>
            <p>Naquele momento eu ainda não imaginava tudo que a gente iria viver…<br />mas ali começou a história mais importante da minha vida.</p>
          </div>

          <PhotoGallery images={taynaraImages.slice(0, 4)} />
        </Section>
      </div>

      {/* 3. O começo não foi fácil */}
      <Section className="bg-[#FFF9E6] w-full max-w-none py-24 px-6 shadow-sm border-y border-sunflower/10">
        <div className="max-w-2xl mx-auto flex flex-col items-center">
          <h2 className="text-2xl sm:text-4xl mb-8 text-yellow-800">O começo não foi fácil</h2>
          <div className="space-y-6 text-gray-700 text-lg leading-relaxed font-light text-center">
            <p>No início a gente teve dificuldades.</p>
            <p>A distância não ajudava.<br />Algumas pessoas não acreditavam muito na gente.<br />E muitas vezes parecia que tudo conspirava para dar errado.</p>
            <p className="font-medium">Mas mesmo assim… nós insistimos.</p>
            <p>Porque quando duas pessoas realmente querem ficar juntas, elas tentam.</p>
            <p className="text-yellow-700 text-xl font-serif py-4">E a gente tentou.</p>
            <p>Vivemos momentos felizes.<br />Vivemos momentos difíceis também.</p>
            <p>Teve alegria.<br />Teve tristeza.<br />Teve brigas.<br />Teve reconciliações.</p>
            <p className="font-serif text-xl pt-4">Mas acima de tudo… teve história.</p>
            <p>E mesmo com tudo isso, a gente continuou.</p>
          </div>
          <PhotoGallery images={matheusTaynaraImages.slice(0, 4)} />
          <Placeholder element="video" label="Vídeo 1: Momentos do casal" src="/videos 1.mp4" />
        </div>
      </Section>

      {/* 4. O maior presente */}
      <Section className="py-24">
        <Flower2 className="w-12 h-12 text-sunflowerBright mb-6" strokeWidth={1.5} />
        <h2 className="text-2xl sm:text-4xl mb-8 text-yellow-800">Então veio o maior presente</h2>
        <div className="space-y-6 text-gray-700 text-lg leading-relaxed font-light">
          <p>No meio da nossa caminhada… <br />a vida nos deu um presente que mudou tudo.</p>
          <p className="font-serif text-3xl text-sunflower py-4">A Isabella.</p>
          <p>Nossa menina.<br />Um verdadeiro presente de Deus.</p>
          <p>A chegada dela mudou muita coisa na nossa vida.</p>
          <p>Mudou nossas prioridades.<br />Mudou nosso jeito de pensar.<br />Mudou o sentido de família.</p>
          <p className="font-medium pt-4">Ali a nossa história ficou ainda mais forte.</p>
          <p>Não era mais só eu e você.<br />Agora éramos nós três.</p>
        </div>
        <PhotoGallery images={isabellaImages} columns={3} />
        <Placeholder element="video" label="Vídeo 2: Você + Taynara + Isabella" src="/videos 2.mp4" />
      </Section>

      {/* 5. Memórias */}
      <Section className="bg-gradient-to-b from-[#FFFdf2] to-[#FFF9E6] w-full max-w-none py-24 px-6 border-y border-sunflower/10">
        <div className="max-w-2xl mx-auto flex flex-col items-center">
          <h2 className="text-2xl sm:text-4xl mb-8 text-yellow-800 text-center">Momentos que vivem na minha memória</h2>
          <div className="space-y-6 text-gray-700 text-lg leading-relaxed font-light text-center">
            <p>Tem momentos que ficam guardados para sempre.</p>
            <p>Um deles foi a nossa viagem para a praia.<br />Só nós três.</p>
            <p>Eu.<br />Você.<br />E a Isabella.</p>
            <p>A Zoe ainda não tinha chegado…<br />mas ali já existia uma família.</p>
            <p>Eu lembro da gente vivendo aquele momento simples…<br />mas ao mesmo tempo tão especial.</p>
            <p className="pt-6">Outro momento que ficou marcado foi quando fomos ao zoológico.</p>
            <p>A Isabella ficou encantada com tudo.<br />Cada animal era uma descoberta nova para ela.</p>
            <p className="font-serif italic text-xl pt-4 text-sunflower">E eu lembro de olhar para vocês duas naquele dia…<br />e sentir uma felicidade que é difícil até de explicar.</p>
            <p className="font-medium pt-4">Porque ali estava tudo que realmente importava para mim.</p>
          </div>
          <PhotoGallery images={familiaImages} />
        </div>
      </Section>

      {/* 6. Segundo Milagre */}
      <Section className="py-24">
        <Flower2 className="w-12 h-12 text-sunflowerBright mb-6" strokeWidth={1.5} />
        <h2 className="text-2xl sm:text-4xl mb-8 text-yellow-800">Então chegou mais um presente</h2>
        <div className="space-y-6 text-gray-700 text-lg leading-relaxed font-light text-center">
          <p>Depois de um tempo… a vida decidiu nos surpreender mais uma vez.</p>
          <p>E veio a Zoe.</p>
          <p className="font-serif text-3xl text-sunflower py-4">Nossa pequena.<br />Mais um presente de Deus.</p>
          <p>Duas meninas lindas.<br />Duas partes de nós.</p>
          <p>Duas razões que sempre vão nos conectar, independente de qualquer coisa.</p>
          <p className="font-medium pt-4">Ver a Isabella e a Zoe juntas é uma das coisas mais lindas que existem.<br />Elas são o nosso maior tesouro.</p>
        </div>
        {/* Mostrando mais fotos soltas */}
        <PhotoGallery images={zoeImages} />
        <Placeholder element="video" label="Vídeo 3: Zoe" src="/zoe/WhatsApp Video 2026-03-07 at 23.26.59.mp4" />
      </Section>

      {/* 7. O momento mais difícil */}
      <Section className="bg-[#FDFBF7] w-full max-w-none py-32 px-6 border-y border-gray-200">
        <div className="max-w-2xl mx-auto flex flex-col items-center">
          <h2 className="text-2xl sm:text-4xl mb-12 text-gray-800">Agora vem a parte mais difícil de falar</h2>
          <div className="space-y-8 text-gray-600 text-lg leading-relaxed font-light text-center">
            <p>Aqui eu preciso ser completamente sincero com você.</p>
            <p className="text-xl font-medium">Eu errei.</p>
            <p>Eu errei com você.<br />Eu errei com a nossa história.<br />Eu traí a sua confiança.</p>
            <p>E mesmo assim… você tentou.</p>
            <p>Você tentou mais de uma vez.<br />Você me perdoou mais vezes do que eu merecia.</p>
            <p>Mesmo machucada, mesmo ferida… você ainda tentou salvar aquilo que a gente tinha construído.</p>
            <p>Mas chegou um momento em que a dor ficou grande demais.</p>
            <p>E eu entendi.<br />Porque ninguém merece carregar esse tipo de peso.</p>
            <p className="font-serif italic text-xl text-gray-800 pt-8">E então… a nossa história acabou naquele momento.</p>
          </div>
        </div>
      </Section>

      {/* 8. O que sinto hoje */}
      <Section className="py-24">
        <div className="space-y-8 text-gray-700 text-lg leading-relaxed font-light text-center">
          <h2 className="text-2xl sm:text-4xl mb-8 text-yellow-800">O que eu sinto hoje</h2>
          <p>Hoje existe um vazio.</p>
          <p>Um vazio que eu mesmo criei.</p>
          <p>Sinto falta de você.<br />Sinto falta das nossas filhas.<br />Sinto falta da nossa rotina.</p>
          <p>Das conversas.<br />Das risadas.<br />Das pequenas coisas do dia a dia.</p>
          <p className="font-serif italic text-xl pt-6 text-sunflower">E principalmente da sensação de olhar para você…<br />e sentir que eu estava em casa.</p>
          <p className="pt-6">Hoje eu entendo o valor de muitas coisas que antes eu não enxergava direito.</p>
          <p>E talvez essa seja uma das maiores dores que existem.</p>
          <p className="font-medium text-yellow-700">Perceber tarde demais o quanto algo era precioso.</p>
        </div>
      </Section>

      {/* 9. Um sonho faltando */}
      <Section className="bg-[#FFF9E6] w-full max-w-none py-24 px-6 shadow-sm border-t border-sunflower/20">
        <div className="max-w-2xl mx-auto flex flex-col items-center">
          <Flower2 className="w-10 h-10 text-sunflower mb-6" strokeWidth={1.5} />
          <h2 className="text-2xl sm:text-4xl mb-8 text-yellow-800 text-center">Um sonho simples que ainda ficou faltando</h2>
          <div className="space-y-6 text-gray-700 text-lg leading-relaxed font-light text-center">
            <p>Tem uma coisa que sempre ficou na minha cabeça.</p>
            <p>Você sempre falava de um sonho simples.</p>
            <p>Acordar em um hotel.</p>
            <p>Descer de manhã…<br />E encontrar aquela mesa cheia de opções de café da manhã.</p>
            <p className="font-medium text-sunflower">Aquele café de hotel.</p>
            <p>Eu lembro do jeito que você falava disso…<br />com aquele brilho no olho.</p>
            <p>A gente viveu muita coisa juntos.<br />Fez várias loucuras de amor.<br />Realizou vários momentos especiais.</p>
            <p className="font-serif italic text-xl pt-4">Mas esse pequeno sonho… ainda ficou faltando.</p>
            <p>E eu nunca esqueci disso.</p>
          </div>
        </div>
      </Section>

      {/* 10 & 11. Final Misterioso / Pedido Final */}
      <Section className="min-h-screen pt-32 pb-16 bg-[#FFFdf2]">
        <h2 className="text-xl sm:text-3xl mb-12 text-gray-600 font-light leading-relaxed max-w-2xl mx-auto text-center">
          "Talvez eu não mereça outra chance.<br /><br />
          Talvez eu tenha destruído algo que não tem conserto.<br /><br />
          Mas existe uma coisa que eu ainda precisava dizer para você.<br /><br />
          <span className="italic font-serif">E por isso eu fiz tudo isso aqui.</span>"
        </h2>

        {!showFinalMessage ? (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowFinalMessage(true)}
            className="mt-8 px-10 py-5 rounded-full bg-gradient-to-r from-sunflower to-sunflowerBright text-white hover:shadow-xl transition-all shadow-lg shadow-sunflower/30 text-sm sm:text-base tracking-widest uppercase font-medium flex items-center gap-3"
          >
            Se você quiser ouvir… clique aqui
            <Heart size={18} fill="currentColor" />
          </motion.button>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="mt-16 max-w-2xl mx-auto space-y-8 text-gray-800 text-lg sm:text-xl leading-relaxed font-light text-center bg-white p-10 sm:p-16 rounded-3xl shadow-2xl border border-sunflower/20"
          >
            <p className="font-serif text-4xl mb-8 text-sunflowerBright">Taynara…</p>
            <p>Eu sei que errei.</p>
            <p>Eu sei que te machuquei.<br />Eu sei que fiz você sofrer.</p>
            <p>E eu sei que talvez eu não mereça pedir mais nada.</p>
            <p>Mas mesmo assim… eu precisava te dizer isso.</p>
            <p className="pt-6">Se ainda existir, em algum lugar no seu coração…<br />mesmo que seja uma pequena chance…</p>
            <p className="font-medium text-yellow-700 text-2xl py-4">eu gostaria de tentar de novo.</p>
            <p className="font-serif italic text-2xl pt-8 flex flex-col items-center gap-6">
              Porque mesmo depois de tudo…
              <span className="text-4xl text-sunflowerBright font-medium">eu ainda amo você.</span>
              <Heart className="w-12 h-12 text-red-500 mt-6 animate-pulse" fill="currentColor" strokeWidth={0} />
            </p>
          </motion.div>
        )}
      </Section>
    </main>
  );
}

// Componente para marcar onde colocar as mídias depois
function Placeholder({ element, label, src }: { element: "video", label: string, src?: string }) {
  if (src) {
    return (
      <div className="w-full max-w-lg mx-auto aspect-video mt-12 mb-8 bg-[#1A1A1A] rounded-2xl border-4 border-[#FFF9E6] shadow-2xl overflow-hidden relative group">
        <video
          src={src}
          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
          controls
          controlsList="nodownload"
          playsInline
        />
      </div>
    );
  }
  return null;
}
