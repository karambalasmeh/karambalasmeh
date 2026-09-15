// Everything the card says. Edit here, then `node tools/build.mjs`.

export const me = {
  name: 'KARAM BALASMEH',
  role: 'AI Engineer',
  place: 'Amman, Jordan',
  // Amman. Printed on the card the way a chart prints a position fix.
  coords: "31°57′N  35°56′E",
  lede: 'Retrieval over knowledge graphs, agents that stop when the evidence runs out, and the data pipelines underneath national-scale government platforms.',
  org: '9XAI · Al-Hussein Technical University',
};

export const builds = [
  ['GOVERNMENT', 'Citizen-complaint intelligence at national scale — ingestion, classification, root-cause detection'],
  ['RETRIEVAL',  'RAG over knowledge graphs and Arabic corpora, with the citation attached to the answer'],
  ['AGENTS',     'Agentic workflows that carry a budget, a confidence threshold, and a way to hand back'],
  ['PIPELINES',  'Kafka and Airflow moving events into Postgres, Neo4j and vector stores that stay queryable'],
];

// The signature section. Three real moments a system I built declined to answer.
export const refusals = [
  {
    reading: '0 / 60',
    title: 'Options Alpha Agent',
    line: 'Enumerated sixty real SPY, QQQ and IWM spreads and priced expected value from delta-implied probabilities. None carried an edge. The agent stood aside rather than manufacture one, then traded the variance risk premium instead — the gap that is actually measurable.',
  },
  {
    reading: 'NO-GO',
    title: 'ReefShield Aqaba',
    line: 'The plan was to validate the plume model against a satellite image of the October 2016 flood. The nearest clear pass was five days late and the plume had dispersed. That is a physical null, not a data-quality problem, so the interface says so and moves the validation target to an in-situ mooring record.',
  },
  {
    reading: 'n = 8,500',
    title: 'Petra Ride Intelligence',
    line: 'Public reviews are customer-voice signal, not market share. Every comparison in the product carries its sample size, and a data-quality view shows what the pipeline dropped and why.',
  },
];

// slug -> simple-icons key. Rendered from the installed package, not fetched.
export const stack = [
  { group: 'AI & RETRIEVAL', items: [
    ['python','Python'], ['langchain','LangChain'], ['ollama','Ollama'],
    ['huggingface','Transformers'], ['neo4j','Neo4j'], ['qdrant','Qdrant'],
    ['opencv','Computer Vision'], ['anthropic','Claude'],
  ]},
  { group: 'SERVICES & DATA', items: [
    ['fastapi','FastAPI'], ['django','Django'], ['apachekafka','Kafka'],
    ['apacheairflow','Airflow'], ['postgresql','PostgreSQL'], ['redis','Redis'],
    ['supabase','Supabase'], ['pandas','Pandas'],
  ]},
  { group: 'INTERFACE & RUNTIME', items: [
    ['react','React'], ['nextdotjs','Next.js'], ['typescript','TypeScript'],
    ['tailwindcss','Tailwind'], ['docker','Docker'], ['kubernetes','Kubernetes'],
    ['githubactions','Actions'], ['nginx','Nginx'],
  ]},
];

// Plotted on the chart as stations. `shot` files are copied from the portfolio build.
export const stations = [
  {
    n: '01', name: 'CHIXTER', kind: 'Restaurant network intelligence',
    line: 'Reads 24,865 orders across five branches and says which one is bleeding margin, why, and what to change this week. On the demo network 7.5 points of prime cost separate best from worst — and 89% of that gap is labour, not food.',
    stack: 'React · TypeScript · LLM analyst',
    shot: 'chixter-01-overview.webp', wide: true,
  },
  {
    n: '02', name: 'REEFSHIELD AQABA', kind: 'Wadi-to-reef sediment forecasting',
    line: 'Flash floods carry sediment onto coral that cannot move. Five catchments, eight reef zones, 1,402 mapped channels. A gradient-boosted model scores exposure and shows what drives the score, quoted against leave-one-catchment-out precision.',
    stack: 'Python · xarray · MapLibre · GBM',
    shot: 'reef-historical.webp', wide: true,
  },
  {
    n: '03', name: 'PETRA RIDE', kind: 'Customer-voice intelligence',
    line: '8,500 public reviews across five Jordanian ride-hailing apps, classified by topic, sentiment and severity, then ranked by negative-signal share per month.',
    stack: 'FastAPI · Next.js · PostgreSQL',
    shot: 'petra-redesign_01_overview.webp',
  },
  {
    n: '04', name: 'PATCHOULI', kind: 'Storefront for an Amman perfume house',
    line: 'Fragrance decoded rather than described — note pyramid, accord bars, a drag-to-explore bottle. Bilingual EN/AR with a fully mirrored RTL layout, and WhatsApp ordering, which is how Amman actually buys.',
    stack: 'React · Vite · Framer Motion',
    shot: 'perfume-home.webp',
  },
];

export const alsoRow = 'LegalMind — Neo4j graph retrieval + LoRA-tuned Llama 3.1 8B, 90%+ on statute interpretation  ·  SAFIR — GNN route optimisation, voice pilot assistant over WebSockets  ·  Quran Tafseer RAG — 49,000 verse-aligned passages across eight books';

export const links = [
  { id: 'linkedin', label: 'LinkedIn', icon: 'linkedin', href: 'https://www.linkedin.com/in/karam-balasmeh-520b76266' },
  { id: 'email',    label: 'Email',    icon: 'maildotru', href: 'mailto:karam.balasmeh@gmail.com' },
  { id: 'github',   label: 'Repos',    icon: 'github',   href: 'https://github.com/karambalasmeh?tab=repositories' },
];

export const footer = {
  edu: 'BSc Artificial Intelligence & Data Science · Hashemite University · 2022–2026 · GPA 3.3/4.0',
  langs: 'Arabic (native) · English (professional) · Spanish (basic)',
};
