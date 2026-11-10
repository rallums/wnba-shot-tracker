// Season over. Seeding permanently disabled.
export async function POST() {
  return new Response(null, { status: 405 })
}
