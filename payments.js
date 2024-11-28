const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const razorpay = new Razorpay({
  key_id: 'rzp_test_9NcDKeaCrAQrxp',
  key_secret: 'tI83ejRS7uhsvZDdfXz43SSI',
});

// Create order
app.post('/create-order', async (req, res) => {
  const { amount } = req.body;
  try {
    const callbackUrl = 'https://botcode-back.onrender.com/payment-callback';
    const order = await razorpay.orders.create({
      amount: amount * 100, // Amount in paisa
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1, 
      notes: {
        "callback_url": callbackUrl
    }
  });
    res.status(200).json(order);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error creating order');
  }
});

app.post('/create-payment-link', async (req, res) => {
  const { amount, currency, description } = req.body;

  try {
    // Create a payment link
    const paymentLink = await razorpay.paymentLinks.create({
      amount: amount * 100,  // Amount in paisa (1 INR = 100 paise)
      currency: currency,
      description: description,
      name: 'Your Company Name',  // You can specify the company name
      email: 'customer@example.com',  // Optional: customer email for receipts
      contact: '+919999999999',  // Optional: customer phone number
      callback_url: 'https://your-website.com/payment-callback', // Optional: callback URL to handle response
      expire_by: Math.floor(Date.now() / 1000) + 60 * 30,  // Payment link expiration (30 minutes from now)
      remind: true,  // Optional: whether to remind the user before expiration
    });

    // Respond with the payment link URL
    res.json({ paymentLink: paymentLink.short_url, sessionId: paymentLink.id });
  } catch (error) {
    console.error('Error creating payment link:', error);
    res.status(500).json({ error: 'Failed to create payment link' });
  }
});




// Verify payment
app.post('/verify-payment', (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const generatedSignature = crypto
    .createHmac('sha256', razorpay.key_secret)
    .update(razorpay_order_id + '|' + razorpay_payment_id)
    .digest('hex');

  if (generatedSignature === razorpay_signature) {
    res.status(200).json({ status: 'success' });
  } else {
    res.status(400).json({ status: 'failed' });
  }
});

app.post('/payment-callback', (req, res) => {
  const paymentDetails = req.body; // Razorpay will send the payment details in the request body
  
  // Verify payment status (usually by checking signature and payment ID)
  // Handle payment success or failure

  // Example of handling successful payment:
  if (paymentDetails.status === 'captured') {
    console.log('Payment Successful:', paymentDetails);
    res.status(200).send('Payment Successful');
  } else {
    console.log('Payment Failed:', paymentDetails);
    res.status(400).send('Payment Failed');
  }
});






// Start server
app.listen(5000, () => {
  console.log('Server running ');
});
