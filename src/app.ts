import express, { Application } from "express";
import cors from "cors";
import {
  getAllUsers,
  getMe,
  login,
  register,
} from "./controllers/AuthController";
import { authenticate, authorize } from "./middlewares/authMiddleware";
import { errorHandler } from "./middlewares/errorHandler";
import * as ProductController from "./controllers/ProductController";
import * as CategoryController from "./controllers/CategoryController";
import * as OrderController from "./controllers/OrderController";
import * as PaymentController from "./controllers/PaymentController";

const createApp = (): Application => {
  const app = express();

  app.use(cors());

  // Routes
  app.post(
    "/webhooks/stripe",
    express.raw({ type: "application/json" }),
    PaymentController.handleStripeWebhook
  );

  app.use(express.json());
  app.use(
    express.urlencoded({
      extended: true,
    })
  );
  // Public
  app.post("/auth/register", register);
  app.post("/auth/login", login);

  // Protected
  app.get("/users/me", authenticate, getMe);

  // Product
  app.get("/products", ProductController.getProducts);
  app.get("/products/:id", ProductController.getProductById);

  // Category
  app.get(
    "/products/:id/recommendations",
    CategoryController.getProductRecommendations
  );
  app.get("/categories/:id/subtree", CategoryController.getSubtree);

  app.post("/orders", authenticate, OrderController.createOrder);
  app.get("/orders", authenticate, OrderController.getOrders);
  app.get("/orders/:id", authenticate, OrderController.getOrderById);

  //Payment
  app.post(
    "/payments/checkout",
    authenticate,
    PaymentController.initiateCheckout
  );

  app.post(
    "/api/v1/payments/bkash/execute",
    authenticate,
    PaymentController.executeBkashPayment
  );

  // bKash Query Endpoint
  app.get(
    "/api/v1/payments/bkash/query/:transactionId",
    authenticate,
    PaymentController.queryBkashPayment
  );

  // Admin Only
  app.get("/admin/users", authenticate, authorize(["ADMIN"]), getAllUsers);
  app.post(
    "/products",
    authenticate,
    authorize(["ADMIN"]),
    ProductController.createProduct
  );

  app.put(
    "/products/:id",
    authenticate,
    authorize(["ADMIN"]),
    ProductController.updateProduct
  );

  app.delete(
    "/products/:id",
    authenticate,
    authorize(["ADMIN"]),
    ProductController.deleteProduct
  );

  app.post(
    "/categories",
    authenticate,
    authorize(["ADMIN"]),
    CategoryController.createCategory
  );

  // Error Handling
  app.use(errorHandler);

  app.use("/", (req, res) => {
    res.send("Hello World");
  });

  return app;
};

export const app = createApp();
