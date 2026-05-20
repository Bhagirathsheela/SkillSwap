import React from "react";
import HowItWorks from "../components/HowItWorks.jsx";
import Avatar from "../components/Avatar.jsx";
import { useHttpClient } from "../hooks/http-hook.js";
import { FiSearch, FiX, FiMapPin, FiClock, FiUserPlus, FiUserX } from "react-icons/fi";
import { formatUTCToLocal } from "../lib/utils.js";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../contexts/auth-context.jsx";
import { showSuccess, showError } from "../lib/toastHelper.js";

const UserCard = () => {
  const { sendRequest } = useHttpClient();
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuthContext();

  const [tasksList, setTasksList] = React.useState([]);
  const [filteredTasks, setFilteredTasks] = React.useState([]);
  const [searchTerm, setSearchTerm] = React.useState("");

  React.useEffect(() => {
    const getAllTasks = async () => {
      try {
        const responseData = await sendRequest(
          `${import.meta.env.VITE_APP_BACKEND_URL}/tasks?status=open`
        );
        if (responseData?.tasks) {
          const filtered = responseData.tasks.filter(
            (task) => task.creator._id !== user?.id
          );
          setTasksList(filtered);
          setFilteredTasks(filtered);
        }
      } catch (err) {
        console.error(err);
      }
    };
    getAllTasks();
  }, [isLoggedIn, user?.id]);

  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchTerm(value);

    if (!value.trim()) {
      setFilteredTasks(tasksList);
      return;
    }

    const results = tasksList.filter((task) => {
      const allFields = [
        task.title,
        task.description,
        task.location,
        task.requestedTask?.join(" "),
        task.offeredTask?.join(" "),
        task.creator?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return allFields.includes(value);
    });

    setFilteredTasks(results);
  };

  const clearSearch = () => {
    setSearchTerm("");
    setFilteredTasks(tasksList);
  };

  const offeredColors = [
    "bg-green-100 text-green-800",
    "bg-teal-100 text-teal-800",
    "bg-lime-100 text-lime-800",
  ];

  const requestedColors = [
    "bg-yellow-100 text-yellow-800",
    "bg-orange-100 text-orange-800",
    "bg-amber-100 text-amber-800",
  ];

  const getRandomColor = (colors) =>
    colors[Math.floor(Math.random() * colors.length)];

  const handleConnect = async (task) => {
    if (!isLoggedIn) return navigate("/login");
    try {
      const res = await sendRequest(
        `${import.meta.env.VITE_APP_BACKEND_URL}/tasks/connect/${task._id}`,
        "POST"
      );
      if (res) {
        setTasksList((prev) => prev.filter((t) => t._id !== task._id));
        setFilteredTasks((prev) => prev.filter((t) => t._id !== task._id));
      }
      if (res?.message) showSuccess(res.message);
    } catch (err) {
      console.error(err);
      showError(err.message || "Failed to send connection request");
    }
  };

  const handleReject = async (task) => {
    if (!isLoggedIn) return navigate("/login");
    try {
      const res = await sendRequest(
        `${import.meta.env.VITE_APP_BACKEND_URL}/tasks/reject/${task._id}`,
        "POST"
      );
      if (res) {
        setTasksList((prev) => prev.filter((t) => t._id !== task._id));
        setFilteredTasks((prev) => prev.filter((t) => t._id !== task._id));
      }
    } catch (err) {
      console.error(err);
      showError(err.message || "Failed to reject connection request");
    }
  };

  return (
    <>
      <section className="px-4 sm:px-8 py-10 bg-[var(--surface-bg)] min-h-screen flex flex-col items-center">
        <div className="usercard-hero">
          <span className="usercard-hero-badge">Live swaps</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-[var(--text-primary)] tracking-tight">
            People on <span className="text-[var(--color-brand-primary)]">SkillSwap</span>
          </h2>
          <p className="mt-2 text-[var(--text-secondary)] text-center text-sm sm:text-base">
            Connect with talented individuals and swap your skills.
          </p>
        </div>

        <div className="mt-8 w-full max-w-2xl mb-10">
          <div className="usercard-search flex items-center bg-[var(--surface-white)] rounded-full overflow-hidden">
            <span className="pl-5 text-[var(--text-muted)]">
              <FiSearch className="w-5 h-5" />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearch}
              placeholder="Search for skills or people..."
              className="flex-1 px-4 py-3 outline-none bg-transparent
                         text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-sm"
              aria-label="Search skills or people"
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="pr-4 text-[var(--text-muted)] hover:text-[var(--color-brand-primary)] transition"
                aria-label="Clear search"
              >
                <FiX className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="usercard-empty flex flex-col items-center justify-center py-20">
            <div className="usercard-empty-icon">
              <FiSearch />
            </div>
            <p className="text-[var(--text-secondary)] text-base sm:text-lg">No tasks found</p>
            <p className="text-[var(--text-muted)] text-sm mt-1">
              Try a different search term
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-5 sm:gap-6 max-w-[1100px] mx-auto w-full">
            {filteredTasks.map((task, index) => (
              <div key={index} className="usercard-item-wrapper">
                {/* Desktop card */}
                <div
                  className="hidden sm:flex bg-[var(--surface-white)] border border-[var(--surface-border)]
                             rounded-2xl shadow-[var(--card-shadow)] hover:shadow-[var(--card-shadow-hover)]
                             hover:-translate-y-0.5 transition-all duration-300 p-6
                             flex-col lg:flex-row items-start lg:items-center justify-between gap-5"
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  <div className="flex items-start gap-4 w-full lg:w-1/4">
                    <div className="usercard-avatar-wrap">
                      <Avatar
                        name={task.creator.name}
                        imageUrl={task.creator.image ? `${import.meta.env.VITE_APP_ASSET_URL}/${task.creator.image}` : null}
                        size="xl"
                      />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-[var(--text-primary)] truncate">
                        {task.creator.name}
                      </h3>
                      {task.location && (
                        <p className="text-[var(--text-secondary)] text-sm flex items-center gap-1 mt-0.5">
                          <FiMapPin className="w-3 h-3 flex-shrink-0" />
                          {task.location}
                        </p>
                      )}
                      <p className="text-[var(--text-muted)] text-xs mt-1 flex items-center gap-1">
                        <FiClock className="w-3 h-3 flex-shrink-0" />
                        Created: {formatUTCToLocal(task.createdAt, false)}
                      </p>
                    </div>
                  </div>

                  <div className="flex-1 w-full lg:w-2/4">
                    <h4 className="text-base sm:text-lg font-bold text-[var(--color-brand-primary)]">
                      {task.title}
                    </h4>
                    <p className="text-[var(--text-secondary)] text-sm mt-1 leading-relaxed">{task.description}</p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {task.offeredTask.map((skill, i) => (
                        <span
                          key={`offered-${i}`}
                          className={`${getRandomColor(offeredColors)} text-xs sm:text-sm px-3 py-1 rounded-full font-medium`}
                        >
                          Offered: {skill.trim()}
                        </span>
                      ))}
                      {task.requestedTask.map((skill, i) => (
                        <span
                          key={`requested-${i}`}
                          className={`${getRandomColor(requestedColors)} text-xs sm:text-sm px-3 py-1 rounded-full font-medium`}
                        >
                          Requested: {skill.trim()}
                        </span>
                      ))}
                    </div>

                    {task.deadline && (
                      <p className="text-sm text-[var(--text-secondary)] mt-3 flex items-center gap-1">
                        <FiClock className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="font-medium">Deadline:</span>{" "}
                        {formatUTCToLocal(task.deadline, false)}
                      </p>
                    )}
                  </div>

                  <div className="w-full lg:w-auto flex flex-col sm:flex-row lg:flex-col xl:flex-row justify-end gap-2">
                    <button
                      onClick={() => handleConnect(task)}
                      className="text-white font-semibold py-2.5 px-5 rounded-[var(--btn-radius)]
                                 bg-gradient-to-r from-[var(--btn-connect-from)] to-[var(--btn-connect-to)]
                                 shadow-[var(--btn-connect-shadow)]
                                 hover:-translate-y-0.5 active:translate-y-0
                                 transition-all duration-300 w-full lg:w-auto text-sm"
                      aria-label={`Connect with ${task.creator.name}`}
                    >
                      <span className="usercard-btn-inner">
                        <FiUserPlus className="w-4 h-4" />
                        Connect
                      </span>
                    </button>
                    {user?.id && task.pendingRequests?.includes(user.id) && (
                      <button
                        onClick={() => handleReject(task)}
                        className="text-white font-semibold py-2.5 px-5 rounded-[var(--btn-radius)]
                                   bg-[var(--btn-reject-bg)] hover:bg-[var(--btn-reject-bg-hover)]
                                   shadow-[0_2px_8px_rgba(239,68,68,0.25)]
                                   hover:-translate-y-0.5 active:translate-y-0
                                   transition w-full lg:w-auto text-sm"
                        aria-label={`Reject request from ${task.creator.name}`}
                      >
                        <span className="usercard-btn-inner">
                          <FiUserX className="w-4 h-4" />
                          Reject
                        </span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Mobile card */}
                <div className="sm:hidden usercard-mobile bg-[var(--surface-white)] rounded-2xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar
                      name={task.creator.name}
                      imageUrl={task.creator.image ? `${import.meta.env.VITE_APP_ASSET_URL}/${task.creator.image}` : null}
                      size="lg"
                      className="usercard-mobile-avatar"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-[var(--text-primary)] text-base truncate">
                        {task.creator.name}
                      </h3>
                      {task.location && (
                        <p className="text-[var(--text-muted)] text-xs flex items-center gap-1 mt-0.5">
                          <FiMapPin className="w-3 h-3 flex-shrink-0" />
                          {task.location}
                        </p>
                      )}
                    </div>
                  </div>

                  <h4 className="text-base font-bold text-[var(--color-brand-primary)] mb-1">
                    {task.title}
                  </h4>
                  <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-3">
                    {task.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {task.offeredTask.map((skill, i) => (
                      <span
                        key={`m-offered-${i}`}
                        className={`${getRandomColor(offeredColors)} text-xs px-2.5 py-1 rounded-full font-medium`}
                      >
                        Offered: {skill.trim()}
                      </span>
                    ))}
                    {task.requestedTask.map((skill, i) => (
                      <span
                        key={`m-requested-${i}`}
                        className={`${getRandomColor(requestedColors)} text-xs px-2.5 py-1 rounded-full font-medium`}
                      >
                        Requested: {skill.trim()}
                      </span>
                    ))}
                  </div>

                  {task.deadline && (
                    <p className="text-xs text-[var(--text-muted)] flex items-center gap-1 mb-3">
                      <FiClock className="w-3 h-3" />
                      Deadline: {formatUTCToLocal(task.deadline, false)}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleConnect(task)}
                      className="text-white font-semibold py-2.5 px-4 rounded-[var(--btn-radius)]
                                 bg-gradient-to-r from-[var(--btn-connect-from)] to-[var(--btn-connect-to)]
                                 shadow-[var(--btn-connect-shadow)]
                                 active:scale-[0.98] transition flex-1 text-sm"
                    >
                      Connect
                    </button>
                    {user?.id && task.pendingRequests?.includes(user.id) && (
                      <button
                        onClick={() => handleReject(task)}
                        className="text-white font-semibold py-2.5 px-4 rounded-[var(--btn-radius)]
                                   bg-[var(--btn-reject-bg)] hover:bg-[var(--btn-reject-bg-hover)]
                                   active:scale-[0.98] transition text-sm"
                      >
                        Reject
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
            </section>

      <HowItWorks />
    </>
  );
};

export default UserCard;
