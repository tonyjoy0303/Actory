# 🚀 Brevo Quick Start (5 Minutes)

## Step 1: Create Brevo Account (2 min)
```
1. Go: https://www.brevo.com/
2. Sign up free
3. Verify email
```

## Step 2: Verify Sender Email (1 min)
```
1. Brevo Dashboard → Senders & API → Sender List
2. Add sender: noreply@yourcompany.com
3. Verify email link (check inbox)
4. Wait for ✅ Verified status
```

## Step 3: Generate API Key (1 min)
```
1. Brevo Dashboard → Senders & API → API Keys
2. Create new API key
3. Name: "Actory-Production"
4. Copy key: SG.xxxxx...
```

## Step 4: Add Environment Variables (1 min)

### Local (.env file)
```env
BREVO_API_KEY=SG.your_key_here
BREVO_FROM_EMAIL=noreply@yourcompany.com
BREVO_FROM_NAME=Actory Spotlight
```

### Render Dashboard
Same 3 variables in **Environment** section.

## Done! ✅

Now:
- Register a user → Receives OTP email
- Enter OTP → Account verified
- Login → Works!

---

## Test Immediately

### Terminal
```bash
npm run dev
```

### cURL (Register)
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test",
    "email": "test@example.com",
    "password": "Test123",
    "role": "Actor",
    "age": 25,
    "gender": "male",
    "experienceLevel": "beginner",
    "phone": "1234567890",
    "location": "NY"
  }'
```

### Check inbox for OTP email ✉️

### cURL (Verify)
```bash
curl -X POST http://localhost:5000/api/v1/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "otp": "123456"
  }'
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Email not sent | Check `BREVO_API_KEY` is set correctly |
| "Not verified" error | Verify sender email in Brevo (check spam) |
| Logs not showing | Add missing env variables |
| Still not working | Check terminal for error messages |

---

## Files Updated

✅ `utils/emailService.js` - Brevo REST API integration
✅ `BREVO_SETUP.md` - Detailed setup guide
✅ `BREVO_EMAIL_IMPLEMENTATION.md` - Full implementation guide
✅ `BREVO_CHANGES_SUMMARY.md` - What changed summary

---

**Need more help?** Read `BREVO_EMAIL_IMPLEMENTATION.md` for detailed instructions!
