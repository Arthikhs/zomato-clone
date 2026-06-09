import { useEffect, useState } from "react";
import type { IOrder } from "../types";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import axios from "axios";
import { restaurantService } from "../main";
import toast from "react-hot-toast";

const ACTIVE_STATUSES = [
  "placed",
  "accepted",
  "preparing",
  "ready_for_rider",
  "rider_assigned",
  "picked_up",
];

const Orders = () => {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { socket } = useSocket();

  const fetchOrders = async () => {
    try {
      const { data } = await axios.get(
        `${restaurantService}/api/order/myorder`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setOrders(data.orders || []);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const onOrderUpdate = () => {
      fetchOrders();
    };

    socket.on("order:update", onOrderUpdate);
    socket.on("order:rider_assigned", onOrderUpdate);

    return () => {
      socket.off("order:update", onOrderUpdate);
      socket.off("order:rider_assigned", onOrderUpdate);
    };
  }, [socket]);

  if (loading) {
    return <p className="text-center text-gray-500">Loading orders...</p>;
  }

  if (orders.length === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-500">No orders yet</p>
      </div>
    );
  }

  const activeOrders = orders.filter((o) => ACTIVE_STATUSES.includes(o.status));
  const completedOrders = orders.filter(
    (o) => !ACTIVE_STATUSES.includes(o.status)
  );
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold">My Orders</h1>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Active Orders</h2>

        {activeOrders.length === 0 ? (
          <p>No active orders</p>
        ) : (
          activeOrders.map((order) => (
            <OrderRow
              key={order._id}
              order={order}
              onClick={() => navigate(`/order/${order._id}`)}
            />
          ))
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Completed Orders</h2>

        {completedOrders.length === 0 ? (
          <p>No Completed orders</p>
        ) : (
          completedOrders.map((order) => (
            <OrderRow
              key={order._id}
              order={order}
              onClick={() => navigate(`/order/${order._id}`)}
              showReorder
            />
          ))
        )}
      </section>
    </div>
  );
};

export default Orders;

// ETA: ~3 mins per km + 10 mins prep
const getETA = (distance: number) => Math.round(distance * 3 + 10);

const OrderRow = ({
  order,
  onClick,
  showReorder,
}: {
  order: IOrder;
  onClick: () => void;
  showReorder?: boolean;
}) => {
  const [reordering, setReordering] = useState(false);

  const handleReorder = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setReordering(true);
      await axios.delete(`${restaurantService}/api/cart/clear`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      for (const item of order.items) {
        for (let i = 0; i < item.quauntity; i++) {
          await axios.post(
            `${restaurantService}/api/cart/add`,
            { restaurantId: order.restaurantId, itemId: item.itemId },
            { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
          );
        }
      }
      toast.success("Items added to cart!");
    } catch {
      toast.error("Failed to reorder");
    } finally {
      setReordering(false);
    }
  };

  return (
    <div
      className="cursor-pointer rounded-xl bg-white p-4 shadow-sm hover:bg-gray-50"
      onClick={onClick}
    >
      <div className="flex justify-between items-center">
        <p className="text-sm font-medium">Order #{order._id.slice(-6)}</p>
        <span className="text-xs capitalize text-gray-500">{order.status.replace("_", " ")}</span>
      </div>

      <div className="mt-2 text-sm text-gray-600">
        {order.items.map((item, i) => (
          <span key={i}>
            {item.name} x {item.quauntity}
            {i < order.items.length - 1 && ", "}
          </span>
        ))}
      </div>

      <div className="mt-2 flex justify-between text-sm font-medium">
        <span>Total</span>
        <span>₹{order.totalAmount}</span>
      </div>

      {ACTIVE_STATUSES.includes(order.status) && order.distance && (
        <p className="mt-1 text-xs text-orange-500">🕐 Est. delivery ~{getETA(order.distance)} mins</p>
      )}

      {showReorder && (
        <button
          onClick={handleReorder}
          disabled={reordering}
          className="mt-3 w-full rounded-lg bg-[#e23744] py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {reordering ? "Adding..." : "🔁 Reorder"}
        </button>
      )}
    </div>
  );
};
