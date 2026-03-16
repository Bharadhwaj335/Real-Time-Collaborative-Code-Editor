import { useEffect, useState } from "react";
import socket from "../../services/socket";

const UserList = ({ roomId, username }) => {

  const [users, setUsers] = useState([]);

  useEffect(() => {

    // Join room
    socket.emit("join-room", { roomId, username });

    // Listen for updated user list
    socket.on("users-update", (usersList) => {
      setUsers(usersList);
    });

    return () => {
      socket.off("users-update");
    };

  }, [roomId, username]);

  return (

    <div>

      <h3 className="font-bold mb-3">Users</h3>

      {users.length === 0 ? (
        <p className="text-gray-400 text-sm">
          No users in room
        </p>
      ) : (
        users.map((user, index) => (
          <div key={index} className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            {user}
          </div>
        ))
      )}

    </div>

  );
};

export default UserList;