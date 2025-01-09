import {
    getAllTeachings,
    createTeaching,
    updateTeachingById,
    deleteTeachingById,
  } from '../services/teachingsServices.js';
  
  // Fetch all teachings
  export const fetchTeachings = async (req, res, next) => {
    try {
      const teachings = await getAllTeachings();
      res.status(200).json({ success: true, data: teachings });
    } catch (error) {
      next(error);
    }
  };
  
  // Add a new teaching
  export const addTeaching = async (req, res, next) => {
    try {
      const teaching = await createTeaching(req.body);
      res.status(201).json({ success: true, data: teaching });
    } catch (error) {
      next(error);
    }
  };
  
  // Update a teaching by ID
  export const editTeaching = async (req, res, next) => {
    try {
      const { id } = req.params;
      const updatedTeaching = await updateTeachingById(id, req.body);
      res.status(200).json({ success: true, data: updatedTeaching });
    } catch (error) {
      next(error);
    }
  };
  
  // Delete a teaching by ID
  export const removeTeaching = async (req, res, next) => {
    try {
      const { id } = req.params;
      await deleteTeachingById(id);
      res.status(200).json({ success: true, message: 'Teaching deleted successfully' });
    } catch (error) {
      next(error);
    }
  };
  




// import { submitTeachingsService } from '../services/teachingsServices.js';
// import { generateToken } from '../utils/jwt.js';

// export const submitTeachings = async (req, res, next) => {
//   try {
    
//   } catch (error) {
//     console.error('Error in submitTeachings controller:', error);
//     next(error);
//   }
// };