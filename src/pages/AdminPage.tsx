import { useEffect, useRef, useState, type FormEvent } from "react";
import { Archive, ArchiveRestore, CalendarDays, Check, ClipboardList, MessageSquare, Plus, Settings, Shield, Tag, Trash2, UserPlus, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getUsers,
  createManagedUser,
  removeManagedUser,
  setUserRole,
  type ManagedUser,
} from "@/api/users";
import { getLogs, writeLog, type LogAction, type LogEntry } from "@/api/logs";
import { useAuth } from "@/context/AuthContext";
import {
  getHerbariumConfig,
  saveHerbariumConfig,
  ALL_FORM_FIELDS,
  FORM_FIELD_LABELS,
  ALL_TABLE_ATTRIBUTES,
  TABLE_ATTRIBUTE_LABELS,
  ALL_SUMMARY_FIELDS,
  SUMMARY_FIELD_LABELS,
  SUMMARY_FIELD_TABS,
  type HerbariumConfig,
  type FormFieldKey,
  type TableAttribute,
  type SummaryField,
} from "@/api/config";
import {
  getFeedback,
  updateFeedbackTags,
  setFeedbackArchived,
  type FeedbackEntry,
} from "@/api/feedback";

function AdminPage() {
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<"users" | "logs" | "config" | "feedback">("users");

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [activeActions, setActiveActions] = useState<Set<LogAction>>(new Set());
  const [hasDateFilter, setHasDateFilter] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [logPage, setLogPage] = useState(1);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showDatePopover, setShowDatePopover] = useState(false);
  const filterMenuRef = useRef<HTMLDivElement>(null);
  const dateChipRef = useRef<HTMLDivElement>(null);

  // Add user dialog state
  const [showDialog, setShowDialog] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [addError, setAddError] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  // Remove confirmation state
  const [confirmRemoveUid, setConfirmRemoveUid] = useState<string | null>(null);
  const [removeLoading, setRemoveLoading] = useState(false);

  // Config state
  const [config, setConfig] = useState<HerbariumConfig | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [configSaved, setConfigSaved] = useState(false);

  // Feedback state
  const [feedbackList, setFeedbackList] = useState<FeedbackEntry[]>([]);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [feedbackPage, setFeedbackPage] = useState(1);
  const [showArchived, setShowArchived] = useState(false);
  const [tagInput, setTagInput] = useState<{ id: string; value: string } | null>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void fetchUsers();
  }, []);

  useEffect(() => {
    if (activeTab === "logs") {
      void fetchLogs();
    }
    if (activeTab === "config") {
      void fetchConfig();
    }
    if (activeTab === "feedback") {
      void fetchFeedbackList();
    }
  }, [activeTab]);

  useEffect(() => {
    setLogPage(1);
  }, [activeActions, hasDateFilter, dateFrom, dateTo]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filterMenuRef.current && !filterMenuRef.current.contains(e.target as Node)) {
        setShowFilterMenu(false);
      }
      if (dateChipRef.current && !dateChipRef.current.contains(e.target as Node)) {
        setShowDatePopover(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function fetchUsers() {
    setLoadingUsers(true);
    try {
      const data = await getUsers();
      setUsers(data.sort((a, b) => a.email.localeCompare(b.email)));
    } finally {
      setLoadingUsers(false);
    }
  }

  async function fetchLogs() {
    setLoadingLogs(true);
    try {
      const data = await getLogs();
      setLogs(data);
    } finally {
      setLoadingLogs(false);
    }
  }

  async function handleAddUser(e: FormEvent) {
    e.preventDefault();
    setAddError("");
    setAddLoading(true);
    try {
      await createManagedUser(newEmail, newPassword);
      await writeLog("user_add", currentUser?.email ?? "admin", `Added user: ${newEmail}`);
      setNewEmail("");
      setNewPassword("");
      setShowDialog(false);
      await fetchUsers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create user.";
      if (msg.includes("email-already-in-use")) {
        setAddError("An account with this email already exists.");
      } else if (msg.includes("weak-password")) {
        setAddError("Password must be at least 6 characters.");
      } else {
        setAddError(msg);
      }
    } finally {
      setAddLoading(false);
    }
  }

  async function handleRemoveUser(uid: string) {
    setRemoveLoading(true);
    try {
      const removedUser = users.find((u) => u.uid === uid);
      await removeManagedUser(uid);
      await writeLog("user_remove", currentUser?.email ?? "admin", `Removed user: ${removedUser?.email ?? uid}`);
      setConfirmRemoveUid(null);
      await fetchUsers();
    } finally {
      setRemoveLoading(false);
    }
  }

  async function handleRoleChange(uid: string, newRole: "admin" | "user") {
    const target = users.find((u) => u.uid === uid);
    if (!target) return;
    await setUserRole(uid, newRole);
    await writeLog(
      "user_role_change",
      currentUser?.email ?? "admin",
      `Changed ${target.email} role to ${newRole}`,
    );
    await fetchUsers();
  }

  async function fetchConfig() {
    setLoadingConfig(true);
    try {
      const data = await getHerbariumConfig();
      setConfig(data);
    } finally {
      setLoadingConfig(false);
    }
  }

  async function fetchFeedbackList() {
    setLoadingFeedback(true);
    try {
      const data = await getFeedback();
      setFeedbackList(data);
    } finally {
      setLoadingFeedback(false);
    }
  }

  async function handleAddTag(id: string, tag: string) {
    const trimmed = tag.trim().toLowerCase();
    if (!trimmed) return;
    const entry = feedbackList.find((f) => f.id === id);
    if (!entry || entry.tags.includes(trimmed)) return;
    const newTags = [...entry.tags, trimmed];
    await updateFeedbackTags(id, newTags);
    setFeedbackList((prev) =>
      prev.map((f) => (f.id === id ? { ...f, tags: newTags } : f)),
    );
  }

  async function handleRemoveTag(id: string, tag: string) {
    const entry = feedbackList.find((f) => f.id === id);
    if (!entry) return;
    const newTags = entry.tags.filter((t) => t !== tag);
    await updateFeedbackTags(id, newTags);
    setFeedbackList((prev) =>
      prev.map((f) => (f.id === id ? { ...f, tags: newTags } : f)),
    );
  }

  async function handleToggleArchive(id: string) {
    const entry = feedbackList.find((f) => f.id === id);
    if (!entry) return;
    const newArchived = !entry.archived;
    await setFeedbackArchived(id, newArchived);
    setFeedbackList((prev) =>
      prev.map((f) => (f.id === id ? { ...f, archived: newArchived } : f)),
    );
  }

  async function handleSaveConfig() {
    if (!config) return;
    setSavingConfig(true);
    try {
      await saveHerbariumConfig(config);
      await writeLog("config_update", currentUser?.email ?? "admin", "Updated herbarium configuration");
      setConfigSaved(true);
      setTimeout(() => setConfigSaved(false), 2000);
    } finally {
      setSavingConfig(false);
    }
  }

  function toggleRequiredField(field: FormFieldKey) {
    if (!config) return;
    setConfig({
      ...config,
      requiredFields: config.requiredFields.includes(field)
        ? config.requiredFields.filter((f) => f !== field)
        : [...config.requiredFields, field],
    });
  }

  function toggleTableAttribute(attr: TableAttribute) {
    if (!config) return;
    setConfig({
      ...config,
      tableAttributes: config.tableAttributes.includes(attr)
        ? config.tableAttributes.filter((a) => a !== attr)
        : [...config.tableAttributes, attr],
    });
  }

  function toggleSummaryField(field: SummaryField) {
    if (!config) return;
    setConfig({
      ...config,
      summaryFields: config.summaryFields.includes(field)
        ? config.summaryFields.filter((f) => f !== field)
        : [...config.summaryFields, field],
    });
  }

  return (
    <>
      {/* Page header */}
      <div className="bg-zinc-900 p-4 w-full text-zinc-50">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          <h1 className="text-2xl font-semibold">Admin Panel</h1>
        </div>
        <p className="text-sm text-zinc-400 mt-0.5">Manage user accounts and view activity logs.</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-200 bg-white px-4 md:px-6">
        <div className="flex gap-0">
          <button
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "users"
                ? "border-lime-600 text-zinc-900"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
            onClick={() => setActiveTab("users")}
          >
            <Users className="size-4" />
            Users
          </button>
          <button
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "logs"
                ? "border-lime-600 text-zinc-900"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
            onClick={() => setActiveTab("logs")}
          >
            <ClipboardList className="size-4" />
            Activity Logs
          </button>
          <button
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "config"
                ? "border-lime-600 text-zinc-900"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
            onClick={() => setActiveTab("config")}
          >
            <Settings className="size-4" />
            Configurations
          </button>
          <button
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "feedback"
                ? "border-lime-600 text-zinc-900"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
            onClick={() => setActiveTab("feedback")}
          >
            <MessageSquare className="size-4" />
            Feedback
          </button>
        </div>
      </div>

      {/* Users tab */}
      {activeTab === "users" && (
        <div className="p-4 md:p-6 max-w-3xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-zinc-800">User Accounts</h2>
            <Button
              size="sm"
              className="bg-zinc-900 hover:bg-zinc-800 text-zinc-50 gap-2"
              onClick={() => { setShowDialog(true); setAddError(""); }}
            >
              <UserPlus className="size-4" />
              Add User
            </Button>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white overflow-hidden">
            {loadingUsers ? (
              <div className="p-6 text-sm text-zinc-500">Loading users...</div>
            ) : users.length === 0 ? (
              <div className="p-6 text-sm text-zinc-500">No users found.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50">
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">Email</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">Role</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const isSelf = user.uid === currentUser?.uid;
                    const adminCount = users.filter((u) => u.role === "admin").length;
                    const isLastAdmin = user.role === "admin" && adminCount <= 1;
                    return (
                      <tr key={user.uid} className="border-b border-zinc-100 last:border-0">
                        <td className="px-4 py-3 text-zinc-800 font-mono text-xs">{user.email}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              user.role === "admin"
                                ? "bg-lime-100 text-lime-800"
                                : "bg-zinc-100 text-zinc-600"
                            }`}
                          >
                            {user.role === "admin" ? "Admin" : "User"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {!isSelf && (
                            confirmRemoveUid === user.uid ? (
                              <div className="flex items-center justify-end gap-2">
                                <span className="text-xs text-zinc-500">Remove this user?</span>
                                <Button
                                  size="xs"
                                  variant="destructive"
                                  disabled={removeLoading}
                                  onClick={() => handleRemoveUser(user.uid)}
                                >
                                  {removeLoading ? "Removing..." : "Confirm"}
                                </Button>
                                <Button
                                  size="xs"
                                  variant="outline"
                                  onClick={() => setConfirmRemoveUid(null)}
                                >
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-2">
                                {user.role === "user" ? (
                                  <Button
                                    size="xs"
                                    variant="outline"
                                    className="text-lime-800 border-lime-200 hover:bg-lime-50"
                                    onClick={() => handleRoleChange(user.uid, "admin")}
                                  >
                                    Make Admin
                                  </Button>
                                ) : (
                                  <Button
                                    size="xs"
                                    variant="outline"
                                    className="text-zinc-600 hover:bg-zinc-50"
                                    disabled={isLastAdmin}
                                    title={isLastAdmin ? "At least one admin must remain" : undefined}
                                    onClick={() => handleRoleChange(user.uid, "user")}
                                  >
                                    Remove Admin
                                  </Button>
                                )}
                                <Button
                                  size="icon-xs"
                                  variant="ghost"
                                  className="text-zinc-400 hover:text-red-600 hover:bg-red-50"
                                  disabled={isLastAdmin}
                                  title={isLastAdmin ? "At least one admin must remain" : undefined}
                                  onClick={() => setConfirmRemoveUid(user.uid)}
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>
                              </div>
                            )
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <p className="mt-3 text-xs text-zinc-400">
            Removed users lose access on their next session. At least one admin must exist at all times.
          </p>
        </div>
      )}

      {/* Logs tab */}
      {activeTab === "logs" && (
        <div className="p-4 md:p-6 max-w-5xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-zinc-800">Activity Logs</h2>
            <Button size="sm" variant="outline" onClick={() => void fetchLogs()} disabled={loadingLogs}>
              {loadingLogs ? "Refreshing..." : "Refresh"}
            </Button>
          </div>

          {/* Notion-style filter bar */}
          <div className="flex flex-wrap items-center gap-2 mb-4">

            {/* Date range chip */}
            {hasDateFilter && (
              <div className="relative" ref={dateChipRef}>
                <button
                  onClick={() => setShowDatePopover((v) => !v)}
                  className="flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  <CalendarDays className="size-3 text-zinc-400" />
                  <span className="text-zinc-500">Date</span>
                  {dateFrom || dateTo ? (
                    <span className="text-zinc-700">
                      {dateFrom
                        ? new Date(dateFrom + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })
                        : "\u2026"}
                      {" \u2192 "}
                      {dateTo
                        ? new Date(dateTo + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })
                        : "\u2026"}
                    </span>
                  ) : (
                    <span className="text-zinc-400">any</span>
                  )}
                  <X
                    className="size-3 text-zinc-400 hover:text-zinc-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      setHasDateFilter(false);
                      setDateFrom("");
                      setDateTo("");
                      setShowDatePopover(false);
                    }}
                  />
                </button>
                {showDatePopover && (
                  <div className="absolute top-full left-0 mt-1.5 z-30 rounded-lg border border-zinc-200 bg-white shadow-xl p-3 space-y-2 w-52">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold uppercase tracking-widest text-zinc-400">From</label>
                      <Input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold uppercase tracking-widest text-zinc-400">To</label>
                      <Input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action chips */}
            {Array.from(activeActions).map((action) => {
              const { label, className } = ACTION_STYLES[action];
              return (
                <div
                  key={action}
                  className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium ${className}`}
                >
                  Action: {label}
                  <button
                    onClick={() =>
                      setActiveActions((prev) => {
                        const next = new Set(prev);
                        next.delete(action);
                        return next;
                      })
                    }
                  >
                    <X className="size-3 opacity-60 hover:opacity-100" />
                  </button>
                </div>
              );
            })}

            {/* Add filter button */}
            {(!hasDateFilter || activeActions.size < Object.keys(ACTION_STYLES).length) && (
              <div className="relative" ref={filterMenuRef}>
                <button
                  onClick={() => setShowFilterMenu((v) => !v)}
                  className="flex items-center gap-1.5 rounded-md border border-dashed border-zinc-300 px-2.5 py-1.5 text-xs font-medium text-zinc-500 hover:border-zinc-400 hover:text-zinc-700"
                >
                  <Plus className="size-3" />
                  Add filter
                </button>
                {showFilterMenu && (
                  <div className="absolute top-full left-0 mt-1.5 z-30 rounded-lg border border-zinc-200 bg-white shadow-xl py-1 min-w-40">
                    {!hasDateFilter && (
                      <button
                        onClick={() => {
                          setHasDateFilter(true);
                          setShowFilterMenu(false);
                          setShowDatePopover(true);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-xs text-zinc-700 hover:bg-zinc-50"
                      >
                        <CalendarDays className="size-3.5 text-zinc-400" />
                        Date Range
                      </button>
                    )}
                    {(Object.keys(ACTION_STYLES) as LogAction[])
                      .filter((a) => !activeActions.has(a))
                      .map((action) => (
                        <button
                          key={action}
                          onClick={() => {
                            setActiveActions((prev) => {
                              const next = new Set(prev);
                              next.add(action);
                              return next;
                            });
                            setShowFilterMenu(false);
                          }}
                          className="flex w-full items-center px-3 py-1.5 hover:bg-zinc-50"
                        >
                          <LogActionBadge action={action} />
                        </button>
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* Clear all */}
            {(hasDateFilter || activeActions.size > 0) && (
              <button
                onClick={() => {
                  setActiveActions(new Set());
                  setHasDateFilter(false);
                  setDateFrom("");
                  setDateTo("");
                  setShowDatePopover(false);
                }}
                className="text-xs text-zinc-400 hover:text-zinc-700 underline"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white overflow-hidden">
            {loadingLogs ? (
              <div className="p-6 text-sm text-zinc-500">Loading logs...</div>
            ) : logs.length === 0 ? (
              <div className="p-6 text-sm text-zinc-500">No activity recorded yet.</div>
            ) : (() => {
              const PAGE_SIZE = 10;
              const fromMs = hasDateFilter && dateFrom ? new Date(dateFrom).getTime() : -Infinity;
              const toMs = hasDateFilter && dateTo ? new Date(dateTo + "T23:59:59").getTime() : Infinity;
              const filtered = logs.filter((l) => {
                const ts = l.timestamp.toDate().getTime();
                return (
                  (activeActions.size === 0 || activeActions.has(l.action)) &&
                  ts >= fromMs &&
                  ts <= toMs
                );
              });
              const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
              const safePage = Math.min(logPage, totalPages);
              const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
              return filtered.length === 0 ? (
                <div className="p-6 text-sm text-zinc-500">No logs match the selected filter.</div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-zinc-100 bg-zinc-50">
                          <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">Timestamp</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">Action</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">Performed By</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">Detail</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pageItems.map((log) => (
                          <tr key={log.id} className="border-b border-zinc-100 last:border-0">
                            <td className="px-4 py-3 text-zinc-500 font-mono text-xs whitespace-nowrap">
                              {log.timestamp.toDate().toLocaleString()}
                            </td>
                            <td className="px-4 py-3">
                              <LogActionBadge action={log.action} />
                            </td>
                            <td className="px-4 py-3 text-zinc-700 font-mono text-xs">{log.performedBy}</td>
                            <td className="px-4 py-3 text-zinc-600 text-xs">{log.detail}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-zinc-100 px-4 py-3">
                      <span className="text-xs text-zinc-400">
                        Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setLogPage((p) => Math.max(1, p - 1))}
                          disabled={safePage === 1}
                          className="rounded px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          ← Prev
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                          <button
                            key={n}
                            onClick={() => setLogPage(n)}
                            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                              n === safePage
                                ? "bg-zinc-900 text-white"
                                : "text-zinc-600 hover:bg-zinc-100"
                            }`}
                          >
                            {n}
                          </button>
                        ))}
                        <button
                          onClick={() => setLogPage((p) => Math.min(totalPages, p + 1))}
                          disabled={safePage === totalPages}
                          className="rounded px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          Next →
                        </button>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Configurations tab */}
      {activeTab === "config" && (
        <div className="p-4 md:p-6 max-w-4xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-zinc-800">Herbarium Configurations</h2>
            <Button
              size="sm"
              className="bg-zinc-900 hover:bg-zinc-800 text-zinc-50 gap-2"
              onClick={() => void handleSaveConfig()}
              disabled={savingConfig || loadingConfig || !config}
            >
              {configSaved ? (
                <>
                  <Check className="size-4" />
                  Saved
                </>
              ) : savingConfig ? (
                "Saving..."
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>

          {loadingConfig || !config ? (
            <div className="p-6 text-sm text-zinc-500">Loading configurations...</div>
          ) : (
            <div className="space-y-8">
              {/* 1. Accession Code Pattern */}
              <section>
                <h3 className="text-sm font-semibold text-zinc-800 mb-1">Accession Code Pattern</h3>
                <p className="text-xs text-zinc-500 mb-3">
                  Define the accession numbering format. Use <code className="rounded bg-zinc-100 px-1 py-0.5 text-[11px] font-mono">#</code> as a digit placeholder.
                </p>
                <Input
                  value={config.accessionPattern}
                  onChange={(e) => setConfig({ ...config, accessionPattern: e.target.value })}
                  placeholder="e.g. PLMH-#-##-###"
                  className="max-w-xs font-mono h-10"
                />
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-zinc-400">Preview:</span>
                  <span className="rounded bg-zinc-100 px-2 py-1 font-mono text-xs text-zinc-700">
                    {config.accessionPattern.replace(/#/g, () => String(Math.floor(Math.random() * 10)))}
                  </span>
                </div>
              </section>

              <hr className="border-zinc-200" />

              {/* 2. Required Fields */}
              <section>
                <h3 className="text-sm font-semibold text-zinc-800 mb-1">Required Fields</h3>
                <p className="text-xs text-zinc-500 mb-3">
                  Select which fields are required when adding a new specimen.
                </p>
                <div className="flex flex-wrap gap-2">
                  {ALL_FORM_FIELDS.map((field) => {
                    const isActive = config.requiredFields.includes(field);
                    return (
                      <button
                        key={field}
                        onClick={() => toggleRequiredField(field)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                          isActive
                            ? "bg-lime-100 text-lime-800 ring-1 ring-lime-300"
                            : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                        }`}
                      >
                        {isActive && <Check className="size-3" />}
                        {FORM_FIELD_LABELS[field]}
                      </button>
                    );
                  })}
                </div>
              </section>

              <hr className="border-zinc-200" />

              {/* 3. Table Attributes */}
              <section>
                <h3 className="text-sm font-semibold text-zinc-800 mb-1">Table Display Attributes</h3>
                <p className="text-xs text-zinc-500 mb-3">
                  Choose which columns appear in the collection table.
                </p>
                <div className="flex flex-wrap gap-2">
                  {ALL_TABLE_ATTRIBUTES.map((attr) => {
                    const isActive = config.tableAttributes.includes(attr);
                    return (
                      <button
                        key={attr}
                        onClick={() => toggleTableAttribute(attr)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                          isActive
                            ? "bg-lime-100 text-lime-800 ring-1 ring-lime-300"
                            : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                        }`}
                      >
                        {isActive && <Check className="size-3" />}
                        {TABLE_ATTRIBUTE_LABELS[attr]}
                      </button>
                    );
                  })}
                </div>
                {config.tableAttributes.length === 0 && (
                  <p className="mt-2 text-xs text-amber-600">At least one column should be visible.</p>
                )}
              </section>

              <hr className="border-zinc-200" />

              {/* 4. Summary Display Fields */}
              <section>
                <h3 className="text-sm font-semibold text-zinc-800 mb-1">Specimen Summary Fields</h3>
                <p className="text-xs text-zinc-500 mb-3">
                  Choose which information appears on the specimen detail view. Fields are grouped by tab.
                </p>
                {(["Summary", "Taxon", "Locality", "Details"] as const).map((tab) => {
                  const tabFields = ALL_SUMMARY_FIELDS.filter(
                    (f) => SUMMARY_FIELD_TABS[f] === tab,
                  );
                  return (
                    <div key={tab} className="mb-4">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">{tab} Tab</h4>
                      <div className="flex flex-wrap gap-2">
                        {tabFields.map((field) => {
                          const isActive = config.summaryFields.includes(field);
                          return (
                            <button
                              key={field}
                              onClick={() => toggleSummaryField(field)}
                              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                                isActive
                                  ? "bg-lime-100 text-lime-800 ring-1 ring-lime-300"
                                  : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                              }`}
                            >
                              {isActive && <Check className="size-3" />}
                              {SUMMARY_FIELD_LABELS[field]}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </section>
            </div>
          )}
        </div>
      )}

      {/* Feedback tab */}
      {activeTab === "feedback" && (
        <div className="p-4 md:p-6 max-w-5xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-zinc-800">User Feedback</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setShowArchived((v) => !v); setFeedbackPage(1); }}
                className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  showArchived
                    ? "border-zinc-300 bg-zinc-100 text-zinc-700"
                    : "border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50"
                }`}
              >
                <Archive className="size-3" />
                {showArchived ? "Showing Archived" : "Show Archived"}
              </button>
              <Button size="sm" variant="outline" onClick={() => void fetchFeedbackList()} disabled={loadingFeedback}>
                {loadingFeedback ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white overflow-hidden">
            {loadingFeedback ? (
              <div className="p-6 text-sm text-zinc-500">Loading feedback...</div>
            ) : (() => {
              const PAGE_SIZE = 10;
              const filtered = feedbackList.filter((f) =>
                showArchived ? f.archived : !f.archived,
              );
              if (filtered.length === 0) {
                return (
                  <div className="p-6 text-sm text-zinc-500">
                    {showArchived ? "No archived feedback." : "No feedback received yet."}
                  </div>
                );
              }
              const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
              const safePage = Math.min(feedbackPage, totalPages);
              const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
              return (
                <>
                  <div className="divide-y divide-zinc-100">
                    {pageItems.map((entry) => (
                      <div key={entry.id} className={`px-4 py-4 ${entry.archived ? "bg-zinc-50/50" : ""}`}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-zinc-800 whitespace-pre-wrap wrap-break-word">
                              {entry.feedback}
                            </p>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              {entry.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="inline-flex items-center gap-1 rounded-full bg-sky-100 text-sky-800 px-2.5 py-0.5 text-xs font-medium"
                                >
                                  {tag}
                                  <button
                                    onClick={() => void handleRemoveTag(entry.id, tag)}
                                    className="hover:text-sky-950"
                                  >
                                    <X className="size-3" />
                                  </button>
                                </span>
                              ))}
                              {tagInput?.id === entry.id ? (
                                <form
                                  onSubmit={(e) => {
                                    e.preventDefault();
                                    void handleAddTag(entry.id, tagInput.value).then(() =>
                                      setTagInput(null),
                                    );
                                  }}
                                  className="inline-flex"
                                >
                                  <input
                                    ref={tagInputRef}
                                    autoFocus
                                    value={tagInput.value}
                                    onChange={(e) =>
                                      setTagInput({ id: entry.id, value: e.target.value })
                                    }
                                    onBlur={() => {
                                      if (tagInput.value.trim()) {
                                        void handleAddTag(entry.id, tagInput.value);
                                      }
                                      setTagInput(null);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === "Escape") setTagInput(null);
                                    }}
                                    placeholder="tag name"
                                    className="w-20 rounded-full border border-zinc-300 bg-white px-2.5 py-0.5 text-xs outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-200"
                                  />
                                </form>
                              ) : (
                                <button
                                  onClick={() => setTagInput({ id: entry.id, value: "" })}
                                  className="inline-flex items-center gap-1 rounded-full border border-dashed border-zinc-300 px-2 py-0.5 text-xs text-zinc-400 hover:border-zinc-400 hover:text-zinc-600"
                                >
                                  <Tag className="size-3" />
                                  Add tag
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <span className="text-xs text-zinc-400 font-mono whitespace-nowrap">
                              {entry.createdAt?.toDate().toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                            <button
                              onClick={() => void handleToggleArchive(entry.id)}
                              className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                                entry.archived
                                  ? "text-lime-700 hover:bg-lime-50"
                                  : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
                              }`}
                              title={entry.archived ? "Unarchive" : "Archive"}
                            >
                              {entry.archived ? (
                                <>
                                  <ArchiveRestore className="size-3.5" />
                                  Unarchive
                                </>
                              ) : (
                                <>
                                  <Archive className="size-3.5" />
                                  Archive
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-zinc-100 px-4 py-3">
                      <span className="text-xs text-zinc-400">
                        Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setFeedbackPage((p) => Math.max(1, p - 1))}
                          disabled={safePage === 1}
                          className="rounded px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          ← Prev
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                          <button
                            key={n}
                            onClick={() => setFeedbackPage(n)}
                            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                              n === safePage
                                ? "bg-zinc-900 text-white"
                                : "text-zinc-600 hover:bg-zinc-100"
                            }`}
                          >
                            {n}
                          </button>
                        ))}
                        <button
                          onClick={() => setFeedbackPage((p) => Math.min(totalPages, p + 1))}
                          disabled={safePage === totalPages}
                          className="rounded px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          Next →
                        </button>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Add User dialog */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="relative w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 shadow-xl mx-4">
            <button
              className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-700"
              onClick={() => setShowDialog(false)}
            >
              <X className="size-4" />
            </button>

            <h3 className="text-base font-semibold text-zinc-900 mb-1">Add New User</h3>
            <p className="text-xs text-zinc-500 mb-5">
              The new user will be able to log in and perform CRUD operations on specimens.
            </p>

            <form onSubmit={handleAddUser} className="flex flex-col gap-4">
              {addError && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                  {addError}
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="new-email" className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
                  Email
                </label>
                <Input
                  id="new-email"
                  type="email"
                  placeholder="user@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                  autoComplete="off"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="new-password" className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
                  Temporary Password
                </label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Min. 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  minLength={6}
                />
              </div>
              <div className="flex gap-2 justify-end pt-1">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowDialog(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-zinc-900 hover:bg-zinc-800 text-zinc-50"
                  disabled={addLoading}
                >
                  {addLoading ? "Creating..." : "Create User"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

const ACTION_STYLES: Record<LogAction, { label: string; className: string }> = {
  login:            { label: "Login",           className: "bg-lime-100 text-lime-800" },
  logout:           { label: "Logout",          className: "bg-zinc-100 text-zinc-600" },
  specimen_create:  { label: "Specimen Add",    className: "bg-sky-100 text-sky-800" },
  specimen_update:  { label: "Specimen Update", className: "bg-amber-100 text-amber-800" },
  specimen_delete:  { label: "Specimen Delete", className: "bg-red-100 text-red-700" },
  user_add:         { label: "User Add",        className: "bg-lime-100 text-lime-800" },
  user_remove:      { label: "User Remove",     className: "bg-orange-100 text-orange-700" },
  user_role_change: { label: "Role Change",     className: "bg-violet-100 text-violet-700" },
  config_update:    { label: "Config Update",   className: "bg-teal-100 text-teal-700" },
};

function LogActionBadge({ action }: { action: LogAction }) {
  const { label, className } = ACTION_STYLES[action];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

export default AdminPage;
