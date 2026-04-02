const io = require('socket.io-client');
const axios = require('axios');

const API_URL = 'http://localhost:5000';
const SOCKET_URL = 'http://localhost:5000';

async function test() {
    try {
        // 1. Login two users
        console.log('Logging in users...');

        // Create/Login User A
        const userA_creds = { email: 'usera@example.com', password: 'password123' };
        try { await axios.post(`${API_URL}/api/auth/register`, { ...userA_creds, name: 'User A', username: 'usera' }); } catch (e) { }
        const resA = await axios.post(`${API_URL}/api/auth/login`, userA_creds);
        const tokenA = resA.data.token;
        const userIdA = resA.data.user.id;

        // Create/Login User B
        const userB_creds = { email: 'userb@example.com', password: 'password123' };
        try { await axios.post(`${API_URL}/api/auth/register`, { ...userB_creds, name: 'User B', username: 'userb' }); } catch (e) { }
        const resB = await axios.post(`${API_URL}/api/auth/login`, userB_creds);
        const tokenB = resB.data.token;
        const userIdB = resB.data.user.id;

        console.log(`User A: ${userIdA}, User B: ${userIdB}`);

        // 2. Connect Sockets
        const socketA = io(SOCKET_URL, { auth: { token: tokenA } });
        const socketB = io(SOCKET_URL, { auth: { token: tokenB } });

        await new Promise(resolve => socketA.on('connect', resolve));
        await new Promise(resolve => socketB.on('connect', resolve));
        console.log('Sockets connected.');

        // 3. User B listens for message
        const messagePromise = new Promise((resolve, reject) => {
            socketB.on('message', (msg) => {
                console.log('User B received message:', msg);
                if (msg.sender && msg.sender.name === 'User A' && msg.sender.username === 'usera') {
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
            to: userIdB,
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
