"use client";

import { russoOne } from "@/app/ui/fonts";
import useSWR from "swr";
import Spinner from "@/app/(app)/components/spinner";
import ExerciseTypeSelect from "@/app/(app)/training/components/ExerciseTypeSelect";
import { useState } from "react";
import { banUser } from "./components/banUser";
import { deleteUser } from "./components/deleteUser";
import { promoteUser } from "./components/promoteUser";

type Users = {
  id: string;
  email: string;
  role: string;
  display_name: string;
  created_at: string;
  banned_until?: string | null;
  ban_reason?: string | null;
};

export default function Sessions() {
  const [sortField, setSortField] = useState("created_at");
  const [reason, setReason] = useState<string>("");
  const [showBanReason, setShowBanReason] = useState<string | null>(null);
  const [selectedDurations, setSelectedDurations] = useState<{
    [userId: string]: string;
  }>({});
  const [selectedRole, setSelectedRole] = useState<{
    [userId: string]: string;
  }>({});

  const fetcher = (url: string) => fetch(url).then((res) => res.json());

  const { data, error, isLoading } = useSWR<Users[]>(
    "/api/users/get-users",
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const sortedData = [...(data || [])].sort((a, b) => {
    if (sortField === "created_at") {
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } else if (sortField === "email" || sortField === "role") {
      return a[sortField].localeCompare(b[sortField]);
    }
    return 0;
  });

  const shorterId = (id: string, start = 4, end = 3) => {
    return `${id.slice(0, start)}...${id.slice(-end)}`;
  };

  const userAmouunt = data ? data.length : 0;

  return (
    <div
      className={`${russoOne.className} relative max-w-7xl mx-auto h-full px-4 mt-5`}
    >
      <h1 className={`${russoOne.className} text-gray-100   text-2xl `}>
        User Analytics
      </h1>

      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-gray-400 text-sm">
            Total Users: <span className="text-gray-100">{userAmouunt}</span>
          </p>
        </div>
        <div className="w-fit text-sm">
          <ExerciseTypeSelect
            label="sort by"
            value={sortField}
            onChange={(value) => {
              setSortField(value);
            }}
            options={[
              { value: "created_at", label: "Created At" },
              { value: "email", label: "Email" },
              { value: "role", label: "Role" },
            ]}
          />
        </div>
      </div>
      <div>
        {isLoading && (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-gray-100">Loading user data...</p>
            <Spinner />
          </div>
        )}
        {error && (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-red-500">Failed to load user data.</p>
          </div>
        )}
        {!isLoading && !error && data && data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-gray-800 text-gray-100">
              <thead>
                <tr className="text-left border-b border-gray-700">
                  <th className="px-4 py-2 font-normal">id</th>
                  <th className="px-4 py-2 font-normal">d.name</th>
                  <th className="px-4 py-2 font-normal">Email</th>
                  <th className="px-4 py-2 font-normal">Role</th>
                  <th className="px-4 py-2 font-normal">Created</th>
                  <th className="px-4 py-2 font-normal">Actions</th>
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
                      {" "}
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
                            <span className="ml-2 text-">banned</span>
                          )}
                      </span>
                      {user.banned_until &&
                        new Date(user.banned_until) > new Date() && (
                          <div className="absolute z-10 border left-0 top-full mt-1 w-48 bg-gray-800 text-gray-100 p-2 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <p>
                              Banned until:{" "}
                              {new Date(user.banned_until).toLocaleDateString()}
                            </p>
                            {user.ban_reason && (
                              <p>
                                Reason:
                                {user.ban_reason}
                              </p>
                            )}
                          </div>
                        )}
                    </td>
                    <td className="px-4 py-2">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className=" px-4 py-2 flex gap-2 flex-nowrap">
                      <button
                        className="text-red-500 cursor-pointer  hover:text-red-700"
                        onClick={() => {
                          deleteUser(user.id);
                        }}
                      >
                        delete
                      </button>

                      <select
                        value={selectedDurations[user.id] || ""}
                        className="bg-slate-900 border w-17 px-1  border-gray-700  cursor-pointer rounded-lg text-sm"
                        onChange={(e) => {
                          const value = e.target.value;
                          if (!value) return;

                          setSelectedDurations((prev) => ({
                            ...prev,
                            [user.id]: value,
                          }));

                          if (value === "unban") {
                            setShowBanReason(null); // no modal needed

                            setTimeout(() => {
                              const confirmed = confirm(
                                `Are you sure you want to unban user: ${user.id}?`
                              );

                              if (!confirmed) {
                                setSelectedDurations((prev) => ({
                                  ...prev,
                                  [user.id]: "",
                                }));
                                return;
                              }

                              banUser(user.id, value, "");
                              setSelectedDurations((prev) => ({
                                ...prev,
                                [user.id]: "",
                              }));
                            }, 0);

                            return;
                          }

                          setShowBanReason(user.id);
                        }}
                      >
                        <option value="" disabled>
                          Ban
                        </option>
                        <option value="24h">1 Day</option>
                        <option value="168h">7 Day</option>
                        <option value="720h">30 Day</option>
                        <option value="876600h">Permanent</option>
                        <option value="unban">Unban</option>
                      </select>

                      {showBanReason === user.id && (
                        <div className="fixed inset-0 z-50 left-1/2 -translate-x-1/2 h-fit top-30 w-fit rounded-lg  border-2 border-gray-700 bg-slate-900 p-10">
                          <div className="mb-4">
                            <h3>Ban User:</h3>
                            <p>{user.id}</p>
                            <p className="mt-2">
                              Duration: {selectedDurations[user.id]}
                            </p>
                          </div>

                          <div className="flex flex-col gap-1">
                            <label htmlFor="">Give reason:</label>
                            <input
                              type="text"
                              spellCheck={false}
                              placeholder="Ban reason"
                              className="py-1 pl-2 rounded-md border-2 border-gray-100 z-10  placeholder-gray-500  text-gray-100 bg-[linear-gradient(50deg,_#0f172a,_#1e293b,_#333333)] hover:border-blue-500 focus:outline-none focus:border-green-300"
                              onChange={(e) => {
                                const reason = e.target.value;
                                setReason(reason);
                              }}
                            />
                          </div>
                          <button
                            className="mt-4 mr-4 bg-red-600 text-white px-4 py-1 rounded-md hover:bg-red-700 transition-colors cursor-pointer"
                            onClick={() => {
                              banUser(
                                user.id,
                                selectedDurations[user.id],
                                reason
                              );
                              setShowBanReason(null);
                              setSelectedDurations((prev) => ({
                                ...prev,
                                [user.id]: "",
                              }));
                              setReason("");
                            }}
                          >
                            Ban
                          </button>
                          <button
                            className="mt-2 bg-gray-600 text-white px-4 py-1 rounded-md hover:bg-gray-700 transition-colors cursor-pointer"
                            onClick={() => {
                              setShowBanReason(null);
                              setSelectedDurations((prev) => ({
                                ...prev,
                                [user.id]: "",
                              }));
                              setReason("");
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      )}

                      <select
                        value={selectedRole[user.id] || ""}
                        className="bg-slate-900 border w-17 px-1  border-gray-700  cursor-pointer rounded-lg text-sm"
                        onChange={(e) => {
                          const newRole = e.target.value;
                          if (!newRole) return;

                          setSelectedRole((prev) => ({
                            ...prev,
                            [user.id]: newRole,
                          }));

                          setTimeout(() => {
                            promoteUser(user.id, newRole);
                            setSelectedRole((prev) => ({
                              ...prev,
                              [user.id]: "",
                            }));
                          }, 0);
                        }}
                      >
                        <option value="" disabled>
                          Role
                        </option>
                        <option value="guest">Guest</option>
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                        <option value="super_admin">Super admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          !isLoading && (
            <div className="flex flex-col items-center justify-center h-full">
              <p className="text-gray-100">No users found.</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
