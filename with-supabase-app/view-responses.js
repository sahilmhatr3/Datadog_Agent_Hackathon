#!/usr/bin/env node

import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

async function listResponses() {
    try {
        const responsesDir = join(process.cwd(), 'responses');
        const files = await readdir(responsesDir);

        const jsonFiles = files.filter(file => file.endsWith('.json'));

        if (jsonFiles.length === 0) {
            console.log('No response files found.');
            return;
        }

        console.log(`Found ${jsonFiles.length} response files:\n`);

        for (const file of jsonFiles) {
            const filepath = join(responsesDir, file);
            const content = await readFile(filepath, 'utf-8');
            const data = JSON.parse(content);

            console.log(`📄 ${file}`);
            console.log(`   Session: ${data.sessionId}`);
            console.log(`   Query: ${data.query}`);
            console.log(`   Timestamp: ${data.timestamp}`);
            console.log(`   Response length: ${JSON.stringify(data.response).length} characters`);
            console.log('');
        }
    } catch (error) {
        console.error('Error reading responses:', error);
    }
}

async function viewResponse(filename: string) {
    try {
        const responsesDir = join(process.cwd(), 'responses');
        const filepath = join(responsesDir, filename);
        const content = await readFile(filepath, 'utf-8');
        const data = JSON.parse(content);

        console.log(`📄 ${filename}`);
        console.log('='.repeat(50));
        console.log(`Session ID: ${data.sessionId}`);
        console.log(`Query: ${data.query}`);
        console.log(`Timestamp: ${data.timestamp}`);
        console.log('\nResponse:');
        console.log(JSON.stringify(data.response, null, 2));
    } catch (error) {
        console.error('Error reading response file:', error);
    }
}

const command = process.argv[2];
const filename = process.argv[3];

if (command === 'view' && filename) {
    viewResponse(filename);
} else {
    listResponses();
}
