import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  fonts: {
    heading: '"Inter", sans-serif',
    body: '"Inter", sans-serif',
  },
  colors: {
    brand: {
      50: '#f0f9f4',   // Very light green
      100: '#dcfce7',  // Light green
      200: '#bbf7d0',  // Lighter green
      300: '#86efac',  // Medium light green
      400: '#4ade80',  // Medium green
      500: '#22c55e',  // Primary green (main brand color)
      600: '#16a34a',  // Darker green
      700: '#15803d',  // Dark green
      800: '#166534',  // Very dark green
      900: '#14532d',  // Darkest green
    },
    // Adding secondary colors from the logo
    secondary: {
      50: '#fefdf8',   // Very light gold
      100: '#fef3c7',  // Light gold
      200: '#fde68a',  // Lighter gold
      300: '#fcd34d',  // Medium light gold
      400: '#fbbf24',  // Medium gold
      500: '#d97706',  // Primary gold/brown
      600: '#b45309',  // Darker gold/brown
      700: '#92400e',  // Dark gold/brown
      800: '#78350f',  // Very dark gold/brown
      900: '#451a03',  // Darkest gold/brown
    },
    accent: {
      50: '#fef2f2',   // Very light red
      100: '#fee2e2',  // Light red
      200: '#fecaca',  // Lighter red
      300: '#fca5a5',  // Medium light red
      400: '#f87171',  // Medium red
      500: '#dc2626',  // Primary red (accent color)
      600: '#b91c1c',  // Darker red
      700: '#991b1b',  // Dark red
      800: '#7f1d1d',  // Very dark red
      900: '#450a0a',  // Darkest red
    },
  },
  styles: {
    global: {
      body: {
        bg: 'gray.50',
      },
    },
  },
});

export default theme;
