export function formatLastUpdated(iso) {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function playerInitials(name) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2)
}
