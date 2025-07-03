//ikootaclient\src\components\auth\Applicationsurvey.jsx
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../service/api";
import "./authControls.css";

const AuthControls = () => {
  const queryClient = useQueryClient();
  const [surveyQuestions, setSurveyQuestions] = useState([]);
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [userRoleUpdates, setUserRoleUpdates] = useState({ userId: "", role: "" });

  // Fetch survey questions
  const { data: questions, refetch: fetchQuestions } = useQuery({
    queryKey: ["fetchSurveyQuestions"],
    queryFn: async () => {
      const res = await api.get("/survey/questions");
      console.log("questions at authcontrols", res.data);
      return res.data;
    },
  });

  // Fetch survey logs
  const { data: surveys, refetch: fetchSurveyLogs } = useQuery({
    queryKey: ["fetchSurveyLogs"],
    queryFn: async () => {
      const res = await api.get("/survey/logs");
      console.log("surveys at authcontrols", res.data);
      return res.data;
    },
  });

  // Update survey questions
  const { mutate: updateQuestions } = useMutation({
    mutationFn: (questions) => api.put("/survey/questions", { questions }),
    onSuccess: () => fetchQuestions(),
  });

  // Update user approval status
  const { mutate: updateApprovalStatus } = useMutation({
    mutationFn: ({ surveyId, userId, status }) => api.put("/survey/approve", { surveyId, userId, status }),
    onSuccess: () => fetchSurveyLogs(),
  });

  // Update user role
  const { mutate: updateUserRole } = useMutation({
    mutationFn: ({ userId, role }) => api.put("/users/role", { userId, role }),
    onSuccess: () => alert("User role updated successfully."),
  });

  useEffect(() => {
    if (questions) setSurveyQuestions(questions);
  }, [questions]);

  const handleQuestionChange = (index, value) => {
    const updatedQuestions = [...surveyQuestions];
    updatedQuestions[index] = value;
    setSurveyQuestions(updatedQuestions);
  };

  const handleApproveOrDecline = (surveyId, userId, status) => {
    updateApprovalStatus({ surveyId, userId, status });
  };

  const handleSendFeedback = (email, status) => {
    const feedbackTemplate = status === "granted" ? "approveverifyinfo" : "suspendedverifyinfo";
    api.post("/email/send", { email, template: feedbackTemplate, status });
  };

  return (
    <div className="auth_controls_body">
      <div className="admin_controls_header">Auth Controls</div>

      {/* Section: Edit Survey Questions */}
      <div className="section">
        <h3>Edit Survey Questions</h3>
        {surveyQuestions?.map((question, index) => (
          <div key={index}>
            <input
              type="text"
              value={question}
              onChange={(e) => handleQuestionChange(index, e.target.value)}
            />
          </div>
        ))}
        <button onClick={() => updateQuestions(surveyQuestions)}>Update Questions</button>
      </div>

      {/* Section: Fetch and Vet Survey Forms */}
      <div className="section">
        <h3>Vetting Survey Forms</h3>
        {Array.isArray(surveys) && surveys.map((survey) => (
          <div key={survey.id} className="survey-log">
            <p>User ID: {survey.user_id}</p>
            <p>Answers: {survey.answers}</p>
            <p>Status: {survey.approval_status}</p>
            <div>
              <button onClick={() => handleApproveOrDecline(survey.id, survey.user_id, "granted")}>
                Approve
              </button>
              <button onClick={() => handleApproveOrDecline(survey.id, survey.user_id, "declined")}>
                Decline
              </button>
              <button
                onClick={() =>
                  handleSendFeedback(survey.user_email, survey.approval_status === "granted")
                }
              >
                Send Feedback
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Section: Role Management */}
      <div className="section">
        <h3>Manage User Roles</h3>
        <input
          type="text"
          placeholder="User ID"
          value={userRoleUpdates.userId}
          onChange={(e) => setUserRoleUpdates({ ...userRoleUpdates, userId: e.target.value })}
        />
        <select
          value={userRoleUpdates.role}
          onChange={(e) => setUserRoleUpdates({ ...userRoleUpdates, role: e.target.value })}
        >
          <option value="">Select Role</option>
          <option value="super_admin">Super Admin</option>
          <option value="admin">Admin</option>
          <option value="user">User</option>
        </select>
        <button onClick={() => updateUserRole(userRoleUpdates)}>Update Role</button>
      </div>
    </div>
  );
};

export default AuthControls;


//NOTE ERROR1 useQuery hook uses the object form as required by React Queryv5 is used above as against that below.

//NOTE ERROR2    The error `Uncaught TypeError: surveys.map is not a function` indicates that the `surveys` variable is not an array when the `map` function is called. This can happen if the API response is not as expected or if the data is not properly initialized.
//To resolve this issue, we need to ensure that the `surveys` variable is always an array before calling the `map` function. Additionally, we should verify that the API endpoints are correctly aligned between the frontend and backend.
//Step 1: Ensure `surveys` is Always an Array
//Update the `AuthControls` component to ensure that `surveys` is always an array before calling the `map` function.





// import React, { useState, useEffect } from "react";
// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import api from "../service/api";
// import "./authControls.css";

// const AuthControls = () => {
//    const queryClient = useQueryClient();
//   const [surveyQuestions, setSurveyQuestions] = useState([]);
//   const [selectedSurvey, setSelectedSurvey] = useState(null);
//   const [userRoleUpdates, setUserRoleUpdates] = useState({ userId: "", role: "" });

//   // Fetch survey questions
//   const { data: questions, refetch: fetchQuestions } = useQuery(
//     ["fetchSurveyQuestions"],
//     async () => {
//       const res = await api.get("/survey/questions");
//       console.log("questions at authcontrols", res.data);
//       return res.data;
//     }
//   );

//   // Fetch surveylogs
//   const { data: surveys, refetch: fetchSurveyLogs } = useQuery(
//     ["fetchSurveyLogs"],
//     async () => {
//       const res = await api.get("/survey/logs");
//       console.log("surveys at authcontrols", res.data);
//       return res.data;
//     }
//   );

//   // Update survey questions
//   const { mutate: updateQuestions } = useMutation(
//     (questions) => api.put("/survey/questions", { questions }),
//     {
//       onSuccess: () => fetchQuestions(),
//     }
//   );

//   // Update user approval status
//   const { mutate: updateApprovalStatus } = useMutation(
//     ({ surveyId, userId, status }) => api.put("/survey/approve", { surveyId, userId, status }),
//     {
//       onSuccess: () => fetchSurveyLogs(),
//     }
//   );

//   // Update user role
//   const { mutate: updateUserRole } = useMutation(
//     ({ userId, role }) => api.put("/users/role", { userId, role }),
//     {
//       onSuccess: () => alert("User role updated successfully."),
//     }
//   );

//   useEffect(() => {
//     if (questions) setSurveyQuestions(questions);
//   }, [questions]);

//   const handleQuestionChange = (index, value) => {
//     const updatedQuestions = [...surveyQuestions];
//     updatedQuestions[index] = value;
//     setSurveyQuestions(updatedQuestions);
//   };

//   const handleApproveOrDecline = (surveyId, userId, status) => {
//     updateApprovalStatus({ surveyId, userId, status });
//   };

//   const handleSendFeedback = (email, status) => {
//     const feedbackTemplate = status === "granted" ? "approveverifyinfo" : "suspendedverifyinfo";
//     api.post("/email/send", { email, template: feedbackTemplate, status });
//   };

//   return (
//     <div className="auth_controls_body">
//       <div className="admin_controls_header">Auth Controls</div>

//       {/* Section: Edit Survey Questions */}
//       <div className="section">
//         <h3>Edit Survey Questions</h3>
//         {surveyQuestions.map((question, index) => (
//           <div key={index}>
//             <input
//               type="text"
//               value={question}
//               onChange={(e) => handleQuestionChange(index, e.target.value)}
//             />
//           </div>
//         ))}
//         <button onClick={() => updateQuestions(surveyQuestions)}>Update Questions</button>
//       </div>

//       {/* Section: Fetch and Vet Survey Forms */}
//       <div className="section">
//         <h3>Vetting Survey Forms</h3>
//         {surveys?.map((survey) => (
//           <div key={survey.id} className="survey-log">
//             <p>User ID: {survey.user_id}</p>
//             <p>Answers: {survey.answers}</p>
//             <p>Status: {survey.approval_status}</p>
//             <div>
//               <button onClick={() => handleApproveOrDecline(survey.id, survey.user_id, "granted")}>
//                 Approve
//               </button>
//               <button onClick={() => handleApproveOrDecline(survey.id, survey.user_id, "declined")}>
//                 Decline
//               </button>
//               <button
//                 onClick={() =>
//                   handleSendFeedback(survey.user_email, survey.approval_status === "granted")
//                 }
//               >
//                 Send Feedback
//               </button>
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* Section: Role Management */}
//       <div className="section">
//         <h3>Manage User Roles</h3>
//         <input
//           type="text"
//           placeholder="User ID"
//           value={userRoleUpdates.userId}
//           onChange={(e) => setUserRoleUpdates({ ...userRoleUpdates, userId: e.target.value })}
//         />
//         <select
//           value={userRoleUpdates.role}
//           onChange={(e) => setUserRoleUpdates({ ...userRoleUpdates, role: e.target.value })}
//         >
//           <option value="">Select Role</option>
//           <option value="super_admin">Super Admin</option>
//           <option value="admin">Admin</option>
//           <option value="user">User</option>
//         </select>
//         <button onClick={() => updateUserRole(userRoleUpdates)}>Update Role</button>
//       </div>
//     </div>
//   );
// };

// export default AuthControls;


//implement approval process of application survey with update on users column.
//--fetch survey,update column, generate ID,

// editing of the questions/survey that is presented to new users as applicationsurvey form, fetching of the filled and submitted application survey forms for vetting, and the vetting (approval or declining) of the application survey forms and corresponding feedback to the new user applicants.
//authControls.jsx is part of the Admin management system and it will be linked and displayed inside the Admin.jsx, I want to manage all that concerns authentication. 

//surveylogs, and reply to users' applications (approveverifyinfo, pendverifyinfo, suspendedverifyinfo/declined, verifySurvey? ) after vetting of applicationsurvey forms will be managed at reports.
//assign roles and their permissions. super_admin, admin and user.

//Authorization or Approvals of Posting of teachings or content; that's the starting of a teaching presentation in towncrier or a chat in iko that will first be in pending status will be managed here at authcontrols? fetching of pending, approved, declined, suspended, and deleted teachings or content will be managed at reports. also, 

// what is there to manage in the signup, login, the thank you page, the forgot password and password-Reset process? 

// userlogs, and other logs will be managed at reports.
//Admin Report will manage the report logs, banning, flagged, 