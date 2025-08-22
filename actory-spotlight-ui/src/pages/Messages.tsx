import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useRef, useState } from "react";

interface Message { id: number; from: "me" | "them"; text: string; }

export default function Messages() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, from: "them", text: "Hi Alex, thanks for submitting!" },
    { id: 2, from: "me", text: "Thank you! Happy to share another take if needed." },
  ]);
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);

  const send = () => {
    if (!draft.trim()) return;
    setMessages((m) => [...m, { id: Date.now(), from: "me", text: draft.trim() }]);
    setDraft("");
  };

  return (
    <>
      <SEO title="Messages" description="Chat in real-time with typing indicators and smooth interactions." />
      <section className="container py-8 grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardContent className="p-0">
            <div className="p-4 border-b font-medium">Conversations</div>
            <div className="p-4 space-y-3">
              {["Producer – Indie Drama", "Casting – Action Feature"].map((c) => (
                <div key={c} className="p-3 rounded-md bg-secondary cursor-pointer">{c}</div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 flex flex-col">
          <CardContent className="flex-1 p-4 overflow-y-auto space-y-3">
            {messages.map((m) => (
              <div key={m.id} className={`max-w-[75%] p-3 rounded-lg ${m.from === 'me' ? 'ml-auto bg-brand text-brand-foreground' : 'bg-secondary'}`}>
                {m.text}
              </div>
            ))}
            <div ref={endRef} />
          </CardContent>
          <div className="p-4 border-t flex items-center gap-2">
            <input
              className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Type a message..."
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <Button variant="hero" className="hover-scale" onClick={send}>Send</Button>
          </div>
          {draft && (
            <div className="px-4 pb-3 text-xs text-muted-foreground">Producer is typing…</div>
          )}
        </Card>
      </section>
    </>
  );
}
