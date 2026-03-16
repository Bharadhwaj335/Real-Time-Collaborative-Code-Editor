import { useState } from "react";
import { useParams } from "react-router-dom";

import Navbar from "../components/Common/Navbar";
import CodeEditor from "../components/Editor/CodeEditor";
import UserList from "../components/Room/UserList";
import ChatBox from "../components/Chat/ChatBox";

const EditorRoom = () => {

  const { roomId } = useParams();

  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");

  return (

    <div className="h-screen flex flex-col">

      <Navbar roomId={roomId} language={language} />

      <div className="flex flex-1">

        {/* SIDEBAR */}
        <div className="w-12 bg-gray-800"></div>

        {/* EDITOR */}
        <div className="flex-1">
          <CodeEditor
            language={language}
            setCode={setCode}
          />
        </div>

        {/* RIGHT PANEL */}
        <div className="w-72 bg-gray-100 p-3">

          <div className="flex gap-3 mb-3">

            <button className="bg-gray-300 px-3 py-1 rounded">
              Users
            </button>

            <button className="bg-gray-300 px-3 py-1 rounded">
              Chat
            </button>

          </div>

          <UserList />

          <ChatBox />

        </div>

      </div>

      {/* OUTPUT BAR */}
      <div className="bg-black text-white h-28 p-3">

        <p className="text-red-500">
          Output will appear here
        </p>

      </div>

    </div>

  );

};

export default EditorRoom;