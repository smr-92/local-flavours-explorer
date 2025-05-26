# Local Flavours Explorer

A personalized food recommendation application that adapts to your tastes using the Model Context Protocol (MCP) architecture and AI-enhanced content.

## 📝 Project Overview

Local Flavours Explorer helps users discover restaurants and dishes based on their preferences. It features:

- Personalized recommendations based on user preferences
- AI-enhanced dish descriptions and classifications
- Adaptive learning from user feedback
- Separate context management for improved privacy and scalability

## 🏗️ Architecture

This project implements the **Model Context Protocol (MCP)** architecture, which separates the AI/ML layer from application business logic:

![Architecture Diagram](./docs/architecture_diagram.png)

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

- Python 3.8 or later
- Node.js 14 or later
- npm 6 or later
- MongoDB 4.0 or later
- Docker (optional, for containerized setup)

### Installation

1. Clone the repo
   ```sh
   git clone https://github.com/your_username_/local-flavours-explorer.git
   ```
2. Install Python dependencies
   ```sh
   cd local-flavours-explorer
   pip install -r requirements.txt
   ```
3. Install Node.js dependencies
   ```sh
   cd client
   npm install
   ```
4. Set up the database
   ```sh
   mongod --dbpath=data/db
   ```
5. Run the application
   ```sh
   python app.py
   ```
   Open a new terminal and run the client
   ```sh
   cd client
   npm start
   ```

### Docker Commands (Optional)

To run the application using Docker, use the following commands:

1. Build the Docker images
   ```sh
   docker-compose build
   ```
2. Run the Docker containers
   ```sh
   docker-compose up
   ```
3. Access the application
   - Backend: `http://localhost:5000`
   - Frontend: `http://localhost:3000`

## 📚 Usage

1. Sign up for a new account or log in to an existing account.
2. Set your food preferences in the profile settings.
3. Explore the recommended restaurants and dishes on your dashboard.
4. Provide feedback on recommendations to improve personalization.
5. Enjoy your meal!

## 🛠️ Development

To contribute to this project, follow these guidelines:

1. Fork the repo
2. Create a new branch (`git checkout -b feature/AmazingFeature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
5. Push to the branch (`git push origin feature/AmazingFeature`)
6. Open a pull request

Please ensure your code follows the existing style and includes appropriate tests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by the Model Context Protocol (MCP) architecture
- Built with passion by the Local Flavours Explorer team
- Powered by GitHub Copilot

