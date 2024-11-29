const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Razorpay instance
const razorpay = new Razorpay({
  key_id: 'rzp_test_9NcDKeaCrAQrxp', // Replace with your Razorpay key ID
  key_secret: 'tI83ejRS7uhsvZDdfXz43SSI', // Replace with your Razorpay secret key
});

// Create an order
app.post('/create-order', async (req, res) => {
  const { amount } = req.body;

  try {
    const order = await razorpay.orders.create({
      amount: amount * 100, // Amount in paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1, // Auto-capture payment
    });

    res.status(200).json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Error creating order', details: error.message });
  }
});

// Create a payment link
app.post('/create-payment-link', async (req, res) => {
  const { amount, currency, description, name, contact, email } = req.body;

  const payload = {
    amount: amount * 100, // Amount in paise
    currency: currency || 'INR',
    description: description || 'Payment for services',
    customer: {
      name: name || 'John Doe',
      contact: contact || '+919876543210',
      email: email || 'example@example.com',
    },
    notify: {
      sms: true,
      email: true,
    },
    callback_url: 'https://botcode-back.onrender.com/payment-callback',
    callback_method: 'get',
  };

  try {
    const response = await axios.post(
      'https://api.razorpay.com/v1/payment_links',
      payload,
      {
        auth: {
          username: 'rzp_test_9NcDKeaCrAQrxp',
          password: 'tI83ejRS7uhsvZDdfXz43SSI',
        },
      }
    );

    res.status(200).json({
      message: 'Payment link created successfully',
      paymentLink: response.data.short_url,
      id: response.data.id,
    });
  } catch (error) {
    console.error('Error creating payment link:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to create payment link',
      details: error.response?.data || error.message,
    });
  }
});

// Verify payment
app.post('/verify-payment', (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  try {
    const generatedSignature = crypto
      .createHmac('sha256', razorpay.key_secret)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (generatedSignature === razorpay_signature) {
      res.status(200).json({ status: 'success' });
    } else {
      res.status(400).json({ status: 'failed', error: 'Signature mismatch' });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: 'Error verifying payment', details: error.message });
  }
});

// Payment callback
app.post('/payment-callback', (req, res) => {
  const paymentDetails = req.body;

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
  console.log('Server running on port 5000');
});
