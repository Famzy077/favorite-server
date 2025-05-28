const  express =  require('express');
const authRoutes = require('./routes/auth.Routes.js');
const userDetailsRoutes = require('./routes/userDetails.Routes.js')
const cors = require('cors')
const app = express();
app.use(express.json());



const allowedOrigins = ['http://localhost:3000', 'https://favourite-plug.vercel.app'];

const corsOptions = {
  origin: function (origin, callback) {

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed for this origin'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));


app.use('/api/auth', authRoutes);
app.options('/api/auth', cors(corsOptions));
app.use('/api/user-details', userDetailsRoutes);
app.options('/api/user-details', cors(corsOptions));

app.listen(5000, () => {
  console.log('Server running on port 5000');
});
