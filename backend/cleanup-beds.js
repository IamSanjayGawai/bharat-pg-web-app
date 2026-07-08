const mongoose = require('mongoose');
require('dotenv').config();

const clean = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');
    
    const Bed = mongoose.connection.collection('beds');
    const Room = mongoose.connection.collection('rooms');
    
    const beds = await Bed.find({}).toArray();
    const rooms = await Room.find({}).toArray();
    const roomIds = new Set(rooms.map(r => r._id.toString()));
    
    let deletedCount = 0;
    for (const bed of beds) {
      if (!roomIds.has(bed.roomId.toString())) {
        await Bed.deleteOne({ _id: bed._id });
        deletedCount++;
      }
    }
    console.log(`Deleted ${deletedCount} orphaned beds`);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
};

clean();
