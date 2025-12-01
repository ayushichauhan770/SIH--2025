# MongoDB Setup Guide

This project now uses MongoDB for data storage instead of in-memory/file storage.

## Prerequisites

1. **Install MongoDB**: 
   - Download and install MongoDB Community Edition from [mongodb.com](https://www.mongodb.com/try/download/community)
   - Or use MongoDB Atlas (cloud-hosted) for free: [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)

2. **MongoDB is already installed** via npm (mongoose package)

## Configuration

### Local MongoDB Setup

1. **Start MongoDB locally**:
   ```bash
   # Windows (if installed as service, it should start automatically)
   # Or manually:
   mongod
   
   # macOS/Linux
   sudo systemctl start mongod
   # or
   mongod
   ```

2. **Set Environment Variable** (optional):
   - Default connection: `mongodb://localhost:27017/smart_india_project`
   - To use a custom MongoDB URI, set the `MONGODB_URI` environment variable:
     ```bash
     # Windows PowerShell
     $env:MONGODB_URI="mongodb://localhost:27017/smart_india_project"
     
     # Windows CMD
     set MONGODB_URI=mongodb://localhost:27017/smart_india_project
     
     # macOS/Linux
     export MONGODB_URI="mongodb://localhost:27017/smart_india_project"
     ```

### MongoDB Atlas Setup (Cloud)

1. **Create a free MongoDB Atlas account** at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)

2. **Create a cluster** (free tier available)

3. **Get your connection string**:
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/dbname`)

4. **Set the MONGODB_URI environment variable**:
   ```bash
   # Replace with your actual connection string
   $env:MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/smart_india_project"
   ```

## Running the Application

1. **Make sure MongoDB is running** (if using local MongoDB)

2. **Start the application**:
   ```bash
   npm run dev
   ```

3. **The application will automatically**:
   - Connect to MongoDB on startup
   - Create collections if they don't exist
   - Seed initial data (if configured)

## Data Migration

If you have existing data in files (`.data` directory), you'll need to migrate it manually or start fresh. The MongoDB storage will create new collections automatically.

## Collections Created

The following collections will be created automatically:
- `users` - User accounts (citizens, officials, admins)
- `applications` - Citizen applications
- `applicationhistories` - Application status history
- `feedbacks` - Ratings and feedback
- `otprecords` - OTP verification records
- `blockchainhashes` - Blockchain hash records
- `notifications` - User notifications
- `departments` - Department information
- `warnings` - Official warnings

## Troubleshooting

### Connection Errors

- **"MongoServerError: connect ECONNREFUSED"**: MongoDB is not running. Start MongoDB service.
- **"Authentication failed"**: Check your MongoDB credentials in the connection string.
- **"Database name not specified"**: Make sure the database name is included in the connection string.

### Performance

- MongoDB automatically creates indexes on frequently queried fields
- For large datasets, consider adding additional indexes based on your query patterns

## Environment Variables

Create a `.env` file in the project root (optional):

```env
MONGODB_URI=mongodb://localhost:27017/smart_india_project
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/smart_india_project
```

## Benefits of MongoDB

- ✅ Persistent data storage (survives server restarts)
- ✅ Scalable and performant
- ✅ No file system dependencies
- ✅ Easy backup and restore
- ✅ Cloud hosting options (MongoDB Atlas)
- ✅ Automatic indexing for fast queries

