# Participant ID Flow

## How Users Get Their Participant ID

### 1. **Registration Process**
When users register for the study:

1. **Fill out registration form** (study group, demographics, etc.)
2. **Backend generates unique ID** automatically:
   ```
   Format: P + timestamp + random letters
   Example: P1703123456abc
   ```
3. **ID is returned to frontend** and temporarily stored
4. **User proceeds to consent page**

### 2. **Consent Page - ID Display**
On the consent page, users see:

- **Prominent blue box** with their Participant ID
- **Copy button** to easily copy the ID
- **Clear instructions** to save the ID for later use
- **Warning message** about the importance of saving it

### 3. **Dashboard - Persistent Display**
Once logged in, users can always see their ID:

- **Top-right corner** of dashboard shows their ID
- **Copy button** for easy access
- **Always visible** during their session

### 4. **Login Process**
For returning users:

- **Enter Participant ID** on login page
- **Helpful guidance** on where to find their ID
- **Recovery options** if they can't find it

## Key Features

### ✅ **User-Friendly Design**
- Clear, prominent display of Participant ID
- One-click copy functionality
- Multiple reminders to save the ID
- Helpful recovery instructions

### ✅ **Technical Implementation**
- ID generated server-side for security
- Temporary storage during registration flow
- Persistent display in dashboard
- Clipboard API for easy copying

### ✅ **Recovery Options**
- Clear instructions on where to find lost IDs
- Option to re-register with same information
- Research team contact for assistance

## User Journey

```
Registration → ID Generated → Consent (ID Displayed) → Dashboard (ID Always Visible)
     ↓
Login Page ← Returning User ← Save ID for Later
```

## Best Practices for Users

1. **Copy the ID** when first displayed
2. **Save it somewhere safe** (notes app, email, screenshot)
3. **Take a screenshot** of the consent page
4. **Use the copy button** whenever needed
5. **Don't rely on memory** - the ID is long and complex

## Troubleshooting

### "I can't find my Participant ID"
- Check browser saved passwords
- Look for screenshots or notes taken during registration
- Check email for any confirmations
- Contact research team
- Re-register with same information

### "The ID format looks wrong"
- Format: `P` + timestamp + 5 random characters
- Example: `P1703123456abc`
- All IDs start with capital `P`

### "I'm getting login errors"
- Make sure you're copying the complete ID
- Check for extra spaces or characters
- Try re-registering if needed

## Technical Notes

- IDs are **globally unique** across all participants
- Generated using **timestamp + crypto random** for uniqueness
- **No personal information** is encoded in the ID
- IDs are **case-sensitive** (always start with capital P)
- **Cannot be changed** once generated (for research integrity)
