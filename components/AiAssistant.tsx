"use client";

import { useEffect, useRef, useState } from "react";
import { SQUAD_UPDATED_EVENT, readSquadPlayerIds, readBenchPlayerIds } from "@/lib/squad-storage";
import { MEMBER_EMAIL_STORAGE_KEY } from "@/lib/member-storage";

interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED_QUESTIONS = ["Who should I captain?", "Who should I transfer out?", "Is my bench right?"];

export default function AiAssistant() {
  const [squadIds, setSquadIds] = useState<number[]>([]);
  const [benchIds, setBenchIds] = useState<number[]>([]);
  const [email, setEmail] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function reload() {
      setSquadIds(readSquadPlayerIds());
      setBenchIds(readBenchPlayerIds());
    }
    Promise.resolve().then(() => {
      reload();
      try {
        setEmail(window.localStorage.getItem(MEMBER_EMAIL_STORAGE_KEY));
      } catch {
        setEmail(null);
      }
    });
    window.addEventListener(SQUAD_UPDATED_EVENT, reload);
    return () => window.removeEventListener(SQUAD_UPDATED_EVENT, reload);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, loading]);

  async function ask(question: string) {
    const trimmed = question.trim();
    if (!trimmed || loading || !email) return;

    const nextMessages: ChatTurn[] = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          question: trimmed,
          squadPlayerIds: squadIds,
          benchPlayerIds: benchIds,
          history: messages,
        }),
      });
      const data: { answer?: string; error?: string } = await res.json();
      if (!res.ok || !data.answer) {
        setError(data.error || "Couldn't get an answer just now - try again in a bit.");
        setMessages(messages); // roll back the optimistic user turn
        return;
      }
      setMessages([...nextMessages, { role: "assistant", content: data.answer }]);
    } catch {
      setError("Couldn't get an answer just now - try again in a bit.");
      setMessages(messages);
    } finally {
      setLoading(false);
    }
  }

  if (!email) return null;

  return (
    <div>
      {squadIds.length === 0 && (
        <p className="mb-3 text-sm text-black/50 dark:text-white/50">
          Save a squad in &quot;My team&quot; above for advice tailored to your actual team - you can
          still ask general questions without one.
        </p>
      )}

      <div className="max-h-96 overflow-y-auto rounded-lg border border-black/10 bg-white p-3 dark:border-white/15 dark:bg-neutral-900">
        {messages.length === 0 ? (
          <p className="text-sm text-black/40 dark:text-white/40">
            Ask anything about your squad — captaincy, transfers, your bench.
          </p>
        ) : (
          <ul className="space-y-3">
            {messages.map((m, i) => (
              <li key={i} className={m.role === "user" ? "text-right" : "text-left"}>
                <span
                  className={`inline-block max-w-[85%] rounded-lg px-3 py-2 text-left text-sm ${
                    m.role === "user"
                      ? "bg-purple-600 text-white"
                      : "bg-black/[.04] text-black/90 dark:bg-white/[.08] dark:text-white/90"
                  }`}
                >
                  {m.content}
                </span>
              </li>
            ))}
          </ul>
        )}
        {loading && <p className="mt-3 text-sm text-black/40 dark:text-white/40">Thinking…</p>}
        <div ref={bottomRef} />
      </div>

      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {messages.length === 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => ask(q)}
              className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-medium hover:bg-black/[.04] dark:border-white/15 dark:hover:bg-white/[.06]"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className="mt-3 flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your squad..."
          disabled={loading}
          className="min-w-0 flex-1 rounded-md border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-purple-500 disabled:opacity-50 dark:border-white/15 dark:bg-neutral-900"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="whitespace-nowrap rounded-md bg-purple-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
