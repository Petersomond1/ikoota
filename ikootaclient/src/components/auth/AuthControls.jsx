import React from 'react';
import '../admin/admin.css';

const AuthControls = () => {
  return (
    <div className="auth_controls_body">
      <div className="admin_controls_header">Auth Controls</div>
      <p>Manage authentication here.</p>
    </div>
  );
};

export default AuthControls;

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