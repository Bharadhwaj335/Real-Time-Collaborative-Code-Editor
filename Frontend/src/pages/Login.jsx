import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import AuthHeroPanel from "../components/Auth/AuthHeroPanel";
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
    <div className="min-h-screen bg-gradient-to-br from-[#0f0f10] via-[#141416] to-[#0a0a0b] text-slate-100">
      <Navbar publicMode />

      <div className="mx-auto flex min-h-[calc(100vh-2.75rem)] w-full max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-8 lg:flex-row lg:items-stretch lg:gap-6 lg:py-10">
        <div className="relative flex-1 overflow-hidden rounded-2xl border border-white/[0.06] shadow-[0_24px_80px_rgba(0,0,0,0.45)] lg:min-h-[520px]">
          <AuthHeroPanel />
        </div>

        <div className="mt-6 flex w-full shrink-0 flex-col justify-center lg:mt-0 lg:w-[400px] xl:w-[420px]">
          <div className="rounded-2xl border border-white/[0.08] bg-[#1a1a1c]/85 p-6 shadow-[0_16px_48px_rgba(0,0,0,0.4)] backdrop-blur-xl sm:p-7">
            <h2 className="text-xl font-semibold tracking-tight text-white">Sign in</h2>
            <p className="mt-1.5 text-[13px] text-slate-500">Access your collaborative workspaces.</p>

            <form onSubmit={handleLogin} className="mt-6 space-y-4">
              <label className="block text-sm">
                <span className="mb-1.5 block text-xs font-medium text-slate-400">Email</span>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="cc-input w-full rounded-lg px-3 py-2.5 text-[13px] text-white transition"
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
                  className="cc-input w-full rounded-lg px-3 py-2.5 text-[13px] text-white transition"
                />
              </label>

              <Button type="submit" className="mt-1 w-full py-2.5" loading={loading}>
                Continue
              </Button>
            </form>

            <p className="mt-6 text-center text-[13px] text-slate-500">
              Need an account?{" "}
              <Link to="/register" className="cc-link">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
