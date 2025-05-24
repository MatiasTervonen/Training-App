"use client";

import { useState, useEffect } from "react";
import { Session } from "@/types/session";
import { russoOne } from "@/app/ui/fonts";
import { useRouter } from "next/navigation";
import TrainingSession from "@/app/components/expandSession/training";
import NotesSession from "@/app/components/expandSession/notes";
import EditSession from "@/app/components/editSession";
import Modal from "@/app/components/modal";
import { formatDate } from "@/lib/formatDate";
import { useInView } from "react-intersection-observer";
import DropdownMenu from "@/app/components/dropdownMenu";
import {
  Pin,
  SquareArrowOutUpRight,
  Disc,
  NotebookPen,
  Dumbbell,
  Ellipsis,
} from "lucide-react";

const formatDuration = (seconds: number) => {
  const totalMinutes = Math.floor(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
};

export default function SessionFeed({ sessions }: { sessions: Session[] }) {
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [pinnedSession, setPinnedSession] = useState<string[]>([]);
  const [editSession, setEditSession] = useState<Session | null>(null);
  const router = useRouter();
  const [visibleSessions, setVisibleSessions] = useState(10);
  const { ref, inView } = useInView({
    threshold: 0,
  });

  useEffect(() => {
    if (inView && visibleSessions < sessions.length) {
      setVisibleSessions((prev) => prev + 10);
    }
  }, [inView]);

  const toggleSession = (id: string) => {
    setExpandedSession(expandedSession === id ? null : id);
  };

  const togglePin = async (id: string) => {
    const isPinned = pinnedSession.includes(id);
    const updatedPinned = !isPinned;

    setPinnedSession((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );

    const res = await fetch("/api/update-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id, pinned: updatedPinned }),
    });

    console.log("res", res);

    if (!res.ok) {
      console.error("Failed to update pinned session");
    }
  };

  useEffect(() => {
    const pinned = sessions.filter((s) => s.pinned).map((s) => s.id);
    setPinnedSession(pinned);
  }, [sessions]);

  const handleDelete = async (id: string) => {
    const confirmDetlete = confirm(
      "Are you sure you want to delete this session?"
    );
    if (!confirmDetlete) return;

    const res = await fetch("/api/delete-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });

    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json();
      alert(data.error || "Failed to delete session");
    }
  };

  const sortByNewest = (sessions: Session[]) => {
    return [...sessions].sort((a, b) => {
      const aPinned = pinnedSession.includes(a.id) ? -1 : 0;
      const bPinned = pinnedSession.includes(b.id) ? -1 : 0;

      if (aPinned !== bPinned) {
        return aPinned - bPinned;
      }

      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });
  };

  return (
    <>
      <div
        className={`${russoOne.className} bg-slate-900 h-[calc(100vh-152px)] px-5 pt-3 pb-20 overflow-y-auto touch-pan-y text-gray-100 `}
      >
        {sessions.length === 0 ? (
          <p>No sessions yet. Let&apos;s get started!</p>
        ) : (
          <>
            {sortByNewest(sessions)
              .slice(0, visibleSessions)
              .map((session: Session) => (
                <div key={session.id}>
                  {pinnedSession.includes(session.id) && (
                    <div className="flex items-center gap-2 mb-2">
                      <Pin size={20} />
                      <p className="text-gray-400">Pinned</p>
                    </div>
                  )}

                  <div
                    className={`border rounded-md flex flex-col justify-center mb-5 transition-colors ${
                      pinnedSession.includes(session.id)
                        ? " border-yellow-200 bg-yellow-200 text-slate-900"
                        : "bg-slate-700"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="p-3">{session.title}</div>
                      <DropdownMenu
                        button={
                          <div
                            className={`flex items-center justify-center p-[14px] rounded-tr-md ${
                              pinnedSession.includes(session.id)
                                ? "text-slate-900"
                                : "text-gray-100"
                            }`}
                          >
                            <Ellipsis size={20} />
                          </div>
                        }
                      >
                        <button
                          onClick={() => {
                            setEditSession(session);
                          }}
                          className="border-b py-2 px-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            togglePin(session.id);
                          }}
                          className="border-b py-2"
                        >
                          {pinnedSession.includes(session.id) ? "Unpin" : "Pin"}
                        </button>
                        <button
                          onClick={() => {
                            handleDelete(session.id);
                          }}
                          className="py-2"
                        >
                          Delete
                        </button>
                      </DropdownMenu>
                    </div>

                    <div className="pb-3 ml-3">
                      {session.notes.length > 20
                        ? `${session.notes.slice(0, 20)}...`
                        : session.notes}
                    </div>

                    <div className="flex justify-between items-center mt-2 bg-black/40 rounded-b-md">
                      {/* Icon */}

                      <div className="flex items-center gap-4">
                        <div className=" p-2 rounded-bl-md">
                          {session.type === "gym" && <Dumbbell size={20} />}
                          {session.type === "notes" && (
                            <NotebookPen size={20} />
                          )}
                          {session.type === "disc-golf" && <Disc size={20} />}
                        </div>
                        <span>
                          {session.type === "gym" && "Gym"}
                          {session.type === "notes" && "Notes"}
                        </span>

                        {session.type === "gym" && session.duration && (
                          <div className="flex gap-2 items-center ml-3">
                            {formatDuration(session.duration)}
                          </div>
                        )}

                        {/* Date */}

                        <div className=" p-[8px]">
                          <p
                            className={` text-sm ${
                              pinnedSession.includes(session.id)
                                ? "text-ng-slate-900"
                                : "text-gray-100"
                            }`}
                          >
                            {formatDate(session.created_at)}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => toggleSession(session.id)}
                        className="bg-blue-500 text-gray-100 p-2 rounded-br-md hover:bg-blue-400"
                      >
                        <span>
                          <SquareArrowOutUpRight size={20} />
                        </span>
                      </button>
                    </div>
                  </div>

                  <Modal
                    isOpen={expandedSession === session.id}
                    onClose={() => setExpandedSession(null)}
                  >
                    {session.type === "gym" && (
                      <TrainingSession session={session} />
                    )}
                    {session.type === "notes" && (
                      <NotesSession session={session} />
                    )}
                  </Modal>
                </div>
              ))}
          </>
        )}
      </div>
      {visibleSessions < sessions.length && <div ref={ref} className="h-10" />}
      {editSession && (
        <EditSession
          session={editSession}
          onClose={() => setEditSession(null)}
        />
      )}
    </>
  );
}
