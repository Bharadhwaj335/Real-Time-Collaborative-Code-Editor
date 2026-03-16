import { useState } from "react";

const ChatBox = () => {
  const [message, setMessage] = useState("");

  return (
    <div>
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button>Send</button>
    </div>
  );
};

export default ChatBox;
