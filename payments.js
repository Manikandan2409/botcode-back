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
  const { amount, currency, description,name,contact,email } = req.body;

  try {
    // Create a payment link
    const paymentLink = await razorpay.paymentLinks.create({
      amount: amount * 100,  
      currency: currency,
      description: description,
      name: name,  
      email: email,  // Optional: customer email for receipts
      contact: contact,  // Optional: customer phone number
      callback_url: 'https://botcode-back.onrender.com/payment-callback', // Optional: callback URL to handle response
      expire_by: Math.floor(Date.now() / 1000) + 60 * 30,  // Payment link expiration (30 minutes from now)
      remind: true,  // Optional: whether to remind the user before expiration
    });

    app.post('/create-payment-link', async (req, res) => {
      const { amount, currency, description, name, contact, email } = req.body;
    
      // Prepare the payment link payload
      const payload = {
        amount: amount * 100, // Razorpay requires amount in paise
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
        // Make the API request
        const response = await axios.post(
          'https://api.razorpay.com/v1/payment_links',
          payload,
          {
            auth: {
              username: 'rzp_test_Dj4J237kLFsMzZ',
              password: '2HIoddEgtdXxh9bmoVB2MHXG',
            },
          }
        );
    
        // Send the response back to the client
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


    // Respond with the payment link URL
    res.json({ paymentLink: paymentLink.short_url, sessionId: paymentLink.id });
  } catch (error) {
    console.error('Error creating payment link:', error);
    res.status(500).json({
      error: 'Failed to create payment link',
      message: error.message,  // Include the specific error message for debugging
      error_details: error  // Include more detailed error details
    });
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
