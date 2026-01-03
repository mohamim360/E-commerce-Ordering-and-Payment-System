import express, { Application } from "express";
import cors from 'cors';
import { getAllUsers, getMe, login, register } from "./controllers/AuthController";
import { authenticate, authorize } from "./middlewares/authMiddleware";
import { errorHandler } from "./middlewares/errorHandler";
import * as ProductController from './controllers/ProductController';
import * as CategoryController from './controllers/CategoryController';

const createApp = (): Application => {
	const app = express();

	app.use(cors())
	app.use(express.json());
	app.use(express.urlencoded({
		extended: true
	}))

	// Routes
// Public
app.post('/auth/register', register);
app.post('/auth/login', login);

// Protected
app.get('/users/me', authenticate, getMe);

// Product 
app.get('/products', ProductController.getProducts);
app.get('/products/:id', ProductController.getProductById);

// Category
app.get('/products/:id/recommendations', CategoryController.getProductRecommendations);
app.get('/categories/:id/subtree', CategoryController.getSubtree);


// Admin Only
app.get('/admin/users', authenticate, authorize(['ADMIN']), getAllUsers);
app.post(
  '/products', 
  authenticate, 
  authorize(['ADMIN']), 
  ProductController.createProduct
);

app.put(
  '/products/:id', 
  authenticate, 
  authorize(['ADMIN']), 
  ProductController.updateProduct
);

app.delete(
  '/products/:id', 
  authenticate, 
  authorize(['ADMIN']), 
  ProductController.deleteProduct
);

app.post('/categories', authenticate, authorize(['ADMIN']), CategoryController.createCategory);


// Error Handling 
app.use(errorHandler);

	app.use('/', (req,res) => {
		res.send('Hello World');
	})
	
	return app;
}

export const app = createApp()