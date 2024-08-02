"use client";

import React, { useEffect, useRef, useState } from "react";

const PlayVideo: React.FC = () => {
  const defaultVideoUrl =
    "https://res.cloudinary.com/dp8ita8x5/video/upload/v1720685155/videoStream/gemuk/wpoydfqeewnhdvtr9mog.mp4";
  const [videoUrl, setVideoUrl] = useState<string>(defaultVideoUrl);
  const [isNewVideoPlaying, setIsNewVideoPlaying] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const connectToStream = () => {
    const eventSource = new EventSource("/api/subscribeMessage");
    eventSource.addEventListener("message", (event) => {
      console.log("Received message event:", event);
      const newVideoUrl = event.data;
      if (newVideoUrl) {
        setVideoUrl(newVideoUrl);
        setIsNewVideoPlaying(true);
        if (videoRef.current) {
          videoRef.current.currentTime = 0; // Reset video to start
          videoRef.current.loop = false; // Do not loop new video
          videoRef.current.load();
          videoRef.current.play().catch((error) => {
            console.error("Error playing video:", error);
          });
        }
      } else {
        console.error("Received invalid video URL");
      }
    });

    eventSource.addEventListener("error", (error) => {
      console.error("EventSource error:", error);
      eventSource.close();
      setTimeout(connectToStream, 1000); // Use 1 second timeout to prevent rapid reconnection attempts
    });

    return eventSource;
  };

  useEffect(() => {
    const eventSource = connectToStream();
    return () => {
      console.log("CLOSED");
      eventSource.close();
    };
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.src = videoUrl;
      videoRef.current.load();
      videoRef.current.play().catch((error) => {
        console.error("Error playing video:", error);
      });
    }
  }, [videoUrl]);

  const handleVideoEnded = () => {
    if (isNewVideoPlaying) {
      setVideoUrl(defaultVideoUrl);
      setIsNewVideoPlaying(false);
      if (videoRef.current) {
        videoRef.current.loop = true;
        videoRef.current.currentTime = 0; // Reset to start of default video
        videoRef.current.load();
        videoRef.current.play().catch((error) => {
          console.error("Error playing video:", error);
        });
      }
    }
  };

  return (
    <div className="grid grid-cols-3 h-[100dvh]">
      <div className="col-span-3 flex items-center justify-center bg-white h-full">
        <div
          style={{
            width: "calc(100dvh * 9 / 16)",
          }}
          className="relative bg-white flex items-center justify-center"
        >
          <div className="flex h-full flex-col items-center justify-center">
            <div className="relative">
              <video
                ref={videoRef}
                src={videoUrl}
                autoPlay
                controls
                onEnded={handleVideoEnded}
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayVideo;
