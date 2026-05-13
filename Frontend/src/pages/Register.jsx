import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import toast from "react-hot-toast";
import AuthHeroPanel from "../components/Auth/AuthHeroPanel";
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
    <div className="min-h-screen bg-gradient-to-br from-[#0f0f10] via-[#141416] to-[#0a0a0b] text-slate-100">
      <Navbar publicMode />

      <div className="mx-auto flex min-h-[calc(100vh-2.75rem)] w-full max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-8 lg:flex-row lg:items-stretch lg:gap-6 lg:py-10">
        <div className="relative order-1 flex-1 overflow-hidden rounded-2xl border border-white/[0.06] shadow-[0_24px_80px_rgba(0,0,0,0.45)] lg:order-none lg:min-h-[520px]">
          <AuthHeroPanel
            subtitle="Create your profile and join live rooms with shared editing, chat, and instant program output."
          />
        </div>

        <div className="order-2 mt-6 flex w-full shrink-0 flex-col justify-center lg:mt-0 lg:w-[400px] xl:w-[420px]">
          <div className="rounded-2xl border border-white/[0.08] bg-[#1a1a1c]/85 p-6 shadow-[0_16px_48px_rgba(0,0,0,0.4)] backdrop-blur-xl sm:p-7">
            <h2 className="text-xl font-semibold tracking-tight text-white">Create account</h2>
            <p className="mt-1.5 text-[13px] text-slate-500">Start collaborating in minutes.</p>

            <form onSubmit={handleRegister} className="mt-6 space-y-4">
              <label className="block text-sm">
                <span className="mb-1.5 block text-xs font-medium text-slate-400">Name</span>
                <input
                  type="text"
                  name="name"
                  placeholder="Full name"
                  value={formData.name}
                  onChange={handleChange}
                  autoComplete="name"
                  className="cc-input w-full rounded-lg px-3 py-2.5 text-[13px] text-white transition"
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
                  className="cc-input w-full rounded-lg px-3 py-2.5 text-[13px] text-white transition"
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1.5 block text-xs font-medium text-slate-400">Password</span>
                <input
                  type="password"
                  name="password"
                  placeholder="At least 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  className="cc-input w-full rounded-lg px-3 py-2.5 text-[13px] text-white transition"
                />
              </label>

              <Button type="submit" className="mt-1 w-full py-2.5" loading={loading}>
                Register
              </Button>
            </form>

            <p className="mt-4 text-center text-[13px] text-slate-500">
              Already have an account? <Link to="/login" className="cc-link">Sign in</Link>
            </p>

            <button
              type="button"
              onClick={() => navigate("/login")}
              className="mt-3 w-full rounded-xl border border-[#3c3c3c] py-2 text-[13px] font-medium text-slate-300 transition hover:border-[#0a7ab8]/45 hover:bg-white/[0.04]"
            >
              Back to login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
