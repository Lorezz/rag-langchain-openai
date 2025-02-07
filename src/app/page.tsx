"use client";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { AiOutlineLoading3Quarters, AiOutlineSend } from "react-icons/ai";
import { send } from "./chat-service";

interface Message {
  user: boolean;
  text: string;
}

export default function Home() {
  //#region state
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  //#endregion

  //#region refs
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  //#endregion

  //#region event handlers
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const message = input;

    setMessages((prev) => [...prev, { user: true, text: input }]);
    setInput("");
    setIsLoading(true);

    try {
      const data = await send({ message });
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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    handleSend();
  }
  //#endregion

  //#region effects
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  //#endregion

  return (
    <div className='flex flex-col h-screen bg-gray-100  max-w-6xl mx-auto'>
      <div className='bg-blue-500 text-center text-2xl font-bold p-4'>
        PA Digitale 2026 - FAQS Chatbot
      </div>
      <div className='flex-1 overflow-y-auto p-4 border border-gray-300'>
        {messages.length === 0 && (
          <div className='flex justify-start mb-2'>
            <div className='p-3 rounded-lg bg-gray-300 text-black max-w-xs'>
              Ciao! Come posso aiutarti?
            </div>
          </div>
        )}
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
              } max-w-xs md:max-w-md  lg:max-w-lg`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {/* Loader visibile durante l'attesa della risposta */}
        {isLoading && (
          <div className='flex justify-start mb-2'>
            <div className='p-3 rounded-lg bg-gray-300 text-black max-w-xs'>
              <div className='flex space-x-1'>
                <span className='block w-2 h-2 bg-black rounded-full animate-bounce'></span>
                <span className='block w-2 h-2 bg-black rounded-full animate-bounce delay-100'></span>
                <span className='block w-2 h-2 bg-black rounded-full animate-bounce delay-200'></span>
              </div>
            </div>
          </div>
        )}

        {/* Riferimento all'ultimo messaggio */}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={(e) => handleSubmit(e)}>
        <div className='flex items-center p-4 bg-white border-t'>
          <input
            type='text'
            value={input}
            ref={inputRef}
            onChange={(e) => handleInputChange(e)}
            placeholder='Scrivi un messaggio...'
            className='flex-1 p-2 border rounded-lg text-black'
          />
          <button
            type='submit'
            disabled={isLoading}
            className='ml-2 p-2 bg-blue-500 text-white rounded-lg'
          >
            {isLoading ? <AiOutlineLoading3Quarters /> : <AiOutlineSend />}
          </button>
        </div>
      </form>
    </div>
  );
}
