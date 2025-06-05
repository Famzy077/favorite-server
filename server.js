const  express =  require('express');
const authRoutes = require('./routes/auth.Routes.js');
const userDetailsRoutes = require('./routes/userDetails.Routes.js')
const adminRoutes = require('./routes/admin/admin.Routes.js')
const cors = require('cors')
const app = express();
app.use(express.json());
const ejs = require('ejs')
const path = require('path');

// // Set EJS as the view engine
app.set('view engine', 'ejs');
// Set the views directory
app.set('views', path.join(__dirname, 'views'));

// Static files (e.g., CSS if needed)
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Route to test the email template
app.get('/test-verification', (req, res) => {
  const mockCode = '1234'; // Mock verification code
  res.render('verification', { code: mockCode });
});

// app.get('/welcome', async (req, res) => {
//   const email = 'demo@example.com';
//   const html = await ejs.renderFile(path.join(__dirname, 'views/welcome.ejs'), { email });
//   res.send(html);
// });

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
app.use('/', adminRoutes)
app.options('/api', cors(corsOptions));

app.listen(5000, () => {
  console.log('Server running on port 5000');
});
