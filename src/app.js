import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import categoryRouter from './routers/categories';
import productRouter from './routers/products';

const app = express();
dotenv.config();

const PORT = process.env.PORT;
const MONGO_URL = process.env.MONGODB_LOCAL;

app.use(express.json());
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.get('/api', (req, res) => res.json({message: "Hello"}))
app.use('/api', categoryRouter)
app.use('/api', productRouter)
mongoose
   .connect(MONGO_URL)
   .then(() => console.log('connected to db'))
   .catch((err) => console.log(`error in connect db : ${err}`));
app.listen(PORT, () => {
   console.log(`listening success ${PORT}`);
});
