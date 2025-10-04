import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(req: Request) {
    try {
        const data = await req.json();

        // Create responses directory if it doesn't exist
        const responsesDir = join(process.cwd(), 'responses');
        try {
            await mkdir(responsesDir, { recursive: true });
        } catch (error) {
            // Directory might already exist, ignore error
        }

        // Generate filename with timestamp and session ID
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const sessionId = data.sessionId?.replace(/[^a-zA-Z0-9-]/g, '') || 'unknown';
        const filename = `linkup-response-${sessionId}-${timestamp}.json`;
        const filepath = join(responsesDir, filename);

        // Write the response data to JSON file
        await writeFile(filepath, JSON.stringify(data, null, 2));

        console.log(`Response saved to: ${filepath}`);

        return NextResponse.json({
            success: true,
            filename,
            message: 'Response saved successfully'
        });
    } catch (error) {
        console.error('Error saving response:', error);
        return NextResponse.json(
            { error: 'Failed to save response' },
            { status: 500 }
        );
    }
}
