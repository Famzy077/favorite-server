const  express =  require('express');
const authRoutes = require('./src/routes/auth.Routes.js');
const userDetailsRoutes = require('./src/routes/userDetails.Routes.js')
const adminRoutes = require('./src/routes/admin/admin.Routes.js')
const productRoutes = require('./src/routes/product.routes');
const wishListRoutes = require('./src/routes/wishlist.routes.js');
const cartRoutes = require('./src/routes/cart.routes.js');
const orderRoutes = require('./src/routes/order.Routes.js')
const cors = require('cors')
const app = express();
app.use(express.json());
const ejs = require('ejs')
const path = require('path');

// Set EJS as the view engine
app.set('view engine', 'ejs');
// Set the views directory
app.set('views', path.join(__dirname, '/src/views'));

// Static files (e.g., CSS if needed)
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Route to test the email template
// To fix the test route, provide mock data
// app.get('/test-email', (req, res) => {
//   const mockOrder = { id: 'test-123', status: 'PENDING', contactPhone: '080...', shippingAddress: '...' };
//   const mockCustomer = { email: 'test@example.com' };
//   const mockCartItems = [{ product: { name: 'Test Product', price: 100 }, quantity: 2 }];
//   const mockTotal = 200;

//   res.render('new-order-notification', {
//       order: mockOrder,
//       customer: mockCustomer,
//       cartItems: mockCartItems,
//       totalAmount: mockTotal
//   });
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

// wishlist route
app.use('/api/wishlist', wishListRoutes);
app.options('/api/wishlist', cors(corsOptions))

// Cart route
app.use('/api/cart', cartRoutes);
app.options('/api/cart', cors(corsOptions))

// Orders route
app.use('/api/orders', orderRoutes);
app.options('/api/orders', cors(corsOptions))

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.listen(5000, () => {
  console.log('Server running on port 5000');
});