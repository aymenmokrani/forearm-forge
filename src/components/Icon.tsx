import type { Equipment } from '../domain/types';

const PATHS = {
  today: 'M13 2 4 14h7l-1 8 9-12h-7l1-8Z',
  plan: 'M4 6h16v14H4zM4 10h16M9 3v4M15 3v4',
  library: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
  history: 'M12 7v5l3 2M3.5 12a8.5 8.5 0 1 0 2.5-6M3 4v4h4',
  me: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21c1.5-4 4.5-6 8-6s6.5 2 8 6',
  play: 'M7 4.5v15l12-7.5-12-7.5Z',
  check: 'm5 12.5 4.5 4.5L19 7.5',
  x: 'M6 6l12 12M18 6 6 18',
  left: 'm15 5-7 7 7 7',
  right: 'm9 5 7 7-7 7',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  trophy: 'M8 4h8v5a4 4 0 0 1-8 0V4ZM8 6H4.5a3.5 3.5 0 0 0 3.6 4M16 6h3.5a3.5 3.5 0 0 1-3.6 4M12 13v4M8.5 20h7M10 17h4v3h-4z',
  alert: 'M12 3 2 20h20L12 3ZM12 10v4M12 17v.5',
  trash: 'M5 7h14M10 4h4M7 7l1 13h8l1-13M10 11v6M14 11v6',
  download: 'M12 4v11M7 10l5 5 5-5M5 20h14',
  upload: 'M12 16V5M7 10l5-5 5 5M5 20h14',
  timer: 'M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM12 9v4l2.5 1.5M10 2h4',
  undo: 'M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3',
  flame: 'M12 3c1 3 5 5 5 10a5 5 0 0 1-10 0c0-2.5 1.5-4 2.5-5 .3 2 1.5 3 2.5 3-1-3 0-6 0-8Z',
  edit: 'M4 20h4L19 9l-4-4L4 16v4ZM13.5 6.5l4 4',
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 22, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}

const GLYPHS: Record<Equipment, string> = {
  bodyweight: 'M8 21v-7l-2-3V6.5a1.5 1.5 0 0 1 3 0V10M9 9V4.5a1.5 1.5 0 0 1 3 0V9M12 9V5.5a1.5 1.5 0 0 1 3 0V10M15 10V7.5a1.5 1.5 0 0 1 3 0V14c0 3-2 5-4 7',
  gripper: 'M7 3c-1 6-1 11 1 15M17 3c1 6 1 11-1 15M8 18a4 3 0 0 0 8 0M10 16.5a2 1.5 0 0 0 4 0',
  dumbbell: 'M3 10v4M6 7v10M18 7v10M21 10v4M6 12h12',
  barbell: 'M2 12h20M5 7v10M8 8.5v7M16 8.5v7M19 7v10',
  kettlebell: 'M8.5 9a3.5 3.5 0 1 1 7 0M6 15a6 6 0 1 0 12 0 6 6 0 0 0-12 0ZM8 9h8',
  plate: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
  'wrist-roller': 'M3 6h18M12 6v9M9 15h6v5H9z',
  band: 'M5 8c0-3 14-3 14 0v8c0 3-14 3-14 0V8ZM8 9c0-1.5 8-1.5 8 0v6c0 1.5-8 1.5-8 0V9Z',
  'rice-bucket': 'M5 8h14l-1.5 12h-11L5 8ZM4 8c2-2 14-2 16 0M9 12h.01M13 14h.01M11 17h.01M15 11h.01',
  towel: 'M6 4h12v14l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5L6 18V4ZM6 8h12',
  'pullup-bar': 'M3 5h18M6 5v-2M18 5V3M9 5v5M15 5v5M9 10a3 3 0 0 0 6 0',
  'fat-grip': 'M3 12h3M18 12h3M6 8h12v8H6zM9 8v8M15 8v8',
};

export function EquipGlyph({ equipment, size = 28 }: { equipment: Equipment; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={GLYPHS[equipment]} />
    </svg>
  );
}
