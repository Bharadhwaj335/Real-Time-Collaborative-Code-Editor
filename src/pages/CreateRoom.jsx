import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuid } from "uuid";

const CreateRoom = () => {

  const navigate = useNavigate();

  const [roomName, setRoomName] = useState("");
  const [language, setLanguage] = useState("JavaScript");
  const [visibility, setVisibility] = useState("private");
  const [recentRooms, setRecentRooms] = useState([]);

  useEffect(() => {
    const savedRooms = JSON.parse(localStorage.getItem("recentRooms")) || [];
    setRecentRooms(savedRooms);
  }, []);

  const createRoom = () => {

    const roomId = uuid().slice(0,6).toUpperCase();

    const newRoom = {
      id: roomId,
      name: roomName,
      language: language,
      visibility: visibility,
      time: "Just now"
    };

    const updatedRooms = [newRoom, ...recentRooms];

    localStorage.setItem("recentRooms", JSON.stringify(updatedRooms));

    navigate(`/room/${roomId}`);
  };

  return (

    <div className="min-h-screen flex items-center justify-center bg-[#020617] text-white">

      <div className="w-[420px] border border-gray-800 rounded-xl p-6">

        <h2 className="text-2xl font-semibold mb-1">
          Start a session
        </h2>

        <p className="text-gray-400 mb-6 text-sm">
          Create a new room or join an existing one.
        </p>

        {/* ROOM NAME */}

        <label className="text-xs text-gray-400">
          ROOM NAME
        </label>

        <input
          value={roomName}
          onChange={(e)=>setRoomName(e.target.value)}
          placeholder="Enter room name"
          className="w-full p-3 mt-2 mb-4 bg-[#020617] border border-gray-700 rounded-md"
        />

        {/* LANGUAGE */}

        <label className="text-xs text-gray-400">
          LANGUAGE
        </label>

        <select
          value={language}
          onChange={(e)=>setLanguage(e.target.value)}
          className="w-full p-3 mt-2 mb-4 bg-[#020617] border border-gray-700 rounded-md"
        >
          <option>JavaScript</option>
          <option>Python</option>
          <option>Java</option>
          <option>C++</option>
        </select>

        {/* VISIBILITY */}

        <label className="text-xs text-gray-400">
          VISIBILITY
        </label>

        <div className="flex gap-3 mt-2 mb-6">

          <button
            onClick={()=>setVisibility("private")}
            className={`flex-1 py-2 border rounded-md ${
              visibility==="private" ? "border-blue-500":"border-gray-700"
            }`}
          >
            Private
          </button>

          <button
            onClick={()=>setVisibility("public")}
            className={`flex-1 py-2 border rounded-md ${
              visibility==="public" ? "border-blue-500":"border-gray-700"
            }`}
          >
            Public
          </button>

        </div>

        {/* CREATE BUTTON */}

        <button
          onClick={createRoom}
          className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500"
        >
          Create room →
        </button>

        {/* RECENT ROOMS */}

        {recentRooms.length > 0 && (

          <div className="mt-8">

            <h3 className="text-sm text-gray-400 mb-3">
              Last Visited
            </h3>

            <div className="space-y-3">

              {recentRooms.map((room)=>(
                <div
                  key={room.id}
                  onClick={()=>navigate(`/room/${room.id}`)}
                  className="flex justify-between items-center border border-gray-700 rounded-lg p-3 cursor-pointer hover:border-blue-500"
                >

                  <div>
                    <p className="font-medium">{room.id}</p>
                    <p className="text-gray-400 text-sm">
                      {room.language}
                    </p>
                  </div>

                  <span className="text-gray-500 text-xs">
                    {room.time}
                  </span>

                </div>
              ))}

            </div>

          </div>

        )}

      </div>

    </div>
  );
};

export default CreateRoom;