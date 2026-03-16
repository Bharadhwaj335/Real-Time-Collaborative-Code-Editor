import { useNavigate } from "react-router-dom";
import { useState } from "react";
import toast from "react-hot-toast";

const Register = () => {

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    contact: "",
    password: ""
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRegister = () => {

    if (!formData.name || !formData.email || !formData.contact || !formData.password) {
      toast.error("Please fill all fields");
      return;
    }

    // Here you will later send data to backend
    console.log(formData);

    toast.success("Registration successful");

    setTimeout(() => {
      navigate("/");
    }, 1200);

  };

  return (

    <div className="h-screen flex items-center justify-center bg-gray-900">

      <div className="bg-gray-800 text-white p-8 rounded-xl shadow-lg w-96">

        <h2 className="text-2xl font-bold mb-6 text-center">
          Register
        </h2>

        {/* NAME */}
        <input
          type="text"
          name="name"
          placeholder="Full Name"
          value={formData.name}
          onChange={handleChange}
          className="w-full p-2 mb-3 text-black rounded"
        />

        {/* EMAIL */}
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          className="w-full p-2 mb-3 text-black rounded"
        />

        {/* CONTACT */}
        <input
          type="tel"
          name="contact"
          placeholder="Contact Number"
          value={formData.contact}
          onChange={handleChange}
          className="w-full p-2 mb-3 text-black rounded"
        />

        {/* PASSWORD */}
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          className="w-full p-2 mb-4 text-black rounded"
        />

        <button
          onClick={handleRegister}
          className="w-full bg-green-500 py-2 rounded hover:bg-green-600 transition"
        >
          Register
        </button>

      </div>

    </div>

  );

};

export default Register;