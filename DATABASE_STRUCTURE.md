# Database Structure & Tables

## Current Storage System

The application currently uses **file-based storage** (JSON files) stored in the `.data` directory. This is not a traditional database, but acts as a persistent storage layer.

## Data Collections/Tables

### Currently Active (9 Collections)

1. **users** - User accounts (citizens, officials, admins)
   - File: `users.json`
   - Stores: username, password, email, phone, role, department, ratings, etc.

2. **applications** - Citizen applications
   - File: `applications.json`
   - Stores: tracking ID, status, department, citizen ID, official ID, etc.

3. **applicationHistory** - Application status history
   - File: `applicationHistory.json`
   - Stores: status changes, comments, timestamps

4. **feedback** - User feedback and ratings
   - File: `feedback.json`
   - Stores: ratings, comments, verification status

5. **otpRecords** - OTP verification records
   - File: `otpRecords.json`
   - Stores: OTP codes, expiration, verification status

6. **blockchainHashes** - Blockchain verification hashes
   - File: `blockchainHashes.json`
   - Stores: SHA-256 hashes for approved applications

7. **notifications** - User notifications
   - File: `notifications.json`
   - Stores: notification messages, read status

8. **departments** - Government departments
   - File: `departments.json`
   - Stores: department names, descriptions

9. **warnings** - Official warnings
   - File: `warnings.json`
   - Stores: warning messages for officials

### Defined but Not Fully Implemented (3 Collections)

10. **judges** - Judge information (judicial system)
    - Currently defined in schema but not actively used

11. **cases** - Legal cases
    - Currently defined in schema but not actively used

12. **hearings** - Court hearings
    - Currently defined in schema but not actively used

## Database Options Available

### 1. File-Based Storage (Current)
- **Type**: JSON files in `.data` directory
- **Tables/Collections**: 9 active
- **Location**: `server/storage.ts` (MemStorage class)
- **Persistence**: Files are saved to disk automatically

### 2. MongoDB (Available but not active)
- **Type**: MongoDB database
- **Collections**: Same 9 collections
- **Location**: `server/mongodb-storage.ts` (MongoDBStorage class)
- **Status**: Code exists but not currently used

### 3. PostgreSQL (Schema defined)
- **Type**: PostgreSQL database
- **Tables**: 12 tables defined in `shared/schema.ts`
- **Status**: Schema exists but not currently implemented

## Summary

- **Active Collections/Tables**: **9**
- **Total Defined**: **12** (9 active + 3 defined but not used)
- **Current Database**: **File-based (JSON files)**
- **Storage Location**: `.data` directory
- **Database Files**: 9 JSON files

## File Structure

```
.data/
├── users.json
├── applications.json
├── applicationHistory.json
├── feedback.json
├── otpRecords.json
├── blockchainHashes.json
├── notifications.json
├── departments.json
└── warnings.json
```

## Switching Database

To switch to MongoDB:
1. Update `server/storage.ts` to use `MongoDBStorage` instead of `MemStorage`
2. Configure MongoDB connection in `.env`
3. Run MongoDB server

To switch to PostgreSQL:
1. Implement PostgreSQL storage class
2. Configure PostgreSQL connection
3. Run database migrations

