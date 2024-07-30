const express = require('express');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const functions = require('@google-cloud/functions-framework');
const cors = require('cors');

// Initialize Firebase Admin SDK
const serviceAccount = require('./serviceAccountKeyFireStore.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const app = express();
app.use(bodyParser.json());

// Get all bank accounts
app.get('/accounts', async (req, res) => {
  try {
    const snapshot = await db.collection('accounts').get();
    const accounts = snapshot.docs.map(doc => ({ accountId: doc.id, ...doc.data() }));
    res.status(200).json(accounts);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// 新しい銀行口座を作成する
app.post('/accounts', async (req, res) => {
  try {
    const newAccount = req.body;
    const docRef = await db.collection('accounts').add(newAccount);
    res.status(201).json({ accountId: docRef.id, ...newAccount });
  } catch (error) {
    console.error('Error creating new bank account:', error);
    res.status(500).send(error.message);
  }
});

// 銀行口座をIDで取得する
app.get('/accounts/:accountId', async (req, res) => {
  try {
    const docRef = db.collection('accounts').doc(req.params.accountId);
    const doc = await docRef.get();
    if (!doc.exists) {
      res.status(404).send('Bank account not found');
    } else {
      res.status(200).json({ accountId: doc.id, ...doc.data() });
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// 銀行口座をIDで更新する
app.put('/accounts/:accountId', async (req, res) => {
  try {
    const updatedAccount = req.body;
    const docRef = db.collection('accounts').doc(req.params.accountId);
    await docRef.set(updatedAccount, { merge: true });
    res.status(200).json({ accountId: req.params.accountId, ...updatedAccount });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// 銀行口座をIDで削除する
app.delete('/accounts/:accountId', async (req, res) => {
  try {
    const docRef = db.collection('accounts').doc(req.params.accountId);
    await docRef.delete();
    res.status(204).send();
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Cloud Functionとしてエクスポートする
functions.http('api', app);
