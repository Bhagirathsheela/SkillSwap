import React, { useEffect, useState } from "react";
import { useAuthContext } from "../../common/context/auth-context";
import { useHttpClient } from "../../common/hooks/http-hook";
import { useNavigate } from "react-router-dom";

function RequestsPage() {
  const { isLoggedIn } = useAuthContext();
  const { sendRequest } = useHttpClient();
  const navigate = useNavigate();

  const [sentRequests, setSentRequests] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);

  useEffect(() => {
    if (!isLoggedIn) return navigate("/login");

    const fetchRequests = async () => {
      try {
        const res = await sendRequest(
          `${import.meta.env.VITE_APP_BACKEND_URL}/tasks/inprogress`
        );
        setSentRequests(res.sentRequests || []);
        setReceivedRequests(res.receivedRequests || []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchRequests();
  }, [isLoggedIn, navigate, sendRequest]);

  const handleCancel = async (taskId) => {
    try {
      await sendRequest(
        `${import.meta.env.VITE_APP_BACKEND_URL}/tasks/cancel/${taskId}`,
        "POST"
      );
      setSentRequests((prev) => prev.filter((t) => t._id !== taskId));
    } catch (err) {
      console.error(err);
      alert("Failed to cancel request");
    }
  };

 const handleAccept = async (taskId, userId) => {
   try {
     await sendRequest(
       `${
         import.meta.env.VITE_APP_BACKEND_URL
       }/tasks/accept/${taskId}/${userId}`, // ✅ send requesterId in params
       "POST"
     );
     setReceivedRequests((prev) => prev.filter((t) => t._id !== taskId));
   } catch (err) {
     console.error(err);
     alert("Failed to accept request");
   }
 };


  const handleReject = async (taskId) => {
    try {
      await sendRequest(
        `${import.meta.env.VITE_APP_BACKEND_URL}/tasks/reject/${taskId}`,
        "POST"
      );
      setReceivedRequests((prev) => prev.filter((t) => t._id !== taskId));
    } catch (err) {
      console.error(err);
      alert("Failed to reject request");
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-center text-[var(--text-primary)] tracking-tight">
        In Progress Requests
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        {/* Sent Requests */}
        <div className="bg-[var(--surface-white)] border border-[var(--surface-border)] p-4 sm:p-5 rounded-2xl shadow-[var(--card-shadow)]">
          <h3 className="text-lg sm:text-xl font-semibold mb-4 text-[var(--color-brand-primary)] flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-[var(--color-brand-primary)]"></span>
            Tasks I Requested
          </h3>
          {sentRequests.length === 0 && (
            <p className="text-[var(--text-muted)] text-sm italic">No requests sent yet.</p>
          )}
          {sentRequests.map((task) => (
            <div
              key={task._id}
              className="bg-[var(--color-brand-primary-pale)] rounded-xl p-4 mb-3 border border-[rgba(91,91,255,0.12)]
                         transition hover:border-[rgba(91,91,255,0.3)]"
            >
              <h4 className="text-base font-semibold text-[var(--text-primary)]">
                {task.title}
              </h4>
              <p className="text-sm text-[var(--text-secondary)] mb-3 leading-relaxed">{task.description}</p>
              <button
                onClick={() => handleCancel(task._id)}
                className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium
                           shadow-[0_2px_6px_rgba(245,158,11,0.25)] transition"
              >
                Cancel
              </button>
            </div>
          ))}
        </div>

        {/* Received Requests */}
        <div className="bg-[var(--surface-white)] border border-[var(--surface-border)] p-4 sm:p-5 rounded-2xl shadow-[var(--card-shadow)]">
          <h3 className="text-lg sm:text-xl font-semibold mb-4 text-emerald-600 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            Tasks Requested to Me
          </h3>
          {receivedRequests.length === 0 && (
            <p className="text-[var(--text-muted)] text-sm italic">No requests received yet.</p>
          )}
          {receivedRequests.map((task) => (
            <div
              key={task._id}
              className="bg-emerald-50 rounded-xl p-4 mb-3 border border-emerald-100
                         transition hover:border-emerald-300"
            >
              <h4 className="text-base font-semibold text-[var(--text-primary)]">
                {task.title}
              </h4>
              <p className="text-sm text-[var(--text-secondary)] mb-3 leading-relaxed">{task.description}</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleAccept(task._id, task.requestedBy?.id)}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium
                             shadow-[0_2px_6px_rgba(16,185,129,0.25)] transition"
                >
                  Accept
                </button>
                <button
                  onClick={() => handleReject(task._id)}
                  className="bg-[var(--btn-reject-bg)] hover:bg-[var(--btn-reject-bg-hover)] text-white px-4 py-1.5 rounded-lg text-sm font-medium
                             shadow-[0_2px_6px_rgba(239,68,68,0.25)] transition"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default RequestsPage;
