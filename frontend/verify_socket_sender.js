import { io } from 'socket.io-client';
import axios from 'axios';

const API_URL = 'http://localhost:5000';
const SOCKET_URL = 'http://localhost:5000';

async function test() {
    try {
        console.log('Logging in users...');

        // Helper to Create/Login
        const loginOrRegister = async (name, username, email, password) => {
            try {
                await axios.post(`${API_URL}/api/auth/register`, { name, username, email, password });
            } catch (e) { /* ignore if exists */ }
            const res = await axios.post(`${API_URL}/api/auth/login`, { email, password });
            return { token: res.data.token, userId: res.data.user.id };
        };

        const userA = await loginOrRegister('User A', 'usera', 'usera@example.com', 'password123');
        const userB = await loginOrRegister('User B', 'userb', 'userb@example.com', 'password123');

        console.log(`User A: ${userA.userId}, User B: ${userB.userId}`);

        // 2. Connect Sockets
        const socketA = io(SOCKET_URL, { auth: { token: userA.token } });
        const socketB = io(SOCKET_URL, { auth: { token: userB.token } });

        await new Promise(resolve => socketA.on('connect', resolve));
        await new Promise(resolve => socketB.on('connect', resolve));
        console.log('Sockets connected.');

        // 3. User B listens for message
        const messagePromise = new Promise((resolve, reject) => {
            socketB.on('message', (msg) => {
                console.log('User B received message:', msg);
                if (msg.sender && msg.sender.username === 'usera') {
                    console.log('SUCCESS: Sender details present in message!');
                    resolve();
                } else {
                    console.error('FAILURE: Sender details MISSING or incorrect:', msg.sender);
                    reject(new Error('Sender details missing'));
                }
            });
        });

        // 4. User A sends message
        console.log('User A sending message...');
        socketA.emit('message', {
            text: 'Hello from A',
            to: userB.userId,
            tempId: Date.now().toString(),
            type: 'direct'
        });

        // 5. Wait for verification
        await messagePromise;

        socketA.disconnect();
        socketB.disconnect();
        process.exit(0);

    } catch (err) {
        console.error('Test Failed:', err.message);
        if (err.response) console.error(err.response.data);
        process.exit(1);
    }
}

test();
