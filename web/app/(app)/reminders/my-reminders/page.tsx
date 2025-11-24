"use client";

import { deleteReminder } from "../../database/reminder";
import toast from "react-hot-toast";
import { useState } from "react";
import { TemplateSkeleton } from "../../ui/loadingSkeletons/skeletons";
import { reminders } from "../../types/models";
import MyReminderCard from "../../components/cards/MyReminderCard";
import ReminderSession from "../../components/expandSession/reminder";
import Modal from "../../components/modal";
import EditReminder from "../../ui/editSession/EditReminder";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { getRTeminders } from "../../database/reminder";

export default function Sessions() {
  const [expandedItem, setExpandedItem] = useState<reminders | null>(null);
  const [editingItem, setEditingItem] = useState<reminders | null>(null);
  const [activeTab, setActiveTab] = useState<"upcoming" | "delivered">(
    "upcoming"
  );

  const queryClient = useQueryClient();

  const {
    error,
    isLoading,
    data: reminders = [],
  } = useQuery<reminders[]>({
    queryKey: ["get-reminders"],
    queryFn: getRTeminders,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });

  const handleDeleteReminder = async (reminder: reminders) => {
    const confirmDelete = confirm(
      "Are you sure you want to delete this reminder?"
    );
    if (!confirmDelete) return;

    const queryKey = ["get-reminders"];

    await queryClient.cancelQueries({ queryKey });

    const previousReminders = queryClient.getQueryData(queryKey);

    queryClient.setQueryData<reminders[]>(queryKey, (oldData) => {
      if (!oldData) return;

      return oldData.filter((r) => r.id !== reminder.id);
    });

    try {
      await deleteReminder(reminder.id);

      await queryClient.refetchQueries({ queryKey: ["feed"], exact: true });
    } catch {
      queryClient.setQueryData(queryKey, previousReminders);
      toast.error("Error deleting reminder. Please try again later! ");
    }
  };

  const filteredReminders = reminders.filter((r) =>
    activeTab === "upcoming" ? !r.delivered : r.delivered
  );

  return (
    <div className="pt-5 px-5 max-w-md mx-auto">
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
          <ReminderSession {...expandedItem} />
        </Modal>
      )}

      {editingItem && (
        <Modal
          isOpen={true}
          onClose={() => {
            setEditingItem(null);
          }}
        >
          <EditReminder
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
