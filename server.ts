import express from 'express';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import 'dotenv/config';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Webhooks from Mercado Pago are POST requests with JSON payload
  app.use(express.json());
  app.use(cors());

  // === WEBHOOK MERCADO PAGO ===
  app.post('/api/webhooks/mercadopago', async (req, res) => {
    try {
      const { type, data, action } = req.body;

      console.log('Webhook Received:', req.body);

      // Only process payment created or updated events
      if (type === 'payment' || action === 'payment.created' || action === 'payment.updated') {
        const paymentId = data && data.id ? data.id : req.body.data?.id;

        if (!paymentId) {
          return res.status(400).send('No payment ID');
        }

        // Fetch payment details from Mercado Pago
        const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
        if (!token) {
          console.error("MERCADOPAGO_ACCESS_TOKEN is not set");
          return res.status(500).send('Server Error');
        }

        const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!paymentResponse.ok) {
          console.error('Failed to fetch payment details', await paymentResponse.text());
          return res.status(400).send('Bad Request');
        }

        const paymentDetails = await paymentResponse.json();

        // Check if payment is approved
        if (paymentDetails.status === 'approved') {
          // Identify the user.
          // Option 1: Try to look for the user email from the payment (payer.email)
          const payerEmail = paymentDetails.payer?.email;
          
          if (payerEmail) {
            console.log(`Payment approved for email: ${payerEmail}`);
            const supabaseUrl = process.env.VITE_SUPABASE_URL;
            const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

            if (supabaseUrl && supabaseServiceKey) {
              const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
              
              // Find the user by email in Supabase
              // We need to list users and find the one matching the email, since admin doesn't have a direct "getUserByEmail" that is public/easy without listing.
              // Actually, there's `supabaseAdmin.auth.admin.listUsers()` or we can do something else.
              // Wait, instead of listUsers, we can create a 'profiles' table and update it.
              // But as a fallback, we could store it in a generic place. Let's assume we update a "profiles" table.
              
              // For simplicity, let's just attempt to update the profile by email.
              const { data, error: userError } = await supabaseAdmin.auth.admin.listUsers();
              if (userError) {
                console.error("Error fetching users:", userError);
              } else {
                const userList = (data as any).users || [];
                const user = userList.find((u: any) => u.email === payerEmail);
                if (user) {
                   // Found the user, update their user_metadata to set premium
                   await supabaseAdmin.auth.admin.updateUserById(user.id, {
                     user_metadata: { is_premium: true }
                   });
                   console.log(`Updated user ${payerEmail} to Premium!`);
                } else {
                   console.log(`User with email ${payerEmail} not found in Supabase.`);
                }
              }
            } else {
              console.error("Supabase Admin keys not configured.");
            }
          }
        }
      }
      
      // Always respond with 200 to acknowledge receipt to Mercado Pago
      res.status(200).send('OK');
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).send('Internal Server Error');
    }
  });


  // API routes FIRST
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // For Express format in Node
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
