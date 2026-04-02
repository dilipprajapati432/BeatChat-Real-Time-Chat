# BeatChat

BeatChat is a real-time chat application built using the MERN stack and Socket.io. The goal of this project was to build a messaging platform that is fast, reliable, and looks good on both desktop and mobile screens.

## Screenshots

<img width="1918" height="1023" alt="image" src="https://github.com/user-attachments/assets/686155cb-446d-4b40-9782-0cb8b7729c9e" />

<img width="1918" height="1026" alt="image" src="https://github.com/user-attachments/assets/541cae2a-43bb-4f60-8184-86e794ce0655" />

<img width="1916" height="1026" alt="image" src="https://github.com/user-attachments/assets/1c5a1ce6-c06f-40c0-bb65-b01955a5b57d" />

<img width="1918" height="1022" alt="image" src="https://github.com/user-attachments/assets/4df186b0-a0b7-43f3-b1e2-bfd1246b55c3" />

<img width="1902" height="1000" alt="image" src="https://github.com/user-attachments/assets/9ab5798a-8e4f-47ee-b4b8-f4d89a15b7fe" />


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
