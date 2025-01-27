import type { NextApiRequest, NextApiResponse } from 'next';

interface ChatRequestBody {
  message: string;
}

interface ChatResponse {
  reply: string;
}

export default function handler(req: NextApiRequest, res: NextApiResponse<ChatResponse>) {
  if (req.method === 'POST') {
    const { message } = req.body as ChatRequestBody;

    // Inserisci qui la chiamata al prompt
    const reply = `Hai detto: "${message}"`;

    return res.status(200).json({ reply });
  }

  res.setHeader('Allow', ['POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}