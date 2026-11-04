export const GRADES = ['3', '4', '4+', '5', '5+', '6A', '6A+', '6B', '6B+', '6C', '6C+', '7A', '7A+', '7B', '7B+', '7C', '7C+', '8A', '8A+', '8B', '8B+', '8C', '8C+']
export const gradeIndex = (g: string) => GRADES.indexOf(g)

/** Couleur de l'étiquette selon le niveau, comme les codes couleur des salles. */
export const GRADE_LEVELS = [
  { label: '3–4+', upTo: '4+', bg: '#22c55e', fg: '#0b1a10' },
  { label: '5–5+', upTo: '5+', bg: '#3b82f6', fg: '#ffffff' },
  { label: '6A–6B+', upTo: '6B+', bg: '#facc15', fg: '#1a1600' },
  { label: '6C–6C+', upTo: '6C+', bg: '#f97316', fg: '#1a0b00' },
  { label: '7', upTo: '7C+', bg: '#ef4444', fg: '#ffffff' },
  { label: '8', upTo: '8C+', bg: '#0a0a0a', fg: '#ffffff' },
]
export function gradeColors(g: string) {
  const i = gradeIndex(g)
  return GRADE_LEVELS.find(l => i <= gradeIndex(l.upTo)) ?? GRADE_LEVELS[GRADE_LEVELS.length - 1]
}
