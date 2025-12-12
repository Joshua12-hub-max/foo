import { TrendingUp } from "lucide-react";

export default function WelcomeBanner({ user }) {
  const date = new Date();
  const formattedDate = date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex justify-between items-center bg-gray-200 shadow-md text-gray-700 rounded-md p-2 mb-6">
      <div className="flex items-center gap-3">
        <TrendingUp className="w-6 h-6 text-gray-700" />
        <div>
          <h2 className="text-lg font-semibold">
            Welcome, {user?.name || "Admin"}
          </h2>
          <p className="text-xs text-gray-500">{formattedDate}</p>
        </div>
      </div>

      <div className="bg-[#F8F9FA] text-center rounded-md p-1 min-w-[50px] shadow-md">
        <div className="text-[8px] font-semibold text-[#274b46] uppercase">
          {date.toLocaleString("en-US", { month: "short" })}
        </div>
        <div className="text-2xl font-bold text-[#274b46] leading-none">
          {date.getDate()}
        </div>
        <div className="text-[8px] text-[#274b46]">{date.getFullYear()}</div>
      </div>
    </div>
  );
}
