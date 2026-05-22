export const colors = {
  background: '#080C18',
  surface: '#0D1526',
  card: '#111E35',
  cardAlt: '#0F1A30',
  primary: '#00FF88',
  primaryDim: '#00CC6A',
  secondary: '#00D4FF',
  secondaryDim: '#009EBF',
  accent: '#FF2D6B',
  accentDim: '#CC1A54',
  warning: '#FFB800',
  warningDim: '#CC9200',
  success: '#00FF88',
  error: '#FF4444',
  text: '#E2E8F0',
  textDim: '#8892A4',
  textMuted: '#4A5568',
  border: '#1A3050',
  borderLight: '#1E4070',
  overlay: 'rgba(0,0,0,0.7)',
} as const;

export const gradients = {
  header: ['#060A14', '#0D1526'] as const,
  card: ['#111E35', '#0D1828'] as const,
  primary: ['#00FF88', '#00CC6A'] as const,
  danger: ['#FF2D6B', '#CC1A54'] as const,
  terminal: ['#020508', '#060C14'] as const,
  splash: ['#050810', '#0A1424', '#060E1C'] as const,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const fontSizes = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 22,
  xxxl: 28,
  huge: 36,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 999,
} as const;

export const shadows = {
  primary: {
    shadowColor: '#00FF88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  secondary: {
    shadowColor: '#00D4FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
};

export type Colors = typeof colors;
export type Spacing = typeof spacing;
export type FontSizes = typeof fontSizes;
export type Radius = typeof radius;
