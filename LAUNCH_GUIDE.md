# 🚀 SMC GEC Palanpur — Website Launch & Google Drive Connection Guide

---

## 1. 🌐 Website Ko Internet Par Launch (Live) Karne Ke Steps (100% FREE)

Aap apni is website ko **2 minute me free me live** kar sakte hain taaki sabhi committee members aur college wale apne phone ya laptop se is website ko access kar sakein.

### Option A: Netlify Drop (Sabse Aasan — 1 Minute)
1. Browser me [https://app.netlify.com/drop](https://app.netlify.com/drop) kholein.
2. Apna free account banayein (Google / GitHub se login karein).
3. Apne computer se pura **`final project`** folder drag karke Netlify ke page par **Drop** kar dein.
4. **Bas ho gaya!** Netlify aapko ek free live URL de dega (Jaise: `smc-gec-palanpur.netlify.app`), jise aap sabhi committee members ko WhatsApp par bhej sakte hain.

### Option B: Vercel (Fast & Professional)
1. [https://vercel.com](https://vercel.com) par free account banayein.
2. "Add New Project" par click karein.
3. Folder upload karein ya GitHub repository connect karein.
4. "Deploy" par click karein. Aapki website live ho jayegi!

### Option C: GitHub Pages (College Repository)
1. GitHub par ek new repository banayein: `smc-gec-palanpur`.
2. Saari files push karein.
3. Repository Settings ➔ Pages me jaakar `main` branch select karein.
4. Aapka URL `https://yourusername.github.io/smc-gec-palanpur` live ho jayega.

---

## 2. 📁 Bill (Images / PDF) Storage Solution

### Abhi Kaise Kaam Kar Raha Hai (In-Browser Storage):
- Abhi system me **Real File Picker** laga diya gaya hai.
- Jab Procurement Committee koi Bill (Image ya PDF) choose karti hai, to wo base64 me encode hokar direct browser ke database me save ho jati hai.
- Account Committee **"👁️ View Attachment"** ya **"👁️ View Bill"** par click karke wahi bill document dekh sakti hai aur download bhi kar sakti hai.

---

## 3. ☁️ Google Drive Se Connect Karne Ke Steps

Agar aap chahte hain ki saare uploaded Bills automatic aapke **Google Drive Folder** me save ho jayein:

### Method 1: Google Apps Script (Free & Direct Webhook)
1. Apne college ke Google Drive me ek folder banayein: `SMC_Bills_GEC_Palanpur`.
2. [script.google.com](https://script.google.com) par jayein aur **New Project** banayein.
3. Yeh chhota sa code paste karein:
   ```javascript
   function doPost(e) {
     var data = JSON.parse(e.postData.contents);
     var folder = DriveApp.getFolderById("YOUR_FOLDER_ID_HERE");
     var contentType = data.fileType || "image/jpeg";
     var bytes = Utilities.base64Decode(data.fileData.split(',')[1]);
     var blob = Utilities.newBlob(bytes, contentType, data.fileName);
     var file = folder.createFile(blob);
     return ContentService.createTextOutput(JSON.stringify({ status: "success", url: file.getUrl() }))
       .setMimeType(ContentService.MimeType.JSON);
   }
   ```
4. **Deploy as Web App** karein aur "Anyone" access select karein.
5. Jo Webhook URL mile, use app ke `BillManagement.jsx` me `fetch(url, { method: 'POST', body: ... })` se connect kar dein!

### Method 2: Firebase Storage / Supabase (Standard Cloud Storage)
- **Supabase Storage** ya **Firebase Storage** (1GB free) se connect karke unlimited PDF aur Bills store kiye ja sakte hain.
