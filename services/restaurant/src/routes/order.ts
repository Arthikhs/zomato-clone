import express from "express";
import { isAuth, isSeller } from "../middlewares/isAuth.js";
import {
  assignRiderToOrder,
  confirmCODOrder,
  createOrder,
  fetchOrderForPayment,
  fetchRestaurantOrders,
  fetchSingleOrder,
  getCurrentOrderForRider,
  getMyOrders,
  getRiderEarnings,
  rateOrder,
  updateOrderStatus,
  updateOrderStatusRider,
  verifyDeliveryOtp,
} from "../controllers/order.js";

const router = express.Router();

router.get("/myorder", isAuth, getMyOrders);
router.get("/rider/earnings", getRiderEarnings);
router.get("/current/rider", getCurrentOrderForRider);
router.get("/restaurant/:restaurantId", isAuth, isSeller, fetchRestaurantOrders);
router.get("/payment/:id", fetchOrderForPayment);
router.get("/:id", isAuth, fetchSingleOrder);

router.post("/new", isAuth, createOrder);
router.post("/cod/:orderId", isAuth, confirmCODOrder);
router.post("/verify/otp", verifyDeliveryOtp);
router.post("/:orderId/rate", isAuth, rateOrder);

router.put("/assign/rider", assignRiderToOrder);
router.put("/update/status/rider", updateOrderStatusRider);
router.put("/:orderId", isAuth, isSeller, updateOrderStatus);

export default router;
