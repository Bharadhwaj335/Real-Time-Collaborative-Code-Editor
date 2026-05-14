import { Link, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { FaCloudUploadAlt } from "react-icons/fa";
import AuthHeroPanel from "../components/Auth/AuthHeroPanel";
import Button from "../components/Common/Button";
import Navbar from "../components/Common/Navbar";
import { registerUser } from "../services/api";
import { getRegisterErrorMessage } from "../utils/errorUtils";
import { getInitials } from "../utils/helpers";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ACCEPT_TYPES = ["image/png", "image/jpeg", "image/webp"];
const ACCEPT_EXT = /\.(png|jpe?g|webp)$/i;
const MAX_BYTES = 2 * 1024 * 1024;

const scorePassword = (pwd) => {
  let score = 0;
  if (!pwd) return 0;
  if (pwd.length >= 6) score += 1;
  if (pwd.length >= 10) score += 1;
  if (/[A-Z]/.test(pwd)) score += 1;
  if (/[0-9]/.test(pwd)) score += 1;
  if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
  return Math.min(score, 4);
};

const strengthLabel = (score) => {
  if (score <= 1) return { text: "Weak", className: "text-rose-300" };
  if (score === 2) return { text: "Fair", className: "text-amber-200" };
  if (score === 3) return { text: "Good", className: "text-sky-300" };
  return { text: "Strong", className: "text-emerald-300" };
};

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const previewUrlRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const strength = scorePassword(formData.password);
  const strengthMeta = strengthLabel(strength);

  const revokePreview = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => revokePreview();
  }, [revokePreview]);

  const setAvatarFromFile = (file) => {
    if (!file) return;

    if (!ACCEPT_TYPES.includes(file.type) && !ACCEPT_EXT.test(file.name || "")) {
      toast.error("Please choose a PNG, JPG, JPEG, or WebP image.");
      return;
    }

    if (file.size > MAX_BYTES) {
      toast.error("Image must be 2 MB or smaller.");
      return;
    }

    revokePreview();
    const url = URL.createObjectURL(file);
    previewUrlRef.current = url;
    setPreviewUrl(url);
    setAvatarFile(file);
  };

  const clearAvatar = () => {
    revokePreview();
    setPreviewUrl(null);
    setAvatarFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleRegister = async (event) => {
    event.preventDefault();

    const name = formData.name.trim();
    const email = formData.email.trim().toLowerCase();
    const { password, confirmPassword } = formData;

    const nextErrors = {};

    if (!name || name.length < 2) {
      nextErrors.name = "Name must be at least 2 characters.";
    }

    if (!email) {
      nextErrors.email = "Email is required.";
    } else if (!EMAIL_REGEX.test(email)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!password || password.length < 6) {
      nextErrors.password = "Password must be at least 6 characters.";
    }

    if (password !== confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors({});
    setLoading(true);

    try {
      let response;

      if (avatarFile) {
        const fd = new FormData();
        fd.append("name", name);
        fd.append("email", email);
        fd.append("password", password);
        fd.append("avatar", avatarFile);
        response = await registerUser(fd);
      } else {
        response = await registerUser({
          name,
          email,
          password
        });
      }

      if (response?.success === false) {
        toast.error(
          typeof response?.message === "string" && response.message.trim()
            ? response.message.trim()
            : "Registration failed."
        );
        return;
      }

      toast.success("Account created. You can sign in now.");
      navigate("/login", { replace: true });
    } catch (error) {
      toast.error(getRegisterErrorMessage(error));
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
              <div>
                <p className="mb-2 text-xs font-medium text-slate-400">Profile picture (optional)</p>
                <div
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) setAvatarFromFile(file);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-4 py-5 transition ${
                    dragOver
                      ? "border-[#0a7ab8]/60 bg-[#0a7ab8]/10"
                      : "border-[#3c3c3c] bg-[#141416]/60 hover:border-[#52525b]"
                  }`}
                >
                  <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#252526] ring-2 ring-white/10">
                      {previewUrl ? (
                        <img src={previewUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-lg font-semibold text-slate-500">
                          {getInitials(formData.name || "?")}
                        </span>
                      )}
                    </div>
                    <div className="text-center sm:text-left">
                      <p className="flex items-center justify-center gap-2 text-[13px] font-medium text-slate-200 sm:justify-start">
                        <FaCloudUploadAlt className="text-[#5cb3e8]" aria-hidden />
                        Drop an image here or click to browse
                      </p>
                      <p className="mt-1 text-[11px] text-slate-500">PNG, JPG, JPEG, or WebP · max 2 MB</p>
                    </div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setAvatarFromFile(file);
                    }}
                  />
                  {avatarFile ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearAvatar();
                      }}
                      className="text-[11px] font-semibold text-rose-300/90 underline-offset-2 hover:underline"
                    >
                      Remove picture
                    </button>
                  ) : null}
                </div>
              </div>

              <label className="block text-sm">
                <span className="mb-1.5 block text-xs font-medium text-slate-400">Name</span>
                <input
                  type="text"
                  name="name"
                  placeholder="Full name"
                  value={formData.name}
                  onChange={handleChange}
                  autoComplete="name"
                  disabled={loading}
                  className="cc-input w-full rounded-lg px-3 py-2.5 text-[13px] text-white transition disabled:opacity-50"
                />
                {fieldErrors.name ? (
                  <p className="mt-1.5 text-[11px] text-rose-300/90">{fieldErrors.name}</p>
                ) : null}
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
                  disabled={loading}
                  className="cc-input w-full rounded-lg px-3 py-2.5 text-[13px] text-white transition disabled:opacity-50"
                />
                {fieldErrors.email ? (
                  <p className="mt-1.5 text-[11px] text-rose-300/90">{fieldErrors.email}</p>
                ) : null}
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
                  disabled={loading}
                  className="cc-input w-full rounded-lg px-3 py-2.5 text-[13px] text-white transition disabled:opacity-50"
                />
                {formData.password ? (
                  <div className="mt-2 space-y-1">
                    <div className="flex h-1 overflow-hidden rounded-full bg-[#2a2a2a]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#0a7ab8] to-[#4ec9b0] transition-all duration-300"
                        style={{ width: `${(strength / 4) * 100}%` }}
                      />
                    </div>
                    <p className={`text-[11px] font-medium ${strengthMeta.className}`}>{strengthMeta.text}</p>
                  </div>
                ) : null}
                {fieldErrors.password ? (
                  <p className="mt-1.5 text-[11px] text-rose-300/90">{fieldErrors.password}</p>
                ) : null}
              </label>

              <label className="block text-sm">
                <span className="mb-1.5 block text-xs font-medium text-slate-400">Confirm password</span>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Re-enter password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                  disabled={loading}
                  className="cc-input w-full rounded-lg px-3 py-2.5 text-[13px] text-white transition disabled:opacity-50"
                />
                {fieldErrors.confirmPassword ? (
                  <p className="mt-1.5 text-[11px] text-rose-300/90">{fieldErrors.confirmPassword}</p>
                ) : null}
              </label>

              <Button type="submit" className="mt-1 w-full py-2.5" loading={loading} disabled={loading}>
                Register
              </Button>
            </form>

            <p className="mt-4 text-center text-[13px] text-slate-500">
              Already have an account?{" "}
              <Link to="/login" className="cc-link">
                Sign in
              </Link>
            </p>

            <button
              type="button"
              onClick={() => navigate("/login")}
              disabled={loading}
              className="mt-3 w-full rounded-xl border border-[#3c3c3c] py-2 text-[13px] font-medium text-slate-300 transition hover:border-[#0a7ab8]/45 hover:bg-white/[0.04] disabled:opacity-50"
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
