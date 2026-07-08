import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

mongoose.connect(process.env.MONGODB_URI as string).then(async () => {
  try {
    const Room = (await import('./src/models/Room')).default;
    const Bed = (await import('./src/models/Bed')).default;
    const Tenant = (await import('./src/models/Tenant')).default;
    const User = (await import('./src/models/User')).default;

    const user = await User.findOne();
    if (!user) return console.log('No user');

    const room = await Room.findOne();
    if (!room) return console.log('No room');

    const bed = await Bed.findOne({ roomId: room._id });
    if (!bed) return console.log('No bed');

    const tenant = await Tenant.create({
      fullName: 'John Doe',
      mobileNumber: '1234567890',
      aadhaarNumber: '123456789012',
      dateOfBirth: new Date(),
      gender: 'Male',
      permanentAddress: '123 Main St',
      city: 'Pune',
      state: 'MH',
      pinCode: '411001',
      emergencyContact: {
        name: 'Jane Doe',
        relationship: 'Mother',
        phoneNumber: '0987654321',
      },
      buildingId: room.buildingId,
      floorId: room.floorId,
      roomId: room._id,
      bedId: bed._id,
      depositAmount: 5000,
      monthlyRent: 8000,
      adminId: user._id,
    });

    bed.status = 'Occupied';
    bed.tenantId = tenant._id;
    await bed.save();

    console.log('Tenant created and assigned to bed:', bed.bedNumber);

    const populatedBed = await Bed.findById(bed._id).populate('tenantId', 'fullName monthlyRent');
    console.log('Populated Bed:', JSON.stringify(populatedBed, null, 2));

    await Tenant.deleteOne({ _id: tenant._id });
    bed.status = 'Available';
    bed.tenantId = undefined;
    await bed.save();

  } catch (err: any) {
    console.error('ERROR:', err);
  } finally {
    mongoose.disconnect();
  }
}).catch(console.error);
