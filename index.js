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

async function getTokensByRole(role) {
  const snapshot = await admin
    .firestore()
    .collection('usuarios')
    .where('tipo', '==', role)
    .get();

  const tokens = [];

  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.token && typeof data.token === 'string') {
      tokens.push(data.token);
    }
  });

  return tokens;
}

// Endpoint para enviar push
app.post('/notify', async (req, res) => {
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

app.post('/notify-role', async (req, res) => {
  const { role, title, body } = req.body;

  try {
    const tokens = await getTokensByRole(role);

    if (!tokens.length) {
      return res.status(404).json({ error: 'No hay tokens para ese rol' });
    }

    await admin.messaging().sendEachForMulticast({
      tokens,
      notification: { title, body },
    });

    res.json({ ok: true, enviados: tokens.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error enviando push por rol' });
  }
});

app.get('/', (req, res) => {
  res.send('Backend OK');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Push backend corriendo en puerto', PORT);
});
