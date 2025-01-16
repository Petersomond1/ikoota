import React, { useState } from "react";
import { toast } from "react-toastify";
import "../admin/admin.css";
import { useUploadTeachingMutation, useFechTeachings } from "../service/uploadTeaching";

const TowncrierControls = () => {
  const [formData, setFormData] = useState({
    topic: "",
    description: "",
    subjectMatter: "",
    audience: "",
    content: "",
    files: [],
  });

  const { mutateAsync: uploadTeachingMutation } = useUploadTeachingMutation();
  const { data: teachings, isLoading, error } = useFechTeachings();

  // Handle input changes for text fields
  const handleInputChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  // Handle file changes
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData({ ...formData, files });
  };

  // Form submit handler
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.files.length) {
      toast.error("Please upload at least one file.");
      return;
    }
    console.log('file exist')
    const formDataToSend = new FormData();
    formDataToSend.append("topic", formData.topic);
    formDataToSend.append("description", formData.description);
    formDataToSend.append("subjectMatter", formData.subjectMatter);
    formDataToSend.append("audience", formData.audience);
    formDataToSend.append("content", formData.content);

    formData.files.forEach((file) => {
      formDataToSend.append("files", file);
    });

    console.log('formData created from this old ', formData)

    uploadTeachingMutation(formDataToSend, {
      onSuccess: () => {
        console.log(" the post requet compoleted fine")
        setFormData({
          topic: "",
          description: "",
          subjectMatter: "",
          audience: "",
          content: "",
          files: [],
        });
      },
      onError: (error) => {
        console.log("issue in sending the post request ", error)
      },
    });
  };

  return (
    <div className="towncrier_controls_body">
      <h2>Towncrier Controls</h2>

      <form onSubmit={handleSubmit}>
        <div className="teaching_form">
          <input
            type="text"
            placeholder="Topic"
            value={formData.topic}
            onChange={handleInputChange("topic")}
          />
          <textarea
            placeholder="Description"
            value={formData.description}
            onChange={handleInputChange("description")}
          />
          <input
            type="text"
            placeholder="Subject Matter"
            value={formData.subjectMatter}
            onChange={handleInputChange("subjectMatter")}
          />
          <input
            type="text"
            placeholder="Audience"
            value={formData.audience}
            onChange={handleInputChange("audience")}
          />
          <textarea
            placeholder="Content (Text, Emoji, URLs)"
            value={formData.content}
            onChange={handleInputChange("content")}
          />
          <input type="file" multiple onChange={handleFileChange} />
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
