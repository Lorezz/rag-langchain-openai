"use client";
import { useState, ChangeEvent, KeyboardEvent } from "react";
import { AiOutlineSend } from "react-icons/ai";

interface Message {
  user: boolean;
  text: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");

  const handleSend = async () => {
    if (!input.trim()) return;

    // Aggiungi il messaggio dell'utente
    setMessages((prev) => [...prev, { user: true, text: input }]);
    const userMessage = input;
    setInput("");

    try {
      // Invio del messaggio all'API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.ok) throw new Error("Errore nella richiesta");

      const data = await response.json();
      setMessages((prev) => [...prev, { user: false, text: data.reply }]);
    } catch (error) {
      console.error("Errore:", error);
      setMessages((prev) => [
        ...prev,
        { user: false, text: "Errore nella risposta del server." },
      ]);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <div className='flex flex-col h-screen bg-gray-100'>
      <div className='flex-1 overflow-y-auto p-4'>
        {messages?.map((msg, index) => (
          <div
            key={index}
            className={`flex ${
              msg.user ? "justify-end" : "justify-start"
            } mb-2`}
          >
            <div
              className={`p-3 rounded-lg ${
                msg.user ? "bg-blue-500 text-white" : "bg-gray-300 text-black"
              } max-w-xs`}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      <div className='flex items-center p-4 bg-white border-t'>
        <input
          type='text'
          value={input}
          onChange={(e) => handleInputChange(e)}
          onKeyPress={(e) => handleKeyPress(e)}
          placeholder='Scrivi un messaggio...'
          className='flex-1 p-2 border rounded-lg'
        />
        <button
          onClick={() => handleSend()}
          className='ml-2 p-2 bg-blue-500 text-white rounded-lg'
        >
          <AiOutlineSend />
        </button>
      </div>
    </div>
  );
}
