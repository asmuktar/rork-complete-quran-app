// Islamic-inspired color palette with gold, green, and soft black - Eye-friendly design
export const Colors = {
  // Primary Islamic colors - Soft and eye-friendly
  primary: '#2E7D32', // Soft Islamic green
  primaryLight: '#66BB6A', // Light green
  primaryDark: '#1B5E20', // Deep green
  secondary: '#D4AF37', // Islamic gold
  secondaryLight: '#F4E4BC', // Light gold
  accent: '#8BC34A', // Fresh green
  
  // Background colors - Warm and comfortable
  background: '#FDF6E3', // Warm cream background
  surface: '#FFFFFF', // Pure white
  surfaceVariant: '#F8F5F0', // Warm light gray
  cardBackground: '#FEFEFE', // Card background
  
  // Text colors - Soft on eyes
  text: '#2C3E50', // Soft dark blue-gray
  textSecondary: '#5D6D7E', // Medium gray
  textLight: '#85929E', // Light gray
  textOnPrimary: '#FFFFFF', // White on primary
  textOnSecondary: '#2C3E50', // Dark on secondary
  textMuted: '#95A5A6', // Muted text
  
  // Islamic theme colors
  islamicGold: '#D4AF37',
  islamicGreen: '#2E7D32',
  islamicCream: '#FDF6E3',
  islamicBeige: '#F4E4BC',
  
  // Status colors
  success: '#27AE60',
  warning: '#F39C12',
  error: '#E74C3C',
  info: '#3498DB',
  
  // Prayer time colors
  fajr: '#4A90E2',
  dhuhr: '#F5A623',
  asr: '#F39C12',
  maghrib: '#E94B3C',
  isha: '#7B68EE',
  
  // Gradients - Warm and Islamic
  gradients: {
    primary: ['#2E7D32', '#66BB6A'],
    secondary: ['#D4AF37', '#F4E4BC'],
    accent: ['#8BC34A', '#AED581'],
    sunset: ['#FF8A65', '#FFCC80'],
    ocean: ['#4FC3F7', '#81D4FA'],
    islamic: ['#D4AF37', '#2E7D32'],
    warm: ['#FDF6E3', '#F4E4BC'],
    mosque: ['#2E7D32', '#D4AF37', '#2E7D32'],
  },
  
  // Opacity variants
  overlay: 'rgba(44, 62, 80, 0.5)',
  overlayLight: 'rgba(44, 62, 80, 0.3)',
  primaryOverlay: 'rgba(46, 125, 50, 0.1)',
  secondaryOverlay: 'rgba(212, 175, 55, 0.1)',
  goldOverlay: 'rgba(212, 175, 55, 0.15)',
};

// Legacy support
const tintColorLight = Colors.primary;
const tintColorDark = '#fff';

export default {
  light: {
    text: Colors.text,
    background: Colors.background,
    tint: tintColorLight,
    tabIconDefault: Colors.textLight,
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#fff',
    background: '#000',
    tint: tintColorDark,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorDark,
  },
};