import {
  getAllTeachings,
  getTeachingsByUserId,
  createTeachingService,
  updateTeachingById,
  deleteTeachingById,
  getTeachingsByIds, // New service function
  getTeachingByPrefixedId, // New service function
} from '../services/teachingsServices.js';

export const fetchAllTeachings = async (req, res) => {
  try {
    const teachings = await getAllTeachings();
    res.status(200).json(teachings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const fetchTeachingsByUserId = async (req, res) => {
  const { user_id } = req.query;
  try {
    const teachings = await getTeachingsByUserId(user_id);
    res.status(200).json(teachings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const fetchTeachingsByIds = async (req, res) => {
  const { ids } = req.query;
  try {
    const teachings = await getTeachingsByIds(ids.split(','));
    res.status(200).json(teachings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// NEW: Fetch teaching by prefixed ID
export const fetchTeachingByPrefixedId = async (req, res) => {
  try {
    const { prefixedId } = req.params;
    const teaching = await getTeachingByPrefixedId(prefixedId);
    
    if (!teaching) {
      return res.status(404).json({ error: 'Teaching not found' });
    }
    
    res.status(200).json(teaching);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



// export const createTeaching = async (req, res) => {
//   try {
//     const { topic, description, subjectMatter, audience, content } = req.body;
    
//        // Extract uploaded files
//        // const files = req.uploadedFiles;
//        const files = req.uploadedFiles || [];
//        const media = files.map((file) => ({
//          url: file.url,
//          type: file.type,
//        }));

//     const newTeaching = await createTeachingService({
//       topic,
//       description,
//       subjectMatter,
//       audience,
//       content,
//       media,
//     });

//     res.status(201).json({ id: newTeaching.id, message: "Teaching created successfully." });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// UPDATED: createTeaching with user_id and prefixed_id response
export const createTeaching = async (req, res) => {
  try {
    const { topic, description, subjectMatter, audience, content } = req.body;
    const { user_id } = req.user; // Get user_id from authenticated user
    
    const files = req.uploadedFiles || [];
    const media = files.map((file) => ({
      url: file.url,
      type: file.type,
    }));

    const newTeaching = await createTeachingService({
      topic,
      description,
      subjectMatter,
      audience,
      content,
      media,
      user_id, // ADD user_id
    });

    res.status(201).json({ 
      id: newTeaching.id,
      prefixed_id: newTeaching.prefixed_id, // RETURN prefixed_id
      message: "Teaching created successfully." 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



export const editTeaching = async (req, res) => {
  try {
    const { id } = req.params;
    const data = {
      ...req.body,
      media: req.uploadedFiles || [],
    };

    const updatedTeaching = await updateTeachingById(id, data);
    res.status(200).json(updatedTeaching);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

export const removeTeaching = async (req, res) => {
  try {
    const { id } = req.params;

    await deleteTeachingById(id);
    res.status(200).json({ message: 'Teaching deleted successfully' });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};