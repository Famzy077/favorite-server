const  express =  require('express');
const authRoutes = require('./routes/authRoutes.js');
const cors = require('cors')
const app = express();


const corsOptions = {
  origin: ['http://localhost:3000', 'https://favourite-plug.vercel.app'],
  methods: ['GET', 'POST', 'OPTIONS'], // allowed methods
  allowedHeaders: ['Content-Type', 'Authorization'], // allowed headers
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());

app.use('/api/auth', authRoutes);

app.listen(5000, () => {
  console.log('Server running on port 5000');
});
