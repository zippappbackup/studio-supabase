import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';

export async function POST() {
  return new Promise((resolve) => {
    // Path to your python script
    const scriptPath = path.join(process.cwd(), 'scripts/backup_tool/check_buckets.py');
    
    // Execute the python script
    exec(`python3 ${scriptPath}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Backup Script Error: ${error}`);
        resolve(NextResponse.json({ error: 'Backup failed', details: stderr }, { status: 500 }));
        return;
      }
      
      console.log(`Backup Script Output: ${stdout}`);
      resolve(NextResponse.json({ message: 'Backup completed successfully', output: stdout }));
    });
  });
}
