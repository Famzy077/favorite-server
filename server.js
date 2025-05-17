const  express =  require('express');
const authRoutes = require('./routes/authRoutes.js');
const cors = require('cors')
const app = express();
app.use(cors("/*"))
app.use(express.json());

app.use('/api/auth', authRoutes);

app.listen(5000, () => {
  console.log('Server running on port 5000');
});
