import express, { Application } from "express";
import cors from 'cors';
import { getAllUsers, getMe, login, register } from "./controllers/AuthController";
import { authenticate, authorize } from "./middlewares/authMiddleware";
import { errorHandler } from "./middlewares/errorHandler";

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

// Admin Only
app.get('/admin/users', authenticate, authorize(['ADMIN']), getAllUsers);

// Error Handling 
app.use(errorHandler);

	app.use('/', (req,res) => {
		res.send('Hello World');
	})
	
	return app;
}

export const app = createApp()