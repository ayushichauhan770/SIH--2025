# How to Clear All Data

There are several ways to clear all accounts and data:

## Method 1: Using the API Endpoint (Recommended)

1. **Start your server** (if not already running):
   ```bash
   npm run dev
   ```

2. **Call the clear data endpoint** using one of these methods:

   **Using PowerShell:**
   ```powershell
   Invoke-WebRequest -Uri "http://localhost:5000/api/admin/clear-all-data" -Method POST
   ```

   **Using Node.js script:**
   ```bash
   node clear-data.js
   ```

   **Using curl (if available):**
   ```bash
   curl -X POST http://localhost:5000/api/admin/clear-all-data
   ```

## Method 2: Delete the .data Directory Manually

You can manually delete the `.data` directory which contains all persisted data:

**Using PowerShell:**
```powershell
Remove-Item -Recurse -Force .data
```

**Using Command Prompt:**
```cmd
rmdir /s /q .data
```

**Using File Explorer:**
- Navigate to your project folder
- Delete the `.data` folder

## Method 3: Restart Server (Clears Memory, but files remain)

If you just restart the server, it will clear in-memory data, but the `.data` files will remain and be reloaded. To fully clear, use Method 1 or 2.

## What Gets Cleared

When you clear all data, the following will be deleted:
- All user accounts
- All applications
- All application history
- All feedback/ratings
- All OTP records
- All blockchain hashes
- All notifications
- All departments
- All warnings
- All data files in the `.data` directory

**Note:** After clearing data, the server will automatically seed initial data (admin accounts, departments, etc.) on the next startup.

