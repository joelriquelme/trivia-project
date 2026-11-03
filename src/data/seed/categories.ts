import type { Category } from '../../domain/types'

export const SEED_CATEGORIES: Category[] = [
  { id: 'historia', name: 'Historia', short: 'Historia', color: '#e07b39', icon: '🏛️' },
  { id: 'geografia', name: 'Geografía', short: 'Geografía', color: '#2bb39b', icon: '🌎' },
  { id: 'ciencia', name: 'Ciencia', short: 'Ciencia', color: '#4f8ff0', icon: '🔬' },
  { id: 'deportes', name: 'Deportes', short: 'Deportes', color: '#e5484d', icon: '🏅' },
  { id: 'arte-literatura', name: 'Arte y Literatura', short: 'Arte y Lit.', color: '#b565d9', icon: '🎨' },
  { id: 'entretenimiento', name: 'Entretenimiento', short: 'Entreten.', color: '#f2c230', icon: '🎬' },
  { id: 'ucl', name: 'UEFA Champions League', short: 'Champions', color: '#6c7cff', icon: '⭐' },
  { id: 'mundial', name: 'Copa del Mundo', short: 'Mundial', color: '#1f9d55', icon: '🏆' },
  { id: 'libertadores', name: 'Copa Libertadores', short: 'Libertad.', color: '#ff8fab', icon: '🗡️' },
  { id: 'ligas-sudamericanas', name: 'Ligas Sudamericanas', short: 'Ligas Sud.', color: '#a3d65c', icon: '⚽' },
  { id: 'ligas-europeas', name: 'Ligas Europeas', short: 'Ligas Eur.', color: '#22b8e6', icon: '🏟️' },
  { id: 'euro-copa-america', name: 'Eurocopa y Copa América', short: 'Euro/C.Am.', color: '#c98a5e', icon: '🥇' },
]
