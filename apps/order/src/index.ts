import express from 'express';
import cors from 'cors';
const app = express();
app.use(cors()); app.use(express.json());

app.get('/quote-shipping', (req, res) => {
  const cartId = req.query.cartId || 'demo';
  res.json({ cartId, fee: 15000 });
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`order :${PORT}`));
