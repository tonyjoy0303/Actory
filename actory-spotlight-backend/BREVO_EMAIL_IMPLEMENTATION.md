# 📧 Brevo Email Verification - Complete Implementation Guide

## Overview

This guide walks you through implementing **Brevo** for email verification during user registration on **Render**.

**Email Flow:**
```
User Registration → OTP Generated → Email via Brevo → User Verifies OTP → Account Created
```

---

## 📋 Step-by-Step Implementation

### **Phase 1: Brevo Account Setup (10 minutes)**

#### 1.1 Create Brevo Account
1. Go to https://www.brevo.com/
2. Click **"Sign Up Free"**
3. Enter your email and password
4. Verify your email
5. Complete the signup process

#### 1.2 Verify Your Sender Email
This is **required** for sending emails.

1. Login to Brevo Dashboard
2. Go to **Senders & API → Sender List**
3. Click **"Add a sender"**
4. Fill in:
   - **Email:** Your email (e.g., `noreply@actory.com` or `tony@gmail.com`)
   - **Name:** `Actory Spotlight`
5. Click **"Verify"**
6. Check your email inbox and click the verification link
7. Status should show **✅ Verified**

#### 1.3 Generate REST API Key (Recommended)
This is the best approach for Render.

1. Go to **Senders & API → API Keys**
2. Click **"Create a new API key"**
3. Fill in:
   - **Name:** `Actory-Production`
   - **Permissions:** `Full access`
4. Click **"Generate"**
5. **Copy the API key** (starts with `SG.`)
6. **Save it securely!**

Example key format: `SG.v91x_M3dSWFsN7X5mK8pL9q...`

---

### **Phase 2: Environment Variables Setup (5 minutes)**

#### 2.1 Local Testing (.env file)
Create a `.env` file in `actory-spotlight-backend/`:

```env
# Brevo Configuration (REST API - Recommended)
BREVO_API_KEY=SG.your_api_key_here
BREVO_FROM_EMAIL=noreply@actory.com
BREVO_FROM_NAME=Actory Spotlight

# Alternative: Brevo SMTP (Optional fallback)
BREVO_SMTP_HOST=smtp-relay.brevo.com
BREVO_SMTP_PORT=587
BREVO_SMTP_USER=your-email@gmail.com
BREVO_SMTP_PASS=your_smtp_key_here

# Other existing variables
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_secret_key
NODE_ENV=development
```

#### 2.2 Render Production Variables
1. Go to Render Dashboard
2. Select your backend service
3. Click **"Environment"**
4. Add these variables:

| Variable | Value |
|----------|-------|
| `BREVO_API_KEY` | `SG.xxx...` (from step 1.3) |
| `BREVO_FROM_EMAIL` | Your verified sender email |
| `BREVO_FROM_NAME` | `Actory Spotlight` |
| `NODE_ENV` | `production` |

**Optional (for SMTP fallback):**
| `BREVO_SMTP_HOST` | `smtp-relay.brevo.com` |
| `BREVO_SMTP_PORT` | `587` |
| `BREVO_SMTP_USER` | Your Brevo email |
| `BREVO_SMTP_PASS` | Your SMTP key |

---

### **Phase 3: Code Implementation (Already Done ✅)**

The code has been updated with Brevo support:

#### 3.1 Email Service (`utils/emailService.js`)

**New Features:**
- ✅ Brevo REST API as primary sender (fast, reliable)
- ✅ SMTP fallback if REST API fails
- ✅ Beautiful HTML email templates
- ✅ Error handling and logging

**How it works:**
1. Tries to send via Brevo REST API first
2. If API fails, falls back to SMTP (Brevo or Gmail)
3. If SMTP also fails, throws error with clear message

**Email Functions:**
```javascript
// Sends verification OTP email
sendVerificationEmail(user, otp)

// Sends password reset email
sendPasswordResetEmail(user, resetToken, resetUrl)

// Generic email sender
sendEmail(options)
```

#### 3.2 Registration Flow (`controllers/auth.js`)

**Current Flow:**
```
1. User fills registration form
2. Validate input
3. Check if email exists
4. Generate 6-digit OTP
5. Create PendingUser (temporary record)
6. Send OTP via Brevo
7. Return success message
8. Frontend shows OTP input form
9. User enters OTP
10. verifyEmail endpoint called
11. Match OTP with PendingUser
12. Create permanent User record
13. Delete PendingUser
14. User can now login
```

**Key Features:**
- OTP expires in **10 minutes**
- PendingUser auto-deletes after 10 minutes (TTL index)
- Email sending doesn't block registration
- Beautiful HTML emails with branding

---

## 🧪 Testing the Implementation

### **Test 1: Local Testing with Ethereal (Free)**

1. Set environment variables:
```env
USE_ETHEREAL=true
NODE_ENV=development
```

2. Run server:
```bash
npm run dev
```

3. Register a user via API:
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "Test123456",
    "role": "Actor",
    "age": 25,
    "gender": "male",
    "experienceLevel": "beginner",
    "phone": "1234567890",
    "location": "New York"
  }'
```

4. Check console for **Ethereal preview link**
5. Open link to see the email

### **Test 2: Local Testing with Brevo (Real Email)**

1. Set environment variables:
```env
BREVO_API_KEY=SG.your_api_key
BREVO_FROM_EMAIL=your-verified-sender@example.com
BREVO_FROM_NAME=Actory Spotlight
NODE_ENV=development
```

2. Run server:
```bash
npm run dev
```

3. Register a test user with your real email
4. Check your inbox for the OTP
5. Extract OTP from email
6. Verify email via API:
```bash
curl -X POST http://localhost:5000/api/v1/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "otp": "123456"
  }'
```

7. Success response should indicate email is verified

### **Test 3: Render Production Testing**

1. Deploy to Render:
```bash
git add .
git commit -m "Implement Brevo email verification"
git push origin main
```

2. Render automatically redeploys
3. Test registration from your frontend
4. Check Brevo dashboard for sent emails
5. Verify user receives OTP in inbox

---

## 📊 Email Templates

### **Verification Email**
- Beautiful gradient header
- Large, prominent OTP code
- Security warnings
- Footer with links

### **Password Reset Email**
- Gradient design matching verification
- Reset button with call-to-action
- Expiration notice (10 minutes)
- Copy-paste link as fallback
- Security note

---

## 🔍 Troubleshooting

### **❌ Email Not Sent**

**Check 1: Is API key correct?**
```bash
echo "BREVO_API_KEY=$BREVO_API_KEY"
```

**Check 2: Is sender email verified?**
- Go to Brevo Dashboard → Sender List
- Verify it shows ✅ Verified status

**Check 3: Check logs**
- Local: Look at terminal output
- Render: Go to **Logs** tab in dashboard

### **❌ "BREVO_API_KEY is not configured"**

Solution: Add `BREVO_API_KEY` environment variable:
- Local: Add to `.env` file
- Render: Add to Environment variables

### **❌ Email goes to spam**

Solutions:
1. Use a branded sender email (not noreply@)
2. Verify sender in Brevo (not just API)
3. Wait 24 hours after adding sender (warming period)
4. Check Brevo reputation (Senders & API → Status)

### **❌ SMTP Fallback errors**

Brevo SMTP sometimes fails. REST API is more reliable.
- Ensure `BREVO_SMTP_PASS` is the SMTP key, not the API key
- SMTP key is different from API key

---

## ✅ Checklist

- [ ] Created Brevo account at brevo.com
- [ ] Verified sender email in Brevo
- [ ] Generated API key
- [ ] Added environment variables to `.env`
- [ ] Added environment variables to Render
- [ ] Code updated with Brevo support (`utils/emailService.js`)
- [ ] Tested registration locally with Brevo
- [ ] Tested OTP verification locally
- [ ] Deployed to Render
- [ ] Tested registration from production frontend
- [ ] Received test email successfully

---

## 🚀 What's Next?

After Brevo is working:

1. **Test End-to-End:**
   - Register → Receive email → Verify → Login ✅

2. **Monitor Brevo:**
   - Go to Senders & API → **Logs**
   - See all emails sent/failed
   - Track delivery status

3. **Customize:**
   - Edit email templates in `utils/emailService.js`
   - Change `BREVO_FROM_NAME` to your brand
   - Add your logo/footer links

4. **Scale:**
   - Brevo free tier: 300 emails/day
   - For more, upgrade to paid plan ($20+/month)

---

## 📞 Support

**Brevo Help:**
- Dashboard: https://www.brevo.com/
- Docs: https://developers.brevo.com/
- Email support: support@brevo.com

**Actory Help:**
- Check logs: Render → Logs tab
- Check console: Local terminal
- Review code: `utils/emailService.js`

---

## 🎉 Success Indicators

✅ User registers → Receives email with OTP
✅ User enters OTP → Account verified
✅ User can login → Authentication works
✅ Brevo dashboard shows sent emails
✅ No errors in Render logs

**You're done!** Your Brevo email verification is ready! 🎊
