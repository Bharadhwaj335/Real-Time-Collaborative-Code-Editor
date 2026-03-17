const Auth = () => {
  return (
    <div className="h-screen flex items-center justify-center bg-black">

      <div className="bg-gray-900 p-8 rounded-xl w-96 text-white shadow-lg">

        <h2 className="text-2xl font-bold mb-6 text-center">
          Login
        </h2>

        <input
          type="email"
          placeholder="Email"
          className="w-full mb-3 p-2 bg-gray-800 rounded"
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full mb-4 p-2 bg-gray-800 rounded"
        />

        <button className="w-full bg-blue-500 py-2 rounded">
          Sign In
        </button>

        <button className="w-full mt-3 bg-red-500 py-2 rounded">
          Continue with Google
        </button>

        <p className="mt-4 text-sm text-center">
          Don't have an account? Register
        </p>

      </div>

    </div>
  );
};

export default Auth;