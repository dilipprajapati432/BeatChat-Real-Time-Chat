const mongoose = require('mongoose');
const User = require('./models/User');
const Message = require('./models/Message');
const dotenv = require('dotenv');

dotenv.config();

async function debug() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        // 1. Find Users
        const dilip = await User.findOne({ $or: [{ email: 'dilipkoilipkohar4320@gmail.com' }, { name: 'Dilip Prajapati' }] });
        const alice = await User.findOne({ $or: [{ email: 'alice@example.com' }, { name: 'Alice' }, { username: 'alice' }] });

        if (!dilip) console.log('Dilip not found');
        else {
            const aliceIdStr = alice ? alice._id.toString() : '';
            const isDeleted = alice && dilip.deletedChats.some(dc => dc.partnerId.toString() === aliceIdStr);
            console.log('Dilip ID:', dilip._id);
            console.log('Is Alice in DeletedChats?', isDeleted);
            if (isDeleted) console.log('Deleted Entry:', dilip.deletedChats.find(dc => dc.partnerId.toString() === aliceIdStr));
        }

        if (!alice) console.log('Alice not found');
        else console.log('Alice ID:', alice._id);

        if (dilip && alice) {
            // 2. Find Messages
            const messages = await Message.find({
                $or: [
                    { senderId: dilip._id, receiverId: alice._id },
                    { senderId: alice._id, receiverId: dilip._id }
                ]
            }).sort({ timestamp: 1 });

            console.log(`Found ${messages.length} messages between them.`);
            messages.forEach(m => {
                console.log(`[${m.timestamp}] ${m.senderId} -> ${m.receiverId}: ${m.text} (Status: ${m.status})`);
            });

            // Simulation of API Logic
            const partnerId = alice._id.toString();
            const deletedEntry = dilip.deletedChats.find(dc => dc.partnerId.toString() === partnerId);

            let shouldShow = false;
            if (!deletedEntry) {
                shouldShow = true;
                console.log("API Simulation: Alice should be visible (No deleted entry)");
            } else {
                const hasNewMessage = await Message.exists({
                    $or: [
                        { senderId: dilip._id, receiverId: alice._id },
                        { senderId: alice._id, receiverId: dilip._id }
                    ],
                    timestamp: { $gt: deletedEntry.deletedAt }
                });
                console.log("API Simulation: Has new message after delete?", !!hasNewMessage);
                shouldShow = !!hasNewMessage;
            }

        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

debug();
