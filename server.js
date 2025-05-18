const  express =  require('express');
const authRoutes = require('./routes/auth.Routes.js');
const cors = require('cors')
const app = express();
const bodyParser = require('body-parser');
app.use(express.json());



const allowedOrigins = ['http://localhost:3000', 'https://favourite-plug.vercel.app'];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like Postman or curl)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed for this origin'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));


app.use('/api/auth', authRoutes);
app.options('/api/auth', cors(corsOptions));

app.listen(5000, () => {
  console.log('Server running on port 5000');
});
