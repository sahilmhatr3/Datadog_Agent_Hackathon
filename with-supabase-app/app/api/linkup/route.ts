import { NextResponse } from 'next/server';
import { LinkupClient } from 'linkup-sdk';

const client = new LinkupClient({
  apiKey: process.env.LINKUP_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    const result = await client.search({
      query,
      depth: 'standard',
      outputType: 'sourcedAnswer',
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Linkup search error:', error);
    return NextResponse.json({ error: 'Failed to fetch Linkup data' }, { status: 500 });
  }
}
