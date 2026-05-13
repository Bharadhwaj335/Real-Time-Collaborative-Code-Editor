import { useNavigate } from "react-router-dom";
import Navbar from "../components/Common/Navbar";
import RoomDashboard from "../components/Room/RoomDashboard";
import { disconnectSocket } from "../services/socket";
import { clearAuthStorage, getStoredUser } from "../utils/helpers";

const MyRooms = () => {
  const navigate = useNavigate();
  const user = getStoredUser();

  const handleLogout = () => {
    clearAuthStorage();
    disconnectSocket();
    navigate("/login", { replace: true });
  };

  return (
    <div className="cc-page-shell">
      <Navbar userName={user?.name || "Student"} onLogout={handleLogout} />

      <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:py-8">
        <RoomDashboard />
      </div>
    </div>
  );
};

export default MyRooms;
