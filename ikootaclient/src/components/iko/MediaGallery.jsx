import React, { useState } from "react";
import ReactPlayer from "react-player";

const MediaGallery = ({ mediaFiles }) => {
  const [currentMedia, setCurrentMedia] = useState(null);
  const [playing, setPlaying] = useState(false);

  const handleMediaClick = (file) => {
    if (currentMedia === file) {
      setPlaying(!playing);
    } else {
      setCurrentMedia(file);
      setPlaying(true);
    }
  };

  return (
    <div className="grid grid-cols-3 gap-4">
      {mediaFiles.map((file, index) => (
        <div key={index} className="p-2 border rounded-md">
          {file.type.includes("image") ? (
            <img
              src={file.url}
              alt={file.name}
              className="w-full h-auto cursor-pointer"
              onClick={() => handleMediaClick(file)}
            />
          ) : file.type.includes("video") ? (
            <ReactPlayer
              url={file.url}
              controls
              playing={currentMedia === file && playing}
              width="100%"
              height="auto"
              onClick={() => handleMediaClick(file)}
            />
          ) : file.type.includes("audio") ? (
            <ReactPlayer
              url={file.url}
              controls
              playing={currentMedia === file && playing}
              width="100%"
              height="50px"
              onClick={() => handleMediaClick(file)}
            />
          ) : (
            <p>Unsupported format</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default MediaGallery;
