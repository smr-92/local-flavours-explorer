# mcp/main.py
import os
from dotenv import load_dotenv
from typing import List, Dict, Optional
load_dotenv()
from fastapi import FastAPI, Depends, HTTPException, status, Header, Body
from pydantic import BaseModel, ValidationError  # Import BaseModel and ValidationError
from pymongo import MongoClient
import psycopg2
from psycopg2.extras import RealDictCursor
import logging
import ai_models  # Import our new AI models module

app = FastAPI()

# Set up logging at the top of your file
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# --- Configuration (from previous step, just showing context) ---
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/mcp_context_db")
POSTGRES_HOST = os.getenv("POSTGRES_HOST", "localhost")
POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")
POSTGRES_USER = os.getenv("POSTGRES_USER", "user")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "password")
POSTGRES_DB = os.getenv("POSTGRES_DB", "restaurants_db")
MCP_API_KEY = os.getenv("MCP_API_KEY")
HF_API_TOKEN = os.getenv("HF_API_KEY", "")  # Optional Hugging Face API key
# --- Pydantic Models for Request/Response ---
class InitialPreferences(BaseModel):
   dietary_restrictions: List[str] = [] # e.g., ["vegetarian", "gluten-free"]
   cuisine_preferences: List[str] = []  # e.g., ["Italian", "Indian"]
   spice_level: Optional[str] = None    # e.g., "Mild", "Medium", "Hot"
   budget: Optional[str] = None         # e.g., "$", "$$", "$$$"
class UserContext(BaseModel):
   user_id: str
   preferences: InitialPreferences
   # These will evolve as user interacts
   inferred_tastes: Dict[str, float] = {} # e.g., {"affinity_pasta": 0.7, "avoid_seafood": 0.9}
   interaction_history: List[Dict] = [] # e.g., [{"item_id": "dish123", "type": "like", "timestamp": "..."}]
# Define a new model for restaurant recommendations
class Restaurant(BaseModel):
    id: int
    name: str
    cuisine: str
    description: str
    price_range: str
    location: str

class Dish(BaseModel):
    id: int
    restaurant_id: int
    name: str
    description: str
    price: float
    dietary_tags: List[str]

class RecommendationResponse(BaseModel):
    restaurants: List[Restaurant] = []
    dishes: List[Dish] = []
    message: str
    recommendation_factors: Dict[str, float] = {}
    user_context: Optional[Dict] = None  # Add this field

class EnhancedDish(BaseModel):
    id: int
    restaurant_id: int
    name: str
    description: str
    ai_description: Optional[str] = None
    ai_attributes: List[str] = []
    price: float
    dietary_tags: List[str]

# Updated recommendation response model
class EnhancedRecommendationResponse(RecommendationResponse):
    enhanced_dishes: List[EnhancedDish] = []
    ai_powered: bool = True

class Interaction(BaseModel):
    item_id: str
    item_type: str  # 'restaurant' or 'dish'
    interaction_type: str  # 'like' or 'dislike'
    timestamp: str

# --- MCP API Key Authentication Dependency ---
def get_api_key(api_key: str = Header(None, alias="X-MCP-API-Key")):
    print(f"API Key received: {api_key}")
    if api_key is None:
        print("No API key provided")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="API Key is required")
    if api_key != MCP_API_KEY:
        print(f"Invalid API key: {api_key} != {MCP_API_KEY}")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid API Key")
    print("API key is valid")
    return api_key
# --- Database Connections (from previous step, just showing context) ---
@app.on_event("startup")
async def startup_db_client():
   app.mongodb_client = MongoClient(MONGO_URI)
   app.mongodb = app.mongodb_client.get_database()
   print(f"Connected to MongoDB: {MONGO_URI}")
@app.on_event("shutdown")
async def shutdown_db_client():
   app.mongodb_client.close()
   print("Closed MongoDB connection.")
def get_postgres_conn():
   try:
       conn = psycopg2.connect(
           host=POSTGRES_HOST,
           port=POSTGRES_PORT,
           user=POSTGRES_USER,
           password=POSTGRES_PASSWORD,
           dbname=POSTGRES_DB
       )
       return conn
   except Exception as e:
       print(f"Error connecting to PostgreSQL: {e}")
       raise HTTPException(status_code=500, detail="Database connection error")

# --- Endpoints ---
# Health Check (from previous step)
@app.get("/mcp/health")
async def health_check():
   mongo_status = "Disconnected"
   postgres_status = "Disconnected"
   try:
       app.mongodb_client.admin.command('ping')
       mongo_status = "Connected"
   except Exception as e:
       mongo_status = f"Failed: {e}"
   try:
       with get_postgres_conn() as conn:
           with conn.cursor() as cursor:
               cursor.execute("SELECT 1")
               postgres_status = "Connected"
   except Exception as e:
       postgres_status = f"Failed: {e}"
   return {
       "status": "ok",
       "message": "MCP is running!",
       "mongodb_status": mongo_status,
       "postgres_status": postgres_status
   }
# New: Endpoint to create/update initial user context
@app.post("/mcp/v1/context/user/{user_id}", response_model=UserContext)
async def create_or_update_user_context(
   user_id: str,
   request: dict = Body(...),  # Change to accept any JSON
   api_key: str = Depends(get_api_key) # Protect this endpoint
):
   print(f"ROUTE WITH /mcp PREFIX WAS CALLED for user {user_id}")
   # Log the raw request body
   logger.debug(f"Received request for user {user_id}")
   logger.debug(f"Request body: {request}")
   
   try:
       # Check if initial_prefs exists in the request
       if 'initial_prefs' in request:
           logger.debug("Found initial_prefs in request")
           initial_prefs = InitialPreferences(**request['initial_prefs'])
       else:
           # Try to parse the whole body as InitialPreferences
           logger.debug("Trying to parse entire body as InitialPreferences")
           initial_prefs = InitialPreferences(**request)
       
       logger.debug(f"Parsed initial_prefs: {initial_prefs}")
       
       # Create a new user context document
       user_context_doc = UserContext(
           user_id=user_id,
           preferences=initial_prefs,
           inferred_tastes={},
           interaction_history=[]
       ).dict()
       
       # Insert or update the context in MongoDB
       result = app.mongodb["user_contexts"].update_one(
           {"user_id": user_id},
           {"$set": user_context_doc},
           upsert=True
       )
       
       if result.upserted_id:
           logger.info(f"New user context created for {user_id}")
       else:
           logger.info(f"User context updated for {user_id}")
       
       # Retrieve the updated document to return
       updated_context = app.mongodb["user_contexts"].find_one({"user_id": user_id})
       return UserContext(**updated_context)
   
   except ValidationError as e:
       # Detailed logging for Pydantic validation errors
       error_details = e.errors()
       logger.error(f"Validation error for user {user_id}: {error_details}")
       
       # Create a more user-friendly error message
       missing_fields = [err["loc"][0] for err in error_details if err["type"] == "missing"]
       if missing_fields:
           error_msg = f"Missing required fields: {', '.join(missing_fields)}"
       else:
           error_msg = f"Validation error: {str(e)}"
           
       logger.error(error_msg)
       raise HTTPException(status_code=422, detail=error_msg)
       
   except Exception as e:
       # General exception handling
       logger.error(f"Unexpected error processing request for user {user_id}: {str(e)}")
       raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

# Function to get user context
def get_user_context(user_id: str):
    context = app.mongodb["user_contexts"].find_one({"user_id": user_id})
    if not context:
        raise HTTPException(status_code=404, detail=f"User context not found for user {user_id}")
    return UserContext(**context)

# Updated recommendations endpoint
@app.get("/mcp/v1/recommendations/user/{user_id}", response_model=RecommendationResponse)
async def get_recommendations(
    user_id: str, 
    excluded_items: str = "",
    refresh: str = "false",
    api_key: str = Depends(get_api_key)
):
    logger.info(f"Generating recommendations for user {user_id}, excluded items: {excluded_items}")
    
    try:
        # Get user context
        user_context = get_user_context(user_id)
        
        # Parse excluded items
        excluded_ids = []
        if excluded_items:
            excluded_ids = [item.strip() for item in excluded_items.split(',')]
            logger.info(f"Excluding items: {excluded_ids}")
        
        # Connect to PostgreSQL
        with get_postgres_conn() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                # Base query
                base_query = """
                SELECT r.id, r.name, r.cuisine, r.description, r.price_range, r.location 
                FROM restaurants r
                """
                
                # Apply filters based on user preferences and excluded items
                filters = []
                params = []
                
                # Filter by cuisine preferences if present
                if user_context.preferences.cuisine_preferences:
                    cuisines_list = user_context.preferences.cuisine_preferences
                    placeholders = ', '.join(['%s'] * len(cuisines_list))
                    filters.append(f"r.cuisine IN ({placeholders})")
                    params.extend(cuisines_list)
                
                # Filter by budget if present
                if user_context.preferences.budget:
                    filters.append("r.price_range = %s")
                    params.append(user_context.preferences.budget)
                
                # Add WHERE clause if filters exist
                if filters:
                    base_query += " WHERE " + " AND ".join(filters)
                
                # Add ORDER BY clause to prioritize restaurants based on user's inferred tastes
                # First get restaurants user has liked cuisines for
                cuisines_liked = []
                for taste, value in user_context.inferred_tastes.items():
                    if taste.startswith("cuisine_") and value > 0.6:
                        cuisine = taste.replace("cuisine_", "").title()
                        cuisines_liked.append(cuisine)
                
                if cuisines_liked:
                    if filters:
                        base_query += " ORDER BY CASE"
                        for i, cuisine in enumerate(cuisines_liked):
                            base_query += f" WHEN r.cuisine = %s THEN {i+1}"
                            params.append(cuisine)
                        base_query += " ELSE 999 END"
                
                # Add LIMIT clause with a higher number
                base_query += f" LIMIT 15"  # Increased limit to have more options
                
                # Execute the query
                cursor.execute(base_query, params)
                restaurant_rows = cursor.fetchall()
                
                # If we got no results with filters, try again without filters
                if not restaurant_rows and filters:
                    logger.info("No matching restaurants with filters, trying without filters")
                    cursor.execute("SELECT r.id, r.name, r.cuisine, r.description, r.price_range, r.location FROM restaurants r LIMIT 10")
                    restaurant_rows = cursor.fetchall()
                
                # Convert to Restaurant objects
                restaurants = [Restaurant(**row) for row in restaurant_rows]
                
                # Get dishes, excluding any disliked ones
                dish_query = """
                SELECT d.id, d.restaurant_id, d.name, d.description, d.price, d.dietary_tags
                FROM dishes d
                WHERE d.restaurant_id = ANY(%s)
                """
                
                # Add exclusion for disliked items
                if excluded_ids:
                    dish_query += " AND d.id::text NOT IN (" + ", ".join(["%s"] * len(excluded_ids)) + ")"
                
                restaurant_ids = [r.id for r in restaurants]
                dish_params = [restaurant_ids]
                
                # Add excluded item params
                if excluded_ids:
                    dish_params.extend(excluded_ids)
                
                # Get dishes
                dishes = []
                if restaurant_ids:
                    cursor.execute(dish_query, dish_params)
                    dish_rows = cursor.fetchall()
                    
                    # Process dishes (similar to before)
                    for row in dish_rows:
                        # Convert dietary_tags from DB format to Python list
                        if isinstance(row['dietary_tags'], list):
                            dietary_tags = row['dietary_tags']
                        else:
                            # Handle case where it might be a string or other format
                            dietary_tags = []
                            if row['dietary_tags']:
                                try:
                                    # Try to parse as a PostgreSQL array format
                                    tags_str = row['dietary_tags'].strip('{}')
                                    if tags_str:
                                        dietary_tags = tags_str.split(',')
                                except:
                                    pass
                        
                        # Update row with properly parsed dietary_tags
                        row['dietary_tags'] = dietary_tags
                        
                        # Include dish if it matches dietary restrictions or we have no restrictions
                        match_dietary = not user_context.preferences.dietary_restrictions or \
                                      any(tag in user_context.preferences.dietary_restrictions for tag in dietary_tags)
                        
                        if match_dietary:
                            dishes.append(Dish(**row))
                
                # Ensure we have enough dishes
                if len(dishes) < 10 and restaurant_ids:
                    # If we have too few dishes, fetch some more without the exclusions
                    logger.info("Not enough dishes with exclusions, adding more options")
                    simpler_query = """
                    SELECT d.id, d.restaurant_id, d.name, d.description, d.price, d.dietary_tags
                    FROM dishes d
                    WHERE d.restaurant_id = ANY(%s)
                    LIMIT 10
                    """
                    cursor.execute(simpler_query, [restaurant_ids])
                    additional_rows = cursor.fetchall()
                    
                    # Only add dishes we don't already have
                    existing_ids = {d.id for d in dishes}
                    for row in additional_rows:
                        if row['id'] not in existing_ids and str(row['id']) not in excluded_ids:
                            # Process dietary tags
                            if isinstance(row['dietary_tags'], list):
                                dietary_tags = row['dietary_tags']
                            else:
                                dietary_tags = []
                                if row['dietary_tags']:
                                    try:
                                        tags_str = row['dietary_tags'].strip('{}')
                                        if tags_str:
                                            dietary_tags = tags_str.split(',')
                                    except:
                                        pass
                            row['dietary_tags'] = dietary_tags
                            dishes.append(Dish(**row))
                
                # Calculate recommendation factors (for debug/visualization)
                recommendation_factors = {
                    "cuisine_match": 0.8 if user_context.preferences.cuisine_preferences else 0.0,
                    "budget_match": 0.7 if user_context.preferences.budget else 0.0,
                    "dietary_match": 0.9 if user_context.preferences.dietary_restrictions else 0.0
                }
                
                # If we have inferred tastes, add them as factors
                for taste, value in user_context.inferred_tastes.items():
                    recommendation_factors[f"inferred_{taste}"] = value
                
                # Include the user context in the response for explanation purposes
                return RecommendationResponse(
                    restaurants=restaurants,
                    dishes=dishes,
                    message=f"Generated {len(restaurants)} restaurant and {len(dishes)} dish recommendations for user {user_id}",
                    recommendation_factors=recommendation_factors,
                    user_context=user_context.dict()  # Add user context to response
                )
    
    except Exception as e:
        logger.error(f"Error generating recommendations for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating recommendations: {str(e)}")

# AI-enhanced recommendations endpoint
@app.get("/mcp/v1/ai-recommendations/user/{user_id}", response_model=EnhancedRecommendationResponse)
async def get_ai_recommendations(
    user_id: str, 
    excluded_items: str = "",
    refresh: str = "false",
    api_key: str = Depends(get_api_key)
):
    logger.info(f"Generating AI-enhanced recommendations for user {user_id}")
    
    try:
        # Get the standard recommendations first
        standard_recs = await get_recommendations(user_id, excluded_items, refresh, api_key)
        
        # Get user context
        user_context = get_user_context(user_id)
        
        # Enhance dishes with AI-generated descriptions and attributes
        enhanced_dishes = []
        
        for dish in standard_recs.dishes:
            # Get the restaurant for this dish
            restaurant = next((r for r in standard_recs.restaurants if r.id == dish.restaurant_id), None)
            cuisine = restaurant.cuisine if restaurant else "delicious"
            
            # Generate AI-enhanced description
            ai_description = ai_models.generate_personalized_description(
                dish_name=dish.name,
                cuisine=cuisine,
                user_preferences=user_context.preferences.dict()
            )
            
            # Classify dish attributes
            ai_attributes = ai_models.classify_dish_attributes(
                dish_name=dish.name,
                dish_description=dish.description
            )
            
            # Create enhanced dish
            enhanced_dish = EnhancedDish(
                id=dish.id,
                restaurant_id=dish.restaurant_id,
                name=dish.name,
                description=dish.description,
                ai_description=ai_description,
                ai_attributes=ai_attributes,
                price=dish.price,
                dietary_tags=dish.dietary_tags
            )
            
            enhanced_dishes.append(enhanced_dish)
        
        # Create and return enhanced response
        return EnhancedRecommendationResponse(
            restaurants=standard_recs.restaurants,
            dishes=standard_recs.dishes,
            enhanced_dishes=enhanced_dishes,
            message=f"Generated {len(standard_recs.restaurants)} AI-enhanced recommendations for user {user_id}",
            recommendation_factors=standard_recs.recommendation_factors,
            user_context=standard_recs.user_context,
            ai_powered=True
        )
    
    except Exception as e:
        logger.error(f"Error generating AI-enhanced recommendations for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating AI-enhanced recommendations: {str(e)}")

# AI-powered sentiment analysis for user feedback
@app.post("/mcp/v1/context/user/{user_id}/ai-feedback")
async def analyze_user_feedback(
    user_id: str,
    feedback: dict = Body(...),
    api_key: str = Depends(get_api_key)
):
    """
    Analyze user feedback using sentiment analysis and update user context.
    """
    logger.info(f"Analyzing feedback for user {user_id}")
    
    try:
        # Extract feedback text and item details
        feedback_text = feedback.get("feedback_text", "")
        item_id = feedback.get("item_id", "")
        item_type = feedback.get("item_type", "")
        
        if not feedback_text or not item_id or not item_type:
            raise HTTPException(status_code=400, detail="Missing required feedback data")
        
        # Analyze sentiment
        sentiment_result = ai_models.analyze_feedback_sentiment(feedback_text)
        
        # Create interaction based on sentiment
        interaction_type = "like" if sentiment_result["sentiment"] == "POSITIVE" else "dislike"
        
        # Create interaction object
        interaction = Interaction(
            item_id=item_id,
            item_type=item_type,
            interaction_type=interaction_type,
            timestamp=feedback.get("timestamp", "") or datetime.now().isoformat()
        )
        
        # Use existing interaction endpoint to update user context
        interaction_result = await user_interaction(user_id, interaction, api_key)
        
        # Return enhanced response with sentiment analysis
        return {
            "message": f"AI-analyzed feedback recorded for user {user_id}",
            "sentiment_analysis": sentiment_result,
            "derived_interaction": interaction.dict(),
            "context_updated": True
        }
    
    except Exception as e:
        logger.error(f"Error analyzing feedback for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error analyzing feedback: {str(e)}")

# Updated interaction endpoint to update user context
@app.post("/mcp/v1/context/user/{user_id}/interact")
async def user_interaction(
    user_id: str, 
    interaction: Interaction,
    api_key: str = Depends(get_api_key)
):
    logger.info(f"Recording interaction for user {user_id}: {interaction}")
    
    try:
        # Get user context
        user_context = get_user_context(user_id)
        
        # Add interaction to history
        interaction_dict = interaction.dict()
        
        # Update interaction history
        app.mongodb["user_contexts"].update_one(
            {"user_id": user_id},
            {"$push": {"interaction_history": interaction_dict}}
        )
        
        # Update inferred tastes based on interaction
        # This is simplified logic - in a real app, you'd have more sophisticated preference learning
        if interaction.interaction_type == "like":
            factor = 0.1  # Increase preference
        else:  # dislike
            factor = -0.1  # Decrease preference
        
        # Get item details to update preferences
        if interaction.item_type == "restaurant":
            # Update restaurant cuisine preference
            with get_postgres_conn() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                    try:
                        # Safely convert item_id to integer and handle any errors
                        item_id_int = int(interaction.item_id)
                        
                        cursor.execute(
                            "SELECT cuisine FROM restaurants WHERE id = %s",
                            (item_id_int,)
                        )
                        result = cursor.fetchone()
                        if result:
                            cuisine = result["cuisine"]
                            
                            # Update inferred taste for this cuisine
                            taste_key = f"cuisine_{cuisine.lower()}"
                            current_value = user_context.inferred_tastes.get(taste_key, 0.5)
                            new_value = max(0.0, min(1.0, current_value + factor))  # Keep between 0 and 1
                            
                            app.mongodb["user_contexts"].update_one(
                                {"user_id": user_id},
                                {"$set": {f"inferred_tastes.{taste_key}": new_value}}
                            )
                    except ValueError as e:
                        # Handle the case where item_id is not a valid integer
                        logger.error(f"Invalid restaurant ID format: {interaction.item_id}")
                        # We'll continue without updating inferred tastes
        
        elif interaction.item_type == "dish":
            # Update dish preference
            with get_postgres_conn() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                    try:
                        # Safely convert item_id to integer and handle any errors
                        item_id_int = int(interaction.item_id)
                        
                        cursor.execute(
                            "SELECT d.name, d.dietary_tags, r.cuisine FROM dishes d JOIN restaurants r ON d.restaurant_id = r.id WHERE d.id = %s",
                            (item_id_int,)
                        )
                        result = cursor.fetchone()
                        if result:
                            # Update cuisine preference
                            cuisine = result["cuisine"]
                            taste_key = f"cuisine_{cuisine.lower()}"
                            current_value = user_context.inferred_tastes.get(taste_key, 0.5)
                            new_value = max(0.0, min(1.0, current_value + factor))
                            
                            app.mongodb["user_contexts"].update_one(
                                {"user_id": user_id},
                                {"$set": {f"inferred_tastes.{taste_key}": new_value}}
                            )
                            
                            # If dish has dietary tags, update those preferences too
                            if result["dietary_tags"]:
                                for tag in result["dietary_tags"]:
                                    tag_key = f"prefers_{tag.replace('-', '_')}"  # Fixed missing closing quote
                                    current_value = user_context.inferred_tastes.get(tag_key, 0.5)
                                    new_value = max(0.0, min(1.0, current_value + factor))
                                    
                                    app.mongodb["user_contexts"].update_one(
                                        {"user_id": user_id},
                                        {"$set": {f"inferred_tastes.{tag_key}": new_value}}
                                    )
                    except ValueError as e:
                        # Handle the case where item_id is not a valid integer
                        logger.error(f"Invalid dish ID format: {interaction.item_id}")
                        # We'll continue without updating inferred tastes
        
        return {
            "message": f"Interaction recorded for user {user_id}",
            "interaction": interaction_dict,
            "context_updated": True
        }
    
    except Exception as e:
        logger.error(f"Error recording interaction for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error recording interaction: {str(e)}")

# Enhanced context summary endpoint for debugging
@app.get("/mcp/v1/context/user/{user_id}/summary")
async def get_context_summary(user_id: str, api_key: str = Depends(get_api_key)):
    logger.info(f"Retrieving context summary for user {user_id}")
    
    try:
        # Get user context
        user_context = get_user_context(user_id)
        
        # Create a human-readable summary
        summary = {
            "user_id": user_id,
            "explicit_preferences": {
                "dietary_restrictions": user_context.preferences.dietary_restrictions,
                "cuisine_preferences": user_context.preferences.cuisine_preferences,
                "spice_level": user_context.preferences.spice_level,
                "budget": user_context.preferences.budget
            },
            "inferred_preferences": user_context.inferred_tastes,
            "recent_interactions": user_context.interaction_history[-5:] if user_context.interaction_history else [],
            "context_age": "new user" if not user_context.interaction_history else f"{len(user_context.interaction_history)} interactions recorded",
            "preference_insights": []
        }
        
        # Add insights based on explicit preferences first (for new users)
        if user_context.preferences.cuisine_preferences:
            for cuisine in user_context.preferences.cuisine_preferences:
                summary["preference_insights"].append(f"You selected {cuisine} cuisine as a preference")
        
        if user_context.preferences.dietary_restrictions:
            for diet in user_context.preferences.dietary_restrictions:
                summary["preference_insights"].append(f"You follow a {diet} diet")
        
        if user_context.preferences.spice_level:
            summary["preference_insights"].append(f"You prefer {user_context.preferences.spice_level.lower()} spice levels")
            
        if user_context.preferences.budget:
            budget_desc = "budget-friendly" if user_context.preferences.budget == "$" else \
                         "moderately priced" if user_context.preferences.budget == "$$" else "premium"
            summary["preference_insights"].append(f"You prefer {budget_desc} restaurants")
        
        # Add human-readable insights based on inferred tastes with lower thresholds
        for taste, value in user_context.inferred_tastes.items():
            if value > 0.6:  # Lower threshold from 0.7 to 0.6
                if taste.startswith("cuisine_"):
                    cuisine = taste.replace("cuisine_", "").title()
                    summary["preference_insights"].append(f"Strong affinity for {cuisine} cuisine ({value:.2f})")
                elif taste.startswith("prefers_"):
                    pref = taste.replace("prefers_", "").replace("_", " ").title()
                    summary["preference_insights"].append(f"Enjoys {pref} dishes ({value:.2f})")
            elif value < 0.4:  # Raise threshold from 0.3 to 0.4
                if taste.startswith("cuisine_"):
                    cuisine = taste.replace("cuisine_", "").title()
                    summary["preference_insights"].append(f"Low interest in {cuisine} cuisine ({value:.2f})")
                elif taste.startswith("prefers_"):
                    pref = taste.replace("prefers_", "").replace("_", " ").title()
                    summary["preference_insights"].append(f"Avoids {pref} dishes ({value:.2f})")
        
        # If still no insights, add some generic ones
        if not summary["preference_insights"]:
            summary["preference_insights"] = [
                "Keep interacting with recommendations to build your taste profile",
                "Try liking or disliking more items to get personalized insights",
                "Your preferences are still being learned"
            ]
        
        return summary
    
    except Exception as e:
        logger.error(f"Error retrieving context summary for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving context summary: {str(e)}")