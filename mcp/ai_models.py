import os
import requests
import json
import logging
from typing import Dict, List, Optional, Union
import time
from datetime import datetime

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Get Hugging Face API token from environment variables
HF_API_TOKEN = os.getenv("HF_API_KEY", "")

# Define headers with authorization
headers = {
    "Authorization": f"Bearer {HF_API_TOKEN}" if HF_API_TOKEN else "",
    "Content-Type": "application/json"
}

# Base URL for Hugging Face Inference API
HF_API_URL = "https://api-inference.huggingface.co/models"

# Updated model selections - use models that are definitely available in the Inference API
TEXT_GENERATION_MODEL = "gpt2-large"  # Use a larger GPT-2 model which should be available
SENTIMENT_MODEL = "distilbert-base-uncased-finetuned-sst-2-english"  # This one works fine
ZERO_SHOT_MODEL = "facebook/bart-large-mnli"  # This one works fine

# Simple cache for API responses to avoid redundant calls (for demo purposes)
response_cache = {}

def generate_personalized_description(dish_name: str, cuisine: str, user_preferences: Dict) -> str:
    """
    Generate a personalized description for a dish based on user preferences.
    """
    # Create a cache key for this request
    cache_key = f"desc_{dish_name}_{cuisine}_{json.dumps(user_preferences)}"
    if cache_key in response_cache:
        logger.info(f"Using cached description for {dish_name}")
        return response_cache[cache_key]
    
    try:
        # Create prompt that incorporates user preferences
        dietary_focus = ", ".join(user_preferences.get("dietary_restrictions", []))
        if not dietary_focus:
            dietary_focus = "any diet"
            
        # Try a variety of prompts - use different templating strategies
        prompts = [
            # Standard prompt
            f"Describe the {cuisine} dish '{dish_name}' in an appetizing way for someone who follows {dietary_focus}.",
            
            # Alternative prompt format
            f"The following is a mouth-watering description of {dish_name}, a {cuisine} dish, suitable for {dietary_focus}:",
            
            # More specific prompt
            f"'{dish_name}' is a {cuisine} dish that {dietary_focus} people would enjoy because"
        ]
        
        # Try different models in order of preference
        models_to_try = [
            "gpt2-large",  # Our primary choice
            "distilgpt2",  # Smaller, but may be more available
            "EleutherAI/gpt-neo-125M"  # Another alternative model
        ]
        
        # Try each model until one works
        for model in models_to_try:
            logger.info(f"Trying text generation with model: {model}")
            
            # Try each prompt until one works
            for prompt in prompts:
                logger.info(f"Sending prompt to Hugging Face API: {prompt[:50]}...")
                
                # Call Hugging Face API
                response = requests.post(
                    f"{HF_API_URL}/{model}",
                    headers=headers,
                    json={
                        "inputs": prompt, 
                        "parameters": {
                            "max_length": 100, 
                            "temperature": 0.8,
                            "do_sample": True,
                            "return_full_text": False
                        }
                    },
                    timeout=10  # Add timeout
                )
                
                logger.info(f"Response from {model}: status {response.status_code}")
                
                # If successful, process the response
                if response.status_code == 200:
                    try:
                        result = response.json()
                        if isinstance(result, list) and len(result) > 0:
                            generated_text = result[0].get("generated_text", "")
                            if generated_text and len(generated_text) > 20:  # Ensure we have a meaningful response
                                # Clean up the generated text
                                description = generated_text.strip()
                                logger.info(f"Generated description with {model}: {description[:50]}...")
                                
                                # Cache the result
                                response_cache[cache_key] = description
                                return description
                    except Exception as e:
                        logger.warning(f"Error processing response from {model}: {e}")
                        continue
                
                # If the model is still loading, wait briefly and continue with next option
                elif response.status_code == 503:
                    logger.info(f"Model {model} is still loading")
                    time.sleep(1)  # Small delay before trying next option
            
        # If we get here, all models failed - create a robust fallback
        custom_descriptions = {
            # Italian dishes
            "Margherita Pizza": f"A classic {cuisine} pizza topped with fresh tomatoes, mozzarella, basil, and a drizzle of olive oil. Simple yet delicious!",
            "Spaghetti Carbonara": f"A rich {cuisine} pasta dish made with eggs, cheese, pancetta, and black pepper. Creamy and satisfying!",
            "Lasagna": f"Layers of pasta, rich meat sauce, and creamy cheese make this {cuisine} classic a hearty favorite.",
            "Tiramisu": f"A delightful {cuisine} dessert with layers of coffee-soaked ladyfingers and mascarpone cream.",
            
            # Indian dishes
            "Chicken Tikka Masala": f"Tender chicken in a creamy, aromatic {cuisine} sauce with a blend of warming spices.",
            "Vegetable Biryani": f"Fragrant basmati rice cooked with mixed vegetables and {cuisine} spices for a flavorful experience.",
            "Butter Chicken": f"A rich and creamy {cuisine} curry with tender chicken pieces in a tomato-based sauce.",
            "Chana Masala": f"A robust {cuisine} chickpea curry with a blend of spices that create a deeply satisfying flavor.",
            
            # Mexican dishes
            "Carne Asada Taco": f"Grilled, marinated steak served in a soft tortilla with fresh toppings - a {cuisine} favorite.",
            "Veggie Burrito": f"A hearty {cuisine} wrap filled with seasoned beans, rice, and fresh vegetables.",
            
            # Thai dishes
            "Pad Thai": f"Stir-fried rice noodles with a perfect balance of sweet, sour, and savory flavors - a {cuisine} classic.",
            "Green Curry": f"A fragrant {cuisine} curry with coconut milk, vegetables, and aromatic herbs and spices."
        }
        
        # Check if we have a custom description for this dish
        if dish_name in custom_descriptions:
            description = custom_descriptions[dish_name]
        else:
            # Generic fallback based on cuisine
            cuisine_descriptions = {
                "Italian": "A classic Italian dish with rich flavors and quality ingredients - a taste of authentic Italy.",
                "Indian": "A flavorful Indian dish with aromatic spices and complex flavors that dance on your palate.",
                "Mexican": "A vibrant Mexican dish combining fresh ingredients with bold, zesty flavors.",
                "Thai": "A harmonious Thai dish balancing sweet, sour, salty, and spicy elements.",
                "Chinese": "A well-crafted Chinese dish with layers of flavor and expert preparation techniques.",
                "Japanese": "A precise Japanese dish showcasing balance, freshness, and skilled craftsmanship.",
                "Vegan": "A satisfying plant-based dish packed with nutrients and bright flavors."
            }
            description = cuisine_descriptions.get(cuisine, f"A delicious {cuisine} dish with wonderful flavors and textures.")
        
        logger.info(f"Using fallback description for {dish_name}")
        
        # Cache the fallback result too
        response_cache[cache_key] = description
        return description
    
    except Exception as e:
        logger.error(f"Error generating description: {str(e)}")
        return f"A traditional {cuisine} dish that's popular with many diners."

def analyze_feedback_sentiment(feedback_text: str) -> Dict:
    """
    Analyze the sentiment of user feedback.
    """
    # Create a cache key for this request
    cache_key = f"sentiment_{feedback_text}"
    if cache_key in response_cache:
        logger.info(f"Using cached sentiment analysis")
        return response_cache[cache_key]
    
    try:
        logger.info(f"Analyzing sentiment for text: {feedback_text[:30]}...")
        logger.info(f"Using model: {SENTIMENT_MODEL}")
        
        response = requests.post(
            f"{HF_API_URL}/{SENTIMENT_MODEL}",
            headers=headers,
            json={"inputs": feedback_text},
            timeout=10  # Add timeout
        )
        
        logger.info(f"Sentiment analysis response status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            if isinstance(result, list) and len(result) > 0:
                # Extract sentiment scores
                sentiment_data = result[0]
                # Return structured sentiment data
                sentiment = max(sentiment_data, key=lambda x: x["score"])
                logger.info(f"Sentiment detected: {sentiment['label']} with confidence {sentiment['score']:.2f}")
                
                # Create response
                sentiment_result = {
                    "sentiment": sentiment["label"],
                    "confidence": sentiment["score"],
                    "details": sentiment_data
                }
                
                # Cache the result
                response_cache[cache_key] = sentiment_result
                return sentiment_result
        
        # Fallback response based on keyword analysis
        logger.warning("Using keyword fallback for sentiment analysis")
        positive_keywords = ["good", "great", "love", "delicious", "tasty", "amazing", "excellent", "enjoy", "best", "favorite"]
        negative_keywords = ["bad", "awful", "terrible", "worst", "dislike", "hate", "disgusting", "disappointed", "poor", "mediocre"]
        
        feedback_lower = feedback_text.lower()
        positive_count = sum(1 for word in positive_keywords if word in feedback_lower)
        negative_count = sum(1 for word in negative_keywords if word in feedback_lower)
        
        if positive_count > negative_count:
            sentiment_result = {"sentiment": "POSITIVE", "confidence": 0.7, "details": []}
        elif negative_count > positive_count:
            sentiment_result = {"sentiment": "NEGATIVE", "confidence": 0.7, "details": []}
        else:
            sentiment_result = {"sentiment": "NEUTRAL", "confidence": 0.7, "details": []}
        
        # Cache the fallback result too
        response_cache[cache_key] = sentiment_result
        return sentiment_result
    
    except Exception as e:
        logger.error(f"Error analyzing sentiment: {str(e)}")
        return {"sentiment": "NEUTRAL", "confidence": 1.0, "details": []}

def classify_dish_attributes(dish_name: str, dish_description: str) -> List[str]:
    """
    Classify a dish into different attribute categories using zero-shot classification.
    """
    # Create a cache key for this request
    cache_key = f"attr_{dish_name}"
    if cache_key in response_cache:
        logger.info(f"Using cached attributes for {dish_name}")
        return response_cache[cache_key]
    
    try:
        # Combine name and description
        input_text = f"{dish_name}: {dish_description}"
        
        # Define the categories we want to classify for
        categories = ["spicy", "sweet", "savory", "healthy", "comfort food", "light", "rich", "exotic", "traditional"]
        
        logger.info(f"Classifying dish attributes for: {dish_name}")
        logger.info(f"Using model: {ZERO_SHOT_MODEL}")
        
        # Improve the request format to better leverage the zero-shot model
        response = requests.post(
            f"{HF_API_URL}/{ZERO_SHOT_MODEL}",
            headers=headers,
            json={
                "inputs": input_text,
                "parameters": {
                    "candidate_labels": categories,
                    "multi_label": True  # Allow multiple labels
                }
            },
            timeout=10  # Add timeout
        )
        
        logger.info(f"Dish classification response status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            
            # Extract the top categories based on scores
            if "labels" in result and "scores" in result:
                # Pair labels with scores, sort by score in descending order
                label_scores = list(zip(result["labels"], result["scores"]))
                label_scores.sort(key=lambda x: x[1], reverse=True)
                
                # Take top 3 categories with scores above threshold
                top_categories = [label for label, score in label_scores if score > 0.3][:3]
                
                if top_categories:
                    logger.info(f"Identified attributes: {top_categories}")
                    
                    # Add more descriptive terms to attributes for better UI display
                    final_attributes = []
                    for attr in top_categories:
                        # Add more descriptive terms based on attribute type
                        if attr == "spicy":
                            final_attributes.append("Spicy & Aromatic")
                        elif attr == "sweet":
                            final_attributes.append("Sweet & Indulgent")
                        elif attr == "savory":
                            final_attributes.append("Rich & Savory")
                        elif attr == "healthy":
                            final_attributes.append("Nutritious & Healthy")
                        elif attr == "comfort food":
                            final_attributes.append("Comforting & Satisfying")
                        elif attr == "light":
                            final_attributes.append("Light & Fresh")
                        elif attr == "rich":
                            final_attributes.append("Rich & Flavorful")
                        elif attr == "exotic":
                            final_attributes.append("Exotic & Unique")
                        elif attr == "traditional":
                            final_attributes.append("Traditional & Authentic")
                        else:
                            final_attributes.append(attr.capitalize())
                    
                    logger.info(f"Identified attributes with descriptors: {final_attributes}")
                    
                    # Ensure we have at least 2-3 attributes for a better UI display
                    if len(final_attributes) < 2:
                        if "Indian" in dish_description or "Indian" in dish_name:
                            final_attributes.append("Aromatic Spices")
                        elif "Italian" in dish_description or "Italian" in dish_name:
                            final_attributes.append("Mediterranean Inspired")
                        elif "Chinese" in dish_description or "Chinese" in dish_name:
                            final_attributes.append("Asian Flavors")
                        elif "vegetarian" in dish_description.lower() or "vegan" in dish_description.lower():
                            final_attributes.append("Plant-Based Goodness")
                    
                    return final_attributes[:3]  # Limit to top 3 for clean UI
            
            # If zero-shot fails to find good attributes, use rules-based approach
            logger.warning("Using keyword fallback for dish attributes")
            attributes = []
            
            # Enhanced keyword matching with more terms and cuisine-specific attributes
            keywords = {
                "spicy": ["spicy", "hot", "chili", "pepper", "jalapeno", "sriracha", "curry", "spice"],
                "sweet": ["sweet", "sugar", "honey", "dessert", "caramel", "chocolate", "fruit", "maple"],
                "savory": ["savory", "umami", "rich", "meaty", "broth", "earthy", "hearty"],
                "healthy": ["healthy", "nutritious", "vitamin", "lean", "protein", "fresh", "light", "vegetable"],
                "comfort food": ["comfort", "hearty", "filling", "homestyle", "classic", "traditional", "warm"],
                "light": ["light", "fresh", "crisp", "delicate", "subtle", "clean", "refreshing"],
                "rich": ["rich", "creamy", "indulgent", "buttery", "cheesy", "decadent", "velvety"],
                "exotic": ["exotic", "unique", "special", "rare", "unusual", "fusion"],
                "traditional": ["traditional", "authentic", "classic", "original", "heritage", "old-fashioned"]
            }
            
            # Cuisine-specific attributes
            cuisine_attributes = {
                "Italian": ["savory", "rich", "traditional"],
                "Indian": ["spicy", "rich", "exotic"],
                "Mexican": ["spicy", "savory", "traditional"],
                "Thai": ["spicy", "sweet", "exotic"],
                "Chinese": ["savory", "umami", "traditional"],
                "Japanese": ["light", "delicate", "traditional"],
                "Vegan": ["healthy", "fresh", "light"]
            }
            
            # Add cuisine-specific attributes based on dish name
            for cuisine, attrs in cuisine_attributes.items():
                if cuisine.lower() in dish_name.lower() or cuisine.lower() in dish_description.lower():
                    attributes.extend(attrs)
            
            # Text-based analysis for additional attributes
            text = input_text.lower()
            for category, terms in keywords.items():
                if any(term in text for term in terms) and category not in attributes:
                    attributes.append(category)
            
            # Add dish-specific attributes
            if "pizza" in dish_name.lower():
                attributes.extend(["savory", "comfort food"])
            elif "soup" in dish_name.lower():
                attributes.extend(["comforting", "warm"])
            elif "salad" in dish_name.lower():
                attributes.extend(["fresh", "healthy", "light"])
            elif "curry" in dish_name.lower():
                attributes.extend(["spicy", "rich", "exotic"])
            elif "pasta" in dish_name.lower() or "spaghetti" in dish_name.lower():
                attributes.extend(["savory", "comfort food"])
            elif "dessert" in dish_name.lower() or "cake" in dish_name.lower() or "sweet" in dish_name.lower():
                attributes.extend(["sweet", "indulgent"])
            
            # Remove duplicates and limit to top 3
            attributes = list(set(attributes))[:3]
            
            logger.info(f"Identified attributes using keywords: {attributes}")
            
            # If we still have no attributes, add generic ones based on dish name
            if not attributes:
                if "chicken" in dish_name.lower() or "beef" in dish_name.lower() or "pork" in dish_name.lower():
                    attributes = ["savory", "traditional"]
                elif "vegetable" in dish_name.lower() or "vegan" in dish_name.lower():
                    attributes = ["healthy", "fresh"]
                else:
                    attributes = ["tasty", "flavorful"]
            
            # Cache the fallback result too
            response_cache[cache_key] = attributes
            return attributes
        
        logger.warning("Could not classify dish attributes, using fallback")
        return ["flavorful", "traditional"]  # Improved generic fallback
    
    except Exception as e:
        logger.error(f"Error classifying dish: {str(e)}")
        return ["flavorful", "delicious"]  # Default fallback
