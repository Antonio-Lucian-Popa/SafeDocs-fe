# 📂 SafeDocs – Frontend

Frontend-ul oficial pentru aplicația **SafeDocs**, construit cu **React + Vite + TypeScript**, **TailwindCSS** și **shadcn/ui**.  
Aplicația oferă o interfață modernă și responsivă pentru gestionarea documentelor, similar cu Google Drive, dar cu funcționalități suplimentare precum remindere și versionare.

---

## 🚀 Tech Stack

- ⚡ [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- 🎨 [TailwindCSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- 🧭 [React Router](https://reactrouter.com/)
- 📡 [Axios](https://axios-http.com/) cu interceptori JWT (access + refresh)
- 🔑 Google Identity Services (login cu Google)
- 🔄 React Query (opțional, pentru fetching/caching date)
- 📦 TypeScript pentru tipuri stricte

---

## 🔑 Autentificare

Fluxul de login:

Utilizatorul apasă "Sign in with Google".

Google returnează un id_token.

Frontend-ul face POST /auth/google la backend → primește { accessToken, refreshToken }.

Access token-ul e păstrat în memorie; refresh-ul în localStorage.

Axios are interceptor care face automat POST /auth/refresh la expirare.

Logout → POST /auth/logout.

# 📡 Endpoints consumate
## 🔐 Auth

POST /auth/google → login cu Google

POST /auth/refresh → reîmprospătare tokenuri

POST /auth/logout → logout

## 📁 Folders

GET /folders?parentId=...

POST /folders

## 📄 Documents

POST /documents

POST /documents/{id}/file

GET /documents/{id}

GET /documents/search?q=...

GET /documents/expiring-soon

## 🔀 Versions

GET /documents/{id}/versions

POST /documents/{id}/versions (upload nou)

POST /documents/{id}/versions/{versionNo}/revert

## 📥 Files

GET /files/{documentId}/download

## 🖥️ Pagini & UX

Login → buton Google Sign-In

Dashboard → grid tip drive (foldere + documente)

Document Details → versiuni, download, upload nou, revert

Expiring Soon → listă cu documente care expiră în următoarele 30 zile

Search → căutare globală documente după titlu/tag-uri