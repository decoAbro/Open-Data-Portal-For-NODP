import { NextResponse } from 'next/server';
import { ensureUploadWindowTable, getUploadWindowState, updateUploadWindowState } from './database';

export async function GET() {
  try {
    await ensureUploadWindowTable(); // Ensure table exists
    const state = await getUploadWindowState();
    console.log('GET upload window state:', state); // Add logging
    return NextResponse.json(state);
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Failed to get upload window state' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log('POST received data:', data); // Add logging
    
    // Validate the incoming data
    if (typeof data.isOpen !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid isOpen value' },
        { status: 400 }
      );
    }

    await ensureUploadWindowTable(); // Ensure table exists

    // Update the upload window state in the database
    const success = await updateUploadWindowState({
      isOpen: data.isOpen,
      deadline: data.deadline || null,
      message: data.message || '',
      year: data.year || new Date().getFullYear().toString(),
    });

    if (!success) {
      throw new Error('Failed to update upload window state');
    }

    const updatedState = await getUploadWindowState();
    console.log('POST updated state:', updatedState); // Add logging
    return NextResponse.json(updatedState);
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Failed to update upload window state' },
      { status: 500 }
    );
  }
}
