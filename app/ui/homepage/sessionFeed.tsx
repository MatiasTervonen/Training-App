"use client";

import { useState, useEffect, useRef } from "react";
import { Session } from "@/types/session";
import { russoOne } from "@/app/ui/fonts";
import { useRouter } from "next/navigation";
import TrainingSession from "@/app/components/expandSession/training";
import NotesSession from "@/app/components/expandSession/notes";
import { Pin } from "lucide-react";
import { SquareArrowOutUpRight } from "lucide-react";
import EditSession from "@/app/components/editSession";
import Modal from "@/app/components/modal";

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
  const [showDropdown, setShowDropdown] = useState<string | null>(null);
  const [pinnedSession, setPinnedSession] = useState<string[]>([]);
  const [editSession, setEditSession] = useState<Session | null>(null);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown when clicking outside

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setShowDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleSession = (id: string) => {
    setExpandedSession(expandedSession === id ? null : id);
  };

  const toggleDropdown = (id: string) => {
    setShowDropdown(showDropdown === id ? null : id);
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
    <div
      className={`${russoOne.className} flex flex-col items-center justify-center text-gray-100 `}
    >
      <div className="bg-slate-500 w-full text-center p-2">
        <h2>Tracking Feed</h2>
      </div>

      <div className="bg-slate-800 p-5 w-full min-h-screen items-center">
        {sessions.length === 0 ? (
          <p>No sessions yet. Let&apos;s get started!</p>
        ) : (
          <div className="flex flex-col">
            {sortByNewest(sessions).map((session: Session) => (
              <div key={session.id}>
                {pinnedSession.includes(session.id) && (
                  <div className="flex items-center gap-2 mb-2">
                    <Pin size={20} />
                    <p className="text-gray-400">Pinned</p>
                  </div>
                )}

                <div className="border p-4 rounded-md bg-slate-700 flex flex-col justify-center mb-5">
                  <div className="relative flex justify-between items-center mb-5">
                    {session.title}
                    <div
                      ref={showDropdown === session.id ? dropdownRef : null}
                      className="relative"
                    >
                      <button
                        onMouseDown={() => toggleDropdown(session.id)}
                        className=" text-gray-100"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="size-6"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
                          />
                        </svg>
                      </button>
                      {showDropdown === session.id && (
                        <div className="absolute right-0 top-10 border-2  rounded-md flex flex-col  z-50 bg-gray-700">
                          <button
                            onClick={() => {
                              setEditSession(session);
                              setShowDropdown(null);
                            }}
                            className="border-b  text-gray-100 px-4 py-2"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              togglePin(session.id);
                              setShowDropdown(null);
                            }}
                            className="border-b  text-gray-100 px-4 py-2"
                          >
                            {pinnedSession.includes(session.id)
                              ? "Unpin"
                              : "Pin"}
                          </button>
                          <button
                            onClick={() => {
                              handleDelete(session.id);
                              setShowDropdown(null);
                            }}
                            className="  text-gray-100 px-4 py-2"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {session.type === "training" && session.duration && (
                    <div>{formatDuration(session.duration)}</div>
                  )}
                  <div className="flex justify-between items-end mt-2">
                    <div className="pr-2">{session.notes}</div>

                    <button
                      onClick={() => toggleSession(session.id)}
                      className="bg-blue-500 text-gray-100 p-2 rounded-md hover:bg-blue-400"
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
                  {session.type === "training" && (
                    <TrainingSession session={session} />
                  )}
                  {session.type === "notes" && (
                    <NotesSession session={session} />
                  )}
                </Modal>
              </div>
            ))}
          </div>
        )}
      </div>
      {editSession && (
        <EditSession
          session={editSession}
          onClose={() => setEditSession(null)}
        />
      )}
    </div>
  );
}
