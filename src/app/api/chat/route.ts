export async function POST(request: Request) {
  const { message } = await request.json();
  await new Promise(resolve => setTimeout(resolve, 5000));
  const reply = `Hai detto: "${message}"`;
  return Response.json({ reply });
}
