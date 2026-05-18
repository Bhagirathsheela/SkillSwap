import React, { useEffect, useState } from "react";
import { useHttpClient } from "../../common/hooks/http-hook.js";
import { formatUTCToLocal } from "../../common/utils.js";
import { useAuthContext } from "../../common/context/auth-context.jsx";

const MyTasks = () => {
  const { sendRequest } = useHttpClient();
  const { isLoggedIn } = useAuthContext();

  const [myTasks, setMyTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    offeredTask: "",
    requestedTask: "",
    deadline: "",
    location: "",
  });

  useEffect(() => {
    const fetchMyTasks = async () => {
      try {
        const responseData = await sendRequest(
          `${import.meta.env.VITE_APP_BACKEND_URL}/tasks/my`
        );
        setMyTasks(responseData.tasks || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (isLoggedIn) fetchMyTasks();
  }, [isLoggedIn, sendRequest]);

  // Close Task
  const handleCloseTask = async (taskId) => {
    try {
      await sendRequest(
        `${import.meta.env.VITE_APP_BACKEND_URL}/tasks/close/${taskId}`,
        "PATCH"
      );
      setMyTasks((prev) =>
        prev.map((t) => (t._id === taskId ? { ...t, status: "cancelled" } : t))
      );
    } catch (err) {
      console.error(err);
    }
  };

  // Open edit modal
  const handleEditClick = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description,
      offeredTask: task.offeredTask.join(", "),
      requestedTask: task.requestedTask.join(", "),
      deadline: task.deadline ? task.deadline.split("T")[0] : "",
      location: task.location,
    });
  };

  // Update task
  const handleUpdateTask = async (e) => {
    e.preventDefault();
    try {
      const updated = {
        ...formData,
        offeredTask: formData.offeredTask.split(",").map((s) => s.trim()),
        requestedTask: formData.requestedTask.split(",").map((s) => s.trim()),
      };

      const res = await sendRequest(
        `${import.meta.env.VITE_APP_BACKEND_URL}/tasks/${editingTask._id}`,
        "PATCH",
        JSON.stringify(updated),
        { "Content-Type": "application/json" }
      );

      setMyTasks((prev) =>
        prev.map((t) => (t._id === editingTask._id ? res.task : t))
      );

      setEditingTask(null); // close modal
    } catch (err) {
      console.error(err);
    }
  };

  const inputClass =
    "w-full px-4 py-2.5 text-sm rounded-lg " +
    "border border-[var(--surface-border)] " +
    "text-[var(--text-primary)] placeholder:text-[var(--text-muted)] " +
    "transition focus:outline-none " +
    "focus:border-[var(--color-brand-primary)] " +
    "focus:ring-2 focus:ring-[var(--color-brand-primary)]/20";

  return (
    <section className="px-4 sm:px-8 py-8 sm:py-10 bg-[var(--surface-bg)] min-h-screen">
      <h2 className="text-2xl sm:text-3xl font-bold text-center text-[var(--text-primary)] mb-8 tracking-tight">
        My <span className="text-[var(--color-brand-primary)]">Tasks</span>
      </h2>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <p className="text-[var(--text-secondary)]">Loading your tasks...</p>
        </div>
      ) : myTasks.length === 0 ? (
        <div className="flex justify-center items-center py-20">
          <p className="text-[var(--text-muted)] text-base sm:text-lg italic">
            You haven’t created any tasks yet.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:gap-6 max-w-5xl mx-auto">
          {myTasks.map((task) => (
            <div
              key={task._id}
              className="relative bg-[var(--surface-white)] border border-[var(--surface-border)]
                         shadow-[var(--card-shadow)] rounded-2xl p-5 sm:p-6
                         hover:shadow-[var(--card-shadow-hover)] hover:-translate-y-0.5
                         transition-all"
            >
              {/* Status badge at top-right */}
              <div className="absolute top-4 right-4">
                <span
                  className={`px-3 py-1 text-[11px] sm:text-xs rounded-full font-semibold uppercase tracking-wide ${
                    task.status === "open"
                      ? "bg-[var(--color-brand-primary-pale)] text-[var(--color-brand-primary)]"
                      : task.status === "in-progress"
                      ? "bg-amber-50 text-amber-700"
                      : task.status === "completed"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-red-50 text-red-600"
                  }`}
                >
                  {task.status}
                </span>
              </div>

              {/* User Info */}
              <div className="flex items-center gap-3 sm:gap-4 pr-20">
                <img
                  src={`${import.meta.env.VITE_APP_ASSET_URL}/${
                    task.creator.image || "default.png"
                  }`}
                  alt={task.creator.name}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover"
                  style={{ boxShadow: "0 0 0 2.5px var(--color-brand-primary)" }}
                />
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)] truncate">
                    {task.creator.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--text-muted)]">
                    Created: {formatUTCToLocal(task.createdAt, false)}
                  </p>
                </div>
              </div>

              {/* Task Title */}
              <h4 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] mt-4">
                {task.title}
              </h4>

              {/* Description */}
              <p className="text-[var(--text-secondary)] text-sm mt-2 leading-relaxed">{task.description}</p>

              {/* Offered and Requested Tasks */}
              <div className="mt-3 flex flex-col gap-2">
                {task.offeredTask.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-xs sm:text-sm text-[var(--text-secondary)]">
                      Offered:
                    </span>
                    {task.offeredTask.map((skill, i) => (
                      <span
                        key={`offered-${i}`}
                        className="bg-emerald-50 text-emerald-700 text-xs sm:text-sm px-3 py-1 rounded-full font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}

                {task.requestedTask.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-xs sm:text-sm text-[var(--text-secondary)]">
                      Requested:
                    </span>
                    {task.requestedTask.map((skill, i) => (
                      <span
                        key={`requested-${i}`}
                        className="bg-amber-50 text-amber-700 text-xs sm:text-sm px-3 py-1 rounded-full font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Deadline */}
              {task.deadline && (
                <p className="text-sm text-[var(--text-secondary)] mt-3">
                  <span className="font-semibold">Deadline:</span>{" "}
                  {formatUTCToLocal(task.deadline, false)}
                </p>
              )}

              {/* Action buttons (hide if cancelled) */}
              {task.status !== "cancelled" && (
                <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <button
                    className="px-4 py-2 rounded-lg text-white text-sm font-semibold
                               bg-[var(--btn-reject-bg)] hover:bg-[var(--btn-reject-bg-hover)]
                               shadow-[0_2px_8px_rgba(239,68,68,0.25)]
                               hover:-translate-y-0.5 active:translate-y-0 transition"
                    onClick={() => handleCloseTask(task._id)}
                  >
                    Close
                  </button>
                  <button
                    className="px-4 py-2 rounded-lg text-white text-sm font-semibold
                               bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary-dark)]
                               shadow-[0_2px_8px_rgba(91,91,255,0.25)]
                               hover:-translate-y-0.5 active:translate-y-0 transition"
                    onClick={() => handleEditClick(task)}
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingTask && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-end sm:items-center z-50 p-0 sm:p-4">
          <div className="bg-[var(--surface-white)] rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
            <h3 className="text-lg sm:text-xl font-bold mb-5 text-[var(--text-primary)]">Edit Task</h3>
            <form onSubmit={handleUpdateTask} className="space-y-4">
              <input
                type="text"
                placeholder="Title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className={inputClass}
              />
              <textarea
                placeholder="Description"
                rows={3}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className={inputClass}
              />
              <input
                type="text"
                placeholder="Offered Tasks (comma separated)"
                value={formData.offeredTask}
                onChange={(e) =>
                  setFormData({ ...formData, offeredTask: e.target.value })
                }
                className={inputClass}
              />
              <input
                type="text"
                placeholder="Requested Tasks (comma separated)"
                value={formData.requestedTask}
                onChange={(e) =>
                  setFormData({ ...formData, requestedTask: e.target.value })
                }
                className={inputClass}
              />
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) =>
                  setFormData({ ...formData, deadline: e.target.value })
                }
                className={inputClass}
              />
              <input
                type="text"
                placeholder="Location"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                className={inputClass}
              />
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="px-4 py-2 text-sm font-medium rounded-lg
                             border border-[var(--surface-border)]
                             bg-white text-[var(--text-primary)]
                             hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold rounded-lg text-white
                             bg-[var(--color-brand-primary)]
                             hover:bg-[var(--color-brand-primary-dark)]
                             shadow-[0_2px_8px_rgba(91,91,255,0.25)]
                             transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default MyTasks;
