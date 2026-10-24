export type ThoughtKind = 'note' | 'wikilink' | 'tag' | 'math' | 'sketch';

export interface HeroThought {
  id: string;
  kind: ThoughtKind;
  title: string;
  excerpt: string;
  thetaDeg: number;
  phiDeg: number;
  radiusScale: number;
  staticX: number;
  staticY: number;
  mobileVisible: boolean;
  linksTo: string[];
  fullMarkdown: string;
  sectionHref: string;
  sectionLabel: string;
  mathId?: 'euler' | 'fourier' | 'gradient';
  sketchId?: 'polyhedron' | 'ornithopter' | 'compass';
}

export const HERO_THOUGHTS: readonly HeroThought[] = [
  {
    id: 'note-pacioli', kind: 'note', title: 'Meeting with [[Luca Pacioli]]',
    excerpt: '• Collaborating on: [[De Divina Proportione]]',
    thetaDeg: -22, phiDeg: 24, radiusScale: 1.05, staticX: -32, staticY: -26, mobileVisible: true,
    linksTo: ['wiki-proportione', 'sketch-polyhedron', 'math-euler'],
    fullMarkdown: '# Meeting with Luca Pacioli\nReviewing 60 polyhedra drawings for Pacioli’s treatise on the golden ratio φ.',
    sectionHref: '#workflows', sectionLabel: 'Workflows & Meetings',
  },
  {
    id: 'wiki-proportione', kind: 'wikilink', title: '[[De Divina Proportione]]',
    excerpt: 'Treatise on Harmonic Ratio · 1509',
    thetaDeg: 34, phiDeg: 28, radiusScale: 1.02, staticX: 32, staticY: -28, mobileVisible: true,
    linksTo: ['note-pacioli', 'sketch-polyhedron'],
    fullMarkdown: 'The divine golden ratio (φ = 1.618) as the universal blueprint connecting art and nature.',
    sectionHref: '#features', sectionLabel: 'Bidirectional Links',
  },
  {
    id: 'sketch-polyhedron', kind: 'sketch', title: 'Icosahedron Study',
    excerpt: 'Leonardo da Vinci · ink drawing', sketchId: 'polyhedron',
    thetaDeg: 6, phiDeg: 40, radiusScale: 0.94, staticX: 4, staticY: -38, mobileVisible: true,
    linksTo: ['wiki-proportione', 'sketch-compass'],
    fullMarkdown: 'Solid and vacant regular polyhedra drawn with geometric perspective.',
    sectionHref: '#features', sectionLabel: 'Sketches & Canvas',
  },
  {
    id: 'note-fleeting', kind: 'note', title: 'On Fleeting Ideas.md',
    excerpt: 'Capture thoughts in <380ms before they vanish.',
    thetaDeg: -68, phiDeg: 10, radiusScale: 1.04, staticX: -42, staticY: -8, mobileVisible: true,
    linksTo: ['wiki-zettelkasten', 'tag-localfirst'],
    fullMarkdown: '# On Fleeting Ideas\nCapture with global quick-capture in <380ms. Link into your organic web.',
    sectionHref: '#features', sectionLabel: 'Quick Capture',
  },
  {
    id: 'math-euler', kind: 'math', title: "Euler's Identity",
    excerpt: 'e^(iπ) + 1 = 0', mathId: 'euler',
    thetaDeg: 82, phiDeg: 14, radiusScale: 1.0, staticX: 42, staticY: -10, mobileVisible: true,
    linksTo: ['note-pacioli', 'sketch-compass'],
    fullMarkdown: '$$e^{i\\pi} + 1 = 0$$\nRendered inline via cursor-gated KaTeX with zero layout shift.',
    sectionHref: '#features', sectionLabel: 'Native LaTeX',
  },
  {
    id: 'wiki-zettelkasten', kind: 'wikilink', title: '[[zettelkasten]]',
    excerpt: '14 backlinks · atomic notes',
    thetaDeg: -112, phiDeg: 18, radiusScale: 1.06, staticX: -36, staticY: 18, mobileVisible: true,
    linksTo: ['note-fleeting', 'tag-localfirst'],
    fullMarkdown: 'Bidirectional `[[zettelkasten]]` stem resolution powered by local SQLite + FTS5.',
    sectionHref: '#features', sectionLabel: 'Knowledge Graph',
  },
  {
    id: 'tag-localfirst', kind: 'tag', title: '#local-first/sqlite',
    excerpt: 'FTS5 search < 2ms · 100% private',
    thetaDeg: 58, phiDeg: -6, radiusScale: 1.02, staticX: 34, staticY: 16, mobileVisible: true,
    linksTo: ['note-fleeting', 'note-syncthing'],
    fullMarkdown: 'All notes stored as plain Markdown on disk with zero cloud lock-in.',
    sectionHref: '#safespace', sectionLabel: 'Privacy & Storage',
  },
  {
    id: 'note-syncthing', kind: 'note', title: 'Vault Sync.md',
    excerpt: 'Encrypted P2P sync between devices.',
    thetaDeg: 122, phiDeg: 18, radiusScale: 1.06, staticX: 36, staticY: 20, mobileVisible: false,
    linksTo: ['tag-localfirst', 'sketch-ornithopter'],
    fullMarkdown: '# Vault Sync\nDirect Desktop ↔ Mobile sync via encrypted peer-to-peer manifest diffing.',
    sectionHref: '#sync', sectionLabel: 'P2P Device Sync',
  },
  {
    id: 'sketch-ornithopter', kind: 'sketch', title: 'Codex Atlanticus f.846',
    excerpt: 'Mechanical wing rib study', sketchId: 'ornithopter',
    thetaDeg: -154, phiDeg: 12, radiusScale: 1.02, staticX: -26, staticY: 24, mobileVisible: true,
    linksTo: ['note-syncthing', 'sketch-compass'],
    fullMarkdown: 'Inspired by Leonardo’s notebooks: plain files on disk that endure for decades.',
    sectionHref: '#features', sectionLabel: 'Notebook Studies',
  },
  {
    id: 'sketch-compass', kind: 'sketch', title: 'Proportional Compass',
    excerpt: 'Sector ratio tool study', sketchId: 'compass',
    thetaDeg: 154, phiDeg: 6, radiusScale: 0.98, staticX: 18, staticY: 28, mobileVisible: false,
    linksTo: ['sketch-polyhedron', 'math-euler'],
    fullMarkdown: 'Mathematical instrument for calculating extreme and mean ratio.',
    sectionHref: '#features', sectionLabel: 'Precision Tools',
  },
];
