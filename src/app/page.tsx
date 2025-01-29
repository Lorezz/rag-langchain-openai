"use client";
import { useState, ChangeEvent, KeyboardEvent, useRef, useEffect } from "react";
import { AiOutlineSend } from "react-icons/ai";

interface Message {
  user: boolean;
  text: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Funzione per scrollare verso l'ultimo messaggio
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    // Aggiungi il messaggio dell'utente
    setMessages((prev) => [...prev, { user: true, text: input }]);
    const userMessage = input;
    setInput("");

    setIsLoading(true);

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
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSend();
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
                {/* Loader visibile durante l'attesa della risposta */}
                {isLoading && (
          <div className="flex justify-start mb-2">
            <div className="p-3 rounded-lg bg-gray-300 text-black max-w-xs">
              <div className="flex space-x-1">
                <span className="block w-2 h-2 bg-black rounded-full animate-bounce"></span>
                <span className="block w-2 h-2 bg-black rounded-full animate-bounce delay-100"></span>
                <span className="block w-2 h-2 bg-black rounded-full animate-bounce delay-200"></span>
              </div>
            </div>
          </div>
        )}

        {/* Riferimento all'ultimo messaggio */}
        <div ref={messagesEndRef} />
      </div>

      <div className='flex items-center p-4 bg-white border-t'>
        <input
          type='text'
          value={input}
          onChange={(e) => handleInputChange(e)}
          onKeyPress={(e) => handleKeyPress(e)}
          placeholder='Scrivi un messaggio...'
          className='flex-1 p-2 border rounded-lg text-black'
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
