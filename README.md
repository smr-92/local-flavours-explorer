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

```
+-------------------+          +-------------------+
|   User Profile    |          |   Restaurant DB   |
|  (Preferences,    |          |  (Ratings, Tags,  |
|   Feedback, etc.) |          |   Location, etc.) |
+-------------------+          +-------------------+
          |                              |
          |                              |
          +--------------+---------------+
                         |
                         v
                +-----------------+
                |   Recommendation  |
                |      Engine      |
                +-----------------+
                         |
                         v
                +-----------------+
                |   AI/ML Layer    |
                | (Model Context   |
                |    Protocol)     |
                +-----------------+
                         |
                         v
                +-----------------+
                |   Business Logic  |
                | (Routing, API,   |
                |  Data Handling)  |
                +-----------------+
                         |
                         v
                +-----------------+
                |   Presentation    |
                |   (Frontend)      |
                +-----------------+
```

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

## 🔧 Troubleshooting

### API Connection Issues

If you encounter API connection issues:

1. **Check your network connectivity** - Ensure your machine can access the internet and local network
2. **Verify services are running** - Confirm all Docker containers are up with `docker-compose ps`
3. **Check API health** - Use the "Test API Health" button in the application UI
4. **Inspect logs** - Check for errors in the container logs:
   ```sh
   docker-compose logs app_api
   docker-compose logs mcp
   ```
5. **Reset services** - Sometimes restarting services solves connectivity issues:
   ```sh
   docker-compose restart app_api mcp
   ```

### AI Features Not Working

If AI-enhanced features aren't functioning:

1. **Verify Hugging Face API key** - Ensure you've set a valid key in the `docker-compose.yml` file
2. **Check AI connectivity** - Toggle AI mode in the UI to test connectivity
3. **Review MCP logs** - Look for AI-related errors:
   ```sh
   docker-compose logs mcp | grep "ai_models"
   ```
4. **Test alternate models** - Update `ai_models.py` to use different models if specific ones are unavailable
5. **Fallback to standard mode** - The app will continue to function without AI enhancements

### Database Issues

If recommendations aren't loading or user data isn't being saved:

1. **Check database connections** - Verify MongoDB and PostgreSQL are running:
   ```sh
   docker-compose logs mongodb
   docker-compose logs postgres
   ```
2. **Ensure initial data is loaded** - Check if PostgreSQL initialization worked:
   ```sh
   docker-compose exec postgres psql -U user -d restaurants_db -c "SELECT COUNT(*) FROM restaurants;"
   ```
3. **Inspect connection strings** - Verify environment variables in `docker-compose.yml`
4. **Reset database volumes** - For a fresh start (warning: this deletes all data):
   ```sh
   docker-compose down -v
   docker-compose up
   ```

### Browser Issues

1. **Clear cache and cookies** - Resolve stale JWT tokens or cached responses
2. **Try Incognito/Private mode** - Test without browser extensions interference
3. **Check console errors** - Use browser dev tools (F12) to identify frontend issues

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by the Model Context Protocol (MCP) architecture
- Built with passion by the Local Flavours Explorer team
- Powered by GitHub Copilot

