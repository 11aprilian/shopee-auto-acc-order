# Shopee Auto Accept Order

Automated order acceptance and mass shipping configuration tool for Shopee Seller Center, built with Node.js, Puppeteer, and Electron.

## 🔧 Features

- Automatically logs into Shopee Seller Center (with cookie session support)
- Navigates to the Mass Shipping page
- Changes pagination to 200 items per page
- Iterates through shipping channel filters and selects checkboxes for mass orders
- Clicks the "Set to Dropoff Counter Massively" button automatically
- Skips filters with no orders
- Electron-wrapped with GUI and portable build option (Windows)

## 📦 Folder Structure

├── index.js 
├── main.js
├── index.html 
├── config.js 
├── cookies.json 
├── utils/
│ └── auth.js 
└── package.json


## 🚀 How to Run (Development)

1. Clone the repository

```bash
git clone https://github.com/your-username/shopee-auto-acc-order.git
cd shopee-auto-acc-order 
```

2. Install dependencies

```bash
npm install
```


3. Start the app

```bash
npm start
```

This will launch the Electron app and start the Shopee automation.

## 🛠 Build as Portable .exe
To build the app as a standalone portable Windows app:

```bash
npm run build
```
Output will be in the dist/ folder, with a single .exe file that can be run without installation.

⚠️ Note: This tool requires manual login the first time and supports OTP verification. After that, the session is saved in cookies.json.

## 📋 Requirements
Node.js v18+

Internet connection

Windows OS (for now)

## 📎 Disclaimer
This project is intended for personal productivity automation and educational purposes only. Use it responsibly. Your Shopee account is your responsibility.
