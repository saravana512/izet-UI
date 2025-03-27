import { useState, useEffect } from "react";
import TextField from "@mui/material/TextField";
import io from "socket.io-client";

import "./App.css";
import { Button } from "@mui/material";

const socket = io.connect("http://localhost:9005");

const USER_1 = "user1";
const USER_2 = "user2";

function App() {
  const [message, setMessage] = useState("");
  const [previousMessages, setPreviousMessages] = useState([]);
  const [currentUser, setCurrentUser] = useState(USER_1);

  console.log("Previous Messages: ", previousMessages, currentUser);

  useEffect(() => {
    console.log("Current User: ", currentUser);
    socket.emit("getMessages", { senderId: currentUser });

    socket.on("messages", (messages) => {
      console.log("Messages Check 1 initil load", messages);
      if (messages?.length) {
        const formattedMessages = messages.map((msg) => ({
          senderId: msg.senderId,
          receiverId: msg.receiverId,
          messageContent: msg.messageContent,
          type: msg.receiverId === currentUser ? "received" : "sent",
        }));
        setPreviousMessages(formattedMessages);
      }
    });

    socket.on("messageReceived", (data) => {
      setPreviousMessages((prev) => [
        ...prev,
        {
          senderId: data.from,
          receiverId: data.to,
          messageContent: data.message,
          type: data.to === currentUser ? "received" : "sent",
        },
      ]);
    });

    // Cleanup the listeners when the component unmounts
    return () => {
      socket.off("messages");
      socket.off("messageReceived");
    };
  }, [currentUser]);

  const sendMessage = (value) => {
    if (value.trim() === "") return;

    const messageData = {
      from: currentUser,
      to: currentUser === USER_1 ? USER_2 : USER_1,
      message: value,
    };

    setPreviousMessages((prev) => [
      ...prev,
      {
        senderId: messageData.from,
        receiverId: messageData.to,
        messageContent: messageData.message,
        type: "sent",
      },
    ]);

    socket.emit("sentMessage", messageData);
    setMessage("");
  };

  return (
    <>
      <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
        <h2>Chat Application</h2>
        <div>
          <Button
            variant="outlined"
            onClick={() =>
              setCurrentUser((prev) => (prev === USER_1 ? USER_2 : USER_1))
            }
            style={{ marginBottom: "20px" }}
          >
            Switch to {currentUser === USER_1 ? "User 2" : "User 1"}
          </Button>
        </div>
        <div>
          Current User is <strong>{currentUser}</strong>
        </div>
        <div
          style={{
            border: "1px solid #ccc",
            borderRadius: "8px",
            padding: "10px",
            height: "400px",
            overflowY: "auto",
            marginBottom: "20px",
          }}
        >
          {previousMessages.map((msg, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                justifyContent: msg.type === "sent" ? "flex-end" : "flex-start",
                marginBottom: "10px",
              }}
            >
              <div
                style={{
                  maxWidth: "60%",
                  padding: "10px",
                  borderRadius: "10px",
                  backgroundColor: msg.type === "sent" ? "#DCF8C6" : "#F1F0F0",
                  textAlign: "left",
                  color: "black",
                }}
              >
                <strong>{msg.type === "sent" ? "You" : msg.senderId}:</strong>{" "}
                {msg.messageContent}
              </div>
            </div>
          ))}
        </div>
        <div>
          <TextField
            id="filled-basic"
            label="Message"
            variant="filled"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            style={{ marginBottom: "20px", width: "80%", color: "white" }}
          />
          <Button
            variant="contained"
            onClick={() => sendMessage(message)}
            style={{ marginLeft: "10px" }}
          >
            Send Message
          </Button>
        </div>
      </div>
    </>
  );
}

export default App;
