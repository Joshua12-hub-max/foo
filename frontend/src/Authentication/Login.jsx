// Ito ang mga kinakailangang pag-import mula sa React at iba pang mga aklatan.
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { IdCardLanyard, FileLock } from "lucide-react";
import AuthLayout from "../components/Custom/Auth/AuthLayout";
import api from "../api/axios";

// Ito ang pangunahing bahagi para sa pahina ng pag-login.
export default function Login() {
  // Pinamamahalaan ng 'useState' ang estado ng form, mga error, at katayuan sa pag-load.
  const [form, setForm] = useState({ employeeId: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("");
  const navigate = useNavigate(); // Ginagamit para sa pag-redirect ng mga user.

  // Ang 'useEffect' ay tumatakbo kapag nag-mount ang component. Sinusuri nito kung ang user ay naka-log in na.
  useEffect(() => {
    // Sinusuri ang lokal na imbakan at imbakan ng session para sa data ng gumagamit at token ng pag-access.
    const existingUser = localStorage.getItem("user");
    const accessToken = sessionStorage.getItem("accessToken");
    
    // Kung ang user at token ay umiiral, sinusubukan nitong i-parse ang data ng user at i-redirect batay sa papel.
    if (existingUser && accessToken) {
      try {
        const userData = JSON.parse(existingUser);
        const role = userData.role.toLowerCase();
        if (role === "hr" || role === "admin") {
          navigate("/admin-dashboard", { replace: true });
        } else if (role === "employee") {
          navigate("/employee-dashboard", { replace: true });
        }
      } catch (error) {
        console.error("Error sa pag-parse ng data ng user:", error);
        // Nililinis ang imbakan kung may error.
        localStorage.removeItem("user");
        sessionStorage.removeItem("accessToken");
      }
    }

    // Awtomatikong pinupunan ang employee ID mula sa huling pagpaparehistro.
    const lastUser = localStorage.getItem("lastRegisteredUser");
    if (lastUser) {
      try {
        const user = JSON.parse(lastUser);
        setForm((prev) => ({ ...prev, employeeId: user.employeeId }));
        setRole(user.role);
        // Nililinis pagkatapos gamitin upang maiwasan ang pagkalito.
        localStorage.removeItem("lastRegisteredUser");
      } catch (error) {
        console.error("Error sa pag-parse ng huling user:", error);
        localStorage.removeItem("lastRegisteredUser");
      }
    }
  }, [navigate]);

  // Pinangangasiwaan ang mga pagbabago sa mga input field.
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  // Pinangangasiwaan ang pagsusumite ng form.
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Bine-validate kung ang mga input ay napunan.
    if (!form.employeeId.trim() || !form.password.trim()) {
      setError("Pakipunan ang lahat ng mga patlang.");
      return;

      // Bine-validate ang data ng tugon.
      if (!accessToken || !user.employeeId || !user.role) {
        throw new Error("Di-wastong tugon mula sa server");
      }

      // Iniimbak ang data ng user at token.
      localStorage.setItem("user", JSON.stringify(user));
      sessionStorage.setItem("accessToken", accessToken);

      // Nagre-redirect batay sa papel ng user.
      const role = user.role.toLowerCase();
      if (role === "hr" || role === "admin") {
        navigate("/admin-dashboard", { replace: true });
      } else if (role === "employee") {
        navigate("/employee-dashboard", { replace: true });
      } else {
        throw new Error("Di-wastong papel ng user");
      }
    } catch (err) {
      console.error("Error sa pag-login:", err);
      
      // Nililinis ang anumang bahagyang data sa error.
      localStorage.removeItem("user");
      sessionStorage.removeItem("accessToken");

      // Pinangangasiwaan ang iba't ibang mga sitwasyon ng error.
      if (err.response) {
        // Tumugon ang server na may error.
        setError(err.response.data?.message || "Nabigo ang pag-login. Pakisubukang muli.");
      } else if (err.request) {
        // Ginawa ang kahilingan ngunit walang tugon.
        setError("Hindi makakonekta sa server. Pakisuri ang iyong koneksyon.");
      } else {
        // Iba pang mga error.
        setError(err.message || "Isang hindi inaasahang error ang naganap.");
      }
    } finally {
      // Tinitiyak na ang pag-load ay naka-set sa false pagkatapos ng pagtatangka.
      setLoading(false);
    }
  };

  // Nagre-render ng login form UI.
  return (
    <AuthLayout title="Welcome Back!">
      {/* Nagpapakita ng mensahe ng error kung mayroon man */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Nagpapakita ng papel ng user kung magagamit */}
      {role && (
        <div className="flex items-center justify-center gap-2 mb-5 py-2 px-4 rounded-[10px] border-[2px] border-gray-200 text-sm font-medium text-gray-900 shadow-md">
          <span className="opacity-80">Nagla-log in bilang:</span>
          <span
            className={`capitalize px-3 py-[3px] rounded-md shadow-md font-semibold text-gray-900 ${
              role.toLowerCase() === "admin" || role.toLowerCase() === "hr" ? "bg-gray-200" : "bg-gray-100"
            }`}
          >
            {role}
          </span>
        </div>
      )}

      {/* Ang login form mismo */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm text-gray-700 mb-1 block">Employee ID</label>
          <div className="relative">
            <IdCardLanyard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={17} />
            <input
              type="text"
              name="employeeId"
              value={form.employeeId}
              onChange={handleChange}
              className="w-full pl-10 pr-3 py-2 border-[2px] border-gray-300 rounded-[15px] shadow-md bg-white focus:ring focus:ring-gray-100 focus:outline-none"
              placeholder="Ilagay ang iyong Employee ID"
              disabled={loading}
              required
            />
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-700 mb-1 block">Password</label>
          <div className="relative">
            <FileLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={17} />
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="w-full pl-10 pr-3 py-2 border-[2px] border-gray-300 rounded-[15px] shadow-md bg-white focus:ring focus:ring-gray-100 focus:outline-none"
              placeholder="Ilagay ang iyong password"
              disabled={loading}
              required
            />
          </div>
        </div>

        {/* Pindutan para sa pagsusumite */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-slate-950 to-green-700 text-white py-2 rounded-[10px] font-semibold hover:from-slate-700 hover:to-green-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Nagla-log in..." : "Mag-login"}
        </button>
      </form>

      {/* Link para sa pagpaparehistro */}
      <p className="text-center mt-5 text-gray-700 text-sm">
        Wala ka pang account?{" "}
        <Link to="/register" className="font-semibold text-black hover:underline">
          Magrehistro dito
        </Link>
      </p>
    </AuthLayout>
  );
}