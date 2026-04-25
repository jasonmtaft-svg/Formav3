"use client";

import { useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { BottomNav } from "@/components/ui/BottomNav";

// ── Data ─────────────────────────────────────────────────────────────────────

const FIXED_TRAITS = [
  "Believe they can't achieve great things — so they don't try",
  "Compare themselves to people doing worse, to feel better",
  "Blame genetics or circumstances for their limitations",
  "See failure as proof of limited ability",
  "Are set in their ways and avoid unfamiliar challenges",
  "Fear criticism and take it personally",
  "Give up when frustrated",
];

const GROWTH_TRAITS = [
  "Look at people doing better to understand what it takes",
  "Believe hard work can grow any skill — talent is just a head start",
  "See failure as data, not identity",
  "Embrace challenges as the place where growth actually happens",
  "Use feedback as a tool, not a weapon",
  "Are inspired by others' success, not threatened by it",
  "Trust that 'not yet' is different from 'never'",
];

const MINDSET_TIPS = [
  {
    number: "01",
    title: "Learn from the mistakes of others",
    short: "Every mistake you see — in yourself or others — is a free lesson.",
    body: "You don't have to experience every failure personally to learn from it. When you see someone struggle in the gym, at work, or in relationships, ask yourself what you'd do differently. That reflection is growth. The same applies when you mess up — don't bury it, examine it. What happened, why, and what would a better version of you do next time?",
  },
  {
    number: "02",
    title: '"Not yet" is not the same as "never"',
    short: "Mastery takes time. Progress is rarely linear.",
    body: "When you're struggling with something new, your brain is literally rewiring itself. The frustration you feel is the feeling of learning. Most people quit right before the breakthrough. The key is to reframe 'I can't do this' into 'I can't do this yet.' That one word changes everything — it keeps the door open. Expect setbacks. They're not detours from the path, they ARE the path.",
  },
  {
    number: "03",
    title: "Take risks in front of others",
    short: "Don't take yourself so seriously. Vulnerability earns respect.",
    body: "One of the biggest blockers to growth is the fear of looking stupid. But here's the truth: people who are willing to try and fail publicly are the ones everyone secretly admires. The person in the gym attempting a new lift and failing isn't embarrassing themselves — they're showing the room what courage looks like. The ones watching and doing nothing are the ones who'll still be in the same place next year.",
  },
  {
    number: "04",
    title: "Be realistic with your goals",
    short: "Big ambition is good. Unrealistic timelines destroy momentum.",
    body: "There's a difference between dreaming big and setting yourself up to fail. If you've never run before, training for a marathon in 4 weeks isn't ambitious — it's a recipe for injury and quitting. Set targets that stretch you without breaking you. Small consistent wins compound into massive results. Changing your entire mindset overnight is unrealistic too — give yourself the same patience you'd give a friend.",
  },
  {
    number: "05",
    title: "Speed isn't the goal — the process is",
    short: "Trust the process. Obsessing over the outcome kills consistency.",
    body: "When your only focus is the destination, every slow day feels like failure. But when you fall in love with the process — the daily habits, the small improvements, the discipline — you stop needing external validation to stay motivated. The irony is that people who focus on the process typically get to the destination faster, because they don't burn out chasing a number on a scale or a weight on a bar.",
  },
  {
    number: "06",
    title: "Own your attitude",
    short: "Your mindset is the one thing no one can take from you.",
    body: "You can't always control what happens to you. You can't control the weather, other people, or your genetics. But you can always control how you respond. That response — your attitude — is your superpower. Develop it deliberately. When you catch yourself reacting with frustration, self-pity, or blame, pause and ask: is this the attitude of the person I'm trying to become? You get to choose.",
  },
  {
    number: "07",
    title: "Be authentically yourself",
    short: "Pretending to be someone else is exhausting and pointless.",
    body: "People can smell inauthenticity immediately — it makes conversations feel hollow and transactional. The version of you that you think is 'not enough' is almost always more compelling than the version you're performing for others. Being yourself doesn't mean being stagnant — it means growing from your actual foundation, not someone else's. You're the only you that exists. That's either terrifying or liberating. Choose liberating.",
  },
  {
    number: "08",
    title: "Cultivate a sense of purpose",
    short: "Know why you're doing what you're doing. It changes everything.",
    body: "Ask yourself honestly: who are you doing this for? If you're training for the Instagram photo, you'll quit the moment you miss a session and feel like a fraud. If you're training because you want to feel strong, confident, and healthy for the next 30 years — that motivation is bulletproof. Purpose doesn't have to be grand or philosophical. It just has to be genuinely yours.",
  },
  {
    number: "09",
    title: "Redefine what 'talented' means",
    short: "Everyone's different. Your weaknesses are your biggest opportunity.",
    body: "The people you admire weren't born finished. They worked on the gaps. Talent is overrated — it's a head start, not a destination. The person who starts with less natural ability but works consistently will almost always outperform the naturally gifted person who coasts. Identify the areas where you're weakest and lean into them. That's where the real growth lives.",
  },
  {
    number: "10",
    title: "Turn criticism into fuel",
    short: "Feedback isn't an attack. It's information.",
    body: "When someone criticises you, your brain's default response is defensive — it reads it as a threat. But that's just biology. You can override it. Separate your ego from the feedback and ask: is there any truth in this? Even 10% truth in a harsh criticism is worth extracting. The people who grow fastest are the ones who actively seek honest feedback rather than surrounding themselves with people who only tell them what they want to hear.",
  },
  {
    number: "11",
    title: "Value the journey over the destination",
    short: "The outcome is a moment. The process is your life.",
    body: "The day you hit your goal weight, lift your target weight, or finish your program will feel great for maybe a week. Then what? The people who are genuinely fulfilled aren't just chasing endpoints — they've built a life where the daily practice itself is rewarding. Fall in love with training, not just results. Fall in love with learning, not just knowing. That's where lasting satisfaction lives.",
  },
  {
    number: "12",
    title: "Acknowledge your imperfections",
    short: "Everyone has gaps. Accepting yours is the start of fixing them.",
    body: "No one is coming from a position of perfection. The person you're comparing yourself to has their own insecurities, struggles, and dark days — you just don't see them. When you can honestly look at your weaknesses without shame, you strip them of their power. They go from being sources of embarrassment to being targets on a roadmap. Self-awareness without self-judgement is one of the most useful skills you can develop.",
  },
  {
    number: "13",
    title: "Face challenges head-on",
    short: "Most things you're afraid of aren't as bad as the anticipation.",
    body: "The moment before you do something scary — a heavy lift, a difficult conversation, a new environment — is almost always worse than the thing itself. Your brain catastrophises to protect you, but most of the time the worst case scenario doesn't happen. Ask yourself: what's the worst realistic outcome? Usually it's survivable. Then ask: what's the best possible outcome? Then ask: which one am I letting make my decision? Use breathing to calm your nervous system before challenges — it genuinely works.",
  },
  {
    number: "14",
    title: "Watch your inner dialogue",
    short: "Your thoughts become your reality. Start editing them.",
    body: "The words you use to describe yourself and your situation aren't neutral — they shape how you feel and what you do. 'I can't' closes a door. 'I'll try' opens it a crack. 'I will' kicks it open. Start noticing the language running in your head. Replace 'I'm useless at this' with 'I'm still learning this.' Replace judgement with curiosity. Replace hate with compassion — including towards yourself. You wouldn't speak to a friend the way you sometimes speak to yourself. Stop doing it.",
  },
];

const POSITIVE_HABITS = [
  {
    title: "Check your language",
    body: "The words you use to describe your life either empower or diminish you. Swap 'I can't' for 'I will.' Swap 'I'm terrible at this' for 'I'm learning this.' Language isn't just description — it's instruction. Your brain takes it literally.",
  },
  {
    title: "Have real conversations",
    body: "Not small talk — real ones. Talk about things you care about with people you trust. Vulnerability and genuine connection are among the fastest ways to shift your emotional state and gain perspective on whatever's weighing on you.",
  },
  {
    title: "Seek out inspiration",
    body: "You are the average of the five people you spend the most time with. If those people are negative, stagnant, or toxic — that will rub off on you. Actively curate who you spend time with and what you consume. Podcasts, books, documentaries — fill your inputs with growth and you'll find it starts to leak into everything else.",
  },
  {
    title: "Laugh more than you think is necessary",
    body: "Laughter is physiologically good for you — it reduces cortisol (the stress hormone) and boosts mood-related neurotransmitters. Watch something that makes you properly laugh. Don't underestimate it as a tool for resetting your state when everything feels heavy.",
  },
];

const REFLECTION_QUESTIONS = [
  { question: "Are you grateful or ungrateful?", growth: "Grateful", fixed: "Ungrateful" },
  { question: "Do you celebrate others' success or envy it?", growth: "Celebrate", fixed: "Envy" },
  { question: "Are you open-minded or rigid?", growth: "Open", fixed: "Rigid" },
  { question: "Do you give generously or sparingly?", growth: "Generously", fixed: "Sparingly" },
  { question: "Do you trust people or fear them?", growth: "Trust", fixed: "Fear" },
  { question: "Do you ask how you can help, or what's in it for you?", growth: "Help others", fixed: "Self-first" },
  { question: "Are you learning every day or resisting change?", growth: "Learning", fixed: "Stagnant" },
];

// ── Components ────────────────────────────────────────────────────────────────

function TipCard({ tip }: { tip: typeof MINDSET_TIPS[0] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-border-default bg-surface overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left px-4 py-4 flex items-start gap-3"
      >
        <span className="text-[11px] font-semibold text-accent shrink-0 mt-0.5 tabular-nums">
          {tip.number}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text-primary">{tip.title}</p>
          <p className="text-xs text-text-muted mt-0.5">{tip.short}</p>
        </div>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
          className={`shrink-0 text-text-muted transition-transform mt-0.5 ${open ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-border-subtle pt-3">
          <p className="text-sm text-text-secondary leading-relaxed">{tip.body}</p>
        </div>
      )}
    </div>
  );
}

function HabitCard({ habit }: { habit: typeof POSITIVE_HABITS[0] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-border-default bg-surface overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left px-4 py-3.5 flex items-center justify-between gap-3"
      >
        <p className="text-sm font-medium text-text-primary">{habit.title}</p>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
          className={`shrink-0 text-text-muted transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-border-subtle pt-3">
          <p className="text-sm text-text-secondary leading-relaxed">{habit.body}</p>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MindsetPage() {
  const [mindsetView, setMindsetView] = useState<"growth" | "fixed">("growth");

  return (
    <main className="flex min-h-dvh flex-col px-6 py-10 pb-28">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Logo />
        <h1 className="text-xl font-semibold">Mindset</h1>
      </div>

      {/* Hero quote */}
      <div className="rounded-xl bg-accent/10 border border-accent/20 px-5 py-5 mb-8">
        <p className="text-base font-semibold text-text-primary leading-snug">
          "If you're not growing, you're dying."
        </p>
        <p className="text-xs text-text-muted mt-1">William S. Burroughs</p>
        <p className="text-sm text-text-secondary mt-4 leading-relaxed">
          Your results in the gym — and in life — are a direct reflection of your mindset.
          This isn't motivation fluff. It's science. The brain is plastic: it rewires
          itself based on how you think and what you do repeatedly. That means your mindset
          is trainable, just like your body.
        </p>
      </div>

      {/* Fixed vs Growth toggle */}
      <section className="mb-8">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-3">
          Fixed vs Growth Mindset
        </h2>

        {/* Toggle */}
        <div className="flex rounded-lg overflow-hidden border border-border-default mb-4">
          {(["growth", "fixed"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setMindsetView(type)}
              className={`flex-1 py-2 text-sm font-medium capitalize transition-colors ${
                mindsetView === type
                  ? type === "growth"
                    ? "bg-accent text-white"
                    : "bg-red-500/80 text-white"
                  : "text-text-secondary"
              }`}
            >
              {type === "growth" ? "Growth Mindset" : "Fixed Mindset"}
            </button>
          ))}
        </div>

        <div className={`rounded-xl border p-4 space-y-2.5 ${
          mindsetView === "growth"
            ? "border-accent/20 bg-accent/5"
            : "border-red-500/20 bg-red-500/5"
        }`}>
          {(mindsetView === "growth" ? GROWTH_TRAITS : FIXED_TRAITS).map((trait, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <span className={`shrink-0 mt-0.5 ${mindsetView === "growth" ? "text-accent" : "text-red-400"}`}>
                {mindsetView === "growth" ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                )}
              </span>
              <p className="text-sm text-text-secondary leading-snug">{trait}</p>
            </div>
          ))}
        </div>

        <p className="text-xs text-text-muted mt-3 leading-relaxed">
          {mindsetView === "growth"
            ? "If this is you — protect it. Growth mindsets are built through daily habits and deliberate thinking, not one-time decisions."
            : "If this sounds familiar, that's OK. A fixed mindset isn't a character flaw — it's a pattern, and patterns can be changed. The fact that you're reading this is already a growth mindset move."}
        </p>
      </section>

      {/* 14 tips */}
      <section className="mb-8">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-1">
          14 Ways to Develop Your Mindset
        </h2>
        <p className="text-sm text-text-secondary mb-4">
          Tap any card to read the full coaching note.
        </p>
        <div className="space-y-2">
          {MINDSET_TIPS.map((tip) => (
            <TipCard key={tip.number} tip={tip} />
          ))}
        </div>
      </section>

      {/* Positive thinking */}
      <section className="mb-8">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-1">
          Building Positive Thinking
        </h2>
        <p className="text-sm text-text-secondary mb-4">
          It's not about being blindly positive. It's about making sure the positive
          thoughts consistently outweigh the negative ones.
        </p>
        <div className="space-y-2">
          {POSITIVE_HABITS.map((h) => (
            <HabitCard key={h.title} habit={h} />
          ))}
        </div>
      </section>

      {/* Daily reflection */}
      <section className="mb-8">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-1">
          Daily Reflection
        </h2>
        <p className="text-sm text-text-secondary mb-4">
          Abundance mentality vs. scarcity mentality. Where do you sit right now?
          Be honest — no one's watching.
        </p>
        <div className="space-y-2">
          {REFLECTION_QUESTIONS.map((q, i) => (
            <div key={i} className="rounded-xl border border-border-default bg-surface px-4 py-3.5">
              <p className="text-sm text-text-primary mb-2">{q.question}</p>
              <div className="flex gap-2">
                <span className="flex items-center gap-1.5 rounded-lg bg-accent/10 border border-accent/20 px-2.5 py-1 text-xs font-medium text-accent">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  {q.growth}
                </span>
                <span className="flex items-center gap-1.5 rounded-lg bg-surface-elevated border border-border-subtle px-2.5 py-1 text-xs text-text-muted">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                  {q.fixed}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Level up — meditation */}
      <section className="mb-8">
        <div className="rounded-xl border border-border-default bg-surface p-5 space-y-3">
          <h2 className="text-sm font-semibold text-text-primary">Level Up: Daily Meditation</h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            The single most effective thing you can do to accelerate mindset change is to
            meditate daily — even for just 5 minutes. Not because it's spiritual or trendy,
            but because it gives you a moment to observe your own thoughts instead of being
            dragged around by them.
          </p>
          <p className="text-sm text-text-secondary leading-relaxed">
            You're allowed to feel angry, frustrated, and negative. Those emotions are
            normal. What matters is how you process them. Meditation teaches you the gap
            between stimulus and response — and in that gap is where your growth lives.
          </p>
          <p className="text-sm text-text-secondary leading-relaxed">
            If you think it's not for you — that's exactly the fixed mindset talking.
            Try it for 7 days before deciding.
          </p>
          <div className="border-t border-border-subtle pt-3">
            <p className="text-xs font-medium text-text-muted uppercase tracking-widest mb-2">Start here</p>
            <div className="space-y-1.5">
              {["Headspace — 10-minute beginner sessions", "Wim Hof breathing — energy + focus reset", "Body scan before sleep — reduces cortisol, improves recovery"].map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <span className="shrink-0 text-accent mt-0.5">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </span>
                  <p className="text-xs text-text-secondary">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Closing */}
      <div className="rounded-xl bg-surface border border-border-default px-5 py-5 text-center space-y-2">
        <p className="text-sm font-semibold text-text-primary">
          You are the director of your own movie.
        </p>
        <p className="text-sm text-text-secondary leading-relaxed">
          Are you driving yourself towards your goals — or away from them?
          The decision, every single day, is yours.
        </p>
        <p className="text-xs text-accent font-medium mt-2">Change the script.</p>
      </div>

      <BottomNav />
    </main>
  );
}
