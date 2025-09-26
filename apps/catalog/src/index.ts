import express from 'express';
import cors from 'cors';
const app = express();
app.use(cors()); app.use(express.json());

const products = [
  { id: 'p1', name: 'Rau sạch A', price: 30000, stock: 12 },
  { id: 'p2', name: 'Trứng gà ta', price: 45000, stock: 20 }
];

app.get('/products', (req, res) => {
  const q = String(req.query.q || '');
  const data = q ? products.filter(p => p.name.toLowerCase().includes(q.toLowerCase())) : products;
  res.json(data);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`catalog :${PORT}`));
