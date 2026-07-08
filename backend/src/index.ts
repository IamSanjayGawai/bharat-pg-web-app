import express, { Application, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import connectDB from './config/db';
import authRoutes from './routes/authRoutes';
import buildingRoutes from './routes/buildingRoutes';
import floorRoutes from './routes/floorRoutes';
import roomRoutes from './routes/roomRoutes';
import bedRoutes from './routes/bedRoutes';
import tenantRoutes from './routes/tenantRoutes';
import rentRoutes from './routes/rentRoutes';
import expenseRoutes from './routes/expenseRoutes';
import lightBillRoutes from './routes/lightBillRoutes';

dotenv.config();

// Connect to database
connectDB();

const app: Application = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/buildings', buildingRoutes);
app.use('/api/floors', floorRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/beds', bedRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/rent', rentRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/light-bills', lightBillRoutes);

// Basic Route
app.get('/', (req: Request, res: Response) => {
  res.send('PG Management API is running...');
});

// Generic Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
