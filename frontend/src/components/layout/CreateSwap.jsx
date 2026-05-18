import React, { useState } from "react";
import {useNavigate } from "react-router-dom";
import { useHttpClient } from "../../common/hooks/http-hook.js";
import { showSuccess } from "../../common/toastHelper";

const CreateSwap = () => {
  const { sendRequest } = useHttpClient();
  const navigate = useNavigate();
  const [taskDetails, setTaskDetails] = useState({
    title: "",
    description: "",
    requestedTask: "",
    offeredTask: "",
    location: "",
    attachments: "",
    deadline: "",
  });
  const [errors, setErrors] = useState({
    title: "",
    description: "",
    requestedTask: "",
    offeredTask: "",
    location: "",
    attachments: "",
    deadline: "",
  });

  
  const validate = () => {
    const newErrors = {};
    if (!taskDetails.title.trim()) newErrors.title = "Title is required.";
    if (!taskDetails.description.trim())
      newErrors.description = "Description is required.";
    if (!taskDetails.requestedTask.trim())
      newErrors.requestedTask = "Requested task is required.";
    if (!taskDetails.offeredTask.trim())
      newErrors.offeredTask = "Offered task is required.";
    if (!taskDetails.location.trim())
      newErrors.location = "Location is required.";
    if (!taskDetails.deadline) newErrors.deadline = "Deadline is required.";
    // Attachments are optional, but you can add validation if needed
    return newErrors;
  };
  /* setTaskDetails({
        title: "",
        description: "",
        requestedTask: "",
        offeredTask: "",
        location: "",
        attachments: "",
        deadline: "",
      }); */
  
const submitTask = async (e) => {
  e.preventDefault();
  const validationErrors = validate();
  setErrors(validationErrors);
  if (Object.keys(validationErrors).length === 0) {
    const formData = new FormData();
    formData.append("title", taskDetails.title);
    formData.append("description", taskDetails.description);
    formData.append("requestedTask", taskDetails.requestedTask);
    formData.append("offeredTask", taskDetails.offeredTask);
    formData.append("location", taskDetails.location);
    formData.append("deadline", taskDetails.deadline);
    if (taskDetails.attachments) {
      formData.append("image", taskDetails.attachments);
    }

    try {
      const responseData = await sendRequest(
        `${import.meta.env.VITE_APP_BACKEND_URL}/tasks`,
        "POST",
        formData,
        null // Let browser set Content-Type with boundary for multipart/form-data
      );
      if (responseData) {
        showSuccess("Swap created successfully!");
        setTaskDetails({
        title: "",
        description: "",
        requestedTask: "",
        offeredTask: "",
        location: "",
        attachments: "",
        deadline: "",
      });
      setTimeout(() => {
         navigate("/my-tasks");
      }, 2000);
      }
    } catch (err) {
      console.error(err);
    }
  }
};
  return (
    <div className="page">
      <h2 className="section_title text-center sm:text-left">Create a Swap</h2>
      <form className="card form" onSubmit={submitTask} noValidate>
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Title</label>
          <input
            placeholder="e.g. Looking to swap React tutoring for Spanish lessons"
            value={taskDetails.title}
            onChange={(e) => {
              setTaskDetails({ ...taskDetails, title: e.target.value });
              setErrors((prev) => ({ ...prev, title: "" }));
            }}
          />
          {errors.title && <div className="error text-red-500 text-xs mt-1">{errors.title}</div>}
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Description</label>
          <textarea
            placeholder="Describe what you're looking for and what you can offer"
            rows={4}
            value={taskDetails.description}
            onChange={(e) => {
              setTaskDetails({ ...taskDetails, description: e.target.value });
              setErrors((prev) => ({ ...prev, description: "" }));
            }}
          />
          {errors.description && (
            <div className="error text-red-500 text-xs mt-1">{errors.description}</div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Requested Task</label>
            <input
              placeholder="What you want to learn"
              value={taskDetails.requestedTask}
              onChange={(e) => {
                setTaskDetails({ ...taskDetails, requestedTask: e.target.value });
                setErrors((prev) => ({ ...prev, requestedTask: "" }));
              }}
            />
            {errors.requestedTask && (
              <div className="error text-red-500 text-xs mt-1">{errors.requestedTask}</div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Offered Task</label>
            <input
              placeholder="What you can teach"
              value={taskDetails.offeredTask}
              onChange={(e) => {
                setTaskDetails({ ...taskDetails, offeredTask: e.target.value });
                setErrors((prev) => ({ ...prev, offeredTask: "" }));
              }}
            />
            {errors.offeredTask && (
              <div className="error text-red-500 text-xs mt-1">{errors.offeredTask}</div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Location</label>
            <input
              placeholder="City or 'Remote'"
              value={taskDetails.location}
              onChange={(e) => {
                setTaskDetails({ ...taskDetails, location: e.target.value });
                setErrors((prev) => ({ ...prev, location: "" }));
              }}
            />
            {errors.location && <div className="error text-red-500 text-xs mt-1">{errors.location}</div>}
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Deadline</label>
            <input
              type="date"
              placeholder="Deadline"
              value={taskDetails.deadline}
              onChange={(e) => {
                setTaskDetails({ ...taskDetails, deadline: e.target.value });
                setErrors((prev) => ({ ...prev, deadline: "" }));
              }}
            />
            {errors.deadline && <div className="error text-red-500 text-xs mt-1">{errors.deadline}</div>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
            Attachment <span className="text-[var(--text-muted)] font-normal">(optional · image or PDF)</span>
          </label>
          <input
            type="file"
            accept="image/*,application/pdf"
            className="block w-full text-sm text-[var(--text-secondary)]
                       file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0
                       file:text-sm file:font-medium file:bg-[var(--color-brand-primary-pale)]
                       file:text-[var(--color-brand-primary)]
                       hover:file:bg-[var(--color-brand-primary)] hover:file:text-white
                       file:transition file:cursor-pointer"
            onChange={(e) => {
              const file = e.target.files[0];
              if (
                file &&
                (file.type.startsWith("image/") ||
                  file.type === "application/pdf")
              ) {
                setTaskDetails({
                  ...taskDetails,
                  attachments: file, // store the File object
                });
                setErrors((prev) => ({ ...prev, attachments: "" }));
              } else {
                setTaskDetails({ ...taskDetails, attachments: "" });
                setErrors((prev) => ({
                  ...prev,
                  attachments: "Only images and PDF files are allowed.",
                }));
              }
            }}
          />
          {errors.attachments && (
            <div className="error text-red-500 text-xs mt-1">{errors.attachments}</div>
          )}
        </div>

        <div className="row flex justify-end pt-2">
          <button className="btn w-full sm:w-auto" type="submit">
            Add Swap
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateSwap;
