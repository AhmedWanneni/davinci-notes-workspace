export interface CoverPreset {
  id: string;
  name: string;
  category: "Art" | "Nature" | "Literature" | "Minimal";
  url: string;
  defaultY?: number;
}

export const COVER_PRESETS: readonly CoverPreset[] = [
  {
    id: "alice-reading",
    name: "Alice in Wonderland",
    category: "Literature",
    url: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1600&q=80",
    defaultY: 50,
  },
  {
    id: "classic-library",
    name: "Vintage Library",
    category: "Literature",
    url: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1600&q=80",
    defaultY: 40,
  },
  {
    id: "starry-night",
    name: "Starry Night",
    category: "Art",
    url: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1600&q=80",
    defaultY: 30,
  },
  {
    id: "great-wave",
    name: "The Great Wave",
    category: "Art",
    url: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1600&q=80",
    defaultY: 45,
  },
  {
    id: "misty-mountains",
    name: "Misty Mountains",
    category: "Nature",
    url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80",
    defaultY: 50,
  },
  {
    id: "autumn-forest",
    name: "Autumn Forest",
    category: "Nature",
    url: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1600&q=80",
    defaultY: 50,
  },
  {
    id: "soft-gradient",
    name: "Velvet Gradient",
    category: "Minimal",
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&q=80",
    defaultY: 50,
  },
  {
    id: "abstract-geometry",
    name: "Minimalist Geometry",
    category: "Minimal",
    url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80",
    defaultY: 50,
  },
];
