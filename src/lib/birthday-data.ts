export type MemoryCard = {
  id: number;
  front: {
    label: string;
    title: string;
    glyph: string;
  };
  back: {
    title: string;
    body: string;
    signature: string;
  };
  accent: string;
  /** distinct per-card accent — drives glyph color, divider, hover foil underline */
  glyphAccent: "amber" | "rose" | "violet" | "emerald" | "sky" | "gold";
};

export const memoryCards: MemoryCard[] = [
  {
    id: 1,
    front: { label: "Chapter 01", title: "The First Hello", glyph: "✦" },
    back: {
      title: "Where it began",
      body: "I still remember the first time our paths crossed. Something in the air felt different — lighter, warmer, as if the universe had been quietly arranging the moment for a long time.",
      signature: "— a memory I keep replaying",
    },
    accent: "from-rose-200/60 to-amber-100/40",
    glyphAccent: "rose",
  },
  {
    id: 2,
    front: { label: "Chapter 02", title: "Quiet Mornings", glyph: "❋" },
    back: {
      title: "Soft and unhurried",
      body: "Mornings with you taught me that slowness is a kind of luxury. The way light pooled on the floor, the sound of your laughter — ordinary moments that turned out to be the whole point.",
      signature: "— the smallest things, the loudest",
    },
    accent: "from-amber-200/60 to-rose-100/40",
    glyphAccent: "amber",
  },
  {
    id: 3,
    front: { label: "Chapter 03", title: "The Long Talks", glyph: "✺" },
    back: {
      title: "Words that stayed",
      body: "We talked about everything and nothing, and somehow both mattered equally. You listened the way people rarely do — fully, without waiting for your turn to speak.",
      signature: "— heard, in the truest sense",
    },
    accent: "from-violet-200/60 to-amber-100/40",
    glyphAccent: "violet",
  },
  {
    id: 4,
    front: { label: "Chapter 04", title: "Adventures Small", glyph: "❖" },
    back: {
      title: "Maps we drew ourselves",
      body: "We never needed a grand plan. A wrong turn, an unplanned stop, a meal we discovered by accident — every detour with you became a story worth keeping.",
      signature: "— lost, and found, at once",
    },
    accent: "from-emerald-200/60 to-amber-100/40",
    glyphAccent: "emerald",
  },
  {
    id: 5,
    front: { label: "Chapter 05", title: "Steady Through Storms", glyph: "✸" },
    back: {
      title: "The calm in the noise",
      body: "When the world got loud, you became the quiet center. Your presence is a kind of shelter — the kind you don't realize you needed until you step inside.",
      signature: "— anchored, always",
    },
    accent: "from-sky-200/60 to-rose-100/40",
    glyphAccent: "sky",
  },
  {
    id: 6,
    front: { label: "Chapter 06", title: "Today, You", glyph: "✦" },
    back: {
      title: "A day that is yours",
      body: "Today the calendar pauses to honor the fact that you exist, that you keep choosing kindness, that you make the people around you feel more like themselves. That is no small thing.",
      signature: "— celebrated, completely",
    },
    accent: "from-rose-200/60 to-violet-100/40",
    glyphAccent: "gold",
  },
];

export const jarThoughts: string[] = [
  "You listen with your whole heart and make others feel important.",
  "When things get stressful, your calm energy helps everyone feel safe.",
  "Your warm laugh always makes people feel happy and relaxed.",
  "You are a deeply loyal friend. I can trust you with anything.",
  "Thank you for being so kind and making the world a sweeter place.",
  "Your friendship is a safe place full of comfort and happiness.",
  "You notice the small things others miss, and that is a rare gift.",
  "Your curiosity makes even ordinary days feel like an adventure.",
  "You give without keeping score, and that generosity echoes.",
  "You make people feel braver just by standing beside them.",
];

export type Track = {
  name: string;
  duration: string;
  mood: string;
  lyrics: { time: number; text: string }[];
};

export const tracks: Track[] = [
  {
    name: "Golden Hour",
    duration: "3:42",
    mood: "Warm · Ambient",
    lyrics: [
      { time: 0, text: "Light bends softly through the curtain" },
      { time: 4, text: "Everything turns to honey and rose" },
      { time: 8, text: "The day holds its breath for a moment" },
      { time: 12, text: "And so do I, watching you glow" },
      { time: 16, text: "Stay here, where the light is kindest" },
      { time: 20, text: "Stay, while the world moves slow" },
      { time: 24, text: "Some hours are made of ordinary magic" },
      { time: 28, text: "And this one belongs to you" },
    ],
  },
  {
    name: "Letters Unsent",
    duration: "4:08",
    mood: "Tender · Reflective",
    lyrics: [
      { time: 0, text: "I wrote you a thousand quiet letters" },
      { time: 4, text: "In the margins of ordinary days" },
      { time: 8, text: "In the space between two words" },
      { time: 12, text: "In the way the light hit your face" },
      { time: 16, text: "Most of them I never sent" },
      { time: 20, text: "But you read them anyway" },
      { time: 24, text: "Some people speak in spoken language" },
      { time: 28, text: "We speak in stays" },
    ],
  },
  {
    name: "Slow Bloom",
    duration: "3:15",
    mood: "Bright · Hopeful",
    lyrics: [
      { time: 0, text: "Not everything arrives in a hurry" },
      { time: 4, text: "Some beauty takes its own sweet time" },
      { time: 8, text: "A petal, a pause, a quiet opening" },
      { time: 12, text: "The slow bravery of becoming" },
      { time: 16, text: "You taught me to trust the unfolding" },
      { time: 20, text: "To let the season do its work" },
      { time: 24, text: "And bloomed, you are breathtaking" },
      { time: 28, text: "Worth every patient morning" },
    ],
  },
];

export type TimelineMoment = {
  id: number;
  season: string;
  title: string;
  detail: string;
  glyph: string;
  accent: "amber" | "rose" | "violet" | "emerald";
};

export const timelineMoments: TimelineMoment[] = [
  {
    id: 1,
    season: "the beginning",
    title: "A quiet first impression",
    detail: "Before I knew your name, I knew the feeling in the room when you walked in — something lighter, more awake.",
    glyph: "✦",
    accent: "amber",
  },
  {
    id: 2,
    season: "early days",
    title: "Learning your rhythms",
    detail: "The way you take your coffee, the songs you hum without noticing, the pause before you laugh. Small maps I started to memorize.",
    glyph: "❋",
    accent: "rose",
  },
  {
    id: 3,
    season: "the middle",
    title: "Carried through hard weeks",
    detail: "When the year turned heavy, you were the steady note underneath everything. I didn't say it enough then. I'm saying it now.",
    glyph: "✺",
    accent: "violet",
  },
  {
    id: 4,
    season: "lately",
    title: "Ordinary magic",
    detail: "A late drive, a shared silence, a meal that tasted like a small celebration. The days I'll remember longest were the unremarkable ones.",
    glyph: "❖",
    accent: "emerald",
  },
  {
    id: 5,
    season: "today",
    title: "You, again",
    detail: "Another orbit around the sun, and here you are — still kind, still curious, still becoming. The best chapter is the one still being written.",
    glyph: "✸",
    accent: "amber",
  },
];

export const heroSubtitle = "A birthday composed in light, sound, and memory — for someone who makes ordinary days feel like kept promises.";

export const compliments: string[] = [
  "You make rooms feel warmer just by being in them.",
  "Your laugh is the best kind of contagious.",
  "You notice people the way most people never do.",
  "You turn ordinary days into small adventures.",
  "Your kindness is not a strategy — it's just you.",
  "You make hard things look gentle.",
  "You have a way of making people feel braver.",
  "Your curiosity keeps the world interesting.",
  "You are the calm in a lot of loud rooms.",
  "You give without keeping a record.",
  "Your warmth is the kind that lingers.",
  "You are far stronger than you let on.",
];

export const introLines = [
  "> initializing celebration.protocol",
  "> loading memory.deck ............ ok",
  "> calibrating sparkle.engine ..... ok",
  "> warming harp.strings ........... ok",
  "> decrypting message.for(heena) .. ok",
  "> ready. tap the gift to begin.",
];

export const wishMessages = [
  "Make a wish, Heena. The whole room is listening.",
  "Whatever you wish for, may it find you this year.",
  "Blow gently — the candles are only the beginning.",
];

/**
 * Wish Horoscope — a playful "year ahead" reading.
 * Generated by matching keyword seeds in the sealed wish to one or more readings.
 * Falls back to a default set when no keywords match.
 */
export type HoroscopeReading = {
  glyph: string;
  season: string;
  title: string;
  body: string;
  accent: "amber" | "rose" | "violet" | "emerald" | "sky";
};

export const horoscopeKeywords: { match: string[]; reading: HoroscopeReading }[] = [
  {
    match: ["love", "heart", "beloved", "partner", "together", "romance", "hug", "kiss"],
    reading: {
      glyph: "❤",
      season: "spring of the heart",
      title: "A Season of Tenderness",
      body: "Love finds you in the small, unhurried moments — a kettle warming, a hand on a shoulder, a song you used to skip. The people who already love you will say it louder this year. Let them.",
      accent: "rose",
    },
  },
  {
    match: ["joy", "happy", "smile", "laugh", "fun", "play", "delight", "cheer"],
    reading: {
      glyph: "✺",
      season: "summer of the laugh",
      title: "A Year of Easy Laughter",
      body: "Your laugh becomes a kind of weather this year — it changes the rooms you walk into. Expect improbable jokes, sudden dance breaks, and at least one story you will tell for years.",
      accent: "amber",
    },
  },
  {
    match: ["peace", "calm", "quiet", "rest", "slow", "breathe", "still"],
    reading: {
      glyph: "❋",
      season: "autumn of the slow breath",
      title: "A Year That Forgets to Rush",
      body: "You will learn the luxury of doing one thing at a time. Mornings lengthen. Walks get longer. You find a quiet so deep you can hear your own kindness again.",
      accent: "violet",
    },
  },
  {
    match: ["success", "work", "career", "job", "grow", "build", "create", "project", "achieve"],
    reading: {
      glyph: "✦",
      season: "winter of the long build",
      title: "A Year of Quiet, Steady Building",
      body: "The work you have been doing in the dark begins to show. Not as fireworks — as foundations. By the time autumn returns, you will stand on something you built with your own hands.",
      accent: "emerald",
    },
  },
  {
    match: ["health", "well", "strong", "body", "energy", "heal", "fit", "wellness"],
    reading: {
      glyph: "✸",
      season: "the year of the body's yes",
      title: "A Year That Listens to Your Body",
      body: "Your body becomes a friend this year, not a task. You sleep deeper. You move for joy. You learn which foods make you glow and which you can finally set down.",
      accent: "sky",
    },
  },
  {
    match: ["travel", "trip", "adventure", "explore", "journey", "road", "away", "world"],
    reading: {
      glyph: "❖",
      season: "spring of the open road",
      title: "A Year of Small Pilgrimages",
      body: "Some places will call you. A coast you have never seen. A city you have only dreamed. Go. The map redraws itself around who you become when you arrive.",
      accent: "emerald",
    },
  },
  {
    match: ["family", "home", "mom", "dad", "sister", "brother", "child", "parent", "friend"],
    reading: {
      glyph: "✧",
      season: "the year of the long table",
      title: "A Year of Long Tables",
      body: "Your people gather closer this year. There will be meals that run late, jokes only your family gets, and at least one apology that finally lands. Home becomes less a place, more a feeling you carry.",
      accent: "amber",
    },
  },
  {
    match: ["learn", "study", "read", "write", "book", "school", "skill", "grow"],
    reading: {
      glyph: "✺",
      season: "the year of the open book",
      title: "A Year of Quiet Scholarship",
      body: "A subject finds you and refuses to leave. You read past midnight. You take notes in the margins. By the end of the year, you will know something you cannot un-know — and it will be beautiful.",
      accent: "violet",
    },
  },
  {
    match: ["money", "abundance", "wealth", "save", "give", "share", "generous"],
    reading: {
      glyph: "✦",
      season: "the year of the open hand",
      title: "A Year of Unhurried Abundance",
      body: "There is enough. That is the secret this year teaches you. Enough to share, enough to spare, enough to give the way you have always wanted to. Generosity stops feeling risky.",
      accent: "amber",
    },
  },
];

export const horoscopeFallback: HoroscopeReading[] = [
  {
    glyph: "✦",
    season: "the year of becoming",
    title: "A Year That Asks Who You Are Becoming",
    body: "This is the year you stop apologizing for the size of your life. You will say yes to fewer things and mean it more. You will say no to one thing that has been asking for years. By winter, you will recognize yourself.",
    accent: "amber",
  },
  {
    glyph: "❋",
    season: "the year of small brave steps",
    title: "A Year of Small, Brave Steps",
    body: "You will not leap this year — you will inch. And the inching will turn out to be the bravest thing you have ever done. Each small step leaves a faint gold trail. By December, you will look back and see a road.",
    accent: "rose",
  },
  {
    glyph: "✺",
    season: "the year of the kind mirror",
    title: "A Year of the Kind Mirror",
    body: "You will start to see yourself the way the people who love you see you. It will feel strange at first, like wearing a coat that fits. By spring, you will stop apologizing for the fit. By autumn, you will not remember the old coat at all.",
    accent: "violet",
  },
  {
    glyph: "✸",
    season: "the year of the second wind",
    title: "A Year of the Second Wind",
    body: "Something you thought you had finished with comes back — kinder this time, gentler, asking only to be understood. You will give it that. And in the giving, you will find a strength you did not know you had been saving.",
    accent: "emerald",
  },
];

export const footerSignature = "Crafted slowly, with care. For Heena, on her day.";
