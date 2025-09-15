// ikootaclient/src/components/iko/Chat.jsx - IMPROVED with Top Action Buttons & Hidden Bottom Forms
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import useUpload from "../../hooks/useUpload";
import EmojiPicker from "emoji-picker-react";
import DOMPurify from "dompurify";
import ReactPlayer from "react-player";
import "./chat.css";
import api from "../service/api";
import { jwtDecode } from "jwt-decode";
import MediaGallery from "./MediaGallery";
import { useUploadCommentFiles } from "../../hooks/useUploadCommentFiles";
import useCommentMutation from "../../hooks/useCommentMutation";
import { useMediaCapture } from "../../hooks/useMediaCapture";
// ✅ NEW: AI Features Import

// Note: getCreatorInfo function is defined later in the component with full implementation
import { useContentSummarization } from "../../hooks/useSummarization";
import { useContentRecommendations } from "../../hooks/useRecommendations";

// Helper function to get creator info - MOVED TO PREVENT HOISTING ISSUES
const getCreatorInfo = async (content) => {
  // Get unique converse_id in OTO#XXXXXX format for privacy
  console.log("Content data for extracting creator converse ID:", content);

  // Method 1: Check if converse_id is directly available in content
  if (content?.converse_id && content.converse_id.startsWith("OTO#")) {
    console.log("Found converse_id directly:", content.converse_id);
    return content.converse_id;
  }

  // Method 2: For comments, user_id field contains the converse ID
  if (
    content?.user_id &&
    typeof content.user_id === "string" &&
    content.user_id.startsWith("OTO#")
  ) {
    console.log("Found converse ID in user_id field:", content.user_id);
    return content.user_id;
  }

  // Fallback to basic display
  return content?.user_id || content?.author || "SYSTEM";
};

// ✅ NEW: Component for displaying creator converse ID with async loading
const CreatorDisplay = ({ content }) => {
  const [creatorId, setCreatorId] = useState("Loading...");

  useEffect(() => {
    const fetchCreatorId = async () => {
      try {
        const id = await getCreatorInfo(content);
        setCreatorId(id);
      } catch (error) {
        console.error("Error fetching creator ID:", error);
        setCreatorId("SYSTEM");
      }
    };

    fetchCreatorId();
  }, [content]);

  return creatorId;
};

const Chat = ({ activeItem, activeComment, chats = [], teachings = [] }) => {
  const { handleSubmit, register, reset, setValue } = useForm();
  const { validateFiles, mutation: chatMutation } = useUpload("/chats");

  const commentMutation = useCommentMutation();
  const uploadCommentFiles = useUploadCommentFiles();

  const {
    isRecording,
    isCapturing,
    mediaStream,
    videoRef,
    canvasRef,
    handleImageUpload,
    startCameraCapture,
    takePhoto,
    startVideoRecording,
    stopVideoRecording,
    switchCamera,
    startAudioRecording,
    stopAudioRecording,
    stopAllStreams,
  } = useMediaCapture();

  const token = localStorage.getItem("token");
  const user_id = token ? jwtDecode(token).user_id : null;

  // ✅ ENHANCED: State management for all forms and modals
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [showTeachingForm, setShowTeachingForm] = useState(false);
  const [showChatForm, setShowChatForm] = useState(false);
  const [formData, setFormData] = useState({});
  const [openEmoji, setOpenEmoji] = useState(false);
  const [addMode, setAddMode] = useState(false); // For bottom form toggle
  const [step, setStep] = useState(0);
  const [playingMedia, setPlayingMedia] = useState(null);

  const [mediaFiles, setMediaFiles] = useState({
    media1: [],
    media2: [],
    media3: [],
  });

  const [showCameraModal, setShowCameraModal] = useState(false);
  const [captureMode, setCaptureMode] = useState("photo");
  const [audioRecordingDuration, setAudioRecordingDuration] = useState(0);

  // ✅ NEW: AI Features state
  const [showAIFeatures, setShowAIFeatures] = useState(false);
  const [aiPanelTab, setAIPanelTab] = useState("summary"); // 'summary', 'recommendations'

  // ✅ ENHANCED: Find active content with better error handling
  const findActiveContent = () => {
    if (!activeItem) {
      console.log("No active item provided");
      return null;
    }

    try {
      const chatsArray = Array.isArray(chats) ? chats : [];
      const teachingsArray = Array.isArray(teachings) ? teachings : [];

      console.log("🔍 Finding content for:", activeItem);

      // Try multiple matching strategies
      const searchStrategies = [
        // Strategy 1: Exact prefixed_id match
        () => {
          if (activeItem.prefixed_id) {
            if (
              activeItem.prefixed_id.startsWith("c") ||
              activeItem.type === "chat"
            ) {
              return chatsArray.find(
                (chat) => chat.prefixed_id === activeItem.prefixed_id
              );
            } else if (
              activeItem.prefixed_id.startsWith("t") ||
              activeItem.type === "teaching"
            ) {
              return teachingsArray.find(
                (teaching) => teaching.prefixed_id === activeItem.prefixed_id
              );
            }
          }
          return null;
        },
        // Strategy 2: ID match with type
        () => {
          if (activeItem.type === "chat") {
            return chatsArray.find((chat) => chat.id === activeItem.id);
          } else if (activeItem.type === "teaching") {
            return teachingsArray.find(
              (teaching) => teaching.id === activeItem.id
            );
          }
          return null;
        },
        // Strategy 3: updatedAt match (fallback)
        () => {
          if (activeItem.type === "chat") {
            return chatsArray.find(
              (chat) => chat.updatedAt === activeItem.updatedAt
            );
          } else if (activeItem.type === "teaching") {
            return teachingsArray.find(
              (teaching) => teaching.updatedAt === activeItem.updatedAt
            );
          }
          return null;
        },
        // Strategy 4: Use activeItem itself if it has content
        () => {
          if (
            activeItem.title ||
            activeItem.topic ||
            activeItem.content ||
            activeItem.text ||
            activeItem.user_id
          ) {
            console.log(activeItem);
            return activeItem;
          }
          return null;
        },
      ];

      for (const strategy of searchStrategies) {
        const result = strategy();
        if (result) {
          console.log("✅ Found content using strategy:", result);
          return result;
        }
      }

      console.log("❌ No content found for activeItem:", activeItem);
      return null;
    } catch (error) {
      console.error("❌ Error in findActiveContent:", error);
      return null;
    }
  };

  const activeContent = findActiveContent();

  // ✅ NEW: AI Features hooks - only activate when content is available
  const {
    data: contentSummary,
    isLoading: summaryLoading,
    error: summaryError,
  } = useContentSummarization(
    activeContent?.content_type || activeContent?.type,
    activeContent?.id,
    {
      method: "auto",
      maxLength: 200,
      style:
        activeContent?.content_type === "teaching" ? "educational" : "casual",
      enabled: !!activeContent && showAIFeatures,
    }
  );

  const { data: contentRecommendations, isLoading: recommendationsLoading } =
    useContentRecommendations(
      activeContent?.content_type || activeContent?.type,
      activeContent?.id,
      {
        includeExternal: true,
        maxCurated: 3,
        maxExternal: 2,
        sources: "youtube",
        enabled: !!activeContent && showAIFeatures,
      }
    );

  // Audio recording timer
  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setAudioRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setAudioRecordingDuration(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  useEffect(() => {
    return () => {
      stopAllStreams();
    };
  }, [stopAllStreams]);

  console.log("🔍 Active item:", activeItem);
  console.log("🔍 Active content:", activeContent);
  console.log("🔍 Active comment:", activeComment);

  if (!activeItem) {
    return (
      <div className="chat_container" style={{ border: "3px solid red" }}>
        <div
          className="status"
          style={{ padding: "50px", textAlign: "center", color: "#666" }}
        >
          <p>📄 Select a chat or teaching from the left to view content</p>
        </div>
      </div>
    );
  }

  const handleNextStep = () => {
    if (step < 6) setStep(step + 1);
  };

  const handlePrevStep = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleEmoji = (e) => {
    setFormData({ ...formData, comment: (formData.comment || "") + e.emoji });
    setOpenEmoji(false);
  };

  const sanitizeMessage = (message) => {
    if (!message) return "";
    return DOMPurify.sanitize(message, {
      ALLOWED_TAGS: ["b", "i", "em", "strong", "a"],
    });
  };

  const handleImageIconClick = async () => {
    try {
      const files = await handleImageUpload();
      if (files.length > 0) {
        const currentStep = step ? `media${step}` : "media1";
        setMediaFiles((prev) => ({
          ...prev,
          [currentStep]: files,
        }));
        console.log(`📁 Added ${files.length} images to ${currentStep}`);
        alert(`${files.length} image(s) selected for upload!`);
      }
    } catch (error) {
      console.error("❌ Image upload failed:", error);
      alert("Failed to select images. Please try again.");
    }
  };

  const handleCameraIconClick = async () => {
    try {
      setShowCameraModal(true);
      await startCameraCapture();
    } catch (error) {
      setShowCameraModal(false);
      console.error("❌ Camera access failed:", error);
    }
  };

  const handleTakePhoto = async () => {
    try {
      const photoFile = await takePhoto();
      if (photoFile) {
        const currentStep = step ? `media${step}` : "media1";
        setMediaFiles((prev) => ({
          ...prev,
          [currentStep]: [photoFile],
        }));
        console.log(`📸 Photo added to ${currentStep}`);
        alert("Photo captured successfully!");
        setShowCameraModal(false);
        stopAllStreams();
      }
    } catch (error) {
      console.error("❌ Photo capture failed:", error);
      alert("Failed to capture photo. Please try again.");
    }
  };

  const handleToggleVideoRecording = async () => {
    if (isRecording) {
      try {
        const videoFile = await stopVideoRecording();
        if (videoFile) {
          const currentStep = step ? `media${step}` : "media1";
          setMediaFiles((prev) => ({
            ...prev,
            [currentStep]: [videoFile],
          }));
          console.log(`🎥 Video added to ${currentStep}`);
          alert("Video recorded successfully!");
          setShowCameraModal(false);
          stopAllStreams();
        }
      } catch (error) {
        console.error("❌ Video recording failed:", error);
        alert("Failed to record video. Please try again.");
      }
    } else {
      setCaptureMode("video");
      startVideoRecording();
    }
  };

  const handleMicIconClick = async () => {
    if (isRecording) {
      try {
        const audioFile = await stopAudioRecording();
        if (audioFile) {
          const currentStep = step ? `media${step}` : "media1";
          setMediaFiles((prev) => ({
            ...prev,
            [currentStep]: [audioFile],
          }));
          console.log(`🎤 Audio added to ${currentStep}`);
          alert("Audio recorded successfully!");
        }
      } catch (error) {
        console.error("❌ Audio recording failed:", error);
        alert("Failed to record audio. Please try again.");
      }
    } else {
      try {
        await startAudioRecording();
        alert("Recording started! Click the microphone again to stop.");
      } catch (error) {
        console.error("❌ Audio recording start failed:", error);
      }
    }
  };

  // ✅ COMMENT: Comment submission handler
  const handleSendComment = async (data) => {
    try {
      if (!user_id) {
        alert("Please log in to comment");
        return;
      }

      const contentId = activeContent?.id || activeItem?.id;
      const contentType =
        activeContent?.content_type || activeContent?.type || activeItem?.type;

      if (!contentId || !contentType) {
        console.error("Missing content ID or type");
        alert("Error: Unable to identify content");
        return;
      }

      const allMediaFiles = [
        ...mediaFiles.media1,
        ...mediaFiles.media2,
        ...mediaFiles.media3,
      ].filter(Boolean);

      let uploadedFiles = [];

      if (allMediaFiles.length > 0) {
        try {
          const validationResult =
            uploadCommentFiles.validateFiles(allMediaFiles);
          if (validationResult !== true) {
            alert(`File validation failed: ${validationResult}`);
            return;
          }

          console.log(`🔄 Uploading ${allMediaFiles.length} media files...`);
          const uploadResponse = await uploadCommentFiles.uploadAsync(
            allMediaFiles
          );

          if (uploadResponse?.uploadedFiles) {
            uploadedFiles = uploadResponse.uploadedFiles;
          } else if (Array.isArray(uploadResponse)) {
            uploadedFiles = uploadResponse;
          }
        } catch (error) {
          console.error("❌ Media upload failed:", error);
          alert(`Failed to upload media files: ${error.message}`);
          return;
        }
      }

      const formData = new FormData();
      formData.append("user_id", user_id);
      formData.append("comment", data.comment);

      if (contentType === "chat") {
        formData.append("chat_id", contentId);
      } else if (contentType === "teaching") {
        formData.append("teaching_id", contentId);
      }

      allMediaFiles.forEach((file, index) => {
        formData.append(`media${index + 1}`, file);
      });

      console.log("🔄 Posting comment...");
      const commentResponse = await commentMutation.mutateAsync(formData);

      console.log("✅ Comment posted successfully:", commentResponse);

      reset();
      setMediaFiles({ media1: [], media2: [], media3: [] });
      setStep(0);
      setShowCommentForm(false);
      stopAllStreams();

      alert("Comment posted successfully!");
      window.location.reload();
    } catch (error) {
      console.error("❌ Comment posting failed:", error);

      let message = "Error posting comment. ";
      if (error.message.includes("authentication")) {
        message += "Please log in and try again.";
      } else if (error.message.includes("validation")) {
        message += "Please check your input and try again.";
      } else {
        message += error.message || "Please try again later.";
      }

      alert(message);
    }
  };

  // ✅ CHAT: Chat creation handler (7-step form)
  const handleSendChat = (data) => {
    const formData = new FormData();
    formData.append("created_by", user_id || "anonymous");
    formData.append("title", data.title);
    formData.append("audience", data.audience);
    formData.append("summary", data.summary);
    formData.append("text", data.text);
    formData.append("is_flagged", false);

    ["media1", "media2", "media3"].forEach((file) => {
      if (data[file]?.[0]) {
        formData.append(file, data[file][0]);
      }
    });

    chatMutation.mutate(formData, {
      onSuccess: (response) => {
        console.log(
          "Chat created with prefixed ID:",
          response.data?.prefixed_id
        );
        reset();
        setStep(0);
        setAddMode(false);
        alert("Chat created successfully!");
        window.location.reload();
      },
      onError: (error) => {
        console.error("Error uploading chat:", error);
        alert("Error creating chat. Please try again.");
      },
    });
  };

  // ✅ TEACHING: Teaching creation handler (8-step form - to be implemented)
  const handleSendTeaching = (data) => {
    // This would be similar to chat creation but for teachings
    // For now, just show placeholder
    alert("Teaching creation will be implemented with 8-step form!");
    setShowTeachingForm(false);
    reset();
    setStep(0);
  };

  const handleMediaClick = (url) => {
    setPlayingMedia(url);
  };

  const renderMedia = (url, type, alt = "media") => {
    if (!url || !type) return null;

    switch (type) {
      case "image":
        return (
          <img
            src={url}
            alt={alt}
            width="100%"
            style={{ maxHeight: "300px", objectFit: "contain" }}
            onClick={() => handleMediaClick(url)}
          />
        );
      case "video":
        return <ReactPlayer url={url} controls width="100%" height="200px" />;
      case "audio":
        return (
          <audio controls style={{ width: "100%" }}>
            <source src={url} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
        );
      default:
        return <p>Unsupported media type: {type}</p>;
    }
  };

  const getContentIdentifier = (content) => {
    if (!content) return "Unknown";
    return (
      content.prefixed_id ||
      `${content.content_type || content.type || "item"}${content.id}` ||
      "Unknown"
    );
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // ✅ ENHANCED: Dynamic content functions for Chat.jsx
  // Add these helper functions before the return statement in your Chat component

  const getCreatorAvatar = (content) => {
    // Try to get converse avatar for privacy (masks real user profile)
    const avatar =
      content?.converse_avatar ||
      content?.creator_converse_avatar ||
      content?.author_converse_avatar ||
      content?.creator?.converse_avatar ||
      content?.user?.converse_avatar ||
      content?.avatar_url ||
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iMjAiIGZpbGw9IiNlZWUiLz4KPHN2ZyB4PSI4IiB5PSI4IiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSI+CjxwYXRoIGQ9Ik0xMiAxMmM0IDAgNCAyIDQgNGgtOGMwLTIgMC00IDQtNFptMC0xYzEuNjU2IDAgMy0xLjM0NCAzLTNTMTMuNjU2IDUgMTIgNSA5IDYuMzQ0IDkgOHMxLjM0NCAzIDMgM1oiIGZpbGw9IiM5OTkiLz4KPHN2Zz4KPHN2Zz4K';

    // Only block the specific problematic /admin/avatar.png path
    if (avatar && avatar.includes('/admin/avatar.png')) {
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iMjAiIGZpbGw9IiNlZWUiLz4KPHN2ZyB4PSI4IiB5PSI4IiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3E9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSI+CjxwYXRoIGQ9Ik0xMiAxMmM0IDAgNCAyIDQgNGgtOGMwLTIgMC00IDQtNFptMC0xYzEuNjU2IDAgMy0xLjM0NCAzLTNTMTMuNjU2IDUgMTIgNSA5IDYuMzQ0IDkgOHMxLjM0NCAzIDMgM1oiIGZpbGw9IiM5OTkiLz4KPHN2Zz4KPHN2Zz4K';
    }

    return avatar;
  };

  // Cache for converse_id lookups to prevent repeated API calls
  const converseIdCache = new Map();

  const getCreatorInfo = async (content) => {
    // Get unique converse_id in OTO#XXXXXX format for privacy
    console.log("Content data for extracting creator converse ID:", content);

    // Method 1: Check if converse_id is directly available in content
    if (content?.converse_id && content.converse_id.startsWith("OTO#")) {
      console.log("Found converse_id directly:", content.converse_id);
      return content.converse_id;
    }

    // Method 2: For comments, user_id field contains the converse ID
    if (
      content?.user_id &&
      typeof content.user_id === "string" &&
      content.user_id.startsWith("OTO#")
    ) {
      console.log("Found converse ID in user_id field:", content.user_id);
      return content.user_id;
    }

    // Method 3: Get from decoded token if content creator matches current user
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const decoded = jwtDecode(token);
        console.log("Token decoded for converse_id:", decoded);

        // Check if the content was created by current user
        if (
          content?.user_id === decoded.user_id ||
          content?.author_id === decoded.user_id
        ) {
          if (decoded.converse_id && decoded.converse_id.startsWith("OTO#")) {
            console.log("Using converse_id from token:", decoded.converse_id);
            return decoded.converse_id;
          }
        }
      }
    } catch (error) {
      console.error("Error decoding token:", error);
    }

    // Method 4: Check nested user object
    if (
      content?.user?.converse_id &&
      content.user.converse_id.startsWith("OTO#")
    ) {
      console.log(
        "Found converse_id in user object:",
        content.user.converse_id
      );
      return content.user.converse_id;
    }

    // Method 5: Check creator object
    if (
      content?.creator?.converse_id &&
      content.creator.converse_id.startsWith("OTO#")
    ) {
      console.log(
        "Found converse_id in creator object:",
        content.creator.converse_id
      );
      return content.creator.converse_id;
    }

    // Method 6: API FALLBACK - Query users table by user_id to get converse_id
    const userId =
      content?.user_id || content?.created_by || content?.author_id;
    if (userId && typeof userId === "number") {
      console.log("Making API call to fetch converse_id for user_id:", userId);

      // Check cache first
      if (converseIdCache.has(userId)) {
        console.log("Found converse_id in cache:", converseIdCache.get(userId));
        return converseIdCache.get(userId);
      }

      try {
        // Make API call to get user's converse_id
        const response = await api.get(`/auth/users/${userId}/converse-id`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        const converseId =
          response.data?.converse_id || response.data?.data?.converse_id;
        if (converseId && converseId.startsWith("OTO#")) {
          console.log("API returned converse_id:", converseId);
          // Cache the result
          converseIdCache.set(userId, converseId);
          return converseId;
        }

        console.log("API response for user converse_id:", response.data);
      } catch (apiError) {
        console.error("Error fetching converse_id from API:", apiError);

        // Try alternative endpoint
        try {
          const altResponse = await api.get(`/users/${userId}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          });

          const altConverseId =
            altResponse.data?.converse_id ||
            altResponse.data?.user?.converse_id;
          if (altConverseId && altConverseId.startsWith("OTO#")) {
            console.log("Alternative API returned converse_id:", altConverseId);
            converseIdCache.set(userId, altConverseId);
            return altConverseId;
          }
        } catch (altError) {
          console.error("Alternative API also failed:", altError);
        }
      }
    }

    // Absolute fallback - this should never happen in production
    console.error("CRITICAL: Could not find converse_id for content:", content);
    return "SYSTEM";
  };

  const getApproverInfo = (content) => {
    // Get approver's converse_id in OTO#XXXXXX format
    const possibleApproverIds = [
      content?.approved_by_converse_id,
      content?.approver_converse_id,
      content?.approver?.converse_id,
      content?.moderator_converse_id,
      content?.moderator?.converse_id,
      content?.approved_by?.converse_id,
    ];

    // Find the first ID that matches OTO# format
    const approverConverseId = possibleApproverIds.find(
      (id) => id && typeof id === "string" && id.startsWith("OTO#")
    );

    // Return the approver converse ID or "System" if not found
    // Never return user_id or numeric IDs
    return approverConverseId || "System";
  };

  const getCreatorName = (content) => {
    // Get display name for creator
    const name =
      content?.user?.username ||
      content?.creator?.username ||
      content?.author_name ||
      content?.username ||
      "Unknown User";
    return name;
  };

  // ✅ ENHANCED: Icon click handlers
  const handlePhoneClick = () => {
    alert(
      "📞 Voice Call Feature\n\nComing Soon! This feature will enable voice calling with other users in this chat."
    );
  };

  const handleVideoClick = () => {
    alert(
      "🎥 Video Chat Feature\n\nComing Soon! Video conferencing capabilities will be available in the next update. You'll be able to have face-to-face conversations!"
    );
  };

  const handleInfoClick = () => {
    const contentInfo = `ℹ️ Content Information\n\nContent Type: ${
      activeContent?.content_type || activeContent?.type || "Unknown"
    }\nContent ID: ${getContentIdentifier(activeContent)}\nCreated: ${
      (activeContent?.createdAt || activeContent?.created_at)
        ? new Date(activeContent.createdAt || activeContent.created_at).toLocaleDateString()
        : "Unknown"
    }\n\nDetailed analytics and information panel coming soon!`;
    alert(contentInfo);
  };

  return (
    <div className="chat_container" style={{ border: "3px solid red" }}>
      {/* ✅ TOP SECTION: Content Header Info with Action Buttons */}

      <div className="top">
        {/* ✅ ENHANCED: Dynamic User Avatar */}
        <div className="user">
          <img
            className="avatar"
            src={getCreatorAvatar(activeContent)}
            alt={`${getCreatorName(activeContent)} Avatar`}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iMjAiIGZpbGw9IiNlZWUiLz4KPHN2ZyB4PSI4IiB5PSI4IiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSI+CjxwYXRoIGQ9Ik0xMiAxMmM0IDAgNCAyIDQgNGgtOGMwLTIgMC00IDQtNFptMC0xYzEuNjU2IDAgMy0xLjM0NCAzLTNTMTMuNjU2IDUgMTIgNSA5IDYuMzQ0IDkgOHMxLjM0NCAzIDMgM1oiIGZpbGw9IiM5OTkiLz4KPHN2Zz4KPHN2Zz4K';
            }}
            // title={`Created by ${getCreatorName(activeContent)}`}
          />
        </div>

        {/* ✅ ENHANCED: Dynamic Content Information */}
        <div className="chat_top_texts">
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span className="creator-info">
              <strong style={{ fontSize: "12px" }}>Posted By:</strong>{" "}
              <CreatorDisplay content={activeContent} />
            </span>
            <span
              className="approver-info"
              style={{ fontSize: "11px", opacity: 0.8 }}
            >
              <strong>Approved By:</strong> {getApproverInfo(activeContent)}
            </span>
          </div>
        </div>
        <div>
          {/* ✅ ENHANCED: Top Action Buttons with better styling */}
          <div className="top-action-buttons">
            <button
              onClick={() => setShowCommentForm(true)}
              title="Add Comment"
              className="action-btn comment-btn small-btn"
              style={{ fontSize: "11px", padding: "3px 6px" }}
            >
              💬 <span style={{ fontSize: "10px" }}>Comment</span>
            </button>

            <button
              onClick={() => setShowTeachingForm(true)}
              title="Create Teaching"
              className="action-btn teach-btn small-btn"
              style={{ fontSize: "11px", padding: "3px 6px" }}
            >
              📚 <span style={{ fontSize: "10px" }}>Teach</span>
            </button>

            <button
              onClick={() => setShowChatForm(true)}
              title="Start Chat"
              className="action-btn chat-btn small-btn"
              style={{ fontSize: "11px", padding: "3px 6px" }}
            >
              💭 <span style={{ fontSize: "10px" }}>Chat</span>
            </button>
          </div>

          {/* ✅ ENHANCED: Interactive Top Icons */}
          <div className="chat-top-icons">
            <img
              src="./phone.png"
              alt="Phone"
              onClick={handlePhoneClick}
              title="Voice Call (Coming Soon)"
              tabIndex="0"
              onKeyDown={(e) => e.key === "Enter" && handlePhoneClick()}
            />
            <img
              src="./video.png"
              alt="Video"
              onClick={handleVideoClick}
              title="Video Chat (Coming Soon)"
              tabIndex="0"
              onKeyDown={(e) => e.key === "Enter" && handleVideoClick()}
            />
            <img
              src="./info.png"
              alt="Info"
              onClick={handleInfoClick}
              title="Content Information"
              tabIndex="0"
              onKeyDown={(e) => e.key === "Enter" && handleInfoClick()}
            />
          </div>
        </div>
      </div>

      {/* ✅ CENTER SECTION: Active Content Display */}
      <div className="center" style={{ border: "3px solid yellow" }}>
        <div className="message-heading" style={{ border: "5px solid brown" }}>
          <div className="content-header">
            <span className="content-type-badge">
              {activeContent?.content_type ||
                activeContent?.type ||
                activeItem?.type ||
                "content"}
            </span>

            <span className="content-id-display">
              {getContentIdentifier(activeContent)}
            </span>
            <span>
              {" "}
              <p>
                Lesson #: {activeContent?.lessonNumber || activeContent?.id}
              </p>
            </span>
            <span>
              {" "}
              {activeContent?.subjectMatter && (
                <p>Subject: {activeContent.subjectMatter}</p>
              )}
            </span>
          
          </div>
          <div
            className="content-header 2"
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              gap: "15px",
              border: "3px solid orange",
              padding: "5px",
              marginTop: "5px",
            }}
          >
            <div className="content-header 2-1">
              <div>
                {activeContent?.description && (
                  <div>
                    Descr:{" "}
                    {activeContent?.description ||
                      activeContent?.summary ||
                      "No description"}
                  </div>
                )}
              </div>
              <div>
                {activeContent?.topic && (
                  <div>Topic #: {activeContent.topic}</div>
                )}
              </div>
            </div>

            <div
              className="content-header 2 2"
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              <p>Audience: {activeContent?.audience || "General"}</p>
              <span>
                Created By: <CreatorDisplay content={activeContent} />
              </span>

              <p>
                Posted:{" "}
                {(activeContent?.createdAt || activeContent?.created_at)
                  ? new Date(activeContent.createdAt || activeContent.created_at).toLocaleString()
                  : "Unknown date"}
              </p>
            </div>
          </div>
        </div>

        <div className="texts" style={{ border: "5px solid green" }}>
          <p>
            {sanitizeMessage(
              activeContent?.text ||
                activeContent?.content ||
                "No content available"
            )}
          </p>
          <span>
            Updated:{" "}
            {(activeContent?.updatedAt || activeContent?.updated_at)
              ? new Date(activeContent.updatedAt || activeContent.updated_at).toLocaleString()
              : "Unknown date"}
          </span>
        </div>

        <div className="media-container" style={{ border: "5px solid gray" }}>
          {renderMedia(
            activeContent?.media_url1,
            activeContent?.media_type1,
            "Media 1"
          )}
          {renderMedia(
            activeContent?.media_url2,
            activeContent?.media_type2,
            "Media 2"
          )}
          {renderMedia(
            activeContent?.media_url3,
            activeContent?.media_type3,
            "Media 3"
          )}
        </div>
        {/* ✅ NEW: AI Features Toggle Button */}
        {activeContent && (
          <button
            onClick={() => setShowAIFeatures(!showAIFeatures)}
            title="Show AI features: Summary & Recommendations"
            className={`action-btn ai-btn ${showAIFeatures ? "active" : ""}`}
          >
            🤖 AI Features
          </button>
        )}
      </div>

      {/* ✅ NEW: AI Features Panel */}
      {activeContent && showAIFeatures && (
        <div
          className="ai-features-panel"
          style={{
            border: "3px solid #4CAF50",
            borderRadius: "8px",
            margin: "10px 0",
            background: "#f9f9f9",
            overflow: "hidden",
          }}
        >
          {/* AI Panel Header */}
          <div
            className="ai-panel-header"
            style={{
              background: "linear-gradient(135deg, #4CAF50 0%, #45a049 100%)",
              color: "white",
              padding: "10px 15px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h4 style={{ margin: 0, fontSize: "16px" }}>
              🤖 AI-Powered Content Analysis
            </h4>
            <button
              onClick={() => setShowAIFeatures(false)}
              style={{
                background: "none",
                border: "none",
                color: "white",
                fontSize: "16px",
                cursor: "pointer",
              }}
              title="Close AI panel"
            >
              ✖
            </button>
          </div>

          {/* AI Panel Tabs */}
          <div
            className="ai-panel-tabs"
            style={{
              display: "flex",
              background: "#e8f5e8",
              borderBottom: "1px solid #ccc",
            }}
          >
            <button
              onClick={() => setAIPanelTab("summary")}
              style={{
                padding: "10px 20px",
                border: "none",
                background:
                  aiPanelTab === "summary" ? "#4CAF50" : "transparent",
                color: aiPanelTab === "summary" ? "white" : "#333",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              📝 Smart Summary
            </button>
            <button
              onClick={() => setAIPanelTab("recommendations")}
              style={{
                padding: "10px 20px",
                border: "none",
                background:
                  aiPanelTab === "recommendations" ? "#4CAF50" : "transparent",
                color: aiPanelTab === "recommendations" ? "white" : "#333",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              🔍 Related Resources
            </button>
          </div>

          {/* AI Panel Content */}
          <div className="ai-panel-content" style={{ padding: "15px" }}>
            {aiPanelTab === "summary" && (
              <div className="summary-tab">
                <div
                  style={{
                    marginBottom: "10px",
                    fontSize: "14px",
                    color: "#666",
                  }}
                >
                  AI-generated summary for better comprehension
                </div>
                {summaryLoading ? (
                  <div
                    style={{
                      padding: "20px",
                      textAlign: "center",
                      color: "#666",
                    }}
                  >
                    <div
                      style={{
                        display: "inline-block",
                        animation: "pulse 1.5s infinite",
                      }}
                    >
                      🤖 Analyzing content...
                    </div>
                  </div>
                ) : summaryError ? (
                  <div
                    style={{
                      padding: "15px",
                      background: "#ffebee",
                      border: "1px solid #ffcdd2",
                      borderRadius: "4px",
                      color: "#c62828",
                    }}
                  >
                    ⚠️ Could not generate summary. Using built-in summarization.
                  </div>
                ) : contentSummary ? (
                  <div
                    style={{
                      background: "white",
                      border: "1px solid #ddd",
                      borderRadius: "6px",
                      padding: "15px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "15px",
                        lineHeight: "1.6",
                        marginBottom: "10px",
                      }}
                    >
                      {contentSummary.summary}
                    </div>
                    {contentSummary.confidence && (
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#666",
                          borderTop: "1px solid #eee",
                          paddingTop: "8px",
                        }}
                      >
                        Method: {contentSummary.method} | Confidence:{" "}
                        {Math.round(contentSummary.confidence * 100)}% |
                        Compression:{" "}
                        {Math.round(
                          (1 -
                            contentSummary.summary?.length /
                              (activeContent?.text?.length || 1)) *
                            100
                        )}
                        %
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    style={{
                      padding: "15px",
                      background: "#fff3e0",
                      border: "1px solid #ffcc02",
                      borderRadius: "4px",
                    }}
                  >
                    💡 Click the AI Features button to generate a summary of
                    this content.
                  </div>
                )}
              </div>
            )}

            {aiPanelTab === "recommendations" && (
              <div className="recommendations-tab">
                <div
                  style={{
                    marginBottom: "10px",
                    fontSize: "14px",
                    color: "#666",
                  }}
                >
                  Curated learning resources and related content
                </div>
                {recommendationsLoading ? (
                  <div
                    style={{
                      padding: "20px",
                      textAlign: "center",
                      color: "#666",
                    }}
                  >
                    <div
                      style={{
                        display: "inline-block",
                        animation: "pulse 1.5s infinite",
                      }}
                    >
                      🔍 Finding related resources...
                    </div>
                  </div>
                ) : contentRecommendations ? (
                  <div>
                    {/* Curated Recommendations */}
                    {contentRecommendations.curated?.length > 0 && (
                      <div style={{ marginBottom: "15px" }}>
                        <h5 style={{ margin: "0 0 10px 0", color: "#4CAF50" }}>
                          📚 Platform Content
                        </h5>
                        {contentRecommendations.curated
                          .slice(0, 3)
                          .map((rec, index) => (
                            <div
                              key={index}
                              style={{
                                background: "white",
                                border: "1px solid #ddd",
                                borderLeft: "4px solid #4CAF50",
                                borderRadius: "4px",
                                padding: "10px",
                                marginBottom: "8px",
                              }}
                            >
                              <div
                                style={{
                                  fontWeight: "bold",
                                  fontSize: "14px",
                                  marginBottom: "4px",
                                }}
                              >
                                {rec.title}
                              </div>
                              <div
                                style={{
                                  fontSize: "13px",
                                  color: "#666",
                                  marginBottom: "6px",
                                }}
                              >
                                {rec.description?.substring(0, 100)}...
                              </div>
                              <div style={{ fontSize: "11px", color: "#888" }}>
                                Type: {rec.type} | Rating: ⭐ {rec.rating}
                              </div>
                            </div>
                          ))}
                      </div>
                    )}

                    {/* External Recommendations */}
                    {contentRecommendations.external?.length > 0 && (
                      <div>
                        <h5 style={{ margin: "0 0 10px 0", color: "#2196F3" }}>
                          🌐 External Resources
                        </h5>
                        {contentRecommendations.external
                          .slice(0, 2)
                          .map((rec, index) => (
                            <div
                              key={index}
                              style={{
                                background: "white",
                                border: "1px solid #ddd",
                                borderLeft: "4px solid #2196F3",
                                borderRadius: "4px",
                                padding: "10px",
                                marginBottom: "8px",
                                cursor: "pointer",
                              }}
                              onClick={() => window.open(rec.url, "_blank")}
                            >
                              <div
                                style={{
                                  fontWeight: "bold",
                                  fontSize: "14px",
                                  marginBottom: "4px",
                                }}
                              >
                                {rec.title} 🔗
                              </div>
                              <div
                                style={{
                                  fontSize: "13px",
                                  color: "#666",
                                  marginBottom: "6px",
                                }}
                              >
                                {rec.description?.substring(0, 100)}...
                              </div>
                              <div style={{ fontSize: "11px", color: "#888" }}>
                                Source: {rec.source} |{" "}
                                {rec.channel && `Channel: ${rec.channel}`}
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    style={{
                      padding: "15px",
                      background: "#fff3e0",
                      border: "1px solid #ffcc02",
                      borderRadius: "4px",
                    }}
                  >
                    🔍 Click the AI Features button to discover related learning
                    resources.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ✅ BOTTOM SECTION: Active Comment Display */}
      <div className="bottom" >
        {activeComment ? (
          <div className="active-comment-display">
            <div
              className="comment-header"
              style={{
                padding: "10px",
                backgroundColor: "#f8f9fa6c",
              }}
            >
              <h4 style={{ margin: 0, color: "#333" }}>💬 Selected Comment</h4>
              <span style={{ fontSize: "12px", color: "#666" }}>
                Comment ID: {activeComment.id} | By:{" "}
                {activeComment.user_id &&
                activeComment.user_id.startsWith("OTO#")
                  ? activeComment.user_id
                  : "Unknown"}{" "}
                | Posted:{" "}
                {(activeComment.createdAt || activeComment.created_at)
                  ? new Date(activeComment.createdAt || activeComment.created_at).toLocaleString()
                  : "Unknown date"}
              </span>
            </div>

            <div className="comment-content" style={{ padding: "15px" }}>
              <div className="comment-text" style={{ marginBottom: "15px" }}>
                <p style={{ fontSize: "16px", lineHeight: "1.5", margin: 0 }}>
                  {sanitizeMessage(
                    activeComment.comment ||
                      activeComment.content ||
                      activeComment.text ||
                      "No content"
                  )}
                </p>
              </div>

              {/* Comment Media */}
              <div
                className="comment-media"
                style={{ borderTop: "1px solid #eee", paddingTop: "10px" }}
              >
                {renderMedia(
                  activeComment.media_url1,
                  activeComment.media_type1,
                  "Comment Media 1"
                )}
                {renderMedia(
                  activeComment.media_url2,
                  activeComment.media_type2,
                  "Comment Media 2"
                )}
                {renderMedia(
                  activeComment.media_url3,
                  activeComment.media_type3,
                  "Comment Media 3"
                )}
              </div>

              {/* Comment Metadata */}
              <div
                className="comment-metadata"
                style={{
                  marginTop: "10px",
                  padding: "8px",
                  backgroundColor: "black",
                  borderRadius: "12px",
                  fontSize: "12px",
                  color: "white",
                  opacity: 0.7,
                  border: "2px solid purple",
                }}
              >
                <div>Comment ID: {activeComment.id}</div>
                {activeComment.chat_id && (
                  <div>On Chat: {activeComment.chat_id}</div>
                )}
                {activeComment.teaching_id && (
                  <div>On Teaching: {activeComment.teaching_id}</div>
                )}
                {activeComment.parentcomment_id && (
                  <div>Reply to Comment: {activeComment.parentcomment_id}</div>
                )}
                <div>Status: {activeComment.status || "approved"}</div>
              </div>
            </div>
          </div>
        ) : (
          <div
            className="no-comment-selected"
            style={{
              padding: "50px",
              textAlign: "center",
              color: "#666",
              backgroundColor: "#f8f9fa",
            }}
          >
            <p>💬 Select a comment from the right panel to view its details</p>
            <p style={{ fontSize: "14px", marginTop: "10px" }}>
              Comments for this {activeContent?.content_type || "content"} will
              appear in the right sidebar
            </p>
          </div>
        )}
      </div>

      {/* ✅ HIDDEN BOTTOM FORM SECTION - From #3 (preserved functionality, hidden with CSS) */}
      <div
        className="hidden-bottom-forms"
        id="hidden-bottom-forms"
      >
        <div className="toggle_buttons">
          <button
            className={!addMode ? "active" : ""}
            onClick={() => setAddMode(false)}
          >
            Comment
          </button>
          <button
            className={addMode ? "active" : ""}
            onClick={() => setAddMode(true)}
          >
            Start New Chat
          </button>
        </div>

        {!addMode ? (
          <form
            className="bottom_comment"
            onSubmit={handleSubmit(handleSendComment)}
            noValidate
          >
            <div className="step-indicator">
              <span>
                Step {step + 1} of 4:{" "}
                {["Comment", "Media 1", "Media 2", "Media 3"][step]}
              </span>

              <span className="icons">
                <img
                  src="./img.png"
                  alt="Upload Images"
                  onClick={handleImageIconClick}
                  title="Upload Images"
                  style={{ cursor: "pointer" }}
                />
                <img
                  src="./camera.png"
                  alt="Camera"
                  onClick={handleCameraIconClick}
                  title="Take Photo/Video"
                  style={{ cursor: "pointer", opacity: isCapturing ? 0.7 : 1 }}
                />
                <img
                  src="./mic.png"
                  alt="Microphone"
                  onClick={handleMicIconClick}
                  title={
                    isRecording
                      ? `Recording... ${formatDuration(audioRecordingDuration)}`
                      : "Record Audio"
                  }
                  style={{
                    cursor: "pointer",
                    opacity: isRecording ? 0.7 : 1,
                    animation: isRecording ? "pulse 1s infinite" : "none",
                  }}
                />
                <span className="emoji">
                  <img
                    src="./emoji.png"
                    alt="Emoji Picker"
                    onClick={() => setOpenEmoji(!openEmoji)}
                    style={{ cursor: "pointer" }}
                  />
                  {openEmoji && <EmojiPicker onEmojiClick={handleEmoji} />}
                </span>
              </span>
            </div>

            {Object.values(mediaFiles).some((files) => files.length > 0) && (
              <div
                className="media-status"
                style={{
                  padding: "8px",
                  backgroundColor: "#e8f5e8",
                  borderRadius: "4px",
                  marginBottom: "10px",
                  fontSize: "12px",
                }}
              >
                📁 Media files ready: {Object.values(mediaFiles).flat().length}
              </div>
            )}

            {isRecording && (
              <div
                className="recording-status"
                style={{
                  padding: "8px",
                  backgroundColor: "#ffe8e8",
                  borderRadius: "4px",
                  marginBottom: "10px",
                  fontSize: "12px",
                  color: "#c0392b",
                }}
              >
                🎤 Recording audio... {formatDuration(audioRecordingDuration)}
              </div>
            )}

            {step === 0 && (
              <input
                type="text"
                placeholder="Type a message..."
                {...register("comment", { required: "Comment is required" })}
              />
            )}
            {step === 1 && (
              <div className="media-step">
                <p>
                  Media 1: Use icons above to add images, photos, videos, or
                  audio
                </p>
                {mediaFiles.media1.length > 0 && (
                  <div>✅ {mediaFiles.media1.length} file(s) selected</div>
                )}
              </div>
            )}
            {step === 2 && (
              <div className="media-step">
                <p>Media 2: Add additional media files (optional)</p>
                {mediaFiles.media2.length > 0 && (
                  <div>✅ {mediaFiles.media2.length} file(s) selected</div>
                )}
              </div>
            )}
            {step === 3 && (
              <div className="media-step">
                <p>Media 3: Add more media files (optional)</p>
                {mediaFiles.media3.length > 0 && (
                  <div>✅ {mediaFiles.media3.length} file(s) selected</div>
                )}
              </div>
            )}

            <div className="input-buttons">
              {step < 3 && (
                <button type="button" onClick={handleNextStep}>
                  Next
                </button>
              )}
              {step > 0 && (
                <button type="button" onClick={handlePrevStep}>
                  Previous
                </button>
              )}
            </div>

            <button
              className="SendButton"
              type="submit"
              disabled={
                commentMutation.isPending || uploadCommentFiles.isPending
              }
            >
              {commentMutation.isPending || uploadCommentFiles.isPending
                ? "Posting..."
                : "Send Comment"}
            </button>
          </form>
        ) : (
          <form
            className="bottom_presentation"
            onSubmit={handleSubmit(handleSendChat)}
            noValidate
          >
            <div className="step-indicator">
              Step {step + 1} of 7:{" "}
              {
                [
                  "Title",
                  "Summary",
                  "Audience",
                  "Content",
                  "Media 1",
                  "Media 2",
                  "Media 3",
                ][step]
              }
            </div>

            {step === 0 && (
              <input
                type="text"
                placeholder="Enter Title"
                {...register("title", { required: "Title is required" })}
              />
            )}
            {step === 1 && (
              <input
                type="text"
                placeholder="Enter Summary"
                {...register("summary", { required: "Summary is required" })}
              />
            )}
            {step === 2 && (
              <input
                type="text"
                placeholder="Enter Audience"
                {...register("audience", { required: "Audience is required" })}
              />
            )}
            {step === 3 && (
              <textarea
                placeholder="Enter Main Text"
                rows="4"
                {...register("text", { required: "Main text is required" })}
              />
            )}
            {step === 4 && (
              <input
                type="file"
                multiple
                accept="image/*,video/*,audio/*"
                {...register("media1", { validate: validateFiles })}
              />
            )}
            {step === 5 && (
              <input
                type="file"
                multiple
                accept="image/*,video/*,audio/*"
                {...register("media2", { validate: validateFiles })}
              />
            )}
            {step === 6 && (
              <input
                type="file"
                multiple
                accept="image/*,video/*,audio/*"
                {...register("media3", { validate: validateFiles })}
              />
            )}

            <div className="input-buttons">
              {step < 6 && (
                <button type="button" onClick={handleNextStep}>
                  Next
                </button>
              )}
              {step > 0 && (
                <button type="button" onClick={handlePrevStep}>
                  Previous
                </button>
              )}
            </div>
            <button className="SendButton" type="submit">
              Create Chat
            </button>
          </form>
        )}

      </div>

      {/* Show/Hide Handle - Always visible at bottom */}
      <div
        className="form-handle"
        onClick={() => {
          const forms = document.getElementById("hidden-bottom-forms");
          if (forms) {
            forms.classList.toggle("show");
          }
        }}
      >
        ⬆️ Advanced Forms ⬆️
      </div>

      {/* ✅ COMMENT FORM MODAL (from #2) */}
      {showCommentForm && (
        <div
          className="comment-form-modal"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            className="comment-form-container"
            style={{
              background: "white",
              borderRadius: "10px",
              padding: "20px",
              maxWidth: "600px",
              width: "90%",
              maxHeight: "80%",
              overflow: "auto",
            }}
          >
            <div className="form-header" style={{ marginBottom: "20px" }}>
              <h3 style={{ margin: 0 }}>💬 Add Comment</h3>
              <p style={{ fontSize: "14px", color: "#666", margin: "5px 0" }}>
                Commenting on:{" "}
                {activeContent?.title || activeContent?.topic || "Content"}
              </p>
            </div>

            <form onSubmit={handleSubmit(handleSendComment)} noValidate>
              <div className="step-indicator" style={{ marginBottom: "15px" }}>
                <span>
                  Step {step + 1} of 4:{" "}
                  {["Comment", "Media 1", "Media 2", "Media 3"][step]}
                </span>

                <div className="icons" style={{ marginTop: "10px" }}>
                  <img
                    src="./img.png"
                    alt="Upload Images"
                    onClick={handleImageIconClick}
                    title="Upload Images"
                    style={{ cursor: "pointer", marginRight: "10px" }}
                  />
                  <img
                    src="./camera.png"
                    alt="Camera"
                    onClick={handleCameraIconClick}
                    title="Take Photo/Video"
                    style={{
                      cursor: "pointer",
                      opacity: isCapturing ? 0.7 : 1,
                      marginRight: "10px",
                    }}
                  />
                  <img
                    src="./mic.png"
                    alt="Microphone"
                    onClick={handleMicIconClick}
                    title={
                      isRecording
                        ? `Recording... ${formatDuration(
                            audioRecordingDuration
                          )}`
                        : "Record Audio"
                    }
                    style={{
                      cursor: "pointer",
                      opacity: isRecording ? 0.7 : 1,
                      animation: isRecording ? "pulse 1s infinite" : "none",
                      marginRight: "10px",
                    }}
                  />
                  <span className="emoji">
                    <img
                      src="./emoji.png"
                      alt="Emoji Picker"
                      onClick={() => setOpenEmoji(!openEmoji)}
                      style={{ cursor: "pointer" }}
                    />
                    {openEmoji && <EmojiPicker onEmojiClick={handleEmoji} />}
                  </span>
                </div>
              </div>

              {Object.values(mediaFiles).some((files) => files.length > 0) && (
                <div
                  className="media-status"
                  style={{
                    padding: "8px",
                    backgroundColor: "#e8f5e8",
                    borderRadius: "4px",
                    marginBottom: "10px",
                    fontSize: "12px",
                  }}
                >
                  📁 Media files ready:{" "}
                  {Object.values(mediaFiles).flat().length}
                </div>
              )}

              {isRecording && (
                <div
                  className="recording-status"
                  style={{
                    padding: "8px",
                    backgroundColor: "#ffe8e8",
                    borderRadius: "4px",
                    marginBottom: "10px",
                    fontSize: "12px",
                    color: "#c0392b",
                  }}
                >
                  🎤 Recording audio... {formatDuration(audioRecordingDuration)}
                </div>
              )}

              {step === 0 && (
                <textarea
                  placeholder="Type your comment..."
                  rows={4}
                  {...register("comment", { required: "Comment is required" })}
                  style={{
                    width: "100%",
                    padding: "10px",
                    marginBottom: "15px",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                  }}
                />
              )}
              {step === 1 && (
                <div
                  className="media-step"
                  style={{
                    padding: "20px",
                    backgroundColor: "#f8f9fa",
                    borderRadius: "4px",
                    marginBottom: "15px",
                  }}
                >
                  <p>
                    Media 1: Use icons above to add images, photos, videos, or
                    audio
                  </p>
                  {mediaFiles.media1.length > 0 && (
                    <div style={{ color: "green" }}>
                      ✅ {mediaFiles.media1.length} file(s) selected
                    </div>
                  )}
                </div>
              )}
              {step === 2 && (
                <div
                  className="media-step"
                  style={{
                    padding: "20px",
                    backgroundColor: "#f8f9fa",
                    borderRadius: "4px",
                    marginBottom: "15px",
                  }}
                >
                  <p>Media 2: Add additional media files (optional)</p>
                  {mediaFiles.media2.length > 0 && (
                    <div style={{ color: "green" }}>
                      ✅ {mediaFiles.media2.length} file(s) selected
                    </div>
                  )}
                </div>
              )}
              {step === 3 && (
                <div
                  className="media-step"
                  style={{
                    padding: "20px",
                    backgroundColor: "#f8f9fa",
                    borderRadius: "4px",
                    marginBottom: "15px",
                  }}
                >
                  <p>Media 3: Add more media files (optional)</p>
                  {mediaFiles.media3.length > 0 && (
                    <div style={{ color: "green" }}>
                      ✅ {mediaFiles.media3.length} file(s) selected
                    </div>
                  )}
                </div>
              )}

              <div
                className="form-buttons"
                style={{
                  display: "flex",
                  gap: "10px",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  {step > 0 && (
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      style={{
                        padding: "8px 16px",
                        backgroundColor: "#6c757d",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      Previous
                    </button>
                  )}
                  {step < 3 && (
                    <button
                      type="button"
                      onClick={handleNextStep}
                      style={{
                        padding: "8px 16px",
                        backgroundColor: "#007bff",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        marginLeft: step > 0 ? "10px" : "0",
                      }}
                    >
                      Next
                    </button>
                  )}
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCommentForm(false);
                      setStep(0);
                      reset();
                      setMediaFiles({ media1: [], media2: [], media3: [] });
                    }}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: "#6c757d",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      marginRight: "10px",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      commentMutation.isPending || uploadCommentFiles.isPending
                    }
                    style={{
                      padding: "8px 16px",
                      backgroundColor: "#28a745",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    {commentMutation.isPending || uploadCommentFiles.isPending
                      ? "Posting..."
                      : "Post Comment"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ✅ NEW: TEACHING FORM MODAL */}
      {showTeachingForm && (
        <div
          className="teaching-form-modal"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            className="teaching-form-container"
            style={{
              background: "white",
              borderRadius: "10px",
              padding: "25px",
              maxWidth: "700px",
              width: "95%",
              maxHeight: "85%",
              overflow: "auto",
            }}
          >
            <div className="form-header" style={{ marginBottom: "25px" }}>
              <h3 style={{ margin: 0, color: "#6f42c1" }}>
                📚 Teach a Subject
              </h3>
              <p style={{ fontSize: "14px", color: "#666", margin: "8px 0" }}>
                8-Step Teaching Process | Share your knowledge with the
                community
              </p>
            </div>

            <form onSubmit={handleSubmit(handleSendTeaching)} noValidate>
              <div
                className="placeholder-content"
                style={{
                  padding: "40px",
                  textAlign: "center",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "8px",
                  border: "2px dashed #6f42c1",
                }}
              >
                <h4 style={{ color: "#6f42c1", marginBottom: "20px" }}>
                  📚 Teaching Form Coming Soon!
                </h4>
                <p style={{ color: "#666", marginBottom: "20px" }}>
                  This will feature an 8-step process for creating comprehensive
                  teaching content:
                </p>
                <div
                  style={{
                    textAlign: "left",
                    maxWidth: "400px",
                    margin: "0 auto",
                  }}
                >
                  <p>1. Subject/Topic</p>
                  <p>2. Learning Objectives</p>
                  <p>3. Difficulty Level</p>
                  <p>4. Prerequisites</p>
                  <p>5. Main Content</p>
                  <p>6. Media Resources 1</p>
                  <p>7. Media Resources 2</p>
                  <p>8. Assessment/Summary</p>
                </div>
              </div>

              <div
                className="form-buttons"
                style={{
                  display: "flex",
                  gap: "15px",
                  justifyContent: "center",
                  marginTop: "25px",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setShowTeachingForm(false);
                    reset();
                  }}
                  style={{
                    padding: "12px 20px",
                    backgroundColor: "#6c757d",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  Close
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "12px 25px",
                    backgroundColor: "#6f42c1",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  📚 Create Teaching (Demo)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ✅ NEW: CHAT FORM MODAL */}
      {showChatForm && (
        <div
          className="chat-form-modal"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            className="chat-form-container"
            style={{
              background: "white",
              borderRadius: "10px",
              padding: "25px",
              maxWidth: "600px",
              width: "90%",
              maxHeight: "80%",
              overflow: "auto",
            }}
          >
            <div className="form-header" style={{ marginBottom: "25px" }}>
              <h3 style={{ margin: 0, color: "#007bff" }}>💭 Start a Chat</h3>
              <p style={{ fontSize: "14px", color: "#666", margin: "8px 0" }}>
                Quick Chat Creation | Start a discussion on any topic
              </p>
            </div>

            <form onSubmit={handleSubmit(handleSendChat)} noValidate>
              <div className="form-step" style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "bold",
                  }}
                >
                  Chat Title *
                </label>
                <input
                  type="text"
                  placeholder="What do you want to discuss?"
                  {...register("title", { required: "Title is required" })}
                  style={{
                    width: "100%",
                    padding: "12px",
                    fontSize: "16px",
                    borderRadius: "6px",
                    border: "1px solid #ddd",
                  }}
                />
              </div>

              <div className="form-step" style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "bold",
                  }}
                >
                  Summary (Optional)
                </label>
                <textarea
                  placeholder="Brief summary of your discussion topic..."
                  rows={2}
                  {...register("summary")}
                  style={{
                    width: "100%",
                    padding: "12px",
                    fontSize: "14px",
                    borderRadius: "6px",
                    border: "1px solid #ddd",
                  }}
                />
              </div>

              <div className="form-step" style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "bold",
                  }}
                >
                  Your Message *
                </label>
                <textarea
                  placeholder="Share your thoughts, ask questions, start the conversation..."
                  rows={5}
                  {...register("text", { required: "Content is required" })}
                  style={{
                    width: "100%",
                    padding: "12px",
                    fontSize: "14px",
                    borderRadius: "6px",
                    border: "1px solid #ddd",
                  }}
                />
              </div>

              <div className="form-step" style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "bold",
                  }}
                >
                  Audience
                </label>
                <select
                  {...register("audience")}
                  style={{
                    width: "100%",
                    padding: "12px",
                    fontSize: "14px",
                    borderRadius: "6px",
                    border: "1px solid #ddd",
                  }}
                >
                  <option value="general">Everyone</option>
                  <option value="beginners">Beginners</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div
                className="form-buttons"
                style={{
                  display: "flex",
                  gap: "15px",
                  justifyContent: "space-between",
                  marginTop: "25px",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setShowChatForm(false);
                    reset();
                  }}
                  style={{
                    padding: "12px 20px",
                    backgroundColor: "#6c757d",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={chatMutation.isPending}
                  style={{
                    padding: "12px 25px",
                    backgroundColor: "#007bff",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  {chatMutation.isPending ? "🔄 Creating..." : "💭 Start Chat"}
                </button>
              </div>

              <div
                className="submission-info"
                style={{
                  marginTop: "15px",
                  padding: "10px",
                  backgroundColor: "#e3f2fd",
                  borderRadius: "6px",
                  fontSize: "12px",
                  color: "#1976d2",
                }}
              >
                <p style={{ margin: 0 }}>
                  💡 Your chat will be reviewed for approval before going live
                </p>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Camera Modal - unchanged */}
      {showCameraModal && (
        <div
          className="camera-modal"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.9)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1001,
          }}
        >
          <div
            className="camera-container"
            style={{
              background: "white",
              borderRadius: "10px",
              padding: "20px",
              maxWidth: "90%",
              maxHeight: "90%",
            }}
          >
            <video
              ref={videoRef}
              style={{
                width: "100%",
                maxWidth: "640px",
                height: "auto",
                borderRadius: "8px",
              }}
              autoPlay
              muted
            />
            <canvas ref={canvasRef} style={{ display: "none" }} />

            <div
              className="camera-controls"
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "15px",
                marginTop: "15px",
              }}
            >
              <button
                onClick={handleTakePhoto}
                style={{
                  padding: "12px 20px",
                  backgroundColor: "#3498db",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                📸 Take Photo
              </button>
              <button
                onClick={handleToggleVideoRecording}
                style={{
                  padding: "12px 20px",
                  backgroundColor: isRecording ? "#e74c3c" : "#27ae60",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                {isRecording ? "🛑 Stop Video" : "🎥 Start Video"}
              </button>
              <button
                onClick={switchCamera}
                style={{
                  padding: "12px 20px",
                  backgroundColor: "#95a5a6",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                🔄 Switch Camera
              </button>
              <button
                onClick={() => {
                  setShowCameraModal(false);
                  stopAllStreams();
                }}
                style={{
                  padding: "12px 20px",
                  backgroundColor: "#e74c3c",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                ❌ Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
