import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import apiRoutes from './routes/index.js';
import webhookRoutes from './routes/webhookRoutes.js';
import errorHandler from './middleware/errorHandler.js';
import { FRONTEND_URL } from './config/index.js';

const app = express();

app.use(cors());
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.use('/api', apiRoutes);
app.use('/webhook', webhookRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'MUST Ride Registration API is running' });
});

console.log('Server FRONTEND_URL =', FRONTEND_URL);

app.use(errorHandler);

export default app;
