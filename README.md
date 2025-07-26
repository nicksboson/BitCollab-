# 🚀 BitCollab - Collaborative Coding Platform

**BitCollab** is a modern, real-time collaborative coding platform designed for seamless teamwork—whether remote or in-person. Built using the **MERN stack** (MongoDB, Express.js, React.js, Node.js), it offers an elegant UI, real-time interaction, and minimalistic room-based workflows.

![BitCollab Screenshot](https://your-screenshot-link.com) <!-- Add your screenshot link here -->

---

## ✨ Features

* 🔑 **Room Management** – Create or join coding rooms with a unique code.
* 👥 **Real-time Collaboration** – Instantly track participant presence and activity.
* 🎨 **Modern UI/UX** – Glassmorphism design with aurora & hyperspeed animations.
* 🔐 **Quick Authentication** – Join with just your name, no sign-ups needed.
* 📱 **Responsive Design** – Works flawlessly on both desktop and mobile devices.

---

## 🛠️ Prerequisites

Ensure the following are installed:

* **Node.js** (v16 or later)
* **MongoDB** (local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
* **npm** or **yarn**

---

## 📦 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd BitCollab
```

### 2. Install Server Dependencies

```bash
cd server
npm install
```

### 3. Install Client Dependencies

```bash
cd ../client
npm install
```

### 4. Configure Environment Variables

Create a `.env` file inside the `server` directory:

```env
MONGO_URI=mongodb://localhost:27017/bitcollab
PORT=5000
```

> For MongoDB Atlas, replace the URI with your cluster string.

---

## 🚀 Running the Application

### Start the Backend Server

```bash
cd server
npm start
# or for development
npx nodemon app.js
```

Runs at: [http://localhost:5000](http://localhost:5000)

### Start the Frontend Client

```bash
cd ../client
npm run dev
```

Runs at: [http://localhost:5173](http://localhost:5173)

---

## 🎮 How to Use

### ✅ Creating a Room

1. Visit the homepage.
2. Click **"Create Room"**.
3. Enter your name (optional: set room name).
4. Share the generated room code with others.

### 🔗 Joining a Room

1. Click **"Join Room"**.
2. Enter room code and your name.
3. Collaborate in real-time!

### 🧰 In-Room Features

* **Participant List**: View current room members.
* **Room Code**: Share or copy for quick access.
* **Real-Time Sync**: Instant updates as users join/leave.
* **Leave Option**: Exit the room anytime.

---

## 🌐 API Endpoints

| Method | Endpoint               | Description           |
| ------ | ---------------------- | --------------------- |
| POST   | `/api/rooms/create`    | Create a new room     |
| POST   | `/api/rooms/join`      | Join an existing room |
| GET    | `/api/rooms/:roomCode` | Get room details      |
| POST   | `/api/rooms/leave`     | Leave a room          |
| GET    | `/api/rooms`           | List all active rooms |

---

## 📂 Project Structure

```
BitCollab/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── App.jsx         # Root component
│   │   └── main.jsx        # Entry point
│   └── package.json
├── server/                 # Node.js backend
│   ├── models/             # Mongoose models
│   ├── routes/             # REST API routes
│   ├── app.js              # Server entry point
│   └── package.json
└── README.md
```

---

## 🧑‍💻 Technologies Used

### Frontend

* **React 19**
* **React Router DOM**
* **Axios**
* **Custom CSS** (Glassmorphism + Animated Backgrounds)

### Backend

* **Node.js** + **Express.js**
* **MongoDB** + **Mongoose**
* **Socket.io** (Real-time communication)
* **CORS** (Cross-origin support)

---

## 🤝 Contributing

We welcome contributions from the community!

1. Fork the repo
2. Create your feature branch:

   ```bash
   git checkout -b feature/AmazingFeature
   ```
3. Commit your changes:

   ```bash
   git commit -m "Add AmazingFeature"
   ```
4. Push the branch:

   ```bash
   git push origin feature/AmazingFeature
   ```
5. Open a Pull Request

Please follow the code style and include tests where applicable.

---

## 📄 License

This project is licensed under the **MIT License** – see the [LICENSE](LICENSE) file for details.

---

## ❓ Support

Having issues or suggestions?
Open an issue [here](https://github.com/your-repo/issues) and we’ll get back to you!

---

**Happy Coding with BitCollab!** 💻✨
