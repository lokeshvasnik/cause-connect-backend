require('dotenv').config();
const { connectDB } = require('../src/db');
const User = require('../src/models/User');
const Event = require('../src/models/Event');

async function run() {
  await connectDB();
  const hostEmail = 'demo-host@example.com';
  let host = await User.findOne({ email: hostEmail });
  if (!host) {
    const bcrypt = require('bcrypt');
    const passwordHash = await bcrypt.hash('password123', 10);
    host = await User.create({ name: 'Demo Host', email: hostEmail, passwordHash, role: 'host' });
    console.log('Created demo host:', host.email);
  }

  const samples = [
    {
      title: 'Ocean Beach Cleanup',
      date: new Date('2026-05-23'),
      tag: 'Environment',
      location: '@Marine Lines',
      description: 'Join us for a day of cleaning beautiful beaches and protecting the marine line from harmful waste.',
      image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80',
      status: 'published',
      hostId: host._id,
    },
    {
      title: 'Community Food Drive',
      date: new Date('2026-02-12'),
      tag: 'Community',
      location: '@City Center',
      description: 'Help collect and distribute food to families in need.',
      image: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=1400&q=80',
      status: 'published',
      hostId: host._id,
    },
  ];

  for (const s of samples) {
    const exists = await Event.findOne({ title: s.title, date: s.date, hostId: host._id });
    if (!exists) {
      await Event.create(s);
      console.log('Seeded event:', s.title);
    }
  }

  console.log('Seeding complete');
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
