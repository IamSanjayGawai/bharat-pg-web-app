const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI).then(async () => { 
  const Tenant = mongoose.connection.collection('tenants'); 
  const active = await Tenant.countDocuments({status: { $in: ['Active', 'Notice Period']}}); 
  const beds = await mongoose.connection.collection('beds').countDocuments({status: 'Available'}); 
  const occ = await mongoose.connection.collection('beds').countDocuments({status: 'Occupied'}); 
  console.log('Active Tenants:', active); 
  console.log('Available Beds:', beds); 
  console.log('Occupied Beds:', occ); 
  process.exit(0); 
});
