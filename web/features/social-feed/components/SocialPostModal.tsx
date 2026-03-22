"use client";

import { useRef, useCallback, useState, useEffect, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, SendHorizonal } from "lucide-react";
import { useTranslation } from "react-i18next";
import useFeedComments from "@/features/social-feed/hooks/useFeedComments";
import useAddComment from "@/features/social-feed/hooks/useAddComment";
import useDeleteComment from "@/features/social-feed/hooks/useDeleteComment";
import CommentItem from "@/features/social-feed/components/CommentItem";
import SocialFeedCardHeader from "@/features/social-feed/components/SocialFeedCardHeader";
import SocialFeedCardFooter from "@/features/social-feed/components/SocialFeedCardFooter";
import { FeedComment, SocialFeedItem } from "@/types/social-feed";
import { createClient } from "@/utils/supabase/client";
import { createPortal } from "react-dom";
import Spinner from "@/components/spinner";

type ReplyState = {
  parentId: string;
  authorName: string;
} | null;

type Props = {
  item: SocialFeedItem;
  onClose: () => void;
  onToggleLike: () => void;
  scrollToComments?: boolean;
  sessionContent: ReactNode;
  isLoadingSession: boolean;
  sessionError: boolean;
};

export default function SocialPostModal({
  item,
  onClose,
  onToggleLike,
  scrollToComments,
  sessionContent,
  isLoadingSession,
  sessionError,
}: Props) {
  const { t } = useTranslation("social");
  const { t: tFeed } = useTranslation("feed");
  const commentsRef = useRef<HTMLDivElement>(null);
  const listEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [inputText, setInputText] = useState("");
  const [replyingTo, setReplyingTo] = useState<ReplyState>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const { data: comments, isLoading: isLoadingComments } = useFeedComments(item.id);
  const { mutate: addComment } = useAddComment();
  const { mutate: deleteComment } = useDeleteComment();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUserId(session?.user?.id ?? null);
    });
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Scroll to comments section if opened via comment button
  useEffect(() => {
    if (scrollToComments && commentsRef.current) {
      setTimeout(() => {
        commentsRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 200);
    }
  }, [scrollToComments]);

  const handleSend = useCallback(() => {
    if (!inputText.trim()) return;

    addComment({
      feedItemId: item.id,
      content: inputText.trim(),
      parentId: replyingTo?.parentId ?? null,
    });

    setInputText("");
    setReplyingTo(null);

    setTimeout(() => {
      listEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, [item.id, inputText, replyingTo, addComment]);

  const handleReply = useCallback((comment: FeedComment) => {
    setReplyingTo({
      parentId: comment.id,
      authorName: comment.author_display_name,
    });
  }, []);

  const handleDelete = useCallback(
    (commentId: string) => {
      deleteComment({ commentId, feedItemId: item.id });
    },
    [item.id, deleteComment],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const commentCount = comments?.length ?? 0;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-999 bg-black/50">
        <motion.div
          className="fixed top-0 left-0 right-0 bottom-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={(_, info) => {
            if (Math.abs(info.offset.x) > 200) {
              onClose();
            }
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {/* Modal */}
          <div
            ref={scrollContainerRef}
            className="relative bg-[#131c2b] md:max-w-2xl mx-auto rounded-xl w-[98%] h-[calc(98dvh)] top-[1dvh] overflow-y-auto touch-pan-y shadow-[0_0_20px_rgba(59,130,246,0.4)] flex flex-col"
          >
          {/* Author header with close button */}
          <SocialFeedCardHeader item={item} onClose={onClose} />

          {/* Full session details */}
          <div className="flex-1">
            {isLoadingSession ? (
              <div className="flex flex-col gap-5 items-center justify-center pt-20 px-10 font-body">
                <p className="text-lg">
                  {item.type === "gym_sessions" ? tFeed("feed.loadingGym") : tFeed("feed.loadingActivity")}
                </p>
                <Spinner />
              </div>
            ) : sessionError ? (
              <p className="text-center text-lg mt-20 px-10 font-body">
                {item.type === "gym_sessions" ? tFeed("feed.gymError") : tFeed("feed.activityError")}
              </p>
            ) : (
              sessionContent
            )}
          </div>

          {/* Like/comment footer bar */}
          <div className="border-t border-slate-700/50">
            <SocialFeedCardFooter
              item={item}
              onToggleLike={onToggleLike}
              onExpand={() => {}}
              onOpenComments={() => {
                commentsRef.current?.scrollIntoView({ behavior: "smooth" });
              }}
            />
          </div>

          {/* ─── Comments section ─── */}
          <div ref={commentsRef} className="border-t border-slate-700">
            {/* Comment header */}
            <div className="px-4 py-2 border-b border-slate-700/50">
              <p className="text-sm text-gray-100">
                {t("social.comments")} {commentCount > 0 && `(${commentCount})`}
              </p>
            </div>

            {/* Comment list */}
            <div>
              {isLoadingComments ? (
                <div className="flex items-center justify-center py-6">
                  <p className="text-slate-500 text-sm font-body">{t("social.comments")}...</p>
                </div>
              ) : commentCount === 0 ? (
                <div className="flex items-center justify-center py-6">
                  <p className="text-slate-500 text-sm font-body">{t("social.noComments")}</p>
                </div>
              ) : (
                <>
                  {comments?.map((comment) => (
                    <CommentItem
                      key={comment.id}
                      comment={comment}
                      isOwnComment={comment.user_id === currentUserId}
                      onDelete={() => handleDelete(comment.id)}
                      onReply={() => handleReply(comment)}
                    />
                  ))}
                  <div ref={listEndRef} />
                </>
              )}
            </div>

            {/* Reply indicator */}
            {replyingTo && (
              <div className="flex items-center justify-between px-4 py-2 bg-slate-800/50 border-t border-slate-700/50">
                <span className="text-xs text-slate-400 font-body">
                  {t("social.replyingTo", { name: replyingTo.authorName })}
                </span>
                <button onClick={() => setReplyingTo(null)} className="cursor-pointer">
                  <X size={16} className="text-slate-400" />
                </button>
              </div>
            )}

            {/* Input */}
            <div className="flex items-center gap-2 px-4 py-3 border-t border-slate-700/50">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t("social.addComment")}
                maxLength={500}
                rows={1}
                className="flex-1 text-slate-200 text-sm bg-slate-800 rounded-2xl border border-slate-700 px-3 py-2 resize-none max-h-20 focus:outline-none focus:border-slate-600 placeholder:text-slate-500 font-body"
              />
              <button
                onClick={handleSend}
                disabled={!inputText.trim()}
                className="cursor-pointer"
              >
                <SendHorizonal
                  size={22}
                  className={inputText.trim() ? "text-blue-500" : "text-slate-600"}
                />
              </button>
            </div>
          </div>
        </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body,
  );
}
