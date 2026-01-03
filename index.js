import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Inicializar Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(
    JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  ),
});

// Endpoint para enviar push
app.post('/send-push', async (req, res) => {
  const { token, title, body } = req.body;

  try {
    await admin.messaging().send({
      token,
      notification: { title, body },
    });

    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error enviando push' });
  }
});

app.get('/', (req, res) => {
  res.send('Backend OK');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Push backend corriendo en puerto', PORT);
});
