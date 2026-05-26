"use client";

import { useState, useEffect, useRef } from"react";
import { motion, AnimatePresence } from"framer-motion";
import { SendHorizontal, X } from"lucide-react";
import { getCookie } from"cookies-next";
import api from"@/src/common/config/api";
import { useTranslations } from"next-intl";

import Markdown from"react-markdown";

interface Message {
 text: string;
 type:"sent" |"received";
}

const LoadingDots = () => {
 return (
 <div className="flex space-x-1">
 <div className="w-2 h-2 bg-default-100 rounded-full animate-bounce delay-0"></div>
 <div className="w-2 h-2 bg-default-100 rounded-full animate-bounce delay-100"></div>
 <div className="w-2 h-2 bg-default-100 rounded-full animate-bounce delay-200"></div>
 </div>
 );
};

export function PiBotChat() {
 const t = useTranslations("piBot");
 const [isOpen, setIsOpen] = useState<boolean>(false);
 const [showBubble, setShowBubble] = useState<boolean>(true);
 const [messages, setMessages] = useState<Message[]>([
 { text: t("welcomeMessage"), type:"received" },
 {
 text: t("introMessage"),
 type:"received",
 },
 //@ts-ignore
 { text: t("questionPrompt"), type:"recedived" },
 ]);

 const [input, setInput] = useState<string>("");
 const [history, setHistory] = useState<{ role: string; content: string }[]>(
 []
 );
 const [isLoading, setIsLoading] = useState<boolean>(false);

 const messagesEndRef = useRef<HTMLDivElement | null>(null);

 const token = getCookie("token") as string | undefined;
 const session = getCookie("session") as string | undefined;

 useEffect(() => {
 if (isOpen) setShowBubble(false);
 else setTimeout(() => setShowBubble(true), 500);
 }, [isOpen]);

 useEffect(() => {
 const handleClickOutside = (event: MouseEvent) => {
 if (!(event.target as HTMLElement).closest(".chat-widget")) {
 setIsOpen(false);
 }
 };
 document.addEventListener("mousedown", handleClickOutside);
 return () => document.removeEventListener("mousedown", handleClickOutside);
 }, []);

 useEffect(() => {
 messagesEndRef.current?.scrollIntoView({ behavior:"smooth" });
 }, [messages, isLoading]);

 const sendMessage = async () => {
 if (input.trim() ==="") return;

 const userMessage = { role:"user", content: input };
 const updatedHistory = [...history, userMessage];
 setHistory(updatedHistory);
 setMessages([...messages, { text: input, type:"sent" }]);

 setInput("");
 setIsLoading(true);

 try {
 const requestBody = {
 message: input,
 history: history.length > 0 ? updatedHistory : [],
 };

 const response = await api.post<{ response: string }>("/pi-bot/message",
 requestBody,
 {
 headers: {
 Authorization: token ?`Bearer ${token}` :"","session-id": session ||"",
 },
 }
 );

 const botResponse = { role:"system", content: response.data.response };
 setHistory((prevHistory) => [...prevHistory, botResponse]);
 setMessages((prevMessages) => [
 ...prevMessages,
 { text: botResponse.content, type:"received" },
 ]);
 } catch (error) {
 console.error("Erro ao enviar mensagem:", error);
 } finally {
 setIsLoading(false);
 }
 };

 return (
 <div className="fixed right-5 bottom-5 flex flex-col items-end chat-widget">
 <AnimatePresence>
 {isOpen && (
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: 20 }}
 className="bg-white text-black rounded-lg mb-3 border-border w-[380px] h-[500px] flex flex-col overflow-hidden"
 >
 <div className="bg-primary text-white p-3 flex items-center justify-between">
 <div className="flex items-center space-x-2">
 <img
 src="/roberto.jpg"
 className="w-8 h-8 rounded-full"
 alt="Pi Bot"
 />
 <div>
 <p className="text-sm font-semibold">
 {t("name")}
 </p>
 <p className="text-xs">{t("onlineNow")}</p>
 </div>
 </div>
 <button onClick={() => setIsOpen(false)} className="text-white">
 <X size={20} />
 </button>
 </div>
 <div className="flex-1 overflow-y-auto p-5 space-y-2 text-sm flex flex-col">
 {messages.map((msg, index) => (
 <p
 key={index}
 className={`p-2 rounded-lg w-fit max-w-[75%] ${msg.type ==="sent" ?"bg-blue-500 text-white self-end" :"bg-default-100 text-black self-start"}`}
 >
 <Markdown>{msg.text}</Markdown>
 </p>
 ))}
 {isLoading && (
 <div className="p-2 rounded-lg w-fit max-w-[75%] bg-default-100 text-black self-start">
 <LoadingDots />
 </div>
 )}
 <div ref={messagesEndRef}></div>
 </div>
 <div className="p-3 border-t flex items-center">
 <input
 type="text"
 placeholder={t("placeholder")}
 className="flex-1 text-sm p-2 border rounded-lg"
 value={input}
 onChange={(e) => setInput(e.target.value)}
 onKeyPress={(e) => e.key ==="Enter" && sendMessage()}
 disabled={isLoading}
 />
 <button
 className="flex items-center justify-center ml-2 h-9 w-9 bg-primary text-white p-2 rounded-lg"
 onClick={sendMessage}
 disabled={isLoading}
 >
 <SendHorizontal size={20} />
 </button>
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 <motion.div
 whileHover={{ scale: 1.1 }}
 whileTap={{ scale: 0.9 }}
 onClick={() => setIsOpen(!isOpen)}
 className="relative cursor-pointer"
 >
 <div className="bg-white border-2 border-border w-16 flex items-center justify-center rounded-full text-white transition duration-300">
 <img
 src="/roberto.jpg"
 className="w-full rounded-full"
 alt="Pi Bot"
 />
 </div>
 <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>

 {/* Balão de conversa no lado esquerdo */}
 <div className="absolute right-full top-1/2 transform -translate-y-1/2 mr-4 w-60 bg-default-100 text-white p-2 rounded-lg">
 <p className="text-sm">{t("greeting")}</p>
 </div>
 </motion.div>
 </div>
 );
}
