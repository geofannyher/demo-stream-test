"use client";
import React, { useState } from "react";
import axios from "axios";
import { LoadingOutlined } from "@ant-design/icons";
import { FiUploadCloud } from "react-icons/fi";
import { notification } from "antd";
import { audios } from "../shared/audio";

const SubmitMessage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [api, context] = notification.useNotification();
  const [responseMessage, setResponseMessage] = useState<string | null>(null);
  const [loadingAudioIndex, setLoadingAudioIndex] = useState<number | null>(
    null
  );

  const handleSend = async () => {
    if (!message.trim()) {
      setResponseMessage("Message cannot be empty");
      return;
    }

    try {
      setLoading(true);
      setStatus("Sending message...");
      const result = await axios.post(
        "/api/audio",
        { text: message },
        { responseType: "arraybuffer" }
      );

      if (result.status !== 200) {
        throw new Error("Failed to generate audio");
      }

      setStatus("Processing audio...");
      const mainAudioBlob = new Blob([result.data], {
        type: "audio/mpeg",
      });
      const formData = new FormData();
      formData.append("file", mainAudioBlob);
      formData.append("upload_preset", "rfc3rxgd");

      const res = await axios.post(
        `https://api.cloudinary.com/v1_1/dp8ita8x5/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (res.status !== 200) {
        setResponseMessage("Failed to upload audio to Cloudinary");
      }

      setStatus("Publishing message...");
      const response = await axios.post("/api/publishMessage", {
        message: res.data.secure_url,
      });

      if (response.status !== 200) {
        setResponseMessage("Failed to publish message");
      }

      setResponseMessage("Message successfully sent and processed");
      setMessage("");
    } catch (error: any) {
      console.error("Error sending message:", error);
      setResponseMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
      setStatus("");
    }
  };

  const handleSubmit = async (audio: string, index: number | null) => {
    setLoadingAudioIndex(index);
    try {
      const res = await axios.post("/api/publishMessage", {
        message: audio,
      });
      if (res.status !== 200) {
        return api.error({ message: "Failed to publish message" });
      }

      return api.success({
        message: "Message successfully sent and processed",
      });
    } catch (error) {
      return api.error({ message: "System error" });
    } finally {
      setLoadingAudioIndex(null);
    }
  };

  return (
    <>
      {context}
      <div className="min-h-screen flex flex-col lg:flex-row items-center justify-center text-black bg-gray-200 p-4 space-y-2">
        {/* <div className="lg:w-[70%] w-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Streaming Text to Speech</h1>
          <div className="flex justify-center items-center">
            <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-md">
              <div className="mb-4">
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  placeholder="Enter message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
              <button
                disabled={loading}
                className="w-full bg-violet-500 hover:bg-violet-900 transition duration-300 text-white p-2 rounded"
                onClick={handleSend}
              >
                {loading ? (
                  <span>
                    <LoadingOutlined style={{ marginRight: 8 }} />
                    {status}
                  </span>
                ) : (
                  "Send Message"
                )}
              </button>
              {responseMessage && (
                <p
                  className={`mt-4 text-center ${
                    responseMessage.startsWith("Error")
                      ? "text-red-500"
                      : "text-green-500"
                  }`}
                >
                  {responseMessage}
                </p>
              )}
            </div>
          </div>
        </div> */}

        <div className="w-full space-y-2">
          {audios.map((audio, index) => (
            <div className="flex gap-2 justify-center" key={index}>
              <button
                onClick={() => handleSubmit(audio?.url, index)}
                className={`rounded-full w-full lg:w-1/2 flex justify-center gap-2 text-sm font-semibold items-center ${
                  loadingAudioIndex === index ? "bg-gray-500" : "bg-violet-600"
                } hover:bg-violet-900 transition duration-300 text-white p-1 `}
                disabled={loadingAudioIndex === index}
              >
                {loadingAudioIndex === index ? (
                  <>
                    <LoadingOutlined style={{ marginRight: 8 }} />
                    Loading...
                  </>
                ) : (
                  <>
                    <FiUploadCloud /> {audio?.name}
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default SubmitMessage;
