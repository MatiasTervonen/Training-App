"use client";

import Spinner from "@/components/spinner";
import ExerciseTypeSelect from "@/features/gym/components/ExerciseTypeSelect";
import { useState } from "react";
import { users } from "@/types/models";
import { banUser } from "@/database/admin/ban-user";
import toast from "react-hot-toast";
import SubNotesInput from "@/ui/SubNotesInput";
import { deleteUser } from "@/database/admin/delete-user";
import { promoteUser } from "@/database/admin/promote-user";
import { useQuery } from "@tanstack/react-query";
import { getUsers } from "@/database/admin/get-users";
import { getUserCount } from "@/database/admin/get-user-count";
import { UserTableSkeleton } from "@/ui/loadingSkeletons/skeletons";
import { useTranslation } from "react-i18next";

export default function Sessions() {
  const { t } = useTranslation("common");
  const [sortField, setSortField] = useState("created_at");
  const [reason, setReason] = useState<string>("");
  const [showBanReason, setShowBanReason] = useState<string | null>(null);
  const [selectedDurations, setSelectedDurations] = useState<{
    [userId: string]: string;
  }>({});
  const [selectedRole, setSelectedRole] = useState<{
    [userId: string]: string;
  }>({});
  const [page, setPage] = useState(0);
  const limit = 10;

  const {
    data,
    error,
    isLoading,
    refetch: mutateUsers,
  } = useQuery<users[]>({
    queryKey: ["get-users", page],
    queryFn: () => getUsers({ pageParam: page, limit }),
    placeholderData: (previousData) => previousData,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const {
    data: userCount,
    error: userCountError,
    isLoading: isLoadingUserCount,
  } = useQuery({
    queryKey: ["get-user-count"],
    queryFn: () => getUserCount(),
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const sortedData = [...(data || [])].sort((a, b) => {
    if (sortField === "created_at") {
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } else if (sortField === "email" || sortField === "role") {
      return (a[sortField] || "").localeCompare(b[sortField] || "");
    }
    return 0;
  });

  type BanUser = {
    user_id: string;
    duration: string;
    reason: string;
  };

  const handleBanUser = async ({ user_id, duration, reason }: BanUser) => {
    try {
      await banUser({ user_id, duration, reason });
      mutateUsers();

      if (reason === "unban") {
        toast.success(t("admin.analytics.userUnbanned"));
      } else {
        toast.success(t("admin.analytics.userBanned"));
      }
    } catch {
      toast.error(t("admin.analytics.errorBanning"));
    }
  };

  const handleDeleteUser = async (user_id: string) => {
    const confirmDelete = confirm(
      `${t("admin.analytics.confirmDelete")} ${user_id}`
    );
    if (!confirmDelete) return;

    try {
      await deleteUser(user_id);
      mutateUsers();

      toast.success(t("admin.analytics.userDeleted"));
    } catch {
      toast.error(t("admin.analytics.errorDeleting"));
    }
  };

  type PromoteUser = {
    userRole: string;
    user_id: string;
  };

  const handlePromoteUser = async ({ user_id, userRole }: PromoteUser) => {
    const confirmPromote = confirm(
      `${t("admin.analytics.confirmPromote")} ${user_id}`
    );
    if (!confirmPromote) return;

    try {
      await promoteUser({ user_id, userRole });
      mutateUsers();

      toast.success(t("admin.analytics.userPromoted"));
    } catch {
      toast.error(t("admin.analytics.errorPromoting"));
    }
  };

  const shorterId = (id: string, start = 4, end = 3) => {
    return `${id.slice(0, start)}...${id.slice(-end)}`;
  };

  const lastPage = userCount?.count
    ? Math.ceil(userCount?.count / limit) - 1
    : 0;

  return (
    <div className="relative max-w-7xl mx-auto page-padding">
      <h1 className="text-2xl text-center mb-10">
        {t("admin.analytics.title")}
      </h1>

      <div className="flex items-center justify-between mb-4">
        {userCountError ? (
          <p>{t("admin.analytics.errorLoadingCount")}</p>
        ) : (
          <div className="flex items-center gap-3">
            <p>{t("admin.analytics.totalUsers")}:</p>
            {isLoadingUserCount ? <Spinner /> : <p>{userCount?.count}</p>}
          </div>
        )}

        <div className="w-fit text-sm">
          <ExerciseTypeSelect
            label={t("admin.analytics.sortBy")}
            value={sortField}
            onChange={(value) => {
              setSortField(value);
            }}
            options={[
              { value: "created_at", label: t("admin.analytics.createdAt") },
              { value: "email", label: t("admin.analytics.email") },
              { value: "role", label: t("admin.analytics.role") },
            ]}
          />
        </div>
      </div>
      <div>
        {isLoading && <UserTableSkeleton count={11} />}
        {error && (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-red-500">{t("admin.analytics.loadError")}</p>
          </div>
        )}
        {!isLoading && !error && data && data.length > 0 && (
          <div className="overflow-x-auto min-h-[451px] bg-gray-900">
            <table className="min-w-full bg-gray-900 rounded-md">
              <thead>
                <tr className="text-left border-b border-gray-700">
                  <th className="px-4 py-2 font-normal">
                    {t("admin.analytics.tableHeaders.id")}
                  </th>
                  <th className="px-4 py-2 font-normal">
                    {t("admin.analytics.tableHeaders.displayName")}
                  </th>
                  <th className="px-4 py-2 font-normal">
                    {t("admin.analytics.tableHeaders.email")}
                  </th>
                  <th className="px-4 py-2 font-normal">
                    {t("admin.analytics.tableHeaders.role")}
                  </th>
                  <th className="px-4 py-2 font-normal">
                    {t("admin.analytics.tableHeaders.created")}
                  </th>
                  <th className="px-4 py-2 font-normal">
                    {t("admin.analytics.tableHeaders.actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedData.map((user) => (
                  <tr
                    key={user.id}
                    className="relative hover:bg-gray-700 border-b border-gray-600"
                  >
                    <td className="px-4 py-2 ">
                      <span className="">{shorterId(user.id)}</span>
                    </td>
                    <td className="px-4 py-2 ">{user.display_name || "-"}</td>
                    <td className="px-4 py-2">{user.email}</td>
                    <td className="px-4 py-2 relative group">
                      <span
                        className={`border py-1 px-2 rounded-xl text-sm ${
                          user.banned_until &&
                          new Date(user.banned_until) > new Date()
                            ? "bg-red-600"
                            : user.role === "admin"
                            ? "bg-blue-600"
                            : user.role === "super_admin"
                            ? "bg-purple-600"
                            : user.role === "user"
                            ? "bg-green-600"
                            : user.role === "guest"
                            ? "bg-yellow-600"
                            : "bg-gray-600"
                        }`}
                      >
                        {user.role}
                        {user.banned_until &&
                          new Date(user.banned_until) > new Date() && (
                            <span className="ml-2 text-">
                              {t("admin.analytics.banned")}
                            </span>
                          )}
                      </span>
                      {user.banned_until &&
                        new Date(user.banned_until) > new Date() && (
                          <div className="absolute z-10 border left-0 top-full w-48 bg-gray-800  py-2 px-4 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                            <p>
                              {t("admin.analytics.bannedUntil")} <br />
                              {new Date(user.banned_until).toLocaleDateString()}
                            </p>

                            {user.ban_reason && (
                              <p className="mt-2">
                                {t("admin.analytics.reason")} <br />
                                {user.ban_reason}
                              </p>
                            )}
                          </div>
                        )}
                    </td>
                    <td className="px-4 py-2">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 flex gap-2 flex-nowrap">
                      <button
                        className="text-red-500 cursor-pointer  hover:text-red-700"
                        onClick={async () => {
                          await handleDeleteUser(user.id);
                        }}
                      >
                        {t("admin.analytics.delete")}
                      </button>

                      <select
                        value={selectedDurations[user.id] ?? "ban"}
                        className="bg-slate-800 border w-17 px-1 border-gray-700  cursor-pointer rounded-lg text-sm"
                        onChange={async (e) => {
                          const value = e.target.value;
                          if (!value) return;

                          setSelectedDurations((prev) => ({
                            ...prev,
                            [user.id]: value,
                          }));

                          if (value === "unban") {
                            setShowBanReason(null); // no modal needed

                            const confirmed = confirm(
                              `${t("admin.analytics.confirmUnban")} ${user.id}?`
                            );

                            if (!confirmed) {
                              setSelectedDurations((prev) => ({
                                ...prev,
                                [user.id]: "",
                              }));
                              return;
                            }

                            await handleBanUser({
                              user_id: user.id,
                              duration: value,
                              reason: "",
                            });

                            setSelectedDurations((prev) => ({
                              ...prev,
                              [user.id]: "ban",
                            }));

                            return;
                          }

                          setShowBanReason(user.id);
                        }}
                      >
                        <option value="ban" disabled>
                          {t("admin.analytics.ban")}
                        </option>
                        <option value="24h">
                          {t("admin.analytics.banDurations.1day")}
                        </option>
                        <option value="168h">
                          {t("admin.analytics.banDurations.7day")}
                        </option>
                        <option value="720h">
                          {t("admin.analytics.banDurations.30day")}
                        </option>
                        <option value="876600h">
                          {t("admin.analytics.banDurations.permanent")}
                        </option>
                        <option value="unban">
                          {t("admin.analytics.unban")}
                        </option>
                      </select>

                      {showBanReason === user.id && (
                        <div className="fixed inset-0 z-50 left-1/2 -translate-x-1/2 h-fit top-30 w-fit rounded-lg  border-2 border-gray-700 bg-slate-900 p-10">
                          <div className="mb-4">
                            <h3>{t("admin.analytics.banModal.title")}</h3>
                            <p>{user.id}</p>
                            <p className="mt-2">
                              {t("admin.analytics.banModal.duration")}{" "}
                              {selectedDurations[user.id]}
                            </p>
                          </div>

                          <div className="flex flex-col gap-1">
                            <label htmlFor="">
                              {t("admin.analytics.banModal.giveReason")}
                            </label>
                            <SubNotesInput
                              placeholder={t(
                                "admin.analytics.banModal.reasonPlaceholder"
                              )}
                              notes={reason}
                              setNotes={setReason}
                            />
                          </div>
                          <button
                            className="mr-5 mt-4 bg-red-800 py-1 w-28 rounded-md shadow-xl border-2 border-red-500 text-lg cursor-pointer hover:bg-red-700 hover:scale-105 transition-all duration-200"
                            onClick={() => {
                              handleBanUser({
                                user_id: user.id,
                                duration: selectedDurations[user.id],
                                reason,
                              });
                              setShowBanReason(null);
                              setSelectedDurations((prev) => ({
                                ...prev,
                                [user.id]: "ban",
                              }));
                              setReason("");
                            }}
                          >
                            {t("admin.analytics.ban")}
                          </button>
                          <button
                            className="w-28 mt-2 bg-gray-600 py-1 rounded-md shadow-xl border-2 border-gray-500 text-lg cursor-pointer hover:bg-gray-700 hover:scale-105 transition-all duration-200"
                            onClick={() => {
                              setShowBanReason(null);
                              setSelectedDurations((prev) => ({
                                ...prev,
                                [user.id]: "ban",
                              }));
                              setReason("");
                            }}
                          >
                            {t("common.cancel")}
                          </button>
                        </div>
                      )}

                      <select
                        value={selectedRole[user.id] ?? "role"}
                        className="bg-slate-800 border w-17 px-1  border-gray-700  cursor-pointer rounded-lg text-sm"
                        onChange={async (e) => {
                          const newRole = e.target.value;
                          if (!newRole) return;

                          setSelectedRole((prev) => ({
                            ...prev,
                            [user.id]: newRole,
                          }));

                          await handlePromoteUser({
                            user_id: user.id,
                            userRole: newRole,
                          });

                          setSelectedRole((prev) => ({
                            ...prev,
                            [user.id]: "role",
                          }));
                        }}
                      >
                        <option value="role" disabled>
                          {t("admin.analytics.role")}
                        </option>
                        <option value="guest">
                          {t("admin.analytics.roles.guest")}
                        </option>
                        <option value="user">
                          {t("admin.analytics.roles.user")}
                        </option>
                        <option value="admin">
                          {t("admin.analytics.roles.admin")}
                        </option>
                        <option value="super_admin">
                          {t("admin.analytics.roles.superAdmin")}
                        </option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex items-center gap-5 mt-3">
          <button
            className="border border-gray-100 p-2 bg-blue-700"
            onClick={() => {
              if (page === 0) return;

              setPage((p) => p - 1);
            }}
          >
            {t("admin.analytics.pagination.previous")}
          </button>
          <p className="border border-gray-100 p-2 bg-gray-600">
            {t("admin.analytics.pagination.page")} {page + 1}
          </p>
          <button
            className="border border-gray-100 p-2 bg-blue-700"
            disabled={page >= lastPage}
            onClick={() => {
              if (page < lastPage) setPage((p) => p + 1);
            }}
          >
            {t("admin.analytics.pagination.next")}
          </button>
        </div>
      </div>
    </div>
  );
}
