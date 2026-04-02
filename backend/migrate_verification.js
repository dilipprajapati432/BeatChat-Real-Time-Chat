const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const migrate = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const result = await User.updateMany(
            { isVerified: { $ne: true } }, // Update if not true (false or undefined)
            { $set: { isVerified: true } }
        );

        console.log(`Updated ${result.modifiedCount} users to verified status.`);
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrate();
