export interface SoftwareEmblem {
  id: string;
  name: string;
  category: 'design' | 'video' | '3d' | 'tech' | 'ai' | 'other';
  color: string;
  iconType: string;
}

export const POPULAR_SOFTWARE_LIST: SoftwareEmblem[] = [
  // Design & Vector
  { id: 'figma', name: 'Figma', category: 'design', color: '#F24E1E', iconType: 'figma' },
  { id: 'photoshop', name: 'Photoshop', category: 'design', color: '#31A8FF', iconType: 'photoshop' },
  { id: 'illustrator', name: 'Illustrator', category: 'design', color: '#FF9A00', iconType: 'illustrator' },
  { id: 'canva', name: 'Canva', category: 'design', color: '#00C4CC', iconType: 'canva' },
  { id: 'procreate', name: 'Procreate', category: 'design', color: '#000000', iconType: 'procreate' },
  { id: 'lightroom', name: 'Lightroom', category: 'design', color: '#31A8FF', iconType: 'lightroom' },
  { id: 'coreldraw', name: 'CorelDRAW', category: 'design', color: '#008751', iconType: 'coreldraw' },

  // Video & Motion
  { id: 'premiere', name: 'Premiere Pro', category: 'video', color: '#9999FF', iconType: 'premiere' },
  { id: 'aftereffects', name: 'After Effects', category: 'video', color: '#9999FF', iconType: 'aftereffects' },
  { id: 'davinci', name: 'DaVinci Resolve', category: 'video', color: '#FF4500', iconType: 'davinci' },
  { id: 'capcut', name: 'CapCut', category: 'video', color: '#000000', iconType: 'capcut' },

  // 3D & Game
  { id: 'blender', name: 'Blender 3D', category: '3d', color: '#F5792A', iconType: 'blender' },
  { id: 'cinema4d', name: 'Cinema 4D', category: '3d', color: '#002B49', iconType: 'cinema4d' },
  { id: 'spline', name: 'Spline 3D', category: '3d', color: '#FF3366', iconType: 'spline' },
  { id: 'unreal', name: 'Unreal Engine', category: '3d', color: '#0E1128', iconType: 'unreal' },
  { id: 'unity', name: 'Unity', category: '3d', color: '#222C37', iconType: 'unity' },

  // Tech & Code
  { id: 'react', name: 'React', category: 'tech', color: '#61DAFB', iconType: 'react' },
  { id: 'nextjs', name: 'Next.js', category: 'tech', color: '#000000', iconType: 'nextjs' },
  { id: 'typescript', name: 'TypeScript', category: 'tech', color: '#3178C6', iconType: 'typescript' },
  { id: 'tailwind', name: 'Tailwind CSS', category: 'tech', color: '#06B6D4', iconType: 'tailwind' },
  { id: 'flutter', name: 'Flutter', category: 'tech', color: '#02569B', iconType: 'flutter' },
  { id: 'python', name: 'Python', category: 'tech', color: '#3776AB', iconType: 'python' },
  { id: 'vscode', name: 'VS Code', category: 'tech', color: '#007ACC', iconType: 'vscode' },
  { id: 'webflow', name: 'Webflow', category: 'tech', color: '#4353FF', iconType: 'webflow' },
  { id: 'wordpress', name: 'WordPress', category: 'tech', color: '#21759B', iconType: 'wordpress' },

  // AI & Tools
  { id: 'chatgpt', name: 'ChatGPT / AI', category: 'ai', color: '#10A37F', iconType: 'chatgpt' },
  { id: 'midjourney', name: 'Midjourney', category: 'ai', color: '#5865F2', iconType: 'midjourney' }
];

export const getSoftwareEmblem = (nameOrId: string): SoftwareEmblem => {
  const norm = (nameOrId || '').trim().toLowerCase();
  const found = POPULAR_SOFTWARE_LIST.find(
    (s) => s.id === norm || s.name.toLowerCase() === norm
  );
  if (found) return found;
  return {
    id: norm,
    name: nameOrId,
    category: 'other',
    color: '#7c3aed',
    iconType: 'custom'
  };
};
