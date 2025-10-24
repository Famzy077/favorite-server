const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = 'Favorite Plug <noreply@notify.joyvinco.com.ng>'; 

// Export both the initialized client and the FROM_EMAIL constant
module.exports = {
  resend,
  FROM_EMAIL
};

if (process.env.RESEND_API_KEY) {
  console.log('Resend client configured successfully.');
} else {
  console.error('RESEND_API_KEY environment variable is missing!');
}