import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const Login = () => {

  const navigate = useNavigate();

  const handleLogin = () => {

    toast.success("Login successful");

    setTimeout(() => {
      navigate("/home");
    }, 1000);

  };

  return (

    <div className="h-screen flex items-center justify-center bg-gray-900">

      <div className="bg-gray-800 text-white p-8 rounded-xl w-96">

        <h2 className="text-2xl mb-6 text-center">Login</h2>

        <input
          placeholder="Email"
          className="w-full p-2 mb-3 text-black"
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-2 mb-4 text-black"
        />

        <button
          onClick={handleLogin}
          className="w-full bg-blue-500 py-2 rounded"
        >
          Login
        </button>

        {/* REGISTER LINK */}

        <p className="text-center mt-4 text-sm">

          Don't have an account?

          <Link
            to="/register"
            className="text-blue-400 ml-1"
          >
            Register
          </Link>

        </p>

      </div>

    </div>

  );
};

export default Login;