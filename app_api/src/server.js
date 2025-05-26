// app_api/src/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken'); // For JWT authentication
const axios = require('axios'); // For making HTTP requests to MCP
const fs = require('fs'); // For file operations
const path = require('path'); // For working with file paths
const app = express();
const port = process.env.PORT || 8000;
// Environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key'; // CHANGE THIS IN PRODUCTION!
const MCP_API_URL = process.env.MCP_API_URL;
const MCP_API_KEY = process.env.MCP_API_KEY;

// --- Middleware ---
app.use(cors());
app.use(express.json());

// Simple persisted user store
const usersFilePath = path.join(__dirname, '../data/users.json');

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Load users from JSON file or initialize empty object
let users = {};
try {
    if (fs.existsSync(usersFilePath)) {
        const data = fs.readFileSync(usersFilePath, 'utf8');
        users = JSON.parse(data);
        console.log(`Loaded ${Object.keys(users).length} users from ${usersFilePath}`);
    } else {
        console.log('No existing users file found, starting with empty users object');
    }
} catch (error) {
    console.error(`Error reading users file: ${error.message}`);
    console.log('Starting with empty users object');
}

// Function to save users to file
function saveUsers() {
    try {
        fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
        console.log(`Saved ${Object.keys(users).length} users to ${usersFilePath}`);
    } catch (error) {
        console.error(`Error saving users to file: ${error.message}`);
    }
}

// --- JWT Middleware (to protect authenticated routes) ---
function authenticateToken(req, res, next) {
   const authHeader = req.headers['authorization'];
   const token = authHeader && authHeader.split(' ')[1];
   if (token == null) return res.sendStatus(401); // No token
   jwt.verify(token, JWT_SECRET, (err, user) => {
       if (err) return res.sendStatus(403); // Invalid token
       req.user = user; // user contains { id: "uuid", email: "..." }
       next();
   });
}
// --- Routes ---
// User Signup Route
app.post('/api/auth/signup', async (req, res) => {
   const { email, password, preferences } = req.body; // preferences are the initial ones
   if (!email || !password || !preferences) {
       return res.status(400).json({ message: 'Email, password, and preferences are required.' });
   }
   if (users[email]) {
       return res.status(409).json({ message: 'User with this email already exists.' });
   }
   const userId = `user-${Date.now()}`; // Simple unique ID for demo
   users[email] = { id: userId, email, password }; // In a real app, hash password!
   
   // Save users to file
   saveUsers();
   
   try {
       // **MCP Integration: Send initial preferences to MCP**
       console.log(`Sending initial context for user ${userId} to MCP...`);
       console.log('Initial preferences:', preferences);
       const mcpResponse = await axios.post(
           `${MCP_API_URL}/mcp/v1/context/user/${userId}`,
           { initial_prefs: preferences }, // This is the InitialPreferences object
           {
               headers: { 'X-MCP-API-Key': MCP_API_KEY }
           }
       );
       console.log('MCP response for initial context:', mcpResponse.data);
       const accessToken = jwt.sign({ id: userId, email: email }, JWT_SECRET, { expiresIn: '1h' });
       res.status(201).json({ message: 'User registered successfully and context created.', token: accessToken });
   } catch (error) {
       console.error('Error during signup or MCP interaction:', error.response ? error.response.data : error.message);
       // Rollback user creation or handle gracefully in a real app
       delete users[email]; // For demo, remove if MCP fails
       res.status(500).json({ message: 'Error registering user or creating initial context.', error: error });
   }
});
// User Login Route
app.post('/api/auth/login', (req, res) => {
   const { email, password } = req.body;
   console.log(`Login attempt for email: ${email}`);
   
   // Check if email or password are missing
   if (!email || !password) {
       console.log('Login failed: Missing email or password');
       return res.status(400).json({ message: 'Email and password are required.' });
   }
   
   // Check if user exists
   const user = users[email];
   if (!user) {
       console.log(`Login failed: User not found for email: ${email}`);
       return res.status(401).json({ message: 'User not found. Please register first.' });
   }
   
   // Check if password matches
   if (user.password !== password) {
       console.log(`Login failed: Invalid password for email: ${email}`);
       return res.status(401).json({ message: 'Invalid credentials.' });
   }
   
   // Success case - generate JWT
   console.log(`Login successful for user: ${user.id}`);
   const accessToken = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
   
   // For debugging, print out the number of users in the store
   console.log(`Current users in store: ${Object.keys(users).length}`);
   console.log(`User IDs: ${Object.values(users).map(u => u.id).join(', ')}`);
   
   res.json({ message: 'Logged in successfully.', token: accessToken });
});
// Recommendations endpoint - fetch real recommendations from MCP
app.get('/api/recommendations', authenticateToken, async (req, res) => {
   try {
       console.log(`Fetching recommendations for user ${req.user.id}`);
       const mcpResponse = await axios.get(
           `${MCP_API_URL}/mcp/v1/recommendations/user/${req.user.id}`,
           {
               headers: { 'X-MCP-API-Key': MCP_API_KEY }
           }
       );
       console.log('MCP recommendations response:', mcpResponse.data);
       res.status(200).json(mcpResponse.data);
   } catch (error) {
       console.error('Error fetching recommendations from MCP:', 
           error.response ? error.response.data : error.message);
       res.status(500).json({ 
           message: 'Error fetching recommendations', 
           error: error.message,
           details: error.response ? error.response.data : 'No additional details'
       });
   }
});
// Feedback endpoint - send user feedback to MCP
app.post('/api/feedback', authenticateToken, async (req, res) => {
   const { itemId, itemType, interactionType } = req.body;
   
   if (!itemId || !itemType || !interactionType) {
       return res.status(400).json({ message: 'Missing required feedback data' });
   }
   
   try {
       console.log(`Sending feedback for user ${req.user.id}: ${interactionType} on ${itemType} ${itemId}`);
       
       const feedbackData = {
           item_id: String(itemId), // Convert itemId to string to match MCP's expected type
           item_type: itemType, // 'restaurant' or 'dish'
           interaction_type: interactionType, // 'like' or 'dislike'
           timestamp: new Date().toISOString()
       };
       
       console.log('Sending feedback data to MCP:', feedbackData);
       
       const mcpResponse = await axios.post(
           `${MCP_API_URL}/mcp/v1/context/user/${req.user.id}/interact`,
           feedbackData,
           {
               headers: { 'X-MCP-API-Key': MCP_API_KEY }
           }
       );
       
       console.log('MCP feedback response:', mcpResponse.data);
       res.status(200).json({ 
           message: `Feedback recorded for user ${req.user.id}`,
           context_updated: true,
           feedback_data: feedbackData
       });
   } catch (error) {
       console.error('Error sending feedback to MCP:', error.response ? error.response.data : error.message);
       res.status(500).json({ message: 'Error recording feedback', error: error.message });
   }
});
// Debug context endpoint - fetch user context from MCP
app.get('/api/debug/context', authenticateToken, async (req, res) => {
   try {
       console.log(`Fetching context for user ${req.user.id}`);
       const mcpResponse = await axios.get(
           `${MCP_API_URL}/mcp/v1/context/user/${req.user.id}/summary`,
           {
               headers: { 'X-MCP-API-Key': MCP_API_KEY }
           }
       );
       console.log('MCP context response:', mcpResponse.data);
       res.status(200).json(mcpResponse.data);
   } catch (error) {
       console.error('Error fetching context from MCP:', error.response ? error.response.data : error.message);
       res.status(500).json({ 
           message: 'Error fetching user context', 
           error: error.message,
           user_id: req.user.id
       });
   }
});

// Add a new endpoint for end-to-end health check
app.get('/api/health/e2e', async (req, res) => {
  try {
    // Check MCP health
    console.log('Checking MCP health...');
    const mcpResponse = await axios.get(`${MCP_API_URL}/mcp/health`, {
      headers: { 'X-MCP-API-Key': MCP_API_KEY }
    });
    
    // Return combined health status
    res.json({
      api_status: 'ok',
      api_message: 'Application API is running!',
      mcp_status: mcpResponse.data.status,
      mcp_message: mcpResponse.data.message,
      mcp_details: {
        mongodb_status: mcpResponse.data.mongodb_status,
        postgres_status: mcpResponse.data.postgres_status
      }
    });
  } catch (error) {
    console.error('Error checking MCP health:', error.message);
    res.status(500).json({
      api_status: 'ok',
      api_message: 'Application API is running!',
      mcp_status: 'error',
      mcp_message: `Failed to connect to MCP: ${error.message}`,
      mcp_details: error.response ? error.response.data : null
    });
  }
});

// AI-enhanced recommendations endpoint with improved logging
app.get('/api/ai-recommendations', authenticateToken, async (req, res) => {
   try {
       console.log(`Fetching AI-enhanced recommendations for user ${req.user.id}`);
       console.log('Making request to Hugging Face-powered MCP endpoint...');
       
       const startTime = Date.now();
       const mcpResponse = await axios.get(
           `${MCP_API_URL}/mcp/v1/ai-recommendations/user/${req.user.id}`,
           {
               headers: { 'X-MCP-API-Key': MCP_API_KEY }
           }
       );
       const endTime = Date.now();
       
       // Log AI-specific information
       console.log(`AI request completed in ${endTime - startTime}ms`);
       console.log(`Received ${mcpResponse.data.enhanced_dishes?.length || 0} AI-enhanced dishes`);
       
       // Check if we got AI descriptions
       const aiDescriptionSample = mcpResponse.data.enhanced_dishes?.[0]?.ai_description;
       if (aiDescriptionSample) {
           console.log('AI Integration Verified: Received AI-generated descriptions');
           console.log(`Sample AI description: "${aiDescriptionSample.substring(0, 50)}..."`);
       } else {
           console.warn('AI Integration Warning: No AI descriptions found in response');
       }
       
       res.status(200).json(mcpResponse.data);
   } catch (error) {
       console.error('Error fetching AI recommendations from MCP:', 
           error.response ? error.response.data : error.message);
       console.error('AI Integration Error: Failed to get AI-enhanced recommendations');
       res.status(500).json({ 
           message: 'Error fetching AI recommendations', 
           error: error.message,
           details: error.response ? error.response.data : 'No additional details',
           ai_status: 'error'
       });
   }
});

// AI-powered feedback analysis endpoint
app.post('/api/ai-feedback', authenticateToken, async (req, res) => {
   const { itemId, itemType, feedbackText } = req.body;
   
   if (!itemId || !itemType || !feedbackText) {
       return res.status(400).json({ message: 'Missing required feedback data' });
   }
   
   try {
       console.log(`Sending AI feedback analysis for user ${req.user.id}`);
       
       const feedbackData = {
           item_id: String(itemId),
           item_type: itemType,
           feedback_text: feedbackText,
           timestamp: new Date().toISOString()
       };
       
       console.log('Sending AI feedback data to MCP:', feedbackData);
       
       const mcpResponse = await axios.post(
           `${MCP_API_URL}/mcp/v1/context/user/${req.user.id}/ai-feedback`,
           feedbackData,
           {
               headers: { 'X-MCP-API-Key': MCP_API_KEY }
           }
       );
       
       console.log('MCP AI feedback response:', mcpResponse.data);
       res.status(200).json({ 
           message: `AI-analyzed feedback recorded for user ${req.user.id}`,
           sentiment_analysis: mcpResponse.data.sentiment_analysis,
           interaction: mcpResponse.data.derived_interaction,
           context_updated: true
       });
   } catch (error) {
       console.error('Error sending AI feedback to MCP:', error.response ? error.response.data : error.message);
       res.status(500).json({ message: 'Error analyzing feedback', error: error.message });
   }
});

// Start the server
app.listen(port, () => {
 console.log(`Application API running on port ${port}`);
 console.log(`MCP API URL: ${MCP_API_URL}`);
 console.log(`JWT Secret: ${JWT_SECRET}`);
});