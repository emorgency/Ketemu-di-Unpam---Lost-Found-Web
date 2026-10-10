// Rule-based matching MVP (ARCHITECTURE.md §7). Tidak memakai AI.
// Skor 0-100 dari atribut: category, name, brand/model, color, description, location, time.
// Hasil hanya rekomendasi; keputusan akhir oleh petugas.

function norm(s) {
  return (s || '').toString().toLowerCase().trim()
}
function tokens(s) {
  return norm(s).split(/[^a-z0-9]+/).filter((t) => t.length > 2)
}
function jaccard(a, b) {
  const A = new Set(tokens(a))
  const B = new Set(tokens(b))
  if (!A.size || !B.size) return 0
  let inter = 0
  for (const t of A) if (B.has(t)) inter++
  return inter / (A.size + B.size - inter)
}

export function scoreMatch(lost, found) {
  // lost: {categoryId,name,brand,model,color,description,lostLocation,lostAt}
  // found: {categoryId,name,brand,model,color,description,foundLocation,foundAt}
  let score = 0
  const parts = {}
  if (lost.categoryId && found.categoryId) {
    parts.category = lost.categoryId === found.categoryId ? 30 : 0
    score += parts.category
  }
  const nameSim = jaccard(lost.name, found.name)
  parts.name = Math.round(nameSim * 20)
  score += parts.name

  const bmL = norm(`${lost.brand || ''} ${lost.model || ''}`)
  const bmF = norm(`${found.brand || ''} ${found.model || ''}`)
  if (bmL && bmF) {
    parts.brandModel = bmL === bmF ? 15 : Math.round(jaccard(bmL, bmF) * 15)
    score += parts.brandModel
  } else parts.brandModel = 0

  if (norm(lost.color) && norm(found.color)) {
    parts.color = norm(lost.color) === norm(found.color) ? 10 : 0
    score += parts.color
  } else parts.color = 0

  const descSim = jaccard(lost.description, found.description)
  parts.description = Math.round(descSim * 10)
  score += parts.description

  const locSim = jaccard(lost.lostLocation || lost.foundLocation, found.foundLocation || found.lostLocation)
  parts.location = Math.round(locSim * 10)
  score += parts.location

  try {
    const t1 = new Date(lost.lostAt || lost.foundAt).getTime()
    const t2 = new Date(found.foundAt || found.lostAt).getTime()
    if (!Number.isNaN(t1) && !Number.isNaN(t2)) {
      const days = Math.abs(t1 - t2) / 86400000
      parts.time = days <= 3 ? 5 : days <= 14 ? 3 : days <= 60 ? 1 : 0
      score += parts.time
    } else parts.time = 0
  } catch { parts.time = 0 }

  return { score: Math.min(100, score), parts }
}

export function rankCandidates(lost, foundList) {
  return foundList
    .map((f) => ({ item: f, ...scoreMatch(lost, f) }))
    .sort((a, b) => b.score - a.score)
}
