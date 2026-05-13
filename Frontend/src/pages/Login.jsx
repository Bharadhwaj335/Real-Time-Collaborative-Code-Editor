import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Button from "../components/Common/Button";
import Navbar from "../components/Common/Navbar";
import { loginUser } from "../services/api";
import { connectSocket } from "../services/socket";
import { setStoredToken, setStoredUser } from "../utils/helpers";

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogin = async (event) => {
    event.preventDefault();

    if (!formData.email.trim() || !formData.password.trim()) {
      toast.error("Please enter both email and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await loginUser(formData);
      const token = response?.token || response?.jwt || response?.accessToken;

      if (!token) {
        throw new Error("Token missing from response");
      }

      const fallbackName = formData.email.split("@")[0] || "Student";
      const user = response?.user || {
        id: response?.userId || `user-${Date.now()}`,
        name: response?.name || fallbackName,
        email: formData.email
      };

      setStoredToken(token);
      setStoredUser(user);
      connectSocket(token);

      toast.success("Login successful. Welcome back!");
      navigate("/home", { replace: true });
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Login failed. Please check your credentials.";

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e1e1e] via-[#181818] to-[#111111] text-slate-100">
      <Navbar publicMode />

      <div className="flex min-h-[calc(100vh-2.75rem)] items-center justify-center px-4 py-8 sm:py-10">
        <div className="mx-auto flex w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-[#2a2a2a] bg-[#252526] shadow-[0_16px_48px_rgba(0,0,0,0.45)] lg:flex-row">
          <section className="relative flex flex-1 flex-col justify-between overflow-hidden bg-[#1e1e1e] p-7 sm:p-9 lg:min-h-[380px] lg:max-w-[52%] lg:p-10">
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_40%_-10%,rgba(10,122,184,0.22),transparent_52%),radial-gradient(circle_at_100%_90%,rgba(61,179,156,0.08),transparent_42%)]"
              aria-hidden
            />
            <div className="relative">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#3db39c]">
                Real-Time Collaborative Editor
              </p>
              <h1 className="mt-4 text-2xl font-bold leading-snug text-white sm:text-3xl lg:text-[1.85rem]">
                Build together, understand faster.
              </h1>
              <p className="mt-4 max-w-sm text-[13px] leading-relaxed text-slate-400">
                Collaborate on code, chat with teammates, and run programs in one classroom-friendly
                workspace.
              </p>
            </div>
            <p className="relative mt-8 hidden text-[11px] text-slate-500 lg:block">
              Secure sign-in · Rooms sync in real time
            </p>
          </section>

          <section className="w-full border-[#2a2a2a] bg-[#1e1e1e] p-7 sm:p-9 lg:w-[min(380px,48%)] lg:border-l lg:py-10">
            <h2 className="text-xl font-semibold tracking-tight text-white">Login</h2>
            <p className="mt-1.5 text-[13px] text-slate-500">Sign in to access your coding rooms.</p>

            <form onSubmit={handleLogin} className="mt-7 space-y-4">
              <label className="block text-sm">
                <span className="mb-1.5 block text-xs font-medium text-slate-400">Email</span>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="cc-input w-full rounded-lg px-3 py-2 text-[13px] text-white transition"
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1.5 block text-xs font-medium text-slate-400">Password</span>
                <input
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="cc-input w-full rounded-lg px-3 py-2 text-[13px] text-white transition"
                />
              </label>

              <Button type="submit" className="mt-1 w-full py-2.5" loading={loading}>
                Login
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-400">
              Need an account?{" "}
              <Link to="/register" className="font-medium text-[#2aa1ff] hover:text-[#cfe9ff]">
                Register
              </Link>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Login;