// Neon style colors matching project theme
export const CHART_COLORS = {
  // Neon gradient colors
  primary: ['#6366F1', '#8B5CF6', '#A855F7'],
  line: ['#6366F1', '#8B5CF6'],
  pie: ['#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#C026D3'],
  bar: ['#6366F1', '#8B5CF6', '#A855F7'],
  // Status colors
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#6366F1',
};

// Neon axis styles
export const AXIS_STYLES = {
  stroke: '#9CA3AF',
  tick: { fill: '#9CA3AF', fontSize: 11 },
  tickLine: false,
  axisLine: false,
};

// Neon grid styles
export const GRID_STYLES = {
  strokeDasharray: '3 3',
  stroke: '#374151',
  opacity: 0.2,
  vertical: false,
};

// Neon tooltip cursor
export const TOOLTIP_CURSOR = {
  stroke: '#6366F1',
  strokeWidth: 2,
  strokeDasharray: '5 5',
  opacity: 0.5,
};

// Neon chart container with glow
export const CHART_CONTAINER_CLASS = `
  relative bg-white/5 dark:bg-gray-900/50 rounded-2xl 
  p-6 border border-indigo-500/20
  shadow-[0_0_30px_rgba(99,102,241,0.15)]
  hover:shadow-[0_0_50px_rgba(139,92,246,0.25)]
  hover:border-indigo-500/40
  transition-all duration-500
  backdrop-blur-sm
`;

// Neon title with glow effect
export const CHART_TITLE_CLASS = `
  text-lg font-semibold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 
  bg-clip-text text-transparent mb-6
  drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]
`;

// Subtitle
export const CHART_SUBTITLE_CLASS = `
  text-sm text-gray-400 font-normal
`;
