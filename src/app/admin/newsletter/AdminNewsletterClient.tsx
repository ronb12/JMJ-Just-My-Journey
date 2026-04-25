"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { LuxuryButton } from "@/components/ui/LuxuryButton";
import { Modal } from "@/components/ui/Modal";
import { useCallback, useEffect, useState } from "react";

export type SubRow = { id: string; email: string; source: string | null; created_at: string };

export type PostRow = {
  id: string;
  title: string;
  subject_line: string;
  body: string;
  status: string;
  created_at: string;
  updated_at: string;
  sent_at: string | null;
  created_by: string | null;
};

function fmtDate(s: string) {
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? s : d.toLocaleString();
}

function statusClass(s: string) {
  if (s === "sent") return "border-[#14B8A6]/50 bg-[#14B8A6]/10 text-[#0F766E] dark:text-[#5EEAD4]";
  if (s === "archived") return "border-slate-300/80 bg-slate-200/30 text-slate-600 dark:border-white/20 dark:bg-white/5 dark:text-slate-300";
  return "border-sky-200/80 bg-sky-50/80 text-sky-900 dark:border-sky-500/30 dark:bg-sky-950/50 dark:text-sky-200";
}

function statusLabel(s: string) {
  if (s === "sent") return "Sent (recorded)";
  if (s === "archived") return "Archived";
  return "Draft";
}

export function AdminNewsletterClient({
  initial,
  initialPosts = [],
}: {
  initial: SubRow[];
  initialPosts?: PostRow[];
}) {
  const [tab, setTab] = useState<"newsletters" | "subscribers">("newsletters");
  const [list, setList] = useState<SubRow[]>(initial);
  const [posts, setPosts] = useState<PostRow[]>(initialPosts);
  const [subLoading, setSubLoading] = useState(false);
  const [subErr, setSubErr] = useState("");

  const refreshSubscribers = useCallback(async () => {
    setSubErr("");
    setSubLoading(true);
    try {
      const res = await fetch("/api/admin/newsletter", { method: "GET" });
      if (!res.ok) {
        setSubErr("Could not load subscribers from the database.");
        return;
      }
      const d = (await res.json()) as { subscribers?: SubRow[] };
      setList(Array.isArray(d.subscribers) ? d.subscribers : []);
    } finally {
      setSubLoading(false);
    }
  }, []);

  /* Always use live `newsletter_subscribers` (same as GET /api/admin/newsletter). */
  useEffect(() => {
    void refreshSubscribers();
  }, [refreshSubscribers]);

  useEffect(() => {
    if (tab === "subscribers") {
      void refreshSubscribers();
    }
  }, [tab, refreshSubscribers]);

  const [title, setTitle] = useState("");
  const [subjectLine, setSubjectLine] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [formErr, setFormErr] = useState("");

  const [editing, setEditing] = useState<PostRow | null>(null);
  const [eTitle, setETitle] = useState("");
  const [eSubject, setESubject] = useState("");
  const [eBody, setEBody] = useState("");
  const [eBusy, setEBusy] = useState(false);
  const [eErr, setEErr] = useState("");

  async function createNewsletter(e: React.FormEvent) {
    e.preventDefault();
    setFormErr("");
    setBusy(true);
    const res = await fetch("/api/admin/newsletter/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, subject_line: subjectLine, body }),
    });
    setBusy(false);
    if (!res.ok) {
      const d = (await res.json().catch(() => ({}))) as { error?: string };
      setFormErr(d.error || "Could not save. Is migration 012 applied on the database?");
      return;
    }
    const d = (await res.json()) as { post: PostRow };
    setPosts((p) => [d.post, ...p]);
    setTitle("");
    setSubjectLine("");
    setBody("");
  }

  function openEdit(p: PostRow) {
    setEditing(p);
    setETitle(p.title);
    setESubject(p.subject_line);
    setEBody(p.body);
    setEErr("");
  }

  async function saveEdit() {
    if (!editing) return;
    setEErr("");
    setEBusy(true);
    const res = await fetch("/api/admin/newsletter/posts/" + editing.id, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: eTitle,
        subject_line: eSubject,
        body: eBody,
      }),
    });
    setEBusy(false);
    if (!res.ok) {
      const d = (await res.json().catch(() => ({}))) as { error?: string };
      setEErr(d.error || "Could not save");
      return;
    }
    const d = (await res.json()) as { post: PostRow };
    setPosts((prev) => prev.map((x) => (x.id === d.post.id ? d.post : x)));
    setEditing(null);
  }

  async function setPostStatus(p: PostRow, status: "draft" | "sent" | "archived") {
    if (status === "archived" && !confirm("Archive this newsletter?")) return;
    const res = await fetch("/api/admin/newsletter/posts/" + p.id, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const d = (await res.json().catch(() => ({}))) as { error?: string };
      alert(d.error || "Could not update");
      return;
    }
    const d = (await res.json()) as { post: PostRow };
    setPosts((prev) => prev.map((x) => (x.id === d.post.id ? d.post : x)));
  }

  async function deletePost(p: PostRow) {
    if (!confirm("Delete this newsletter draft permanently?")) return;
    const res = await fetch("/api/admin/newsletter/posts/" + p.id, { method: "DELETE" });
    if (!res.ok) {
      alert("Could not delete");
      return;
    }
    setPosts((prev) => prev.filter((x) => x.id !== p.id));
    if (editing?.id === p.id) setEditing(null);
  }

  return (
    <div className="space-y-4">
      <div className="inline-flex flex-wrap gap-1 rounded-2xl border border-slate-200 bg-white/80 p-1 dark:border-white/10 dark:bg-slate-900/60">
        {(
          [
            { id: "newsletters" as const, label: "Create & history" },
            { id: "subscribers" as const, label: "Subscribers" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={
              "rounded-xl px-4 py-2 text-sm font-medium transition-colors " +
              (tab === t.id
                ? "bg-[#2563EB] text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10")
            }
          >
            {t.label}
          </button>
        ))}
      </div>
      {subErr ? <p className="text-sm text-amber-800 dark:text-amber-200">{subErr}</p> : null}

      {tab === "newsletters" && (
        <>
          <div className="flex flex-col gap-2 rounded-2xl border border-sky-200/60 bg-sky-50/50 p-3 text-sm sm:flex-row sm:items-center sm:justify-between dark:border-sky-500/20 dark:bg-slate-800/50">
            <p className="text-slate-700 dark:text-slate-200">
              <span className="font-semibold text-slate-900 dark:text-slate-100">Current audience: </span>
              {list.length} subscriber{list.length === 1 ? "" : "s"}
              {subLoading ? (
                <span className="text-slate-500"> · syncing with server…</span>
              ) : null}{" "}
              <span className="text-slate-500 dark:text-slate-400">
                (live list from <code className="text-xs">newsletter_subscribers</code> — same data as the Subscribers tab).
              </span>
            </p>
            <LuxuryButton
              type="button"
              variant="ghost"
              className="!shrink-0 !px-3 !py-1.5 text-xs"
              disabled={subLoading}
              onClick={() => void refreshSubscribers()}
            >
              {subLoading ? "Refreshing…" : "Refresh audience"}
            </LuxuryButton>
          </div>
          <GlassCard>
            <h2 className="font-serif text-xl text-[#1E3A8A] dark:text-sky-200">Write a newsletter</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Composed in JMJ, sent manually for now. Your recipient list is the people above. Copy subject and body to
              Mailchimp, Resend, or any ESP, then paste those emails from the Subscribers tab.
            </p>
            <form className="mt-4 space-y-3" onSubmit={createNewsletter}>
              <div className="jmj-field-block">
                <label className="jmj-label" htmlFor="nl-title">
                  Internal title
                </label>
                <input
                  id="nl-title"
                  className="jmj-input"
                  value={title}
                  onChange={(ev) => setTitle(ev.target.value)}
                  required
                  placeholder="e.g. May wellness tips"
                  maxLength={200}
                />
              </div>
              <div className="jmj-field-block">
                <label className="jmj-label" htmlFor="nl-subject">
                  Email subject line
                </label>
                <input
                  id="nl-subject"
                  className="jmj-input"
                  value={subjectLine}
                  onChange={(ev) => setSubjectLine(ev.target.value)}
                  required
                  placeholder="What subscribers see in their inbox"
                  maxLength={300}
                />
              </div>
              <div className="jmj-field-block">
                <label className="jmj-label" htmlFor="nl-body">
                  Message body
                </label>
                <textarea
                  id="nl-body"
                  className="jmj-textarea min-h-[200px]"
                  value={body}
                  onChange={(ev) => setBody(ev.target.value)}
                  rows={10}
                  placeholder="Plain text or your own light HTML for pasting into an email tool"
                />
              </div>
              {formErr ? <p className="text-sm text-rose-600 dark:text-rose-400">{formErr}</p> : null}
              <LuxuryButton type="submit" disabled={busy}>
                {busy ? "Saving…" : "Save as draft"}
              </LuxuryButton>
            </form>
          </GlassCard>

          <div>
            <h3 className="mb-2 font-serif text-lg text-sky-900 dark:text-sky-200">Saved newsletters</h3>
            {posts.length === 0 ? (
              <GlassCard>
                <p className="text-sm text-slate-500 dark:text-slate-400">No newsletters yet. Write one above.</p>
              </GlassCard>
            ) : (
              <GlassCard className="overflow-x-auto p-0">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="bg-sky-50/50 text-slate-600 dark:bg-slate-800/70 dark:text-slate-200">
                    <tr>
                      <th className="p-3">Title</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 whitespace-nowrap">Updated</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {posts.map((p) => (
                      <tr key={p.id} className="border-t border-sky-100/50 dark:border-white/10">
                        <td className="p-3">
                          <p className="font-medium text-slate-800 dark:text-slate-100">{p.title}</p>
                          <p className="text-xs text-slate-500 line-clamp-1">{p.subject_line}</p>
                        </td>
                        <td className="p-3">
                          <span
                            className={"inline-block rounded-full border px-2 py-0.5 text-xs " + statusClass(p.status)}
                          >
                            {statusLabel(p.status)}
                          </span>
                        </td>
                        <td className="p-3 text-xs text-slate-500">{fmtDate(p.updated_at)}</td>
                        <td className="p-3">
                          <div className="flex flex-wrap justify-end gap-1">
                            <LuxuryButton
                              type="button"
                              variant="ghost"
                              className="!px-2.5 !py-1 text-xs"
                              onClick={() => openEdit(p)}
                            >
                              Open
                            </LuxuryButton>
                            {p.status === "draft" && (
                              <LuxuryButton
                                type="button"
                                variant="teal"
                                className="!px-2.5 !py-1 text-xs"
                                onClick={() => setPostStatus(p, "sent")}
                              >
                                Mark sent
                              </LuxuryButton>
                            )}
                            {p.status !== "archived" && (
                              <LuxuryButton
                                type="button"
                                variant="ghost"
                                className="!px-2.5 !py-1 text-xs"
                                onClick={() => setPostStatus(p, "archived")}
                              >
                                Archive
                              </LuxuryButton>
                            )}
                            <LuxuryButton
                              type="button"
                              variant="ghost"
                              className="!px-2.5 !py-1 text-xs text-rose-600"
                              onClick={() => deletePost(p)}
                            >
                              Delete
                            </LuxuryButton>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </GlassCard>
            )}
          </div>
        </>
      )}

      {tab === "subscribers" && (
        <div className="space-y-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-serif text-lg text-sky-900 dark:text-sky-200">People who asked for newsletters</h2>
            <LuxuryButton
              type="button"
              variant="ghost"
              className="!w-fit !px-3 !py-1.5 text-xs"
              disabled={subLoading}
              onClick={() => void refreshSubscribers()}
            >
              {subLoading ? "Loading…" : "Reload from database"}
            </LuxuryButton>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {list.length} total · list reloads from the server when you open this tab, use Reload, or after a removal. The Source
            column is how they signed up.
          </p>
          <GlassCard className="overflow-x-auto p-0">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="bg-sky-50/50 text-slate-600 dark:bg-slate-800/70 dark:text-slate-200">
              <tr>
                <th className="p-3">Email</th>
                <th className="p-3">Source</th>
                <th className="p-3 whitespace-nowrap">Subscribed</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id} className="border-t border-sky-100/50 dark:border-white/10">
                  <td className="p-3">{r.email}</td>
                  <td className="p-3 text-slate-500">{r.source || "—"}</td>
                  <td className="p-3 text-xs text-slate-500">{fmtDate(r.created_at)}</td>
                  <td className="p-3">
                    <div className="flex justify-end">
                      <LuxuryButton
                        type="button"
                        variant="ghost"
                        className="!px-3 !py-1.5 text-xs"
                        onClick={async () => {
                          if (!confirm(`Remove ${r.email} from the list?`)) return;
                          const res = await fetch("/api/admin/newsletter?id=" + r.id, { method: "DELETE" });
                          if (!res.ok) {
                            const j = (await res.json().catch(() => ({}))) as { error?: string };
                            alert(j.error || "Could not remove");
                            return;
                          }
                          await refreshSubscribers();
                        }}
                      >
                        Remove
                      </LuxuryButton>
                    </div>
                  </td>
                </tr>
              ))}
              {list.length === 0 ? (
                <tr>
                  <td className="p-4 text-slate-500" colSpan={4}>
                    No subscribers yet. Signups come from the contact form and from Account in the customer dashboard.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </GlassCard>
        </div>
      )}

      <Modal open={Boolean(editing)} title="Edit newsletter" onClose={() => setEditing(null)}>
        {editing ? (
          <div className="space-y-3">
            <div className="jmj-field-block">
              <label className="jmj-label">Title</label>
              <input className="jmj-input" value={eTitle} onChange={(e) => setETitle(e.target.value)} maxLength={200} />
            </div>
            <div className="jmj-field-block">
              <label className="jmj-label">Subject</label>
              <input
                className="jmj-input"
                value={eSubject}
                onChange={(e) => setESubject(e.target.value)}
                maxLength={300}
              />
            </div>
            <div className="jmj-field-block">
              <label className="jmj-label">Body</label>
              <textarea
                className="jmj-textarea min-h-[200px]"
                value={eBody}
                onChange={(e) => setEBody(e.target.value)}
                rows={10}
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-3 dark:border-white/10">
              <div className="flex flex-wrap gap-1">
                <LuxuryButton type="button" variant="ghost" className="!text-xs" onClick={() => void navigator.clipboard.writeText(eBody)}>
                  Copy body
                </LuxuryButton>
                <LuxuryButton
                  type="button"
                  variant="ghost"
                  className="!text-xs"
                  onClick={() => void navigator.clipboard.writeText(eSubject)}
                >
                  Copy subject
                </LuxuryButton>
              </div>
              {eErr ? <p className="text-xs text-rose-600">{eErr}</p> : <span className="text-xs text-slate-500" />}
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              {editing.status === "draft" && (
                <LuxuryButton
                  type="button"
                  variant="teal"
                  onClick={async () => {
                    await setPostStatus(editing, "sent");
                    setEditing(null);
                  }}
                >
                  Mark sent
                </LuxuryButton>
              )}
              {editing.status === "archived" && (
                <LuxuryButton
                  type="button"
                  variant="ghost"
                  onClick={async () => {
                    const res = await fetch("/api/admin/newsletter/posts/" + editing.id, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ status: "draft" }),
                    });
                    if (res.ok) {
                      const d = (await res.json()) as { post: PostRow };
                      setPosts((prev) => prev.map((x) => (x.id === d.post.id ? d.post : x)));
                      setEditing(d.post);
                    }
                  }}
                >
                  Move to draft
                </LuxuryButton>
              )}
              <LuxuryButton type="button" variant="ghost" onClick={() => setEditing(null)}>
                Close
              </LuxuryButton>
              <LuxuryButton type="button" onClick={() => void saveEdit()} disabled={eBusy}>
                {eBusy ? "Saving…" : "Save"}
              </LuxuryButton>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
