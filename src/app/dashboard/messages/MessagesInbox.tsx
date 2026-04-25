"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { MessageBubble } from "@/components/ui/MessageBubble";
import { LuxuryButton } from "@/components/ui/LuxuryButton";
import { Modal } from "@/components/ui/Modal";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { MessagesInboxTable } from "./MessagesInboxTable";

type Conv = {
  id: string;
  subject: string;
  updated_at: string;
  unread?: number;
  customer_name?: string | null;
  customer_email?: string | null;
  admin_name?: string | null;
  admin_email?: string | null;
};
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
  const [adminOpen, setAdminOpen] = useState(false);
  const threadRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    // Keep the most recent messages in view.
    if (!cid) return;
    const el = threadRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [cid, msg.length]);

  const activeConv = convs.find((c) => c.id === cid) || null;

  if (p.isAdmin) {
    return (
      <div className="mt-4 space-y-3">
        <MessagesInboxTable
          convs={convs}
          activeId={adminOpen ? cid : null}
          onOpen={(id) => {
            loadTh(id);
            setAdminOpen(true);
          }}
          onDelete={async (id) => {
            if (!confirm("Delete this conversation?")) return;
            const res = await fetch(`/api/messages/${id}`, { method: "DELETE" });
            if (!res.ok) {
              const j = (await res.json().catch(() => ({}))) as { error?: string };
              alert(j.error || "Could not delete");
              return;
            }
            if (cid === id) {
              setCid(null);
              setMsg([]);
              setAdminOpen(false);
            }
            loadConvs();
          }}
        />

        <Modal
          open={adminOpen && Boolean(cid)}
          title={activeConv?.subject || "Conversation"}
          onClose={() => {
            setAdminOpen(false);
            setReply("");
          }}
          className="max-w-3xl"
        >
          {cid ? (
            <div className="space-y-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-white/10 dark:bg-slate-950">
                <p className="font-medium text-slate-800 dark:text-slate-100">
                  {activeConv?.customer_name || "Customer"}{" "}
                  <span className="text-slate-500 dark:text-slate-300">
                    {activeConv?.customer_email ? `<${activeConv.customer_email}>` : null}
                  </span>
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Conversation ID: {cid}
                </p>
              </div>

              <div className="max-h-[55vh] space-y-2 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-900">
                {msg.map((m) => (
                  <MessageBubble
                    key={m.id}
                    from={m.sender_id === p.currentUserId ? "me" : "them"}
                    name={m.sender_name}
                    body={m.body}
                    at={m.created_at}
                  />
                ))}
                {msg.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-300">No messages yet.</p>
                ) : null}
              </div>

              <div className="jmj-field-block">
                <label className="jmj-label">Reply</label>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-stretch">
                  <input
                    className="jmj-input !mt-0 sm:flex-1"
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Write a reply…"
                  />
                  <LuxuryButton
                    type="button"
                    className="!px-5 !py-2.5 sm:self-end"
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
                      } else {
                        const j = (await res.json().catch(() => ({}))) as { error?: string };
                        alert(j.error || "Could not send");
                      }
                    }}
                  >
                    Send
                  </LuxuryButton>
                </div>
              </div>
            </div>
          ) : null}
        </Modal>
      </div>
    );
  }

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-12">
      <div className="space-y-5 lg:col-span-5">
        <GlassCard className="overflow-hidden p-0">
          <div className="border-b border-sky-100/80 bg-gradient-to-r from-sky-50/90 to-white px-4 py-3 dark:border-white/10 dark:from-slate-800/50 dark:to-slate-900/30">
            <h2 className="font-serif text-lg text-[#1E3A8A] dark:text-sky-200">Your conversations</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Open a thread to read and reply.</p>
          </div>
          <MessagesInboxTable
            convs={convs}
            activeId={cid}
            className="rounded-none border-0 shadow-none dark:bg-transparent"
            onOpen={(id) => {
              r.push((p.isAdmin ? "/admin/messages" : "/dashboard/messages") + "?c=" + id);
              loadTh(id);
            }}
            onDelete={async (id) => {
              if (!confirm("Delete this conversation?")) return;
              const res = await fetch(`/api/messages/${id}`, { method: "DELETE" });
              if (!res.ok) {
                const j = (await res.json().catch(() => ({}))) as { error?: string };
                alert(j.error || "Could not delete");
                return;
              }
              if (cid === id) {
                setCid(null);
                setMsg([]);
                r.push(p.isAdmin ? "/admin/messages" : "/dashboard/messages");
              }
              loadConvs();
            }}
          />
        </GlassCard>

        <GlassCard>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Start a new thread
          </p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            The team usually replies during studio hours.
          </p>
          <div className="mt-4 space-y-3">
            <div className="jmj-field-block">
              <label className="jmj-label" htmlFor="msg-new-subject">
                Subject
              </label>
              <input
                id="msg-new-subject"
                className="jmj-input"
                value={newSub}
                onChange={(e) => setNewSub(e.target.value)}
                placeholder="What is this about?"
              />
            </div>
            <div className="jmj-field-block">
              <label className="jmj-label" htmlFor="msg-new-body">
                Message
              </label>
              <textarea
                id="msg-new-body"
                className="jmj-textarea min-h-[120px]"
                rows={5}
                value={newBody}
                onChange={(e) => setNewBody(e.target.value)}
                placeholder="Share details so we can help you faster…"
              />
            </div>
            <LuxuryButton
              type="button"
              className="w-full sm:w-auto"
              onClick={async () => {
                if (!newSub.trim() || !newBody.trim()) return;
                const res = await fetch("/api/messages/conversations", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ subject: newSub, body: newBody }),
                });
                if (res.ok) {
                  setNewSub("");
                  setNewBody("");
                  loadConvs();
                } else {
                  const j = (await res.json().catch(() => ({}))) as { error?: string };
                  alert(j.error || "Could not start conversation");
                }
              }}
            >
              Send message
            </LuxuryButton>
          </div>
        </GlassCard>
      </div>

      <div className="lg:col-span-7">
        {cid ? (
          <GlassCard className="flex h-full min-h-[420px] flex-col overflow-hidden p-0">
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200/80 bg-gradient-to-r from-sky-50/90 via-white to-rose-50/20 px-4 py-4 dark:border-white/10 dark:from-slate-800/60 dark:via-slate-900/40 dark:to-slate-950/40">
              <div className="min-w-0">
                <p className="font-serif text-lg leading-snug text-[#1E3A8A] dark:text-sky-200">
                  {activeConv?.subject || "Conversation"}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {p.isAdmin ? activeConv?.customer_email || "Customer" : "JMJ support team"}
                </p>
              </div>
              {p.isAdmin ? (
                <LuxuryButton
                  type="button"
                  variant="ghost"
                  className="!shrink-0 !px-3 !py-1.5 text-xs"
                  onClick={() => {
                    void navigator.clipboard
                      .writeText(cid)
                      .then(() => alert("Conversation ID copied."));
                  }}
                >
                  Copy ID
                </LuxuryButton>
              ) : null}
            </div>

            <div
              ref={threadRef}
              className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-gradient-to-b from-slate-50/90 to-white px-4 py-4 dark:from-slate-950/80 dark:to-slate-900/60"
            >
              {msg.map((m) => (
                <MessageBubble
                  key={m.id}
                  from={m.sender_id === p.currentUserId ? "me" : "them"}
                  name={m.sender_name}
                  body={m.body}
                  at={m.created_at}
                />
              ))}
              {msg.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-12 text-center dark:border-white/10">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No messages in this thread yet</p>
                  <p className="mt-1 max-w-xs text-xs text-slate-500 dark:text-slate-400">
                    Your first message should appear here. If something looks wrong, start a new thread from the left.
                  </p>
                </div>
              ) : null}
            </div>

            <div className="shrink-0 border-t border-slate-200/80 bg-white/90 p-4 dark:border-white/10 dark:bg-slate-900/90">
              <label className="jmj-label" htmlFor="msg-reply">
                Your reply
              </label>
              <textarea
                id="msg-reply"
                className="jmj-textarea mt-2 min-h-[88px]"
                rows={3}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Type your reply…"
                onKeyDown={async (e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                    e.preventDefault();
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
                  }
                }}
              />
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tip: press {navigator.platform.includes("Mac") ? "⌘" : "Ctrl"}+Enter to send.
                </p>
                <LuxuryButton
                  type="button"
                  className="w-full sm:w-auto"
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
                    } else {
                      const j = (await res.json().catch(() => ({}))) as { error?: string };
                      alert(j.error || "Could not send");
                    }
                  }}
                >
                  Send reply
                </LuxuryButton>
              </div>
            </div>
          </GlassCard>
        ) : (
          <GlassCard className="flex min-h-[360px] flex-col items-center justify-center border-dashed border-slate-200/80 bg-gradient-to-b from-slate-50/50 to-white px-6 text-center dark:border-white/10 dark:from-slate-900/40 dark:to-slate-950/60">
            <p className="font-serif text-xl text-[#1E3A8A] dark:text-sky-200">Pick a conversation</p>
            <p className="mt-2 max-w-sm text-sm text-slate-600 dark:text-slate-300">
              Select a thread from the list, or start a new one with the form on the left.
            </p>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
