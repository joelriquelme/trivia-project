export interface Scored {
  id: string
  score: number
}

/** Ids of the players tied for the top score among `players`. */
export function leaders<T extends Scored>(players: readonly T[]): string[] {
  if (players.length === 0) return []
  const top = Math.max(...players.map((p) => p.score))
  return players.filter((p) => p.score === top).map((p) => p.id)
}

export interface RankedEntry<T> {
  rank: number
  player: T
}

/** Standard competition ranking (1, 2, 2, 4): tied players share a rank. */
export function ranking<T extends Scored>(players: readonly T[]): RankedEntry<T>[] {
  const sorted = [...players].sort((a, b) => b.score - a.score)
  let lastScore: number | null = null
  let lastRank = 0
  return sorted.map((player, i) => {
    if (player.score !== lastScore) {
      lastRank = i + 1
      lastScore = player.score
    }
    return { rank: lastRank, player }
  })
}
