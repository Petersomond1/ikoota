// import React, { useState } from "react";
// import { useQuery } from "@tanstack/react-query";
// import api from "../service/api";
// import { useUploadTeaching } from "../service/useUploadTeaching";

// const TowncrierControls = () => {
//   const [formData, setFormData] = useState({
//     topic: "",
//     description: "",
//     subjectMatter: "",
//     audience: "",
//     content: "",
//     files: [],
//   });

//   const { mutate: uploadTeaching } = useUploadTeaching();
//   const { data: teachings } = useQuery(["teachings"], () => api.get("/teachings").then((res) => res.data));

//   const handleFileChange = (e) => {
//     setFormData((prev) => ({ ...prev, files: e.target.files }));
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     const data = new FormData();
//     Object.entries(formData).forEach(([key, value]) => {
//       if (key === "files") {
//         Array.from(value).forEach((file) => data.append("files", file));
//       } else {
//         data.append(key, value);
//       }
//     });

//     uploadTeaching(data);
//   };

//   return (
//     <div>
//       <form onSubmit={handleSubmit}>
//         <input type="text" placeholder="Topic" onChange={(e) => setFormData({ ...formData, topic: e.target.value })} />
//         <textarea placeholder="Description" onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
//         <input type="file" multiple onChange={handleFileChange} />
//         <button type="submit">Upload Teaching</button>
//       </form>
//       <div>
//         {teachings?.map((teaching) => (
//           <div key={teaching.id}>
//             <h4>{teaching.topic}</h4>
//             {teaching.fileUrls && JSON.parse(teaching.fileUrls).map((url, index) => <img key={index} src={url} alt="" />)}
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default TowncrierControls;

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "react-toastify";
import "../admin/admin.css";
import { useUploadTeachingMutation } from "../service/uploadTeaching";

const TowncrierControls = () => {
  const [formData, setFormData] = useState({
    topic: "",
    description: "",
    subjectMatter: "",
    audience: "",
    content: "",
    files: [],
  });
  const { mutate: uploadTeachingMutation } = useUploadTeachingMutation();

  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState(null);


  // Fetch teachings
  const { data: teachings, refetch: fetchTeachings } = useQuery({
    queryKey: ["teachings"],
    queryFn: async () => {
      const res = await axios.get("/api/teachings");
      return res.data;
    },
  });

  // Handle input changes and file input
  const handleInputChange = (field) => (e) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const handleFileChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      files: [...e.target.files],
    }));
  };

  // Form submit handler
  const handleSubmit = (e) => {
    e.preventDefault(); // Prevent default form submission
    console.log("jkmfdks")
    // Validate that at least one file is uploaded
    if (formData.files.length === 0) {
      toast.error("Please upload at least one file.");
      return;
    }

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key === "files") {
        value.forEach((file) => data.append("files", file));
      } else {
        data.append(key, value);
      }
    });
    console.log("imqjg ")

    // Call the mutation to upload the teaching data
    uploadTeachingMutation(data);
  };

  // Reset form to initial state
  const resetForm = () => {
    setFormData({
      topic: "",
      description: "",
      subjectMatter: "",
      audience: "",
      content: "",
      files: [],
    });
    setEditMode(false);
    setCurrentId(null);
  };

  // Set form data for editing
  const handleEdit = (teaching) => {
    setFormData(teaching);
    setEditMode(true);
    setCurrentId(teaching.id);
  };

  // Delete teaching
  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/teachings/${id}`);
      fetchTeachings();
    } catch (error) {
      toast.error(`Error: ${error.response?.data?.error || error.message}`);
    }
  };

  return (
    <div className="towncrier_controls_body">
      <h2>Towncrier Controls</h2>

      {/* Ensure the form has onSubmit handler attached correctly */}
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
          
          {/* Ensure button type is "submit" */}
          <button type="submit">
            {editMode ? "Update Teaching" : "Add Teaching"}
          </button>
        </div>
      </form>

      <div className="teachings_list">
        <h3>Existing Teachings</h3>
        {Array.isArray(teachings) &&
          teachings.map((teaching) => (
            <div key={teaching.id}>
              <p>Topic: {teaching.topic}</p>
              <p>Lesson Number: {teaching.lessonNumber || "N/A"}</p>
              <p>Date: {new Date(teaching.createdAt).toLocaleDateString()}</p>
              <button onClick={() => handleEdit(teaching)}>Edit</button>
              <button onClick={() => handleDelete(teaching.id)}>Delete</button>
            </div>
          ))}
      </div>
    </div>
  );
};

export default TowncrierControls;





