const  express =  require('express');
const authRoutes = require('./routes/authRoutes.js');
const cors = require('cors')
const app = express();
app.use(express.json());


const corsOptions = {
  origin: ['*'],
  // origin: ['http://localhost:3000' || 'https://favourite-plug.vercel.app'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};


app.use(cors(corsOptions));

app.use('/api/auth', authRoutes);
app.options('/api/auth', cors(corsOptions));

app.listen(5000, () => {
  console.log('Server running on port 5000');
});
