"use client";

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { PlaceData } from "@/types/place";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Bot, Compass, LoaderCircle, Send, Sparkles, Square } from "lucide-react";
import { useState, type FormEvent } from "react";

const transport = new DefaultChatTransport({ api: "/api/chat" });

interface TravelChatProps {
  data: PlaceData;
}

export function TravelChat({ data }: TravelChatProps) {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status, error, stop } = useChat({ transport });
  const busy = status === "submitted" || status === "streaming";
  const placeContext = {
    overview: data.overview,
    weather: data.weather,
    attractions: data.attractions.slice(0, 8),
    food: data.food.slice(0, 6),
    transport: data.transport.slice(0, 8),
    hotels: data.hotels.slice(0, 6),
    currency: data.currency,
    costOfLiving: data.costOfLiving,
  };

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    void sendMessage({ text }, { body: { placeContext } });
    setInput("");
  }

  const suggestions = [
    `Plan a perfect first day in ${data.overview.name}`,
    "What should I eat first?",
    "Build a rainy-day plan",
  ];

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button className="fixed right-4 bottom-4 z-50 h-13 gap-2 rounded-full px-5 shadow-[0_18px_60px_-15px_var(--place-accent)] sm:right-6 sm:bottom-6" size="lg">
          <Sparkles className="size-4" /> Ask Atlasia
        </Button>
      </SheetTrigger>
      <SheetContent className="data-[side=right]:!w-full gap-0 border-l-white/10 bg-background/96 p-0 backdrop-blur-2xl sm:data-[side=right]:!w-[28rem] sm:data-[side=right]:!max-w-[28rem]">
        <SheetHeader className="border-b border-border/65 px-5 py-5 text-left">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full bg-primary text-primary-foreground"><Compass className="size-4" /></span>
            <div>
              <SheetTitle>Atlasia AI · {data.overview.name}</SheetTitle>
              <SheetDescription>Fast answers powered by Groq and your live place data.</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col">
          <Conversation className="min-h-0 flex-1">
            <ConversationContent className="gap-5 px-5 py-6">
              {messages.length === 0 ? (
                <ConversationEmptyState
                  icon={<Bot className="size-7" />}
                  title={`Ask about ${data.overview.name}`}
                  description="Food trails, day plans, neighbourhood logic, weather pivots—Atlasia uses the dashboard context."
                >
                  <div className="flex size-full flex-col items-center justify-center gap-5 p-6 text-center">
                    <span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary"><Bot className="size-6" /></span>
                    <div>
                      <h3 className="font-medium">Your travel co-pilot</h3>
                      <p className="mt-1 max-w-72 text-sm leading-6 text-muted-foreground">Ask for a plan grounded in the live place data on this page.</p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-2">
                      {suggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          className="rounded-full border border-border bg-card px-3 py-2 text-xs transition hover:border-primary/35 hover:bg-muted"
                          onClick={() => void sendMessage({ text: suggestion }, { body: { placeContext } })}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                </ConversationEmptyState>
              ) : (
                messages.map((message) => (
                  <Message key={message.id} from={message.role}>
                    <MessageContent>
                      {message.parts.map((part, index) =>
                        part.type === "text" ? (
                          <MessageResponse key={`${message.id}-${index}`}>{part.text}</MessageResponse>
                        ) : null
                      )}
                    </MessageContent>
                  </Message>
                ))
              )}
              {status === "submitted" && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground"><LoaderCircle className="size-3.5 animate-spin" /> Atlasia is mapping an answer…</div>
              )}
              {error && <p className="rounded-xl bg-destructive/10 p-3 text-xs text-destructive">The travel companion is unavailable. Check GROQ_API_KEY and try again.</p>}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>

          <form onSubmit={submit} className="border-t border-border/65 bg-background/80 p-4">
            <div className="flex items-center gap-2 rounded-2xl border border-input bg-muted/35 p-1.5 focus-within:ring-2 focus-within:ring-ring/45">
              <Input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={`Ask about ${data.overview.name}…`}
                className="border-0 bg-transparent shadow-none focus-visible:ring-0 dark:bg-transparent"
              />
              {busy ? (
                <Button type="button" size="icon" variant="secondary" className="rounded-xl" onClick={() => void stop()} aria-label="Stop response"><Square className="size-3.5 fill-current" /></Button>
              ) : (
                <Button type="submit" size="icon" className="rounded-xl" disabled={!input.trim()} aria-label="Send message"><Send className="size-4" /></Button>
              )}
            </div>
            <p className="mt-2 px-1 text-[10px] text-muted-foreground">Verify time-sensitive travel details before booking.</p>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
