🔐 EskroSecure — A Secure Escrow Web App with Passwordless Authentication and Tamper-Evident Logs
> Final Year Project | Bachelor of Information Technology (Hons) in Computer System Security (BCSS)  
> Universiti Kuala Lumpur — Malaysian Institute of Information Technology (UniKL MIIT)
---
📌 Overview
EskroSecure is a secure web-based escrow platform built for Consumer-to-Consumer (C2C) transactions. It safely holds funds until transaction terms are met — protecting both buyers and sellers from online fraud commonly seen on platforms like Facebook Marketplace and Mudah.my.
The platform is hardened with three core security pillars:
🔑 Passwordless Authentication (WebAuthn / Passkeys)
🛡️ Anti-Replay Attack Protection (Nonces + Timestamps)
📋 Tamper-Evident Audit Logs (HMAC-SHA256 Hash Chains)
---
❗ Problem Statement
The growth of C2C e-commerce in Malaysia has led to a rise in online transaction fraud. Traditional platforms lack:
Strong authentication (passwords are easily stolen or phished)
Protection against replay attacks
Immutable audit logs — leaving transaction records open to tampering
---
🎯 Objectives
Study vulnerabilities in escrow authentication, replay attacks, and audit logging
Develop a secure escrow web app with passwordless login, anti-replay features, and tamper-evident logs
Test the application against common cyber attacks and evaluate its log integrity
---
🚀 Features
🔑 Passwordless Authentication (WebAuthn / FIDO2)
Users log in using device-bound passkeys (biometrics or PIN) via `@simplewebauthn`
Eliminates risks of phishing, credential stuffing, and password reuse
No passwords stored — ever
🛡️ Anti-Replay Attack Protection
Every transaction request is signed with a unique nonce + server timestamp
Duplicate or replayed requests are automatically rejected
Result during testing: 0 successful replay attacks
📋 Tamper-Evident Audit Logs
Every action is cryptographically chained using HMAC-SHA256
Each log entry includes the hash of the previous entry
Any modification to historical records breaks the chain and is immediately detectable
🔒 Additional Security
AES-256 database encryption for all sensitive data at rest
Session management via `iron-session`
Payment flow integrated via ToyyibPay Sandbox API
Tested against OWASP-based attack vectors
---
👥 User Roles
Role	Capabilities
Buyer	Create escrow contracts, deposit funds, confirm item receipt
Seller	Accept contracts, receive payment upon buyer confirmation
Admin	Monitor transactions, view audit logs, manage disputes
---
🛠️ Tech Stack
Layer	Technology
Framework	Next.js 16
Frontend	React 19, Tailwind CSS
Authentication	WebAuthn / FIDO2 (`@simplewebauthn`)
Session Management	`iron-session`
Database ORM	Prisma
Email	Nodemailer / Resend
Payment	ToyyibPay Sandbox API
Hosting	Render
---
🧪 Security Testing Results
Vulnerability	Status
Replay Attack	✅ Mitigated
Password Phishing	✅ Mitigated (no passwords used)
Audit Log Tampering	✅ Detected & Blocked
Database Exposure	✅ Mitigated (AES-256 encryption)
CSP / HTTP Headers	✅ Hardened
---
📁 Project Structure
```
Eskro-FYP/
├── components/      # Reusable UI components
├── lib/             # Helper functions & utilities
├── pages/           # Next.js pages & API routes
│   └── api/         # Backend API endpoints
├── prisma/          # Prisma schema & database config
├── public/          # Static assets
├── scripts/         # Utility scripts
├── styles/          # Global CSS styles
├── .gitignore
├── next.config.mjs
├── package.json
└── README.md
```
---
⚙️ Getting Started
Prerequisites
Node.js v18+
npm or yarn
A modern browser with WebAuthn support (Chrome, Safari, Edge, Firefox)
A database (PostgreSQL recommended with Prisma)
Installation
```bash
# Clone the repository
git clone https://github.com/ikhwanishak/Eskro-FYP.git

# Navigate to project directory
cd Eskro-FYP

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Fill in your configuration in .env

# Set up the database
npx prisma migrate dev

# Start the development server
npm run dev
```
Open http://localhost:3000 in your browser.
Environment Variables
```env
DATABASE_URL=your_database_url
HMAC_SECRET=your_hmac_secret_key
AES_KEY=your_aes_256_key
SESSION_SECRET=your_iron_session_secret
TOYYIBPAY_API_KEY=your_toyyibpay_key
RESEND_API_KEY=your_resend_api_key
```
---
⚠️ Limitations
Payment integration uses ToyyibPay Sandbox — not live financial transactions
Session hijacking remains a residual risk if a user's personal device or biometric authenticator is compromised
Deployed on Render (free tier) — may introduce minor latency under heavy loads
---
👨‍💻 Author
Muhammad Ikhwan bin Ishak  
📧 mikhwan.ishak@s.unikl.edu.my  
🎓 Bachelor of IT (Hons) in Computer System Security — UniKL MIIT
Supervisor: Ts. Norsuhaili Seid  
📧 norsuhaili@unikl.edu.my
---
📄 License
This project is submitted as an academic Final Year Project at Universiti Kuala Lumpur (UniKL MIIT). All rights reserved.
---
> *"Built to solve a real problem — because every Malaysian deserves safer online transactions."*
