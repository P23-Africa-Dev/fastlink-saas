"use client";

import React, { useState } from "react";
import { Send, MessageSquare } from "lucide-react";
import { Comment } from "./types";

interface CommentSectionProps {
  comments:   Comment[];
  onPost:     (text: string) => void;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const AVATAR_COLORS = ["#33084E", "#AF580B", "#074616", "#1d4ed8", "#be185d"];

export function CommentSection({ comments, onPost }: CommentSectionProps) {
  const [text, setText] = useState("");

  const handlePost = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onPost(trimmed);
    setText("");
  };

  return (
    <div className="flex flex-col" style={{ gap: "0" }}>
      {/* Section header */}
      <div className="flex items-center justify-between" style={{ marginBottom: "14px" }}>
        <h3 className="text-[13px] font-bold text-(--text-primary) uppercase tracking-wider">
          Comments
        </h3>
        {comments.length > 0 && (
          <span className="rounded-full text-[11px] font-bold" style={{ padding: "2px 8px", background: "#f0f0f5", color: "#9ca3af" }}>
            {comments.length}
          </span>
        )}
      </div>

      {/* Empty state */}
      {comments.length === 0 && (
        <div className="flex flex-col items-center text-center rounded-2xl border border-dashed border-[#f0f0f5]" style={{ padding: "28px 16px", gap: "8px", marginBottom: "16px" }}>
          <div className="w-9 h-9 rounded-full bg-[#f0f0f5] flex items-center justify-center text-[#9ca3af]">
            <MessageSquare size={16} />
          </div>
          <p className="text-[12px] font-bold text-(--text-primary)">No comments yet</p>
          <p className="text-[11px] text-[#9ca3af]">Be the first to comment on this task.</p>
        </div>
      )}

      {/* Comment list */}
      {comments.length > 0 && (
        <div className="flex flex-col" style={{ gap: "12px", marginBottom: "16px" }}>
          {comments.map((c, i) => (
            <div key={c.id} className="flex items-start" style={{ gap: "10px" }}>
              <div
                className="rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                style={{ width: "30px", height: "30px", background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
              >
                {c.user_initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between" style={{ gap: "8px", marginBottom: "4px" }}>
                  <span className="text-[12px] font-bold text-(--text-primary)">{c.user_name}</span>
                  <span className="text-[11px] text-[#9ca3af] shrink-0">{timeAgo(c.created_at)}</span>
                </div>
                <div className="rounded-xl bg-[#f8f8fc] border border-[#f0f0f5] text-[12px] text-(--text-primary) leading-relaxed" style={{ padding: "10px 12px" }}>
                  {c.comment}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Input row */}
      <div className="flex items-end rounded-xl border border-[#f0f0f5] bg-white overflow-hidden" style={{ gap: "0" }}>
        <textarea
          rows={2}
          placeholder="Write a comment…"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handlePost(); }}
          className="flex-1 text-[13px] outline-none resize-none bg-transparent placeholder:text-[#9ca3af]"
          style={{ padding: "12px 14px" }}
        />
        <button
          onClick={handlePost}
          disabled={!text.trim()}
          className="flex items-center justify-center text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed self-end rounded-lg"
          style={{ padding: "10px 12px", background: "#33084E", margin: "6px 6px 6px 0" }}
        >
          <Send size={14} />
        </button>
      </div>
      <p className="text-[11px] text-[#9ca3af]" style={{ marginTop: "6px" }}>⌘ + Enter to post</p>
    </div>
  );
}
