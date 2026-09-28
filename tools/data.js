// Everything the card says. Edit here, then `node tools/build.mjs`.

export const me = {
  name: 'KARAM BALASMEH',
  role: 'AI Engineer',
  place: 'Amman, Jordan',
  lede: 'Retrieval over knowledge graphs, agents that stop when the evidence runs out, and the data pipelines underneath national-scale government platforms.',
  org: '9XAI · Al-Hussein Technical University',
};

// Scannable facts. Plain labels, no jargon.
export const facts = [
  ['BASED IN',   'Amman, Jordan'],
  ['EXPERIENCE', 'Since 2022'],
  ['SHIPPED',    '7+ government platforms'],
  ['OPEN TO',    'AI engineering roles'],
];

export const builds = [
  ['GOVERNMENT', 'Citizen-complaint intelligence at national scale — ingestion, classification, root-cause detection'],
  ['RETRIEVAL',  'RAG over knowledge graphs and Arabic corpora, with the citation attached to the answer'],
  ['AGENTS',     'Agentic workflows that carry a budget, a confidence threshold, and a way to hand back'],
  ['PIPELINES',  'Kafka and Airflow moving events into Postgres, Neo4j and vector stores that stay queryable'],
];

// Three projects where the honest answer was "no". Written plainly — the point
// only lands if a reader gets it without decoding anything.
export const honest = [
  {
    title: 'Options Alpha Agent',
    line: 'I priced 60 real option spreads to see which were worth trading. After costs, not one of them was. So the agent refused to trade rather than force a position, and went looking for a smaller edge that was actually there.',
  },
  {
    title: 'ReefShield Aqaba',
    line: 'I needed a satellite photo of a 2016 flood to check my model against. The satellite passed five days late, by which time the flood had cleared — the photo could never have existed. The app shows the check as failed and explains why, instead of quietly dropping it.',
  },
  {
    title: 'Petra Ride',
    line: 'App reviews tell you what people complain about, not how big a company is. Every chart in the product shows how many reviews it is built on, so nobody reads more into it than the data supports.',
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

// `shot` files are copied from the portfolio build.
export const projects = [
  {
    name: 'CHIXTER', kind: 'Restaurant network intelligence',
    line: 'Reads 24,865 orders across five branches and says which one is bleeding margin, why, and what to change this week. On the demo network 7.5 points of prime cost separate best from worst — and 89% of that gap is labour, not food.',
    stack: 'React · TypeScript · LLM analyst',
    shot: 'chixter-01-overview.webp',
  },
  {
    name: 'REEFSHIELD AQABA', kind: 'Wadi-to-reef sediment forecasting',
    line: 'Flash floods carry sediment onto coral that cannot move. Five catchments, eight reef zones, 1,402 mapped channels. A gradient-boosted model scores exposure and shows what drives the score, quoted against leave-one-catchment-out precision.',
    stack: 'Python · xarray · MapLibre · GBM',
    shot: 'reef-historical.webp',
  },
  {
    name: 'PETRA RIDE', kind: 'Customer-voice intelligence',
    line: '8,500 public reviews across five Jordanian ride-hailing apps, classified by topic, sentiment and severity, then ranked by negative-signal share per month.',
    stack: 'FastAPI · Next.js · PostgreSQL',
    shot: 'petra-redesign_01_overview.webp',
  },
  {
    name: 'PATCHOULI', kind: 'Storefront for an Amman perfume house',
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
