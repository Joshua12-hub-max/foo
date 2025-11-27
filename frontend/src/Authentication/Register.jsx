// Mga kinakailangang pag-import mula sa React, React Router, at iba pang mga aklatan.
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Users, IdCardLanyard, FileLock, Building } from "lucide-react";
import AuthLayout from "../components/Custom/Auth/AuthLayout";
import api from "../api/axios";

// Ito ang pangunahing bahagi para sa pahina ng pagpaparehistro.
export default function Register() {
  // Pinamamahalaan ng 'useState' ang estado para sa form, mga error, tagumpay, at katayuan sa pag-load.
  const [form, setForm] = useState({
    name: "",
    role: "",
    department: "",
    employeeId: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate(); // Ginagamit para i-redirect ang user.

  // Pinangangasiwaan ang mga pagbabago sa mga input field ng form.
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
    setSuccess("");
  };

  // Pinangangasiwaan ang pagsusumite ng form sa pagpaparehistro.
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      // Nagpapadala ng kahilingan sa POST sa '/register' endpoint ng backend.
      const res = await api.post("/auth/register", form);

      // Iniimbak ang impormasyon ng huling nagparehistrong user para sa kaginhawahan sa pahina ng pag-login.
      localStorage.setItem(
        "lastRegisteredUser",
        JSON.stringify({
          employeeId: form.employeeId,
          role: form.role,
        }),
      );

      // Nagtatakda ng mensahe ng tagumpay at nagre-redirect sa pahina ng pag-login pagkatapos ng isang segundo.
      setSuccess(res.data.message);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      console.error("Registration Error:", err);
      if (err.response) {
        // Server responded with an error
        if (err.response.data?.errors) {
           const errorMessages = err.response.data.errors.map(e => e.msg).join(", ");
           setError(errorMessages);
        } else {
           setError(err.response.data?.message || "Nabigo ang pagpaparehistro.");
        }
      } else if (err.request) {
        // Request was made but no response received
        setError("Hindi makakonekta sa server. Pakisuri kung tumatakbo ang backend.");
      } else {
        // Something else happened
        setError("May naganap na error: " + err.message);
      }
    } finally {
      // Tinitiyak na ang estado ng pag-load ay naka-set sa false pagkatapos ng pagtatangka.
      setLoading(false);
    }
  };

  // Nagre-render ng UI ng registration form.
  return (
    <AuthLayout
      title="Create an Account"
      subtitle="Pakipunan ang mga detalye para magrehistro."
    >
      {/* Nagpapakita ng mensahe ng error kung mayroon. */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Nagpapakita ng mensahe ng tagumpay kung mayroon. */}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          {success}
        </div>
      )}

      {/* Ang mismong registration form. */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm text-gray-700 mb-1 block">
            Buong Pangalan
          </label>
          <div className="relative">
            <User
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={17}
            />
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full pl-10 pr-3 py-2 border-[2px] border-gray-300 rounded-[15px] shadow-md bg-white focus:ring focus:ring-gray-100"
              placeholder="Ilagay ang iyong buong pangalan"
              required
            />
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-700 mb-1 block">Papel</label>
          <div className="relative">
            <Users
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={17}
            />
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full pl-10 pr-3 py-2 border-[2px] border-gray-300 rounded-[15px] shadow-md bg-white focus:ring focus:ring-gray-100 appearance-none"
              required
            >
              <option value="">Pumili ng papel</option>
              <option value="employee">Empleyado</option>
              <option value="admin">Human Resource (Admin)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-700 mb-1 block">Departamento</label>
          <div className="relative">
            <Building
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={17}
            />
            <input
              type="text"
              name="department"
              value={form.department}
              onChange={handleChange}
              className="w-full pl-10 pr-3 py-2 border-[2px] border-gray-300 rounded-[15px] shadow-md bg-white focus:ring focus:ring-gray-100"
              placeholder="Ilagay ang iyong departamento"
              required
            />
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-700 mb-1 block">
            Employee ID
          </label>
          <div className="relative">
            <IdCardLanyard
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={17}
            />
            <input
              type="text"
              name="employeeId"
              value={form.employeeId}
              onChange={handleChange}
              className="w-full pl-10 pr-3 py-2 border-[2px] border-gray-300 rounded-[15px] shadow-md bg-white focus:ring focus:ring-gray-100"
              placeholder="Ilagay ang iyong Employee ID"
              required
            />
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-700 mb-1 block">Password</label>
          <div className="relative">
            <FileLock
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={17}
            />
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="w-full pl-10 pr-3 py-2 border-[2px] border-gray-300 rounded-[15px] shadow-md bg-white focus:ring focus:ring-gray-100"
              placeholder="Maglagay ng isang malakas na password"
              required
            />
          </div>
        </div>

        {/* Pindutan para sa pagsusumite ng form */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-slate-950 to-green-700 text-white py-2 rounded-[10px] font-semibold hover:from-slate-700 hover:to-green-500 transition disabled:opacity-50"
        >
          {loading ? "Gumagawa ng Account..." : "Magrehistro"}
        </button>
      </form>

      {/* Link para sa mga user na may account na. */}
      <p className="text-center mt-5 text-gray-700 text-sm">
        May account ka na?{" "}
        <Link
          to="/login"
          className="font-semibold text-gray-900 hover:underline"
        >
          Mag-login dito
        </Link>
      </p>
    </AuthLayout>
  );
}
