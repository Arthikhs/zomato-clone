import { useParams } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import { useEffect, useState } from "react";
import type { IOrder } from "../types";
import axios from "axios";
import { restaurantService } from "../main";
import UserOrderMap from "../components/UserOrderMap";
import toast from "react-hot-toast";

const OrderPage = () => {
  const { id } = useParams();
  const { socket } = useSocket();

  const [order, setOrder] = useState<IOrder | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrder = async () => {
    try {
      const { data } = await axios.get(`${restaurantService}/api/order/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      setOrder(data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  useEffect(() => {
    if (!socket) return;

    const onOrderUpdate = () => {
      fetchOrder();
    };

    socket.on("order:update", onOrderUpdate);
    socket.on("order:rider_assigned", onOrderUpdate);

    return () => {
      socket.off("order:update", onOrderUpdate);
      socket.off("order:rider_assigned", onOrderUpdate);
    };
  }, [socket]);

  const [riderLocation, setRiderLocation] = useState<[number, number] | null>(
    null
  );

  useEffect(() => {
    if (!socket) return;

    const onRiderLocation = ({ latitude, longitude }: any) => {
      console.log("Rider Location:", latitude, longitude);
      setRiderLocation([latitude, longitude]);
    };

    socket.on("rider:location", onRiderLocation);

    return () => {
      socket.off("rider:location", onRiderLocation);
    };
  }, [socket]);

  if (loading) {
    return <p className="text-center text-gray-500">Loading order...</p>;
  }

  if (!order) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-500">No order Found</p>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
      <h1 className="text-xl font-bold">Order #{order._id.slice(-6)}</h1>
      <div className="rounded-lg bg-blue-50 p-3 text-sm font-medium">
        Status: <span className="capitalize">{order.status}</span>
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm space-y-2">
        <h2 className="font-semibold">Items</h2>
        {order.items.map((item, i) => (
          <div className="flex justify-between text-sm" key={i}>
            <span>
              {item.name} x {item.quauntity}
            </span>
            <span>₹{item.price * item.quauntity}</span>
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm space-y-1">
        <h2 className="font-semibold">Delivery Address</h2>
        <p className="text-sm text-gray-600">
          {order.deliveryAddress.fromattedAddress}
        </p>
        <p className="text-sm text-gray-600">
          Mobile: {order.deliveryAddress.mobile}
        </p>
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm space-y-2">
        <div className="flex justify-between text-sm">
          <span>SubTotal</span> <span>₹{order.subtotal}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Delivery Fee</span> <span>₹{order.deliveryFee}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>PlatForm Fee</span> <span>₹{order.platfromFee}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Total</span> <span>₹{order.totalAmount}</span>
        </div>

        <p className="text-xs text-gray-500">
          Payment Method: {order.paymentMethod}
        </p>
        <p className="text-xs text-gray-500">
          Payment Status: {order.paymentStatus}
        </p>
      </div>

      {order.status === "picked_up" && order.deliveryOtp && (
        <div className="rounded-xl bg-yellow-50 border-2 border-yellow-400 p-4 text-center space-y-2">
          <p className="text-sm font-medium text-yellow-800">🛵 Rider is nearby! Share this OTP to complete delivery</p>
          <p className="text-4xl font-bold tracking-widest text-yellow-600">{order.deliveryOtp}</p>
          <p className="text-xs text-yellow-700">Do not share this OTP with anyone else</p>
        </div>
      )}

      {(order.status === "rider_assigned" || order.status === "picked_up") &&
        (riderLocation ? (
          <UserOrderMap
            riderLocation={riderLocation}
            deliveryLocation={[
              order.deliveryAddress.latitude!,
              order.deliveryAddress.longitude!,
            ]}
          />
        ) : (
          <p>Waiting for rider location</p>
        ))}

      {order.status === "delivered" && (
        <RatingSection order={order} onRated={fetchOrder} />
      )}
    </div>
  );
};

export default OrderPage;

const RatingSection = ({ order, onRated }: { order: IOrder; onRated: () => void }) => {
  const [selected, setSelected] = useState(order.rating || 0);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!selected) return toast.error("Please select a rating");
    try {
      setSubmitting(true);
      await axios.post(
        `${restaurantService}/api/order/${order._id}/rate`,
        { rating: selected },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      toast.success("Rating submitted!");
      onRated();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm space-y-3">
      <h2 className="font-semibold">Rate your order</h2>
      {order.rating ? (
        <p className="text-sm text-gray-500">You rated this order: {"⭐".repeat(order.rating)}</p>
      ) : (
        <>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setSelected(star)}
                className={`text-2xl transition ${
                  star <= selected ? "text-yellow-400" : "text-gray-300"
                }`}
              >
                ★
              </button>
            ))}
          </div>
          <button
            onClick={submit}
            disabled={submitting || !selected}
            className="w-full rounded-lg bg-[#e23744] py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Rating"}
          </button>
        </>
      )}
    </div>
  );
};
