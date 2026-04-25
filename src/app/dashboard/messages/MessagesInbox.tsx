"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { MessageBubble } from "@/components/ui/MessageBubble";
import { LuxuryButton } from "@/components/ui/LuxuryButton";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

type Conv = { id: string; subject: string; updated_at: string };
type M = { id: string; body: string; created_at: string; sender_id: string; sender_name: string };
type Props = { isAdmin: boolean; currentUserId: string; currentEmail: string | null | undefined };

export function MessagesInbox(p: Props) {
  const sp = useSearchParams();
  const r = useRouter();
  const [convs, setConvs] = useState<Conv[]>([]);
  const [cid, setCid] = useState<string | null>(sp.get("c") || null);
  const [msg, setMsg] = useState<M[]>([]);
  const [reply, setReply] = useState("");
  const [newSub, setNewSub] = useState("");
  const [newBody, setNewBody] = useState("");

  const loadConvs = useCallback(() => {
    void fetch("/api/messages/conversations")
      .then((r) => r.json())
      .then((d) => setConvs((d.conversations as Conv[]) || []));
  }, []);
  const loadTh = useCallback((id: string) => {
    setCid(id);
    void fetch(`/api/messages/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setMsg((d.messages as M[]) || []);
        void fetch(`/api/messages/${id}/mark-read`, { method: "POST" });
      });
  }, []);
  useEffect(() => {
    loadConvs();
  }, [loadConvs]);
  useEffect(() => {
    const c = sp.get("c");
    if (c) {
      setCid(c);
      void fetch(`/api/messages/${c}`)
        .then((r) => r.json())
        .then((d) => setMsg((d.messages as M[]) || []));
    }
  }, [sp]);

  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-3">
      <div className="space-y-2">
        {convs.map((c) => (
          <button
            type="button"
            key={c.id}
            onClick={() => {
              r.push(
                (p.isAdmin ? "/admin/messages" : "/dashboard/messages") + "?c=" + c.id
              );
              loadTh(c.id);
            }}
            className={`w-full text-left ${
              cid === c.id ? "ring-2 ring-[#60A5FA]" : ""
            } rounded-2xl border border-white/30 bg-white/30 p-3 text-sm shadow hover:bg-white/50`}
          >
            {c.subject}
            <p className="text-xs text-slate-500">{c.updated_at}</p>
          </button>
        ))}
        {!p.isAdmin ? (
          <GlassCard className="!p-3 text-sm">
            <input
              className="w-full rounded-xl border border-white/40 bg-white/50 px-2 py-1"
              value={newSub}
              onChange={(e) => setNewSub(e.target.value)}
              placeholder="Start a conversation — subject"
            />
            <textarea
              className="mt-2 w-full rounded-xl border border-white/40 bg-white/50 px-2 py-1"
              rows={3}
              value={newBody}
              onChange={(e) => setNewBody(e.target.value)}
              placeholder="Message"
            />
            <LuxuryButton
              type="button"
              className="mt-2 w-full"
              onClick={async () => {
                if (!newSub || !newBody) return;
                const res = await fetch("/api/messages/conversations", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ subject: newSub, body: newBody }),
                });
                if (res.ok) {
                  setNewSub("");
                  setNewBody("");
                  loadConvs();
                }
              }}
            >
              Send to support
            </LuxuryButton>
          </GlassCard>
        ) : null}
      </div>
      <div className="lg:col-span-2">
        {cid ? (
          <GlassCard>
            <div className="max-h-[50vh] space-y-2 overflow-y-auto p-1">
              {msg.map((m) => (
                <MessageBubble
                  key={m.id}
                  from={m.sender_id === p.currentUserId ? "me" : "them"}
                  name={m.sender_name}
                  body={m.body}
                  at={m.created_at}
                />
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <input
                className="flex-1 rounded-2xl border border-white/40 bg-white/50 px-2 py-2"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Reply"
              />
              <LuxuryButton
                type="button"
                onClick={async () => {
                  if (!reply.trim() || !cid) return;
                  const res = await fetch(`/api/messages/${cid}/reply`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ body: reply }),
                  });
                  if (res.ok) {
                    setReply("");
                    loadTh(cid);
                    loadConvs();
                  }
                }}
              >
                Send
              </LuxuryButton>
            </div>
          </GlassCard>
        ) : (
          <p className="text-slate-500">Select a conversation or start a new one.</p>
        )}
      </div>
    </div>
  );
}
