# Brevo Email Setup Guide

## 1. Create Brevo Account

### A. Sign Up
1. Go to https://www.brevo.com/
2. Click "Sign Up Free"
3. Fill in your details:
   - Email address
   - Password
   - Company name (or "Personal")
4. Click "Create my account"
5. Verify your email (check your inbox)

### B. Verify Your Sender Email
1. Login to Brevo Dashboard
2. Go to **Senders & API → Sender List**
3. Click **Add a sender**
4. Enter your details:
   - Email: `your-email@gmail.com` (or your actual email)
   - Name: `Actory` (or your app name)
5. Brevo will send a verification email
6. Click the verification link in the email
7. Wait for "Verified" status (usually instant)

### C. Generate SMTP Credentials (for SMTP approach)
Alternative if you want to use SMTP instead of REST API:
1. Go to **Senders & API → SMTP & API**
2. Click **Generate a new SMTP key**
3. Save these credentials:
   - Host: `smtp-relay.brevo.com`
   - Port: `587` (TLS) or `465` (SSL)
   - Username: Your Brevo login email
   - Password: The generated SMTP key

### D. Generate REST API Key (Recommended for Render)
1. Go to **Senders & API → API Keys**
2. Click **Create a new API key**
3. Name it: `Actory-Production`
4. Select permissions: **Full access** (or just Email sending)
5. Copy the API key (starts with `SG.`)
6. **Keep this secret!**

---

## 2. Add Environment Variables to Render

### In Render Dashboard:
1. Go to your backend service
2. Click **Environment**
3. Add these variables:

```
BREVO_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxx
BREVO_SMTP_HOST=smtp-relay.brevo.com
BREVO_SMTP_PORT=587
BREVO_SMTP_USER=your-email@gmail.com
BREVO_SMTP_PASS=your-generated-smtp-key
BREVO_FROM_EMAIL=your-verified-sender@gmail.com
BREVO_FROM_NAME=Actory Spotlight
```

---

## 3. Implementation Options

### Option A: REST API (Recommended - Fastest)
- ✅ No SMTP port issues
- ✅ Works on all platforms (Render, Vercel, etc.)
- ✅ Better reliability
- ✅ Easy to implement

### Option B: SMTP (Traditional)
- ✅ Works on Render
- ❌ May fail on Vercel (port blocking)
- Works with existing nodemailer setup

---

## 4. Pricing

- **Free tier:** 300 emails/day (perfect for testing)
- **Paid:** Starts at $20/month for 20,000 emails

---

## Next Steps

After setting up Brevo, run the implementation script I'll provide to update your code.
