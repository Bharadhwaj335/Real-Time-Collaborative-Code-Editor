import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import Modal from "../components/Common/Modal";
import Navbar from "../components/Common/Navbar";
import CodeEditor from "../components/Editor/CodeEditor";
import EditorToolbar from "../components/Editor/EditorToolbar";
import CursorOverlay from "../components/Room/CursorOverlay";
import InviteLink from "../components/Room/InviteLink";
import RoomHeader from "../components/Room/RoomHeader";
import UserList from "../components/Room/UserList";
import ChatBox from "../components/Chat/ChatBox";
import useRoom from "../hooks/useRoom";
import useEditor from "../hooks/useEditor";
import { executeCode } from "../services/api";
import { disconnectSocket } from "../services/socket";
import {
  buildRoomInviteLink,
  clearAuthStorage,
  createGuestIdentity,
  getStoredUser,
  setStoredUser
} from "../utils/helpers";

const extractExecutionResult = (payload) => {
  const stdout = payload?.stdout || payload?.output || payload?.run?.stdout || "";
  const stderr = payload?.stderr || payload?.run?.stderr || "";
  const error =
    payload?.error ||
    payload?.compile_output ||
    payload?.compileError ||
    payload?.message ||
    "";

  return {
    stdout,
    stderr,
    error
  };
};

const EditorRoom = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const user = useMemo(() => {
    const storedUser = getStoredUser();

    if (storedUser) {
      return {
        id: storedUser.id || storedUser._id || `user-${Date.now()}`,
        name: storedUser.name || storedUser.username || "Student"
      };
    }

    const guest = createGuestIdentity();
    setStoredUser(guest);
    return guest;
  }, []);

  const {
    code,
    language,
    setLanguage,
    remoteCursors,
    handleEditorChange,
    handleCursorMove
  } = useEditor({ roomId, user });

  const { users, isConnected } = useRoom({ roomId, user });

  const [output, setOutput] = useState({
    stdout: "",
    stderr: "",
    error: ""
  });
  const [isRunning, setIsRunning] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const inviteLink = useMemo(() => buildRoomInviteLink(roomId), [roomId]);
  const roomUsers = users.length > 0 ? users : [{ id: user.id, name: user.name, status: "online" }];

  useEffect(() => {
    const languageFromRoute = location.state?.language;
    if (languageFromRoute) {
      setLanguage(languageFromRoute);
    }
  }, [location.state?.language, setLanguage]);

  const handleRunCode = async () => {
    if (!code.trim()) {
      toast.error("Type some code before running.");
      return;
    }

    setIsRunning(true);
    setOutput({ stdout: "", stderr: "", error: "" });

    try {
      const response = await executeCode({
        roomId,
        code,
        language
      });

      setOutput(extractExecutionResult(response));
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to run code.";

      setOutput((prev) => ({
        ...prev,
        error: message
      }));
      toast.error(message);
    } finally {
      setIsRunning(false);
    }
  };

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      toast.success("Invite link copied.");
    } catch {
      toast.error("Could not copy invite link.");
    }
  };

  const handleLogout = () => {
    clearAuthStorage();
    disconnectSocket();
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex h-screen min-h-screen flex-col bg-[#111318] text-white">
      <Navbar
        roomId={roomId}
        connectedUsers={roomUsers.length}
        isConnected={isConnected}
        userName={user.name}
        onShare={() => setIsInviteOpen(true)}
        onLogout={handleLogout}
      />

      <div className="grid min-h-0 flex-1 gap-3 p-3 lg:grid-cols-[260px_minmax(0,1fr)_320px] lg:p-4">
        <aside className="flex min-h-0 flex-col gap-3">
          <RoomHeader roomId={roomId} language={language} isConnected={isConnected} />

          <InviteLink roomId={roomId} inviteLink={inviteLink} onCopy={copyInviteLink} />

          <div className="min-h-0 flex-1 overflow-auto">
            <UserList users={roomUsers} currentUserId={user.id} />
          </div>
        </aside>

        <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-white/10 bg-[#1e1e1e]">
          <EditorToolbar
            roomId={roomId}
            language={language}
            onLanguageChange={setLanguage}
            onRunCode={handleRunCode}
            onCopyLink={copyInviteLink}
            isRunning={isRunning}
          />

          <div className="relative min-h-0 flex-1">
            <CursorOverlay remoteCursors={remoteCursors} />
            <CodeEditor
              language={language}
              code={code}
              onCodeChange={handleEditorChange}
              onCursorMove={handleCursorMove}
            />
          </div>
        </section>

        <aside className="min-h-0">
          <ChatBox roomId={roomId} user={user} />
        </aside>
      </div>

      <section className="border-t border-white/10 bg-[#1a1d25] p-4">
        <h3 className="text-sm font-semibold text-slate-200">Output Console</h3>

        <div className="mt-3 grid gap-3 text-sm lg:grid-cols-3">
          <div className="rounded-lg border border-white/10 bg-[#252526] p-3">
            <p className="mb-2 font-semibold text-emerald-300">stdout</p>
            <pre className="max-h-36 overflow-auto whitespace-pre-wrap break-words text-slate-200">
              {output.stdout || "No output yet."}
            </pre>
          </div>

          <div className="rounded-lg border border-white/10 bg-[#252526] p-3">
            <p className="mb-2 font-semibold text-amber-300">stderr</p>
            <pre className="max-h-36 overflow-auto whitespace-pre-wrap break-words text-slate-200">
              {output.stderr || "No errors."}
            </pre>
          </div>

          <div className="rounded-lg border border-white/10 bg-[#252526] p-3">
            <p className="mb-2 font-semibold text-rose-300">Compilation / Runtime</p>
            <pre className="max-h-36 overflow-auto whitespace-pre-wrap break-words text-slate-200">
              {output.error || "No runtime issues."}
            </pre>
          </div>
        </div>
      </section>

      <Modal
        isOpen={isInviteOpen}
        title="Invite to room"
        onClose={() => setIsInviteOpen(false)}
      >
        <InviteLink roomId={roomId} inviteLink={inviteLink} onCopy={copyInviteLink} />
      </Modal>
    </div>
  );
};

export default EditorRoom;