import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import toast from "react-hot-toast";
import Button from "../components/Common/Button";
import Navbar from "../components/Common/Navbar";
import { registerUser } from "../services/api";

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRegister = async (event) => {
    event.preventDefault();

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      password: formData.password
    };

    if (!payload.name || !payload.email || !payload.password) {
      toast.error("Please fill all required fields.");
      return;
    }

    setLoading(true);

    try {
      const response = await registerUser(payload);

      if (response?.success === false) {
        throw new Error(response?.message || "Registration failed.");
      }

      toast.success("Registration successful. Please login.");
      navigate("/login", { replace: true });
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Registration failed. Try a different email.";
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
          <section className="hidden w-full max-w-[52%] border-r border-[#2a2a2a] bg-[linear-gradient(160deg,#252526_0%,#1c1c1c_55%,#1e1e1e_100%)] p-8 lg:block lg:p-9">
            <h2 className="text-2xl font-bold tracking-tight text-white">Create your account</h2>
            <p className="mt-3 text-[13px] leading-relaxed text-slate-400">
              Join live coding rooms with a shared editor, built-in chat, and instant output.
            </p>

            <ul className="mt-7 space-y-2.5 text-[13px] text-slate-400">
              <li className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#3db39c]" />
                Live code sync and cursor updates
              </li>
              <li className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0a7ab8]" />
                Room-based collaboration
              </li>
              <li className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#569cd6]" />
                Language switching and code execution
              </li>
            </ul>
          </section>

          <section className="w-full bg-[#1e1e1e] p-7 sm:p-9 lg:w-[min(380px,48%)] lg:py-10">
            <h2 className="text-xl font-semibold tracking-tight text-white">Register</h2>
            <p className="mt-1.5 text-[13px] text-slate-500">Create your student profile to get started.</p>

            <form onSubmit={handleRegister} className="mt-7 space-y-4">
              <label className="block text-sm">
                <span className="mb-1.5 block text-xs font-medium text-slate-400">Name</span>
                <input
                  type="text"
                  name="name"
                  placeholder="Full name"
                  value={formData.name}
                  onChange={handleChange}
                  autoComplete="name"
                  className="cc-input w-full rounded-lg px-3 py-2 text-[13px] text-white transition"
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1.5 block text-xs font-medium text-slate-400">Email</span>
                <input
                  type="email"
                  name="email"
                  placeholder="you@school.edu"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                  className="cc-input w-full rounded-lg px-3 py-2 text-[13px] text-white transition"
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1.5 block text-xs font-medium text-slate-400">Password</span>
                <input
                  type="password"
                  name="password"
                  placeholder="At least 8 characters"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  className="cc-input w-full rounded-lg px-3 py-2 text-[13px] text-white transition"
                />
              </label>

              <Button type="submit" className="mt-1 w-full py-2.5" loading={loading}>
                Register
              </Button>
            </form>

            <p className="mt-4 text-center text-[13px] text-slate-500 lg:hidden">
              Already have an account? <Link to="/login" className="cc-link">Login</Link>
            </p>

            <button
              type="button"
              onClick={() => navigate("/login")}
              className="mt-3 w-full rounded-xl border border-[#3c3c3c] py-2 text-[13px] font-medium text-slate-300 transition hover:border-[#0a7ab8]/45 hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a7ab8]/40"
            >
              Back to Login
            </button>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Register;