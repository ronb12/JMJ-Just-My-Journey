"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { MessageBubble } from "@/components/ui/MessageBubble";
import { LuxuryButton } from "@/components/ui/LuxuryButton";
import { Modal } from "@/components/ui/Modal";
import { useCallback, useEffect, useState } from "react";
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
    <div className="mt-4 grid gap-4 lg:grid-cols-3">
      <div className="space-y-3">
        <MessagesInboxTable
          convs={convs}
          activeId={cid}
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
        {!p.isAdmin ? (
          <GlassCard className="!p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              New message
            </p>
            <input
              className="mt-2 w-full rounded-2xl border border-white/40 bg-white/50 px-3 py-2 text-sm"
              value={newSub}
              onChange={(e) => setNewSub(e.target.value)}
              placeholder="Subject"
            />
            <textarea
              className="mt-2 w-full rounded-2xl border border-white/40 bg-white/50 px-3 py-2 text-sm"
              rows={4}
              value={newBody}
              onChange={(e) => setNewBody(e.target.value)}
              placeholder="Write your message…"
            />
            <LuxuryButton
              type="button"
              className="mt-3 w-full"
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
                }
              }}
            >
              Send
            </LuxuryButton>
            <p className="mt-2 text-xs text-slate-500">
              This inbox syncs with the studio admin.
            </p>
          </GlassCard>
        ) : null}
      </div>
      <div className="lg:col-span-2">
        {cid ? (
          <GlassCard className="p-0">
            <div className="flex items-center justify-between gap-3 border-b border-white/30 bg-white/30 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-800">
                  {activeConv?.subject || "Conversation"}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {p.isAdmin
                    ? activeConv?.customer_email || "Customer"
                    : "Support"}
                </p>
              </div>
              <LuxuryButton
                type="button"
                variant="ghost"
                className="!px-3 !py-1.5 text-xs"
                onClick={() => {
                  void navigator.clipboard
                    .writeText(cid)
                    .then(() => alert("Conversation ID copied."));
                }}
              >
                Copy ID
              </LuxuryButton>
            </div>
            <div className="max-h-[52vh] space-y-2 overflow-y-auto px-3 py-3">
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
            <div className="border-t border-white/30 bg-white/30 p-3">
              <div className="flex gap-2">
                <input
                  className="flex-1 rounded-2xl border border-white/40 bg-white/60 px-3 py-2 text-sm"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Write a reply…"
                />
                <LuxuryButton
                  type="button"
                  className="!px-5 !py-2.5"
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
              <p className="mt-2 text-xs text-slate-500">
                Tip: Keep messages clear and short—replies are saved automatically.
              </p>
            </div>
          </GlassCard>
        ) : (
          <GlassCard>
            <p className="text-slate-700 font-medium">Select a conversation</p>
            <p className="mt-1 text-sm text-slate-500">
              Choose a thread from the left to view messages.
            </p>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
