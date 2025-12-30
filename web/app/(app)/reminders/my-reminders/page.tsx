"use client";

import { useState } from "react";
import { TemplateSkeleton } from "../../ui/loadingSkeletons/skeletons";
import MyReminderCard from "@/app/(app)/components/feed-cards/MyReminderCard";
import Modal from "../../components/modal";
import EditMyGlobalReminder from "@/app/(app)/components/edit-session-cards/EditMyReminder";
import { useQuery } from "@tanstack/react-query";
import { full_reminder } from "@/app/(app)/types/session";
import { getReminders } from "@/app/(app)/database/reminders/get-reminders";
import useDeleteReminder from "@/app/(app)/reminders/hooks/useDeleteReminder";
import MyReminderSession from "@/app/(app)/components/expand-session-cards/myReminder";

export default function Sessions() {
  const [expandedItem, setExpandedItem] = useState<full_reminder | null>(null);
  const [editingItem, setEditingItem] = useState<full_reminder | null>(null);
  const [activeTab, setActiveTab] = useState<"upcoming" | "delivered">(
    "upcoming"
  );

  const {
    error,
    isLoading,
    data: reminders = [],
  } = useQuery<full_reminder[]>({
    queryKey: ["get-reminders"],
    queryFn: async () => {
      const data = await getReminders();
      return data as full_reminder[];
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  // useDeleteReminder hook to delete reminder
  const { handleDeleteReminder } = useDeleteReminder();

  const filteredReminders = reminders.filter((r) =>
    activeTab === "upcoming"
      ? !r.seen_at && !r.delivered
      : r.seen_at || r.delivered
  );

  return (
    <div className="page-padding max-w-md mx-auto">
      <h1 className="text-center mb-10 text-2xl "> My Reminders</h1>
      <div className="flex items-center justify-center gap-5 my-10">
        <button
          onClick={() => setActiveTab("upcoming")}
          className={`px-4 py-2 w-[150px] rounded-xl cursor-pointer ${
            activeTab === "upcoming" ? "bg-gray-900 text-cyan-500" : ""
          }`}
        >
          Upcoming
        </button>
        <button
          onClick={() => setActiveTab("delivered")}
          className={`px-4 py-2 w-[150px] rounded-xl cursor-pointer ${
            activeTab === "delivered" ? "bg-gray-900 text-cyan-500" : ""
          }`}
        >
          Delivered
        </button>
      </div>
      {!error && isLoading && <TemplateSkeleton count={6} />}
      {error && (
        <p className="text-red-500 text-center">
          Error loading reminders. Try again!
        </p>
      )}
      {!isLoading && filteredReminders.length === 0 && (
        <p className="text-gray-300 text-center mt-10 text-lg">
          No {activeTab} reminders.
        </p>
      )}
      {filteredReminders.map((reminder, index) => (
        <MyReminderCard
          key={reminder.id}
          index={index}
          item={reminder}
          onDelete={() => handleDeleteReminder(reminder)}
          onExpand={() => setExpandedItem(reminder)}
          onEdit={() => setEditingItem(reminder)}
        />
      ))}

      {expandedItem && (
        <Modal
          isOpen={true}
          onClose={() => {
            setExpandedItem(null);
          }}
        >
          <MyReminderSession {...expandedItem} />
        </Modal>
      )}

      {editingItem && (
        <Modal
          isOpen={true}
          onClose={() => {
            setEditingItem(null);
          }}
        >
          <EditMyGlobalReminder
            reminder={editingItem}
            onClose={() => setEditingItem(null)}
            onSave={async () => {
              setEditingItem(null);
            }}
          />
        </Modal>
      )}
    </div>
  );
}
