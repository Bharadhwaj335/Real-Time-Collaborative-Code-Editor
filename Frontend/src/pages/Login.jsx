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
    <div className="min-h-screen bg-[#111318] text-slate-100">
      <Navbar publicMode />

      <div className="mx-auto flex w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#1a1d25] shadow-2xl lg:mt-8 lg:flex-row">
        <section className="flex flex-1 flex-col justify-between bg-[radial-gradient(circle_at_top,_#1d4ed8_0%,_#1e1e1e_60%)] p-8 lg:p-10">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-blue-200/90">
              Real-Time Collaborative Editor
            </p>
            <h1 className="mt-4 text-3xl font-bold leading-tight text-white lg:text-4xl">
              Build together, understand faster.
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-200/90">
              Collaborate on code, chat with teammates, and run programs in one
              classroom-friendly workspace.
            </p>
          </div>
        </section>

        <section className="w-full bg-[#1e1e1e] p-8 lg:w-[420px] lg:p-10">
          <h2 className="text-2xl font-semibold text-white">Login</h2>
          <p className="mt-2 text-sm text-slate-400">
            Sign in to access your coding rooms.
          </p>

          <form onSubmit={handleLogin} className="mt-8 space-y-5">
            <label className="block text-sm">
              <span className="mb-2 block text-slate-300">Email</span>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-white/15 bg-[#252526] px-3 py-2.5 text-white outline-none transition focus:border-blue-400"
              />
            </label>

            <label className="block text-sm">
              <span className="mb-2 block text-slate-300">Password</span>
              <input
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter password"
                className="w-full rounded-lg border border-white/15 bg-[#252526] px-3 py-2.5 text-white outline-none transition focus:border-blue-400"
              />
            </label>

            <Button type="submit" className="w-full" loading={loading}>
              Login
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Need an account?{" "}
            <Link to="/register" className="font-medium text-blue-400 hover:text-blue-300">
              Register
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
};

export default Login;