import { useNavigate } from "react-router-dom";
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
    <div className="min-h-screen bg-[#111318] text-slate-100">
      <Navbar publicMode />

      <div className="mx-auto flex w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-[#1e1e1e] shadow-2xl lg:mt-8">
        <section className="hidden w-1/2 border-r border-white/10 bg-[linear-gradient(130deg,_#252526,_#0f172a)] p-8 lg:block">
          <h2 className="text-3xl font-bold text-white">Create your account</h2>
          <p className="mt-4 text-sm leading-relaxed text-slate-300">
            Join your classmates in live coding rooms with shared editor,
            built-in chat, and instant output.
          </p>

          <ul className="mt-8 space-y-3 text-sm text-slate-300">
            <li>Live code sync and cursor updates</li>
            <li>Room-based collaboration</li>
            <li>Language switching and code execution</li>
          </ul>
        </section>

        <section className="w-full p-8 lg:w-1/2">
          <h2 className="text-2xl font-semibold text-white">Register</h2>
          <p className="mt-2 text-sm text-slate-400">
            Start by creating your student profile.
          </p>

          <form onSubmit={handleRegister} className="mt-8 space-y-5">
            <label className="block text-sm">
              <span className="mb-2 block text-slate-300">Name</span>
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
                className="w-full rounded-lg border border-white/15 bg-[#252526] px-3 py-2.5 text-white outline-none transition focus:border-blue-400"
              />
            </label>

            <label className="block text-sm">
              <span className="mb-2 block text-slate-300">Email</span>
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                className="w-full rounded-lg border border-white/15 bg-[#252526] px-3 py-2.5 text-white outline-none transition focus:border-blue-400"
              />
            </label>

            <label className="block text-sm">
              <span className="mb-2 block text-slate-300">Password</span>
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                className="w-full rounded-lg border border-white/15 bg-[#252526] px-3 py-2.5 text-white outline-none transition focus:border-blue-400"
              />
            </label>

            <Button type="submit" className="w-full" loading={loading}>
              Register
            </Button>
          </form>

          <button
            type="button"
            onClick={() => navigate("/login")}
            className="mt-4 w-full rounded-lg border border-white/15 px-4 py-2.5 text-sm text-slate-200 transition hover:bg-white/5"
          >
            Back to Login
          </button>
        </section>
      </div>
    </div>
  );
};

export default Register;