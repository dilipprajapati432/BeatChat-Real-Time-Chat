# BeatChat

BeatChat is a real-time chat application built using the MERN stack and Socket.io. The goal of this project was to build a messaging platform that is fast, reliable, and looks good on both desktop and mobile screens.

## Screenshots

<img width="1918" height="1022" alt="image" src="https://github.com/user-attachments/assets/5fe7781f-304e-4b19-9928-f6ff89894340" />

<img width="1918" height="1028" alt="image" src="https://github.com/user-attachments/assets/a524fb98-8072-43f0-a112-f988cc0a3960" />

<img width="1918" height="1021" alt="image" src="https://github.com/user-attachments/assets/d3987e7a-a119-41ad-8587-118bbc0dc13b" />

<img width="1918" height="1017" alt="image" src="https://github.com/user-attachments/assets/27f475b6-74ce-4187-84d3-ef3664bc3ad2" />

<img width="1918" height="1021" alt="image" src="https://github.com/user-attachments/assets/1adb8082-bbea-48b2-a765-3ec65df15597" />

<img width="1918" height="1032" alt="image" src="https://github.com/user-attachments/assets/f0154c24-ced3-4704-ab97-bc0bb4d44e90" />


## Features

- **Real-Time Messaging**: Complete with fast, instant delivery via Socket.io.
- **Delivery Status**: Track exactly when your messages are sending, sent, delivered, and seen.
- **Smart Mentions**: Tag users with `@username` to highlight specific messages.
- **Presence Tracking**: See who's online right now and track "Last seen" timestamps.
- **Chat Management**: Hide old or messy conversations from your sidebar (they automatically reappear if a new message is sent).
- **Export Data**: Download your full chat history as a `.txt` file for backup.
- **Security**: Built with JWT authentication, password hashing, and secure endpoints.
- **UI/UX**: Responsive layout built with Tailwind CSS, featuring dark mode and a clean glassmorphism aesthetic.

## Tech Stack

- **Frontend**: React (Vite), Tailwind CSS, Zustand (state management), Lucide Icons.
- **Backend**: Node.js, Express.js.
- **Database & Real-Time**: MongoDB (Mongoose) and Socket.io.

## Local Setup

You'll need Node.js and MongoDB (local or Atlas) to run this project.

**1. Clone the repo**
```bash
git clone https://github.com/[YOUR_USERNAME]/BeatChat.git
cd Real-Time-Chat
```

**2. Backend Setup**
```bash
cd backend
npm install
```
Create a `.env` file in the `backend` directory with the following variables:
```env
PORT=5001
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
FRONTEND_URL=http://localhost:5173
```
Start the backend server:
```bash
npm start
```

**3. Frontend Setup**
```bash
cd ../frontend
npm install
```
Create a `.env` file in the `frontend` directory:
```env
VITE_API_URL=http://localhost:5001
```
Start the development server:
```bash
npm run dev
```

## Future Enhancements (Roadmap)
Here are a few things planned for future updates:
- OAuth integration (Google & GitHub login)
- Audio and video call Supports
- Voice notes 
- Custom chat themes
- Backup and Restore chats

## 👨‍💻 Author

**Dilip Kohar**  
B.Tech Computer Engineering Student  
📧 dilipkohar4320@gmail.com  
🔗 GitHub: https://github.com/dilipprajapati432  
🔗 LinkedIn: https://www.linkedin.com/in/dilip-kohar-014627293

## License
MIT License
