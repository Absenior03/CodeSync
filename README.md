CodeSync: Real-Time Collaborative Code Editor
=
CodeSync is a feature-rich, full-stack web application that allows multiple users to write, edit, and run code together in real-time. It's built with a modern, scalable tech stack and provides a seamless collaborative experience, complete with live cursor tracking, a participant list, and an interactive online compiler.

➡️ [Live Demo Link Here](https://codesyncing.netlify.app/)

✨ Industry-Grade Features
=

**Real-Time Collaboration:** Code changes are synchronized across all clients in a room instantly using WebSockets.

**Multi-Language Support:** An integrated online compiler supports multiple languages like JavaScript, Python, and Java, powered by the JDoodle API.

**Live Cursor Tracking:** See the cursors of other participants move and make selections in real-time.

**Dynamic Participant List:** A live-updating sidebar shows who is currently active in the room, complete with unique avatars.

**Persistent Sessions:** Room code and language settings are stored in a high-speed Redis database, ensuring data persists between sessions.

**Interactive UI:** A polished, modern interface with a resizable output panel, toast notifications for user events, and a dynamic, animated landing page.

🏗️ Architecture
=

The platform uses a decoupled client-server architecture designed for low-latency, real-time communication.

**Frontend (Client):** A React single-page application built with Vite and styled with Tailwind CSS. It uses the Monaco Editor for a professional coding experience and connects to the backend via a Socket.IO client.

**Backend (Server):** A Node.js server using Express and Socket.IO to manage rooms, users, and real-time events. It acts as the central hub for all communication.

**Database:** A serverless Redis instance (from Upstash) is used as a fast, in-memory data store for persisting room code and state.

**Code Execution API:** A secure REST API endpoint on the backend communicates with the JDoodle API to execute code snippets safely and return the output.

**graph TD:**

    A[User A Browser] <-->|WebSocket| S[Node.js Server on Render]; <br>
    B[User B Browser] <-->|WebSocket| S; <br>
    S <-->|CRUD| R[Redis Database on Upstash]; <br>
    S -->|HTTP POST| J[JDoodle API]; <br>
    J -->|Output| S; <br>

🛠️ Tech Stack
=

**Frontend:** React , Tailwind CSS , Monaco Editor, Socket.IO Client

**Backend:** Node.js , Express, Socket.IO, Axios

**Database:** Redis  (via Upstash)

**Deployment:** Render (Backend), Netlify (Frontend)

**Tools:** Git , Vite

📸 Project Showcase
=

**1. Dynamic Landing Page**
An engaging entry point with an interactive, animated background that reacts to cursor movement.
<img width="1467" height="795" alt="Screenshot 2025-08-07 at 12 22 30" src="https://github.com/user-attachments/assets/0ddb147a-362f-4cf1-95ce-a96f953d94d2" />


**2. Collaborative Editor UI**
The main editor interface, showing the participant list with avatars, language selection, and the live code editor.
<img width="1467" height="795" alt="Screenshot 2025-08-08 at 01 58 56" src="https://github.com/user-attachments/assets/32953ca1-3265-481f-b787-6a51b905b440" />


**3. Real-Time Code Execution**
Demonstration of the online compiler in action, showing Python code being executed and the result appearing in the output panel.
<img width="1467" height="795" alt="Screenshot 2025-08-08 at 02 00 42" src="https://github.com/user-attachments/assets/28c2c8a7-85ee-4df8-9501-f608a7f14c79" />


<br><br>

🚀 Setup and Deployment
=
This project contains two main components in separate directories: backend and frontend.

The backend is a Node.js/Express server deployed on Render. It requires a REDIS_URL, JDOODLE_CLIENT_ID, and JDOODLE_CLIENT_SECRET in its environment variables to connect to the necessary services.

The frontend is a React application deployed on Netlify. It connects to the live backend server via its public URL.
