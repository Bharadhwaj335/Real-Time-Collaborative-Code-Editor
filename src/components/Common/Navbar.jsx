import { FaPlay, FaShareAlt } from "react-icons/fa";

const Navbar = ({ roomId, language }) => {
  return (
    <div className="flex justify-between items-center px-6 py-3 bg-gray-900 text-white shadow-lg">

      {/* LOGO */}
      <h1 className="text-xl font-bold text-blue-400">
        CodeCollab
      </h1>

      {/* ROOM BADGE */}
      <div className="flex items-center gap-2 bg-gray-800 px-3 py-1 rounded-full">
        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
        Room {roomId}
      </div>

      {/* LANGUAGE */}
      <select className="bg-gray-800 px-2 py-1 rounded">
        <option>JavaScript</option>
        <option>Python</option>
        <option>Java</option>
        <option>C++</option>
      </select>

      {/* ACTION BUTTONS */}
      <div className="flex gap-3">

        <button className="flex items-center gap-2 bg-gray-700 px-3 py-1 rounded hover:bg-gray-600">
          <FaShareAlt />
          Share
        </button>

        <button className="flex items-center gap-2 bg-green-500 px-4 py-1 rounded hover:bg-green-600">
          <FaPlay />
          Run
        </button>

      </div>

    </div>
  );
};

export default Navbar;