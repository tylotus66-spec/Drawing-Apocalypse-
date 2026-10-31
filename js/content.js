// Universe content: the 30 official elements (spec §9), species, drawing
// structure (spec §6), ORB guidance lines and help topics.

const E = (name, color, desc, abilities) => ({ id: name, name, color, desc, abilities });

export const ELEMENTS = [
  E('FIRE', '#ff4d2e', 'Raw combustion. Fast, aggressive pressure and burning damage over time.', ['Fireball', 'Flame burst', 'Fire wall', 'Burning projectiles']),
  E('WATER', '#3d7bd9', 'Flowing force that shields, pushes and cuts with pressure.', ['Water projectile', 'Water shield', 'Water wave', 'High-pressure attack']),
  E('EARTH', '#8a6a3c', 'Stone and soil. Heavy impacts and solid cover.', ['Ground strike', 'Stone projectile', 'Earth barrier', 'Ground eruption']),
  E('AIR', '#cfd6e0', 'Wind and pressure. Mobility, knockback and crowd control.', ['Wind blast', 'Air projectile', 'Gust movement', 'Tornado attack']),
  E('LIGHTNING', '#f5e663', 'Electric discharge. Chaining hits, stuns and dashes.', ['Electrical projectile', 'Chain lightning', 'Electrical stun', 'Lightning dash']),
  E('ICE', '#a9d8f0', 'Cold that slows, freezes and builds frozen walls.', ['Ice projectile', 'Frozen barrier', 'Frost wave', 'Freezing attack']),
  E('NATURE', '#4caf50', 'Living growth. Vines, roots and regeneration.', ['Plant growth', 'Vine attack', 'Root restraint', 'Natural regeneration']),
  E('LAVA', '#ff6a00', 'Molten rock. Area denial and searing bursts.', ['Molten projectile', 'Lava eruption', 'Molten ground', 'Heat burst']),
  E('BLOOD', '#b3001b', 'Crimson life-force bent into weapons and wards.', ['Blood projectile', 'Blood manipulation', 'Blood-based defense', 'Crimson energy attacks']),
  E('POISON', '#7fd000', 'Toxins that corrode and linger.', ['Poison projectile', 'Toxic cloud', 'Poisonous ground', 'Corrosive attacks']),
  E('SHADOW', '#4b2a66', 'Darkness with substance: concealment and dark energy. Distinct from VOID.', ['Shadow projectile', 'Temporary concealment', 'Shadow movement', 'Dark energy burst']),
  E('LIGHT', '#fff4c2', 'Radiance that blinds, protects and purifies.', ['Light projectile', 'Radiant barrier', 'Flash attack', 'Light-based energy']),
  E('MOON', '#c9c3e6', 'Lunar power: calm fields and empowering moonlight.', ['Lunar projectile', 'Lunar energy field', 'Moonlight effects', 'Lunar enhancement']),
  E('SOLAR', '#ffb300', 'The fury of a sun: flares and radiant heat.', ['Solar projectile', 'Solar flare', 'Radiant heat', 'Solar burst']),
  E('METAL', '#9aa0a6', 'Shaped alloy for barriers and crushing impacts.', ['Metal projectile', 'Metallic barrier', 'Metal manipulation', 'Metallic impact']),
  E('CRYSTAL', '#e07bff', 'Growing lattices and razor shards.', ['Crystal projectile', 'Crystal barrier', 'Crystal growth', 'Shard attacks']),
  E('PSYCHIC', '#ff5fd2', 'The mind as a weapon: disruption and force fields.', ['Psychic projectile', 'Mental disruption', 'Psychic field', 'Mind-based abilities']),
  E('SPIRIT', '#b8f2e6', 'Spectral energy, projection and protection.', ['Spirit energy', 'Spectral attacks', 'Spirit protection', 'Spiritual projection']),
  E('COSMIC', '#9b4dff', 'Nebula energy and stellar fields drawn from the void between stars.', ['Cosmic projectile', 'Nebula energy', 'Cosmic field', 'Stellar effects']),
  E('VOID', '#1a1a1a', 'Nothingness and entropy. Unmakes rather than darkens. Distinct from SHADOW.', ['Entropy attacks', 'Energy collapse', 'Distortion', 'Nothingness-based abilities']),
  E('GRAVITY', '#6a4c93', 'Mass and pull: crush, push and hold in place.', ['Gravity projectile', 'Gravity field', 'Pull and push effects', 'Gravity compression']),
  E('TIME', '#d4af37', 'Bend the flow of moments: slow, rewind, burst.', ['Time distortion', 'Temporary slowdown', 'Time-based defense', 'Temporal burst']),
  E('SOUND', '#ff8fb1', 'Resonance and sonic force.', ['Sonic projectile', 'Sound wave', 'Sonic disruption', 'Resonance attack']),
  E('PLASMA', '#ff3df0', 'Superheated energy beams and fields.', ['Plasma projectile', 'Plasma burst', 'Energy field', 'Plasma beam']),
  E('ASH', '#6e6e6e', 'Choking ash clouds and storms for area control.', ['Ash cloud', 'Ash projectile', 'Ash storm', 'Suffocation area control']),
  E('DREAM', '#c08bff', 'Illusions and disorientation drawn from sleep.', ['Dream projection', 'Illusion', 'Dream energy', 'Disorientation']),
  E('DIMENSION', '#8e44ad', 'Fold space: displacement, rifts and barriers.', ['Dimensional projectile', 'Dimensional distortion', 'Spatial displacement', 'Dimensional barriers']),
  E('RADIATION', '#b6ff00', 'Invisible decay released as fields and discharges.', ['Radiation projectile', 'Radiation field', 'Energy discharge', 'Radiation-based attacks']),
  E('BONE', '#e8dcc0', 'Living bone grown into spears, walls and armor of the body itself.', ['Bone projectile', 'Bone barrier', 'Bone formation', 'Bone-based attacks']),
  E('STAR', '#fff0f8', 'Celestial fire of newborn stars.', ['Star projectile', 'Stellar burst', 'Star energy', 'Celestial effects']),
];

export const SPECIES = [
  { id: 'HUMAN', name: 'Human', desc: 'Male and female survivors.' },
  { id: 'HUMANOID', name: 'Humanoid', desc: 'Original humanoid species.' },
  { id: 'CRYPTID', name: 'Cryptid', desc: 'Cryptids, mythological-inspired and SCP-inspired original creatures.' },
  { id: 'DRAGON', name: 'Dragon', desc: 'Multiple original dragon species.' },
  { id: 'DINOSAUR', name: 'Dinosaur', desc: 'Different dinosaur species and body structures.' },
];

export const DRAW_CATEGORIES = [
  { id: 'dragons', name: 'DRAGONS', glyph: '<path d="M3 17c4-1 6-4 7-8 2 3 5 4 11 3-3 2-5 5-6 9-2-3-6-4-12-4Z"/><path d="M10 9 8 4l4 3"/>' },
  { id: 'dinosaurs', name: 'DINOSAURS', glyph: '<path d="M4 20c1-6 4-9 8-9 2-4 5-6 9-6-1 3-3 5-5 6 1 3 0 6-3 9"/><path d="M8 20v-3M12 20v-2"/>' },
  { id: 'anime', name: 'ANIME', glyph: '<path d="M12 3l2 7 7 2-7 2-2 7-2-7-7-2 7-2Z"/>' },
  { id: 'realism', name: 'REALISM', glyph: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>' },
  { id: 'cartoon', name: 'CARTOON', glyph: '<path d="M4 5h16v10H9l-5 4Z"/>' },
  { id: 'steampunk', name: 'STEAMPUNK', glyph: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/><circle cx="12" cy="12" r="7"/>' },
  { id: 'cyberpunk', name: 'CYBERPUNK', glyph: '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>' },
  { id: 'animals', name: 'ANIMALS', glyph: '<circle cx="7" cy="9" r="1.8"/><circle cx="17" cy="9" r="1.8"/><circle cx="10" cy="5.5" r="1.8"/><circle cx="14" cy="5.5" r="1.8"/><path d="M8 17c0-3 2-5 4-5s4 2 4 5-2 3-4 2-4 1-4-2Z"/>' },
  { id: 'vehicles', name: 'VEHICLES', glyph: '<path d="M3 16v-4l2-5h14l2 5v4Z"/><circle cx="7.5" cy="16.5" r="1.8"/><circle cx="16.5" cy="16.5" r="1.8"/>' },
  { id: 'monsters', name: 'MONSTERS', glyph: '<path d="M5 11a7 7 0 1 1 14 0v4l-2 1v4h-2v-2h-2v2h-2v-2H9v2H7v-4l-2-1Z"/><circle cx="9" cy="11" r="1.6"/><circle cx="15" cy="11" r="1.6"/>' },
];
export const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

export const SECTIONS = {
  home: { name: 'HOME', line: 'HOME is your command center. Your level, challenges, rewards and my guidance live here.' },
  drawing: { name: 'DRAWING', line: 'DRAWING is a library of video lessons. You learn by watching and listening, step by step.' },
  survival: { name: 'SURVIVAL', line: 'SURVIVAL turns your phone sideways into a full 3D apocalypse. The city is still being built.' },
  create: { name: 'CREATE', line: 'CREATE is where you shape your own avatar and creatures. It awakens at level five.' },
  vault: { name: 'VAULT', line: 'The VAULT holds everything you earn: elements, achievements, characters and lore.' },
};

// Contextual tips spoken when the player taps ORB on each screen.
export const TIPS = {
  home: [
    'Every day brings new challenges. Complete them, then claim your reward here on HOME.',
    'Experience raises your level. At level five, the CREATE section awakens.',
    'Tap the bell to see what has changed. Unlocks and achievements are recorded there.',
    'You can ask me questions. Tap ask, and choose a topic or type your own words.',
  ],
  drawing: [
    'There are ten schools of drawing here, from dragons to monsters. Each has four levels of difficulty.',
    'The featured lesson is the fire wyvern. Twelve steps, from the gesture line to the fire breath.',
    'Study every step of a lesson to complete it. Each lesson pays its experience only once.',
    'Most lesson videos are not uploaded yet. Those lessons say so, and their written steps still count.',
    'Tap the heart to favorite a lesson. Favorites appear in your VAULT.',
  ],
  survival: [
    'Choose a mode, then confirm. Survival plays in landscape.',
    'No mode is playable yet. The first playable round, a night in the ruined city, arrives in phase three.',
  ],
  create: [
    'The creator is sealed until level five. Earn experience through challenges to break the seal.',
    'When it opens, you will shape humans, humanoids, cryptids, dragons and dinosaurs.',
    'Every creation follows the old law: ninety two percent living flesh, eight percent technology.',
  ],
  vault: [
    'Thirty elements exist. You begin with fire. Others awaken as you rise in level.',
    'Shadow and Void are not the same. Shadow conceals. Void unmakes.',
    'Achievements are only marked when you have truly earned them.',
  ],
  settings: [
    'You can silence my voice or change its volume here. Subtitles will always carry my words.',
    'Your progress is saved on this device. Cloud accounts will come when the server is built.',
  ],
};

// Scripted help topics for "Ask ORB" (keyword matching, not AI).
export const HELP_TOPICS = [
  { id: 'sections', label: 'The five sections', keys: ['section', 'tab', 'navigate', 'menu', 'where', 'navigation'], answer: 'There are five sections at the bottom of the screen. HOME is your dashboard. DRAWING holds video lessons. SURVIVAL is the 3D game, played in landscape. CREATE is the avatar creator, unlocked at level five. VAULT stores everything you have earned.' },
  { id: 'xp', label: 'Levels and XP', keys: ['xp', 'level', 'experience', 'progress', 'rank', 'earn'], answer: 'You earn experience by completing daily challenges, achievements and, in later phases, lessons, missions and battles. Right now you can earn it by talking to me and visiting every section each day. Claim finished challenges on HOME.' },
  { id: 'create', label: 'Unlocking CREATE', keys: ['create', 'creator', 'avatar', 'unlock', 'character', 'level 5', 'five'], answer: 'The CREATE section unlocks at level five. Until then it stays sealed, and shows how far you have to go. When it opens, you will be able to choose a species, a style and an element for your avatar.' },
  { id: 'elements', label: 'Elements', keys: ['element', 'power', 'fire', 'water', 'bend', 'ability', 'abilities'], answer: 'There are thirty elements, from Fire to Star. You begin with Fire. More awaken as your level rises. Open the VAULT to study each element and its abilities. Combat with elements arrives in phase five.' },
  { id: 'void', label: 'Shadow vs Void', keys: ['void', 'shadow', 'difference', 'entropy', 'nothing'], answer: 'Shadow and Void are separate elements. Shadow is darkness with substance. It conceals and strikes with dark energy. Void is nothingness and entropy. It does not darken things. It unmakes them.' },
  { id: 'survival', label: 'Survival mode', keys: ['survival', 'shoot', 'game', 'play', 'gun', 'weapon', 'zombie', 'mission', 'landscape'], answer: 'Survival is played in landscape. In this build you can choose a mode and test the landscape switch. Phase three brings the first playable round: a ruined city at night, a survivor with a pistol, and zombies. The other modes follow one at a time.' },
  { id: 'drawing', label: 'Drawing lessons', keys: ['draw', 'drawing', 'lesson', 'tutorial', 'video', 'learn', 'sketch'], answer: 'Drawing is a video lesson library. You learn by watching and listening, not by drawing on the screen. There are ten categories and four difficulty levels. Open a lesson, follow its steps, and finish every step to earn experience. Lessons with an uploaded video play in the built in player with captions. Lessons without one say so honestly.' },
  { id: 'daily', label: 'Daily challenges', keys: ['daily', 'challenge', 'reward', 'claim', 'reset', 'today'], answer: 'Daily challenges reset at midnight on your phone. Finish one, then tap claim on HOME to receive the experience. Each reward can only be claimed once per day.' },
  { id: 'achievements', label: 'Achievements', keys: ['achievement', 'trophy', 'badge'], answer: 'Achievements are recorded in the VAULT. Each one is only marked when you have actually done it, and each pays its experience exactly once.' },
  { id: 'voice', label: 'My voice & subtitles', keys: ['voice', 'sound', 'volume', 'mute', 'subtitle', 'audio', 'quiet', 'speak'], answer: 'Open settings with the gear on HOME. There you can turn my voice on or off, change voice, music and effect volumes, and adjust subtitles.' },
  { id: 'controller', label: 'Controllers', keys: ['controller', 'gamepad', 'bluetooth', 'joystick', 'controls'], answer: 'Pair a Bluetooth controller with your phone, then open settings. The controller section shows whether it is detected. Full button mapping arrives with the survival game in phase three.' },
  { id: 'account', label: 'Account & saves', keys: ['account', 'save', 'cloud', 'login', 'sign', 'password', 'backup', 'data'], answer: 'Your profile is saved on this device. You can export a backup file in settings. Cloud accounts, login and online saves need a server, which will be connected in a later phase.' },
  { id: 'install', label: 'Install & offline', keys: ['install', 'offline', 'home screen', 'app', 'download'], answer: 'Open this page in Safari or Chrome, then choose add to home screen. After the first visit, the app opens even without internet.' },
  { id: 'orb', label: 'Who is ORB?', keys: ['who are you', 'orb', 'guide', 'you'], answer: 'I am ORB, the Eternal Guide. I am the soul and guiding presence of your avatar. I will be with you in every section.' },
];

export const LORE = {
  'orb-awakening': { title: 'ORB: The Eternal Guide', body: 'A sphere of black glass holding a living galaxy. ORB is the soul and guiding presence of every survivor’s avatar, older than the ruin it now watches over.' },
};
