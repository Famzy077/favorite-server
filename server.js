const  express =  require('express');
const authRoutes = require('./src/routes/auth.Routes.js');
const userDetailsRoutes = require('./src/routes/userDetails.Routes.js')
const adminRoutes = require('./src/routes/admin/admin.Routes.js')
const productRoutes = require('./src/routes/product.routes');
const cors = require('cors')
const app = express();
app.use(express.json());
// const ejs = require('ejs')
const path = require('path');

// // Set EJS as the view engine
// app.set('view engine', 'ejs');
// // Set the views directory
// app.set('views', path.join(__dirname, 'views'));

// // Static files (e.g., CSS if needed)
// app.use(express.static(path.join(__dirname, 'public')));

// // ✅ Route to test the email template
// app.get('/test-verification', (req, res) => {
//   const mockCode = '1234'; // Mock verification code
//   res.render('verification', { code: mockCode });
// });

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
  methods: ['GET', 'POST', 'PUT', 'HEAD',  'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Auth route
app.use('/api/auth', authRoutes);
app.options('/api/auth', cors(corsOptions));
// User route
app.use('/api/user-details', userDetailsRoutes);
app.options('/api/user-details', cors(corsOptions));
// Admin route
app.use('/api/admin', adminRoutes)
app.options('/api/admin', cors(corsOptions));
// products route
app.use('/api/products', productRoutes);
app.options('/api/products', cors(corsOptions))


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.listen(5000, () => {
  console.log('Server running on port 5000');
});