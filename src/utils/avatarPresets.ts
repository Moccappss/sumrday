// Comprehensive library of 200+ distinct avatars across diverse artistic styles

export interface AvatarCategory {
  id: string;
  name: string;
  iconName: string;
}

export const AVATAR_CATEGORIES: AvatarCategory[] = [
  { id: 'all', name: 'Semua', iconName: 'Sparkles' },
  { id: 'notionists', name: 'Notionist', iconName: 'Palette' },
  { id: 'lorelei', name: 'Anime / Aesthetic', iconName: 'Heart' },
  { id: 'adventurer', name: 'Adventurer', iconName: 'Compass' },
  { id: 'openpeeps', name: 'Open Peeps', iconName: 'Users' },
  { id: 'bottts', name: 'Tech & Robots', iconName: 'Cpu' },
  { id: 'personas', name: 'Modern 3D', iconName: 'Glasses' },
  { id: 'fun', name: 'Fun & Smile', iconName: 'Smile' },
];

export interface AvatarItem {
  id: string;
  category: string;
  name: string;
  url: string;
}

// 1. Notionists (B&W Minimalist)
const NOTIONISTS_SEEDS = [
  'Arif', 'Alex', 'Sarah', 'Budi', 'Rian', 'Maya', 'Jessica', 'David', 'Dian', 'Reza', 'Felix', 'Luna',
  'Aiden', 'Bella', 'Charlie', 'Diana', 'Ethan', 'Fiona', 'George', 'Hannah', 'Ian', 'Julia', 'Kevin', 'Lily',
  'Marcus', 'Nadia', 'Oliver', 'Priscilla', 'Quinn', 'Rachel', 'Samuel', 'Tara', 'Umar', 'Vanessa', 'William', 'Xenia',
  'Yusuf', 'Zoe', 'Kenji', 'Kaito', 'Sora', 'Hana', 'Minho', 'Jisoo', 'Eunice', 'Mateo', 'Camila', 'Thiago'
];

// 2. Lorelei (Aesthetic Anime / Illustration)
const LORELEI_SEEDS = [
  'Aria', 'Sora', 'Mika', 'Kira', 'Luna', 'Ren', 'Yuki', 'Hana', 'Shin', 'Haru',
  'Kenji', 'Akira', 'Mei', 'Rei', 'Taro', 'Yuna', 'Kai', 'Nao', 'Shiro', 'Kuro',
  'Aoi', 'Rin', 'Shun', 'Nana', 'Hikari', 'Daiki', 'Kazuki', 'Misaki', 'Riku', 'Sayuri',
  'Tsubasa', 'Asuka', 'Ayumi', 'Hayato', 'Kenta', 'Miyu'
];

// 3. Adventurer (RPG & Fantasy Heroes)
const ADVENTURER_SEEDS = [
  'Knight', 'Wizard', 'Rogue', 'Paladin', 'Archer', 'Mage', 'Warrior', 'Cleric', 'Hunter', 'Druid',
  'Shadow', 'Phoenix', 'Dragon', 'Viper', 'Falcon', 'Wolf', 'Titan', 'Specter', 'Valkyrie', 'Ranger',
  'Slayer', 'Guardian', 'Samurai', 'Ninja', 'Sorcerer', 'Oracle', 'Monk', 'Bard', 'Templar', 'Gladiator',
  'Champion', 'Corsair', 'Lancer', 'Warlock'
];

// 4. Open Peeps (Hand-drawn Characters)
const OPENPEEPS_SEEDS = [
  'Peep1', 'Peep2', 'Peep3', 'Peep4', 'Peep5', 'Peep6', 'Peep7', 'Peep8', 'Peep9', 'Peep10',
  'Peep11', 'Peep12', 'Peep13', 'Peep14', 'Peep15', 'Peep16', 'Peep17', 'Peep18', 'Peep19', 'Peep20',
  'Peep21', 'Peep22', 'Peep23', 'Peep24', 'Peep25', 'Peep26', 'Peep27', 'Peep28', 'Peep29', 'Peep30',
  'Peep31', 'Peep32', 'Peep33', 'Peep34', 'Peep35', 'Peep36'
];

// 5. Bottts (Cyborgs & AI Robots)
const BOTTTS_SEEDS = [
  'Cyber1', 'Robo2', 'Nano3', 'Volt4', 'Matrix5', 'Apex6', 'Echo7', 'Nexus8', 'Quantum9', 'Cipher10',
  'Spark11', 'Gizmo12', 'Byte13', 'Glitch14', 'Radar15', 'Pixel16', 'Torque17', 'Orbit18', 'Vortex19', 'Aero20',
  'Zero21', 'Omega22', 'Titan23', 'Alpha24', 'Laser25', 'Flux26', 'Pulse27', 'Aura28'
];

// 6. Personas (Modern Stylized)
const PERSONAS_SEEDS = [
  'James', 'Emily', 'Lucas', 'Chloe', 'Noah', 'Ava', 'Mason', 'Harper', 'Elijah', 'Evelyn',
  'Logan', 'Abigail', 'Jackson', 'Emily', 'Aiden', 'Mia', 'Lucas', 'Ella', 'Liam', 'Scarlett',
  'Ethan', 'Grace', 'Benjamin', 'Chloe', 'Henry', 'Penelope', 'Alexander', 'Riley'
];

// 7. Fun & Big Smile
const FUN_SEEDS = [
  'Joy1', 'Happy2', 'Smile3', 'Sunny4', 'Cheer5', 'Bliss6', 'Spark7', 'Glow8', 'Bright9', 'Shine10',
  'Lucky11', 'Star12', 'Hero13', 'Buddy14', 'Chubby15', 'Snack16', 'Coco17', 'Mochi18', 'Boba19', 'Taco20',
  'Panda21', 'Kitsune22', 'Koala23', 'Otter24', 'Penguin25', 'Dolphin26'
];

export const ALL_AVATARS: AvatarItem[] = [
  ...NOTIONISTS_SEEDS.map((s, i) => ({
    id: `notionist_${i}_${s}`,
    category: 'notionists',
    name: s,
    url: `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(s)}`
  })),
  ...LORELEI_SEEDS.map((s, i) => ({
    id: `lorelei_${i}_${s}`,
    category: 'lorelei',
    name: s,
    url: `https://api.dicebear.com/7.x/lorelei/svg?seed=${encodeURIComponent(s)}`
  })),
  ...ADVENTURER_SEEDS.map((s, i) => ({
    id: `adventurer_${i}_${s}`,
    category: 'adventurer',
    name: s,
    url: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(s)}`
  })),
  ...OPENPEEPS_SEEDS.map((s, i) => ({
    id: `openpeeps_${i}_${s}`,
    category: 'openpeeps',
    name: s,
    url: `https://api.dicebear.com/7.x/open-peeps/svg?seed=${encodeURIComponent(s)}`
  })),
  ...BOTTTS_SEEDS.map((s, i) => ({
    id: `bottts_${i}_${s}`,
    category: 'bottts',
    name: s,
    url: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(s)}`
  })),
  ...PERSONAS_SEEDS.map((s, i) => ({
    id: `personas_${i}_${s}`,
    category: 'personas',
    name: s,
    url: `https://api.dicebear.com/7.x/personas/svg?seed=${encodeURIComponent(s)}`
  })),
  ...FUN_SEEDS.map((s, i) => ({
    id: `fun_${i}_${s}`,
    category: 'fun',
    name: s,
    url: `https://api.dicebear.com/7.x/big-smile/svg?seed=${encodeURIComponent(s)}`
  }))
];

export const getRandomAvatar = (): string => {
  const randomIndex = Math.floor(Math.random() * ALL_AVATARS.length);
  return ALL_AVATARS[randomIndex].url;
};
