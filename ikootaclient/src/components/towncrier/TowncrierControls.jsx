import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { toast } from "react-toastify";
import "../../admin/styles/navbar.css";
import { useFechTeachings } from "../service/uploadTeaching";
import { useMutation } from "@tanstack/react-query";
import api from "../service/api";

const TowncrierControls = () => {
  const { handleSubmit, control, register, reset, watch } = useForm();

  const { data: teachings, isLoading, error } = useFechTeachings();
  
  async function sendTeachingMaterial (formData) {
    console.log("i triggered")
    const response = await api.post("/teachings", formData, {
    headers: {
      "Content-Type": "multipart/form-data", // Required for file uploads
    },
  }
)
    return response.data;
}

  const mutation = useMutation({
    mutationFn: sendTeachingMaterial,
    });
   

  // File validation
  const validateFiles = (value) => {
    if (!value || value.length === 0) {
      return "Please upload at least one file.";
    }
    return true;
  };

  // Form submit handler
  const onSubmit = (data) => {
    if (!data.files.length) {
      console.log("Please upload at least one file.");
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append("topic", data.topic);
    formDataToSend.append("description", data.description);
    formDataToSend.append("subjectMatter", data.subjectMatter);
    formDataToSend.append("audience", data.audience);
    formDataToSend.append("content", data.content);

    Array.from(data.files).forEach((file) => {
      formDataToSend.append("files", file);
    });

    console.log("just before sendnig")
    mutation.mutate(formDataToSend, {
      onSuccess: () => {
        console.log("Teaching material uploaded successfully.");
      },
      onError: (error) => {
        console.error("Error uploading teaching material:", error);
      },
    });
    //reset(); // Reset the form after submission
  };

  return (
    <div className="towncrier_controls_body">
      <h2>Towncrier Controls</h2>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="teaching_form">
          <input
            type="text"
            placeholder="Topic"
            {...register("topic", { required: "Topic is required" })}
          />
          <textarea
            placeholder="Description"
            {...register("description", { required: "Description is required" })}
          />
          <input
            type="text"
            placeholder="Subject Matter"
            {...register("subjectMatter", { required: "Subject Matter is required" })}
          />
          <input
            type="text"
            placeholder="Audience"
            {...register("audience", { required: "Audience is required" })}
          />
          <textarea
            placeholder="Content (Text, Emoji, URLs)"
            {...register("content", { required: "Content is required" })}
          />
          <input
              type="file"
              multiple
              {...register("files", { validate: validateFiles })}
            />
      
          <button type="submit">Add Teaching</button>
        </div>
      </form>

      <div className="teachings_list">
        <h3>Existing Teachings</h3>
        {isLoading ? (
          <p>Loading...</p>
        ) : error ? (
          <p>Error: {error.message}</p>
        ) : (
          teachings?.map((teaching) => (
            <div key={teaching.id}>
              <p>Topic: {teaching.topic}</p>
              <p>Lesson Number: {teaching.lessonNumber || "N/A"}</p>
              <p>Date: {new Date(teaching.createdAt).toLocaleDateString()}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TowncrierControls;
