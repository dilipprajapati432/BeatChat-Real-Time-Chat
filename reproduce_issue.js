const http = require('http');

async function runTest() {
    const API_URL = 'http://localhost:5000/api/auth';

    // Simple fetch wrapper for Node.js without external deps
    // Actually, Node 18+ has fetch. Assuming user has Node 18+.
    // If not, I'll use a simple http request helper.

    const request = async (endpoint, method, body, token) => {
        return new Promise((resolve, reject) => {
            const url = new URL(endpoint);
            const options = {
                hostname: url.hostname,
                port: url.port,
                path: url.pathname,
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                }
            };

            const req = http.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    try {
                        resolve({ status: res.statusCode, data: JSON.parse(data) });
                    } catch (e) {
                        resolve({ status: res.statusCode, data: data });
                    }
                });
            });

            req.on('error', (e) => reject(e));
            if (body) req.write(JSON.stringify(body));
            req.end();
        });
    };

    try {
        const timestamp = Date.now();
        const userA = { name: 'Bob', email: `bob_${timestamp}@test.com`, password: 'password123' };
        const userB = { name: 'Alice', email: `alice_${timestamp}@test.com`, password: 'password123' };
        const uniqueUsername = `king_${timestamp}`;

        console.log(`1. Registering User A (${userA.email})...`);
        let res = await request(`${API_URL}/register`, 'POST', userA);
        const tokenA = res.data.token;
        if (!tokenA) throw new Error('Failed to register User A: ' + JSON.stringify(res.data));

        console.log(`2. Setting User A username to "${uniqueUsername}"...`);
        res = await request(`${API_URL}/update-profile`, 'PUT', { username: uniqueUsername }, tokenA);
        if (res.status !== 200) throw new Error('Failed to update User A: ' + JSON.stringify(res.data));
        console.log('   User A updated successfully.');

        console.log(`3. Registering User B (${userB.email})...`);
        res = await request(`${API_URL}/register`, 'POST', userB);
        const tokenB = res.data.token;
        if (!tokenB) throw new Error('Failed to register User B: ' + JSON.stringify(res.data));

        console.log(`4. Attempting to set User B username to "${uniqueUsername}" (Should FAIL)...`);
        res = await request(`${API_URL}/update-profile`, 'PUT', { username: uniqueUsername }, tokenB);

        if (res.status === 400 && res.data.error === 'Username already taken') {
            console.log('   ✅ SUCCESS: Correctly blocked duplicate username.');
        } else {
            console.log('   ❌ FAILURE: Did not block duplicate username.');
            console.log('   Status:', res.status);
            console.log('   Response:', res.data);
        }

    } catch (e) {
        console.error('Test failed:', e);
    }
}

runTest();
