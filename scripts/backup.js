const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const fs = require('fs');

// ── Firebase init ──────────────────────────────────────────
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const YEAR = new Date().getFullYear();
const BASE_YEAR = 2026;

function collName(base) {
  return YEAR === BASE_YEAR ? base : `${base}_${YEAR}`;
}

// ── Fetch all data ─────────────────────────────────────────
async function fetchAll() {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const timeStr = now.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Bucharest' });

  console.log(`Starting backup for ${dateStr} at ${timeStr}...`);

  // Concedii — toate doc-urile
  const concediiSnap = await db.collection(collName('concedii')).get();
  const concedii = {};
  concediiSnap.forEach(doc => { concedii[doc.id] = doc.data(); });

  // Sortatori
  let sortatori = null;
  try {
    const sortSnap = await db.collection(collName('sortatori')).doc('state').get();
    if (sortSnap.exists) sortatori = sortSnap.data();
  } catch(e) { console.warn('sortatori fetch error:', e.message); }

  // Prezente
  let prezente = null;
  try {
    const presSnap = await db.collection(collName('prezente')).doc('state').get();
    if (presSnap.exists) prezente = presSnap.data();
  } catch(e) { console.warn('prezente fetch error:', e.message); }

  // Statistici sumare
  const allDrivers = [];
  Object.values(concedii).forEach(doc => {
    (doc.drivers || []).forEach(d => {
      if (!allDrivers.find(x => x.id === d.id)) allDrivers.push(d);
    });
  });

  const backup = {
    version: 3,
    year: YEAR,
    savedAt: now.toISOString(),
    date: dateStr,
    time: timeStr,
    savedBy: 'github-actions-22:00',
    driverCount: allDrivers.length,
    thresholds: concedii['tania']?.thresholds || { warn: 3, crit: 5 },
    drivers: allDrivers,
    prezente: prezente?.presence || {},
    sortatori: sortatori ? {
      drivers: sortatori.drivers || [],
      presence: sortatori.presence || {}
    } : null,
    _raw_concedii: concedii
  };

  console.log(`Fetched: ${allDrivers.length} drivers, prezente keys: ${Object.keys(backup.prezente).length}`);
  return backup;
}

// ── Send email ─────────────────────────────────────────────
async function sendBackupEmail(backup) {
  const json = JSON.stringify(backup, null, 2);
  const filename = `mtc-backup-${backup.date}-22h.json`;

  // Salvează local pentru log
  fs.writeFileSync(`/tmp/${filename}`, json);
  console.log(`Backup JSON size: ${(json.length / 1024).toFixed(1)} KB`);

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS  // Gmail App Password (nu parola normală!)
    }
  });

  const driverCount = backup.driverCount;
  const prezLuni = Object.keys(backup.prezente).length;
  const sortCount = backup.sortatori?.drivers?.length || 0;

  await transporter.sendMail({
    from: `"MTC Backup" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_TO,
    subject: `✅ Backup MTC Transport — ${backup.date} ora 22:00`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:500px">
        <h2 style="color:#6366f1">📦 Backup zilnic MTC Transport</h2>
        <p>Backup automat generat în data de <strong>${backup.date}</strong> la ora <strong>22:00</strong>.</p>
        <table style="border-collapse:collapse;width:100%">
          <tr><td style="padding:6px;background:#f5f5f5"><strong>👥 Persoane</strong></td><td style="padding:6px">${driverCount}</td></tr>
          <tr><td style="padding:6px;background:#f5f5f5"><strong>📅 Luni cu prezențe</strong></td><td style="padding:6px">${prezLuni}</td></tr>
          <tr><td style="padding:6px;background:#f5f5f5"><strong>📦 Sortatori</strong></td><td style="padding:6px">${sortCount}</td></tr>
          <tr><td style="padding:6px;background:#f5f5f5"><strong>💾 Mărime JSON</strong></td><td style="padding:6px">${(JSON.stringify(backup).length/1024).toFixed(1)} KB</td></tr>
        </table>
        <p style="margin-top:20px">Fișierul JSON este atașat acestui email. Îl poți folosi pentru restaurare din aplicație (butonul <em>📂 Încarcă backup fișier</em>).</p>
        <p style="color:#999;font-size:12px">Backup generat automat prin GitHub Actions • MTC Transport GESTIUNE PERSONAL</p>
      </div>
    `,
    attachments: [{
      filename,
      content: json,
      contentType: 'application/json'
    }]
  });

  console.log(`Email sent to ${process.env.EMAIL_TO}`);
}

// ── Main ───────────────────────────────────────────────────
(async () => {
  try {
    const backup = await fetchAll();
    await sendBackupEmail(backup);
    console.log('✅ Backup completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Backup failed:', err);
    process.exit(1);
  }
})();
