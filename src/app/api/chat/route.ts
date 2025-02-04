export async function POST(request: Request) {
  const { message } = await request.json();
  const reply = `Hai detto: "${message}"`;





  return Response.json({ reply });
}
