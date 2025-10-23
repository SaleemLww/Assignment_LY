import { config } from 'dotenv';
import { resolve } from 'path';
import { PrismaClient } from '@prisma/client';

// Load environment variables from root .env file
config({ path: resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function verifyDatabaseData() {
  console.log('🔍 VERIFYING ACTUAL DATABASE DATA...\n');
  console.log('='.repeat(80));

  try {
    // Get the most recent timetable
    const timetable = await prisma.timetable.findFirst({
      where: {
        processingStatus: 'COMPLETED'
      },
      include: {
        teacher: true,
        timeBlocks: {
          take: 5, // Get first 5 blocks as sample
          orderBy: {
            dayOfWeek: 'asc'
          }
        }
      },
      orderBy: {
        uploadedAt: 'desc'
      }
    });

    if (!timetable) {
      console.log('❌ No completed timetables found in database');
      return;
    }

    console.log('\n📊 TIMETABLE RECORD (ACTUAL SCHEMA):');
    console.log('-'.repeat(80));
    console.log('ID:', timetable.id);
    console.log('Processing Status:', timetable.processingStatus);
    console.log('Uploaded At:', timetable.uploadedAt);
    console.log('Original File Name:', timetable.originalFileName);
    console.log('File Type:', timetable.fileType);
    console.log('File Size:', timetable.fileSize, 'bytes');
    console.log('File Path:', timetable.filePath);
    console.log('Extraction Method:', timetable.extractionMethod);
    console.log('Error Message:', timetable.errorMessage);

    console.log('\n👤 TEACHER:');
    console.log('-'.repeat(80));
    console.log('ID:', timetable.teacher.id);
    console.log('Name:', timetable.teacher.name);
    console.log('Email:', timetable.teacher.email);

    console.log('\n📅 TIME BLOCKS (Sample of 5):');
    console.log('-'.repeat(80));
    timetable.timeBlocks.forEach((block, index) => {
      console.log(`\nBlock #${index + 1}:`);
      console.log(JSON.stringify(block, null, 2));
    });

    // Count total blocks
    const totalBlocks = await prisma.timeBlock.count({
      where: {
        timetableId: timetable.id
      }
    });
    console.log(`\n✅ Total Time Blocks: ${totalBlocks}`);

    // Get all timetables count
    const totalTimetables = await prisma.timetable.count();
    console.log(`✅ Total Timetables in DB: ${totalTimetables}`);

    console.log('\n' + '='.repeat(80));
    console.log('✅ VERIFICATION COMPLETE');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyDatabaseData();
