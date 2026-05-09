# 📅 Concedii Persoane — Bayern

Aplicație web pentru gestionarea concediilor, funcționează pe **web, iOS și Android** via browser.  
Date stocate în **Firebase Firestore** (cloud). Autentificare simplă: **2 butoane** (Raluca / Tania) + **login Admin** cu email și parolă.

---

## 🚀 Pași de configurare (~30 minute)

### PASUL 1 — Creează proiect Firebase

1. Mergi la [console.firebase.google.com](https://console.firebase.google.com)
2. Click **"Add project"** → dă un nume (ex: `concedii-bayern`) → **Create project**

---

### PASUL 2 — Activează autentificarea Email/Password

1. În Firebase Console → **Authentication** → **Get started**
2. Tab **Sign-in method** → click **Email/Password** → **Enable** → **Save**
3. Mergi la tab **Users** → **Add user**
4. Email: `paulandreimacarie@yahoo.com`, Parolă: alege una sigură → **Add user**

> Aceasta este parola pe care o vei folosi la butonul "Login Admin" din aplicație.

---

### PASUL 3 — Creează baza de date Firestore

1. Firebase Console → **Firestore Database** → **Create database**
2. **"Start in production mode"** → `europe-west` → **Enable**
3. Tab **Rules** → înlocuiește tot cu:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /concedii/shared {
      allow read, write: if true;
    }
  }
}
```
4. Click **Publish**

---

### PASUL 4 — Adaugă aplicația web & copiază config

1. **Project Settings** → tab **General** → **`</>`** (Web) → Register
2. Copiază obiectul `firebaseConfig`
3. Deschide `index.html`, găsește secțiunea marcată cu 🔧 și înlocuiește valorile

---

### PASUL 5 — Publică pe GitHub Pages

1. Creează repository nou pe github.com → încarcă `index.html`
2. **Settings** → **Pages** → Source: `main`, `/ (root)` → **Save**
3. URL: `https://USERNAME.github.io/REPO/`

---

### PASUL 6 — Adaugă domeniul în Firebase Auth

Firebase Console → **Authentication** → **Settings** → **Authorized domains** → Add `USERNAME.github.io`

---

## 🖥️ Utilizatori

| Utilizator | Cum intră | Acces |
|---|---|---|
| **Raluca** | Click buton Raluca | Calendar comun |
| **Tania** | Click buton Tania | Calendar comun |
| **Admin** | Buton Login Admin + parolă | Calendar comun + drepturi admin |

Toți văd și editează **același calendar shared**.

---

## 📱 Telefon

- **iOS Safari**: Share → Add to Home Screen  
- **Android Chrome**: ⋮ → Add to Home screen
