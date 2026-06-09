import { useEffect, useState } from "react";
import axios from "axios";
import { restaurantService } from "../main";
import type { IOrder } from "../types";

const SalesDashboard = ({ restaurantId }: { restaurantId: string }) => {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await axios.get(
          `${restaurantService}/api/order/restaurant/${restaurantId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setOrders(data.orders || []);
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [restaurantId]);

  if (loading) return <p className="text-sm text-gray-500">Loading sales...</p>;

  const delivered = orders.filter((o) => o.status === "delivered");

  const totalRevenue = delivered.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalOrders = delivered.length;
  const avgOrder = totalOrders ? Math.round(totalRevenue / totalOrders) : 0;

  // group by date
  const byDate: Record<string, { count: number; revenue: number }> = {};
  delivered.forEach((o) => {
    const day = new Date(o.createdAt).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    });
    if (!byDate[day]) byDate[day] = { count: 0, revenue: 0 };
    byDate[day].count += 1;
    byDate[day].revenue += o.totalAmount;
  });

  const days = Object.entries(byDate).slice(-7).reverse();

  return (
    <div className="space-y-5">
      {/* summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Orders", value: totalOrders },
          { label: "Total Revenue", value: `₹${totalRevenue}` },
          { label: "Avg Order", value: `₹${avgOrder}` },
        ].map((s) => (
          <div key={s.label} className="rounded-lg bg-gray-50 p-3 text-center">
            <p className="text-lg font-bold text-[#e23744]">{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* last 7 days */}
      <div>
        <p className="mb-2 text-sm font-semibold text-gray-700">Last 7 Days</p>
        {days.length === 0 ? (
          <p className="text-sm text-gray-400">No delivered orders yet</p>
        ) : (
          <div className="space-y-2">
            {days.map(([date, d]) => (
              <div
                key={date}
                className="flex items-center justify-between rounded-lg border px-4 py-2 text-sm"
              >
                <span className="text-gray-600">{date}</span>
                <span className="text-gray-500">{d.count} orders</span>
                <span className="font-semibold text-green-600">₹{d.revenue}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesDashboard;
