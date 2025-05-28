// frontend/src/App.jsx
import { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import axios from 'axios'; // Import axios
import './App.css';
const API_URL = import.meta.env.VITE_APP_API_URL; // From docker-compose env
// --- Components ---
const AuthForm = ({ type }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  // Initial preferences for signup
  const [dietaryRestrictions, setDietaryRestrictions] = useState([]);
  const [cuisinePreferences, setCuisinePreferences] = useState([]);
  const [spiceLevel, setSpiceLevel] = useState('');
  const [budget, setBudget] = useState('');
  // Add health status state
  const [healthStatus, setHealthStatus] = useState(null);

  const navigate = useNavigate(); // For navigation after login/signup
  const handleDietaryChange = (e) => {
    const { value, checked } = e.target;
    setDietaryRestrictions(prev =>
      checked ? [...prev, value] : prev.filter(item => item !== value)
    );
  };
  const handleCuisineChange = (e) => {
    const { value, checked } = e.target;
    setCuisinePreferences(prev =>
      checked ? [...prev, value] : prev.filter(item => item !== value)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      let response;
      if (type === 'signup') {
        const preferences = {
          dietary_restrictions: dietaryRestrictions,
          cuisine_preferences: cuisinePreferences,
          spice_level: spiceLevel,
          budget: budget
        };
        response = await axios.post(`${API_URL}/api/auth/signup`, {
          email,
          password,
          preferences
        });
      } else { // login
        response = await axios.post(`${API_URL}/api/auth/login`, {
          email,
          password
        });
      }
      localStorage.setItem('token', response.data.token); // Store JWT
      setMessage(response.data.message);
      navigate('/home'); // Redirect to home after success
    } catch (error) {
      console.error('Auth Error:', error.response ? error.response.data : error.message);
      setMessage(error.response?.data?.message || 'An error occurred.');
    }
  };

  // Add health check function
  const checkHealth = async () => {
    try {
      setHealthStatus('Checking end-to-end connectivity...');
      const response = await axios.get(`${API_URL}/api/health/e2e`);
      setHealthStatus(
        <div>
          <h4>End-to-End Health Check:</h4>
          <p>API: {response.data.api_status} - {response.data.api_message}</p>
          <p>MCP: {response.data.mcp_status} - {response.data.mcp_message}</p>
          <p>MongoDB: {response.data.mcp_details.mongodb_status}</p>
          <p>PostgreSQL: {response.data.mcp_details.postgres_status}</p>
        </div>
      );
    } catch (error) {
      console.error('Health check failed:', error);
      setHealthStatus(`Health Check Failed: ${error.message}`);
    }
  };

  return (
    <div className="auth-container">
      <h2>{type === 'signup' ? 'Sign Up' : 'Login'}</h2>

      {/* Add health check button at the top of the signup form */}
      {type === 'signup' && (
        <div className="health-check-container">
          <button
            type="button"
            onClick={checkHealth}
            className="health-check-btn"
          >
            Test API Connectivity
          </button>
          {healthStatus && <div className="health-status">{healthStatus}</div>}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div>
          <label>Email:</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label>Password:</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {type === 'signup' && (
          <>
            <h3>Your Food Preferences (Initial Context)</h3>
            <div className="checkbox-group">
              <h4>Dietary Restrictions:</h4>
              <label><input type="checkbox" value="vegetarian" onChange={handleDietaryChange} /> Vegetarian</label>
              <label><input type="checkbox" value="vegan" onChange={handleDietaryChange} /> Vegan</label>
              <label><input type="checkbox" value="gluten-free" onChange={handleDietaryChange} /> Gluten-Free</label>
            </div>
            <div className="checkbox-group">
              <h4>Preferred Cuisines:</h4>
              <label><input type="checkbox" value="Italian" onChange={handleCuisineChange} /> Italian</label>
              <label><input type="checkbox" value="Indian" onChange={handleCuisineChange} /> Indian</label>
              <label><input type="checkbox" value="Mexican" onChange={handleCuisineChange} /> Mexican</label>
              <label><input type="checkbox" value="Chinese" onChange={handleCuisineChange} /> Chinese</label>
              <label><input type="checkbox" value="Thai" onChange={handleCuisineChange} /> Thai</label>
            </div>
            <div>
              <label>Spice Level:</label>
              <select value={spiceLevel} onChange={(e) => setSpiceLevel(e.target.value)}>
                <option value="">Select...</option>
                <option value="Mild">Mild</option>
                <option value="Medium">Medium</option>
                <option value="Hot">Hot</option>
              </select>
            </div>
            <div>
              <label>Budget:</label>
              <select value={budget} onChange={(e) => setBudget(e.target.value)}>
                <option value="">Select...</option>
                <option value="$">$ (Cheap)</option>
                <option value="$$">$$ (Moderate)</option>
                <option value="$$$">$$$ (Expensive)</option>
              </select>
            </div>
          </>
        )}
        <button type="submit">{type === 'signup' ? 'Sign Up' : 'Login'}</button>
      </form>
      {message && <p className="message">{message}</p>}
      {type === 'signup' ? (
        <p>Already have an account? <Link to="/login">Login</Link></p>
      ) : (
        <p>Don't have an account? <Link to="/signup">Sign Up</Link></p>
      )}
    </div>
  );
};
const Home = () => {
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [healthStatus, setHealthStatus] = useState(null);
  const [feedbackStatus, setFeedbackStatus] = useState(null);
  const [useAI, setUseAI] = useState(false); // Add a new state for AI mode
  const [aiStatus, setAiStatus] = useState('off'); // 'off', 'loading', 'ready', 'error'
  const [aiDebugInfo, setAiDebugInfo] = useState(null);
  const [recommendationFactors, setRecommendationFactors] = useState({});
  const [likedItems, setLikedItems] = useState([]);
  const [dislikedItems, setDislikedItems] = useState([]);
  const feedbackStatusRef = useRef(null); // Add a ref for the feedback status
  const navigate = useNavigate();

  // Add a function to fetch AI-enhanced recommendations with status indicators
  const fetchRecommendations = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    try {
      setLoading(true);

      // Set AI status if using AI mode
      if (useAI) {
        setAiStatus('loading');
      }

      // Choose the endpoint based on AI mode
      const endpoint = useAI ? '/api/ai-recommendations' : '/api/recommendations';
      
      // Include disliked items as excluded parameters
      const params = new URLSearchParams();
      if (dislikedItems.length > 0) {
        params.append('feedback', dislikedItems.join(','));
      }
      params.append('refresh', 'true');

      const response = await axios.get(`${API_URL}${endpoint}?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setRecommendations(response.data);
      setRecommendationFactors(response.data.recommendation_factors || {});

      // Update AI status and debug info if using AI
      if (useAI) {
        // Check if we actually got AI-enhanced dishes
        if (response.data.enhanced_dishes && response.data.enhanced_dishes.length > 0) {
          setAiStatus('ready');

          // For debugging: store sample of AI-generated content
          const sampleDish = response.data.enhanced_dishes[0];
          setAiDebugInfo({
            sample_dish: sampleDish.name,
            ai_description: sampleDish.ai_description?.substring(0, 50) + '...',
            ai_attributes: sampleDish.ai_attributes,
            timestamp: new Date().toISOString()
          });
        } else {
          setAiStatus('error');
          setAiDebugInfo({
            error: 'No AI-enhanced dishes returned',
            timestamp: new Date().toISOString()
          });
        }
      } else {
        setAiStatus('off');
        setAiDebugInfo(null);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching recommendations:', error.response ? error.response.data : error.message);
      setError('Failed to load recommendations. Please try again.');

      // Update AI status if error occurs during AI mode
      if (useAI) {
        setAiStatus('error');
        setAiDebugInfo({
          error: error.message,
          details: error.response?.data || 'No details available',
          timestamp: new Date().toISOString()
        });
      }

      setLoading(false);
      if (error.response && error.response.status === 401) {
        navigate('/login');
      }
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [navigate, useAI]); // Update useEffect to call the new fetchRecommendations function

  const handleFeedback = async (itemId, itemType, interactionType) => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      setFeedbackStatus(`Sending ${interactionType} feedback...`);
      
      // Update local state for liked/disliked items
      if (interactionType === 'like') {
        setLikedItems(prev => [...prev, itemId]);
      } else {
        setDislikedItems(prev => [...prev, itemId]);
      }
      
      // Include AI mode in the request
      const response = await axios.post(
        `${API_URL}/api/feedback?with_recommendations=true&use_ai=${useAI}`,
        { itemId, itemType, interactionType },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setFeedbackStatus(`Feedback recorded! ${interactionType === 'like' ? '👍' : '👎'}`);

      // If we got updated recommendations in the response, use them directly
      if (response.data.updated_recommendations) {
        setRecommendations(response.data.updated_recommendations);
        setRecommendationFactors(response.data.updated_recommendations.recommendation_factors || {});
        
        // If we're in AI mode but enhanced_dishes is missing, fetch AI recommendations separately
        if (useAI && !response.data.updated_recommendations.enhanced_dishes) {
          console.log("Fetching AI recommendations separately after feedback");
          fetchRecommendations();
        } else {
          setTimeout(() => setFeedbackStatus(null), 2000);
        }
      } else {
        // Otherwise, fetch new recommendations after a short delay
        setTimeout(() => {
          setFeedbackStatus(null);
          fetchRecommendations();
        }, 2000);
      }

    } catch (error) {
      console.error('Error sending feedback:', error.response ? error.response.data : error.message);
      setFeedbackStatus('Failed to record feedback. Please try again.');
      setTimeout(() => setFeedbackStatus(null), 3000);
    }
  };

  // Update the handleTextFeedback function to refresh recommendation factors and scroll
  const handleTextFeedback = async (itemId, itemType, feedbackText) => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      setFeedbackStatus(`Analyzing your feedback...`);
      const response = await axios.post(
        `${API_URL}/api/ai-feedback`,
        { itemId, itemType, feedbackText },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Get sentiment analysis data
      const sentiment = response.data.sentiment_analysis.sentiment;
      const confidence = response.data.sentiment_analysis.confidence;
      const aiDetails = response.data.ai_details;
      const emoji = sentiment === 'POSITIVE' ? '😃' : sentiment === 'NEGATIVE' ? '😞' : '😐';

      // Display more detailed feedback with confidence - make it persistent
      setFeedbackStatus(
        <div className="ai-sentiment-analysis">
          <div className="sentiment-main">
            Your feedback was analyzed as <strong>{sentiment}</strong> {emoji} with {(confidence * 100).toFixed(0)}% confidence
          </div>
          
          {aiDetails && (
            <div className="sentiment-details">
              <div className="ai-badge-small">AI</div>
              <div className="reasoning">{aiDetails.reasoning}</div>
              {aiDetails.key_phrases && aiDetails.key_phrases.length > 0 && (
                <div className="key-phrases">
                  Key phrases: {aiDetails.key_phrases.join(', ')}
                </div>
              )}
              <div className="analysis-method">Analysis method: {aiDetails.analysis_method}</div>
            </div>
          )}
          <button 
            onClick={() => setFeedbackStatus(null)} 
            className="close-feedback-btn"
          >
            Dismiss
          </button>
        </div>
      );

      // Fetch updated recommendation factors without full page reload
      try {
        const recResponse = await axios.get(`${API_URL}/api/recommendations`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Only update the recommendation factors, not the entire recommendations
        setRecommendationFactors(recResponse.data.recommendation_factors || {});
      } catch (error) {
        console.error('Error updating recommendation factors:', error);
      }

      // Scroll to the feedback status after it's rendered
      setTimeout(() => {
        if (feedbackStatusRef.current) {
          feedbackStatusRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }
      }, 100);

    } catch (error) {
      console.error('Error sending feedback:', error.response ? error.response.data : error.message);
      setFeedbackStatus(
        <div className="ai-sentiment-analysis error">
          <div className="sentiment-main">Failed to process feedback. Please try again.</div>
          <button 
            onClick={() => setFeedbackStatus(null)} 
            className="close-feedback-btn"
          >
            Dismiss
          </button>
        </div>
      );
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  // Health check function
  const checkHealth = async () => {
    try {
      setHealthStatus('Checking end-to-end connectivity...');
      const response = await axios.get(`${API_URL}/api/health/e2e`);
      setHealthStatus(
        <div>
          <h4>End-to-End Health Check:</h4>
          <p>API: {response.data.api_status} - {response.data.api_message}</p>
          <p>MCP: {response.data.mcp_status} - {response.data.mcp_message}</p>
          <p>MongoDB: {response.data.mcp_details.mongodb_status}</p>
          <p>PostgreSQL: {response.data.mcp_details.postgres_status}</p>
        </div>
      );
    } catch (error) {
      console.error('Health check failed:', error);
      setHealthStatus(`Health Check Failed: ${error.message}`);
    }
  };

  return (
    <div className="recommendations-container">
      <h2>Welcome to Local Flavors Explorer!</h2>

      {/* MCP Info Banner */}
      <div className="mcp-info-banner">
        <p>
          This application uses the <strong>Model Context Protocol</strong> to deliver personalized recommendations.
          <Link to="/mcp-dashboard" className="learn-more-link">Learn how it works</Link>
        </p>
      </div>

      {/* AI Mode Toggle */}
      <div className={`ai-mode-toggle ${aiStatus === 'loading' ? 'ai-loading' : ''} ${aiStatus === 'error' ? 'ai-connection-error' : ''}`}>
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={useAI}
            onChange={() => setUseAI(!useAI)}
          />
          <span className="toggle-slider"></span>
        </label>
        <span className="toggle-label">AI-Enhanced Mode {useAI ? '(On)' : '(Off)'}</span>
        {useAI && (
          <div className="ai-badge">
            {aiStatus === 'loading' ? 'Connecting to AI...' :
              aiStatus === 'ready' ? 'Connected to Hugging Face' :
                aiStatus === 'error' ? 'AI Connection Error' : 'Hugging Face AI'}
          </div>
        )}
      </div>

      {/* AI Debug Info */}
      {useAI && aiDebugInfo && (
        <div className="ai-debug-info">
          <details>
            <summary>AI Debug Info</summary>
            <pre>{JSON.stringify(aiDebugInfo, null, 2)}</pre>
          </details>
        </div>
      )}

      {/* Loading and Error States */}
      {loading && <p>Loading your personalized recommendations...</p>}
      {error && <p className="error-message">{error}</p>}

      {/* Feedback Status */}
      {feedbackStatus && (
        <div className="feedback-status" ref={feedbackStatusRef}>
          {feedbackStatus}
        </div>
      )}

      {/* Recommendations Content */}
      {recommendations && !loading && (
        <div>
          {/* User Context and Recommendations */}
          {(() => {
            // Create a safe reference to user context data
            const userContext = recommendations.user_context || {
              preferences: {
                cuisine_preferences: [],
                budget: null
              }
            };

            return (
              <div>
                {/* Recommendation Factors - Use the separate state instead of recommendations.recommendation_factors */}
                <div className="recommendation-factors">
                  <h3>Your Recommendation Factors</h3>
                  <div className="factors-grid">
                    {Object.entries(recommendationFactors).map(([factor, value]) => (
                      <div key={factor} className="factor-item">
                        <div className="factor-name">{factor.replace(/_/g, ' ').replace(/^(.)|\s+(.)/g, c => c.toUpperCase())}</div>
                        <div className="factor-bar">
                          <div className="factor-value" style={{ width: `${value * 100}%` }}></div>
                        </div>
                        <div className="factor-percent">{(value * 100).toFixed(0)}%</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Restaurants Section */}
                <h3>Recommended Restaurants</h3>
                <div className="restaurants-grid">
                  {recommendations.restaurants?.map(restaurant => (
                    <div key={restaurant.id} className="restaurant-card">
                      {/* Restaurant content */}
                      <h4>{restaurant.name}</h4>
                      <div className="restaurant-details">
                        <span className="cuisine-tag">{restaurant.cuisine}</span>
                        <span className="price-tag">{restaurant.price_range}</span>
                      </div>
                      <p className="restaurant-description">{restaurant.description}</p>
                      <div className="restaurant-location">{restaurant.location}</div>

                      {/* Recommendation reason */}
                      <div className="recommendation-reason">
                        <h5>Why we recommended this:</h5>
                        <ul className="reason-list">
                          {userContext.preferences?.cuisine_preferences?.includes(restaurant.cuisine) &&
                            <li>Matches your cuisine preference for {restaurant.cuisine}</li>
                          }
                          {userContext.preferences?.budget === restaurant.price_range &&
                            <li>Matches your budget preference ({restaurant.price_range})</li>
                          }
                          {Object.entries(recommendations.recommendation_factors || {})
                            .filter(([key, value]) =>
                              key.includes(restaurant.cuisine.toLowerCase()) && value > 0.5)
                            .map(([key, value]) => (
                              <li key={key}>Based on your taste profile ({(value * 100).toFixed(0)}% match)</li>
                            ))
                          }
                          {!(userContext.preferences?.cuisine_preferences?.includes(restaurant.cuisine) ||
                            userContext.preferences?.budget === restaurant.price_range) &&
                            <li>New recommendation to help us learn your preferences</li>
                          }
                        </ul>
                      </div>

                      {/* Feedback buttons */}
                      <div className="feedback-buttons">
                        <button
                          onClick={() => handleFeedback(restaurant.id, 'restaurant', 'like')}
                          className="like-button"
                        >
                          👍 Like
                        </button>
                        <button
                          onClick={() => handleFeedback(restaurant.id, 'restaurant', 'dislike')}
                          className="dislike-button"
                        >
                          👎 Dislike
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Dishes Section */}
                <h3>Recommended Dishes</h3>
                <div className="dishes-grid">
                  {recommendations.dishes?.map(dish => (
                    <div key={dish.id} className="dish-card">
                      <h4>{dish.name}</h4>
                      <p className="dish-price">${dish.price.toFixed(2)}</p>
                      <p className="dish-description">{dish.description}</p>
                      <div className="dish-tags">
                        {dish.dietary_tags.map(tag => (
                          <span key={tag} className="dietary-tag">{tag}</span>
                        ))}
                      </div>
                      <div className="feedback-buttons">
                        <button
                          onClick={() => handleFeedback(dish.id, 'dish', 'like')}
                          className="like-button"
                        >
                          👍 Like
                        </button>
                        <button
                          onClick={() => handleFeedback(dish.id, 'dish', 'dislike')}
                          className="dislike-button"
                        >
                          👎 Dislike
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* AI-Enhanced Dishes Section */}
          {useAI && recommendations.enhanced_dishes && (
            <div>
              <h3>AI-Enhanced Dish Descriptions</h3>
              <p className="ai-explanation">These dishes are enhanced with AI-powered classifications and descriptions</p>
              <div className="dishes-grid">
                {recommendations.enhanced_dishes.map(dish => (
                  <div key={dish.id} className="dish-card ai-enhanced">
                    <h4>{dish.name}</h4>
                    <p className="dish-price">${dish.price.toFixed(2)}</p>
                    
                    {/* Highlight AI Attributes at the top of the card */}
                    {dish.ai_attributes && dish.ai_attributes.length > 0 && (
                      <div className="ai-attributes-container">
                        <h5 className="ai-attributes-title">
                          <span className="ai-badge-small">AI</span> Flavor Profile:
                        </h5>
                        <div className="ai-attributes">
                          {dish.ai_attributes.map(attr => (
                            <span key={attr} className="ai-attribute-tag">{attr}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Add a visual indicator for fallback descriptions */}
                    <div className="ai-description">
                      <h5>
                        <span className="ai-badge-small">AI</span> 
                        Description:
                        {!dish.ai_description?.includes("A traditional") && 
                         !dish.ai_description?.includes("A delicious") && 
                         !dish.ai_description?.includes("A flavorful") ? 
                          "" : 
                          <span className="fallback-indicator"> (Generated)</span>
                        }
                      </h5>
                      <p>{dish.ai_description || "AI is still thinking about this dish..."}</p>
                    </div>
                    
                    {/* Text Feedback Form */}
                    <div className="text-feedback-form">
                      <textarea
                        placeholder="What do you think about this dish? Your feedback will be analyzed by AI."
                        className="feedback-textarea"
                        id={`feedback-${dish.id}`}
                        rows="3"
                      ></textarea>
                      <button
                        onClick={() => {
                          const text = document.getElementById(`feedback-${dish.id}`).value;
                          handleTextFeedback(dish.id, 'dish', text);
                        }}
                        className="submit-feedback-btn"
                      >
                        Submit Feedback
                      </button>
                    </div>
                    
                    {/* Traditional Feedback Buttons */}
                    <div className="feedback-buttons">
                      <button
                        onClick={() => handleFeedback(dish.id, 'dish', 'like')}
                        className="like-button"
                      >
                        👍 Like
                      </button>
                      <button
                        onClick={() => handleFeedback(dish.id, 'dish', 'dislike')}
                        className="dislike-button"
                      >
                          👎 Dislike
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Health Check Button */}
      <button onClick={checkHealth} className="health-check-btn">
        Test API Health
      </button>
      {healthStatus && <div className="health-status">{healthStatus}</div>}

      {/* Navigation */}
      <nav>
        <Link to="/debug/context">View My Taste Profile</Link> |
        <Link to="/mcp-dashboard">MCP Dashboard</Link> |
        <button onClick={handleLogout}>Logout</button>
      </nav>
    </div>
  );
};

const DebugContext = () => {
  const [context, setContext] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchContext = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/api/debug/context`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setContext(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching context:', error.response ? error.response.data : error.message);
        setError('Failed to load your taste profile. Please try again.');
        setLoading(false);
        if (error.response && error.response.status === 401) {
          navigate('/login');
        }
      }
    };
    fetchContext();
  }, [navigate]);

  return (
    <div className="context-debug">
      <h2>Your Taste Profile (Powered by MCP)</h2>
      
      <div className="mcp-explanation">
        <p>
          The Model Context Protocol (MCP) maintains this profile separately from the main application.
          This separation provides better security, scalability, and allows your preferences to potentially
          be used across multiple services.
          <Link to="/mcp-dashboard" className="learn-more-link">Learn more about MCP</Link>
        </p>
      </div>

      {loading && <p>Loading your taste profile...</p>}
      {error && <p className="error-message">{error}</p>}

      {context && !loading && (
        <div className="context-data">
          {/* Explicit Preferences Section */}
          <div className="context-section">
            <h3>Your Explicit Preferences</h3>
            <div className="preference-group">
              <h4>Dietary Restrictions:</h4>
              {context.explicit_preferences?.dietary_restrictions?.length > 0 ? (
                <ul>
                  {context.explicit_preferences.dietary_restrictions.map(item => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p>None specified</p>
              )}
            </div>
            
            <div className="preference-group">
              <h4>Cuisine Preferences:</h4>
              {context.explicit_preferences?.cuisine_preferences?.length > 0 ? (
                <ul>
                  {context.explicit_preferences.cuisine_preferences.map(item => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p>None specified</p>
              )}
            </div>
            
            <div className="preference-group">
              <h4>Spice Level:</h4>
              <p>{context.explicit_preferences?.spice_level || 'Not specified'}</p>
            </div>
            
            <div className="preference-group">
              <h4>Budget:</h4>
              <p>{context.explicit_preferences?.budget || 'Not specified'}</p>
            </div>
          </div>
          
          {/* Inferred Preferences Section */}
          <div className="context-section">
            <h3>Your Learned Preferences</h3>
            {Object.keys(context.inferred_preferences || {}).length > 0 ? (
              <div className="inferred-preferences">
                {Object.entries(context.inferred_preferences || {}).map(([key, value]) => (
                  <div key={key} className="inferred-item">
                    <div className="inferred-name">
                      {key.replace(/_/g, ' ').replace(/^(.)|\s+(.)/g, c => c.toUpperCase())}
                    </div>
                    <div className="inferred-bar">
                      <div 
                        className="inferred-value" 
                        style={{ 
                          width: `${value * 100}%`,
                          backgroundColor: value > 0.6 ? '#4CAF50' : 
                                          value < 0.4 ? '#F44336' : '#FFC107'
                        }}
                      ></div>
                    </div>
                    <div className="inferred-percent">{(value * 100).toFixed(0)}%</div>
                  </div>
                ))}
              </div>
            ) : (
              <p>No learned preferences yet. Keep interacting with recommendations!</p>
            )}
          </div>
          
          {/* Timeline Section */}
          <div className="context-section">
            <h3>Context Evolution Timeline</h3>
            {context.recent_interactions?.length > 0 ? (
              <div className="context-timeline">
                <div className="timeline-start">
                  <div className="timeline-marker">📝</div>
                  <div className="timeline-label">Initial Preferences</div>
                </div>
                
                {context.recent_interactions.map((interaction, idx) => (
                  <div key={idx} className="timeline-event">
                    <div className="timeline-marker">
                      {interaction.interaction_type === 'like' ? '👍' : '👎'}
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-header">
                        {new Date(interaction.timestamp).toLocaleString()}
                      </div>
                      <div className="timeline-detail">
                        {interaction.interaction_type === 'like' ? 'Liked' : 'Disliked'} {interaction.item_type} #{interaction.item_id}
                      </div>
                      <div className="timeline-impact">
                        Impact: {idx < context.recent_interactions.length - 1 ? 
                          'Updated taste profile' : 
                          'Most recent interaction'}
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="timeline-end">
                  <div className="timeline-marker">🎯</div>
                  <div className="timeline-label">Current Profile</div>
                </div>
              </div>
            ) : (
              <p>No interactions yet. Your context will evolve as you interact with recommendations.</p>
            )}
          </div>
          
          {/* Preference Insights Section */}
          <div className="context-section">
            <h3>Preference Insights</h3>
            {context.preference_insights?.length > 0 ? (
              <ul className="insights-list">
                {context.preference_insights.map((insight, index) => (
                  <li key={index}>{insight}</li>
                ))}
              </ul>
            ) : (
              <p>No insights available yet. Continue using the app to build your profile.</p>
            )}
          </div>
          
          {/* Recent Interactions Section */}
          <div className="context-section">
            <h3>Recent Interactions</h3>
            {context.recent_interactions?.length > 0 ? (
              <div className="interactions-list">
                {context.recent_interactions.map((interaction, index) => (
                  <div key={index} className="interaction-item">
                    <span className={`interaction-type ${interaction.interaction_type}`}>
                      {interaction.interaction_type === 'like' ? '👍' : '👎'}
                    </span>
                    <span className="interaction-detail">
                      {interaction.item_type.charAt(0).toUpperCase() + interaction.item_type.slice(1)} #{interaction.item_id}
                    </span>
                    <span className="interaction-time">
                      {new Date(interaction.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p>No interactions recorded yet. Try liking or disliking some recommendations!</p>
            )}
          </div>
          
          {/* Privacy Section */}
          <div className="context-section">
            <h3>Context Privacy</h3>
            <p>
              Your context data is managed securely by the MCP. In a production application, 
              you would have controls to:
            </p>
            <ul className="privacy-controls">
              <li>Export your personal context data</li>
              <li>Reset specific preference categories</li>
              <li>Delete your entire context profile</li>
            </ul>
            <p className="privacy-note">
              This separation of context data is a key benefit of the Model Context Protocol architecture.
            </p>
          </div>
          
          {/* Metadata Section */}
          <div className="context-metadata">
            <p>User ID: {context.user_id}</p>
            <p>Context Age: {context.context_age}</p>
          </div>
        </div>
      )}
      
      <div className="nav-links">
        <Link to="/home" className="back-link">Back to Recommendations</Link> |
        <Link to="/mcp-dashboard" className="nav-link">MCP Dashboard</Link>
      </div>
    </div>
  );
};

// MCPDashboard component
const MCPDashboard = () => {
  return (
    <div className="mcp-dashboard">
      <h2>Model Context Protocol Dashboard</h2>
      
      <div className="mcp-section">
        <h3>What is Model Context Protocol?</h3>
        <p>
          MCP is an architectural pattern that separates the AI/ML layer from the application logic,
          allowing for better maintainability, scalability, and flexibility in AI-powered applications.
        </p>
        
        <div className="mcp-architecture">
          <h4>MCP Architecture Visualization</h4>
          <div className="architecture-diagram">
            <div className="layer frontend">Frontend UI</div>
            <div className="arrow">↓ HTTP/REST ↑</div>
            <div className="layer app-api">Application API</div>
            <div className="arrow">↓ HTTP/REST ↑</div>
            <div className="layer mcp">Model Context Protocol</div>
            <div className="mcp-sublayers">
              <div className="sublayer">Context Management</div>
              <div className="sublayer">Recommendation Engine</div>
              <div className="sublayer">Preference Learning</div>
            </div>
            <div className="arrow">↓ Database Access ↑</div>
            <div className="layer databases">
              <span>MongoDB</span>
              <span>PostgreSQL</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mcp-section">
        <h3>Key Benefits of MCP</h3>
        <ul className="benefits-list">
          <li>
            <strong>Separation of Concerns:</strong> The AI/ML logic is decoupled from application business logic
          </li>
          <li>
            <strong>Scalability:</strong> Scale AI components independently from the rest of the application
          </li>
          <li>
            <strong>Maintainability:</strong> Update AI models without changing application code
          </li>
          <li>
            <strong>Reusability:</strong> Use the same MCP service across multiple applications
          </li>
          <li>
            <strong>Security:</strong> Isolate sensitive user context data from application code
          </li>
        </ul>
      </div>

      <div className="mcp-section">
        <h3>Database Architecture: Why Two Databases?</h3>
        <p>
          This application uses a dual-database architecture to optimize for different data needs:
        </p>
        
        <div className="db-comparison">
          <div className="db-card mongodb">
            <h4>MongoDB (NoSQL)</h4>
            <h5>Used for: User Context</h5>
            <ul>
              <li><strong>Flexible Schema:</strong> User preferences and tastes evolve over time, requiring a dynamic schema</li>
              <li><strong>Rapid Iteration:</strong> New preference attributes can be added without migrations</li>
              <li><strong>Document Storage:</strong> Natural fit for storing complete user context as a single document</li>
              <li><strong>High Write Volume:</strong> Efficiently handles frequent updates to user context as feedback is provided</li>
            </ul>
          </div>
          
          <div className="db-card postgres">
            <h4>PostgreSQL (Relational)</h4>
            <h5>Used for: Restaurant & Dish Data</h5>
            <ul>
              <li><strong>Structured Data:</strong> Restaurants and dishes have well-defined, stable schemas</li>
              <li><strong>Relational Integrity:</strong> Maintains relationships between restaurants and their dishes</li>
              <li><strong>Complex Queries:</strong> Efficiently filters and sorts based on multiple criteria</li>
              <li><strong>ACID Compliance:</strong> Ensures data consistency for business-critical information</li>
            </ul>
          </div>
        </div>
        
        <div className="db-explanation">
          <h4>Why This Matters for MCP:</h4>
          <p>
            This dual-database approach demonstrates another key advantage of the MCP architecture:
            <strong>specialized data storage for different concerns</strong>. The preference learning
            and context management functions can use MongoDB's flexibility, while the recommendation
            system can leverage PostgreSQL's querying capabilities.
          </p>
          <p>
            In a production environment, this separation allows teams to:
          </p>
          <ul>
            <li>Scale each database independently based on usage patterns</li>
            <li>Optimize each for their specific workloads</li>
            <li>Ensure sensitive user context data is stored separately from content data</li>
            <li>Add new context dimensions without impacting the core recommendation service</li>
          </ul>
        </div>
      </div>

      <div className="mcp-section">
        <h3>MCP in Action: Local Flavors Explorer</h3>
        <p>
          The Local Flavors Explorer demo showcases a food recommendation system that adapts to your tastes.
          It uses MCP to manage your preferences and improve recommendations over time.
        </p>

        <h4>How It Works:</h4>
        <ol>
          <li><strong>Sign Up / Login:</strong> Create an account or log in.</li>
          <li><strong>Set Preferences:</strong> Optionally, set your food preferences.</li>
          <li><strong>Get Recommendations:</strong> Receive personalized restaurant and dish recommendations.</li>
          <li><strong>Provide Feedback:</strong> Like or dislike recommendations to improve accuracy.</li>
          <li><strong>View Context:</strong> See your taste profile and how it evolves.</li>
        </ol>

        <p>
          This demo highlights the power of MCP in creating adaptive, user-centered applications.
        </p>
      </div>
    </div>
  );
};

// App Routes Component
function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/signup" element={<AuthForm type="signup" />} />
          <Route path="/login" element={<AuthForm type="login" />} />
          <Route path="/home" element={<Home />} />
          <Route path="/debug/context" element={<DebugContext />} />
          <Route path="/mcp-dashboard" element={<MCPDashboard />} />
          <Route path="/" element={<AuthForm type="login" />} /> {/* Default route */}
        </Routes>
      </div>
    </Router >
  );
}

export default App;

// Add these CSS styles to enhance the display of sentiment analysis
// You can add this to App.css or include it inline in a style tag if needed
/*
.ai-sentiment-analysis {
  background-color: #f5f5f5;
  border-left: 4px solid #5436DA;
  padding: 12px;
  border-radius: 6px;
  margin: 10px 0;
  animation: fadeIn 0.5s ease;
}

.sentiment-main {
  font-weight: bold;
  margin-bottom: 8px;
}

.sentiment-details {
  font-size: 0.9em;
  padding: 8px;
  background-color: rgba(84, 54, 218, 0.05);
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.reasoning {
  font-style: italic;
}

.key-phrases {
  font-size: 0.85em;
  color: #555;
}

.analysis-method {
  font-size: 0.8em;
  color: #666;
  margin-top: 5px;
}
*/
