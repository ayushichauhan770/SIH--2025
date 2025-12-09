
import { MemStorage } from './server/storage';
import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';

(async () => {
    console.log('--- Debugging Persistence ---');
    console.log('CWD:', process.cwd());
    const storage = new MemStorage();
    
    // Check if initial load worked (should have existing users if any)
    const officials = await storage.getAllOfficials();
    console.log('Initial Officials count:', officials.length);
    
    // Create a dummy user
    const username = `debug_user_${Date.now()}`;
    console.log(`Creating user: ${username}`);
    
    try {
        await storage.createUser({
            username,
            password: 'hashedpassword',
            role: 'citizen',
            fullName: 'Debug User',
            email: `debug_${Date.now()}@example.com`,
            phone: '9999999999',
            rating: 0,
            assignedCount: 0,
            solvedCount: 0,
            createdAt: new Date(),
        } as any); // cast to avoid strict type checks for simple test
    } catch (e) {
        console.error('Error creating user:', e);
    }

    // specific check for the file
    const dataDir = path.join(process.cwd(), '.data');
    const usersFile = path.join(dataDir, 'users.json');
    
    console.log(`Checking for file at: ${usersFile}`);
    if (fs.existsSync(usersFile)) {
        console.log('✅ users.json exists');
        const content = fs.readFileSync(usersFile, 'utf-8');
        console.log('Content preview:', content.substring(0, 100));
        
        if (content.includes(username)) {
             console.log('✅ Newly created user found in file!');
        } else {
             console.log('❌ Newly created user NOT found in file?');
        }
    } else {
        console.log('❌ users.json does NOT exist');
        // Check if directory exists
        if (fs.existsSync(dataDir)) {
             console.log('But .data directory exists.');
        } else {
             console.log('.data directory also does NOT exist.');
        }
    }
})();
