import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

mongoose.connect(process.env.MONGODB_URI as string).then(async () => {
  try {
    const Bed = (await import('./src/models/Bed')).default;
    
    const bed = await Bed.findOne({ status: 'Occupied' }).populate('tenantId', 'fullName monthlyRent');
    console.log('Occupied Bed with populated tenant:', JSON.stringify(bed, null, 2));

  } catch (err: any) {
    console.error('ERROR:', err);
  } finally {
    mongoose.disconnect();
  }
}).catch(console.error);
