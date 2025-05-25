-- init-db/init.sql
CREATE TABLE IF NOT EXISTS restaurants (
   id SERIAL PRIMARY KEY,
   name VARCHAR(255) NOT NULL,
   cuisine VARCHAR(100) NOT NULL,
   description TEXT,
   price_range VARCHAR(10), -- e.g., $, $$, $$$
   location VARCHAR(255) -- Placeholder for location
);
CREATE TABLE IF NOT EXISTS dishes (
   id SERIAL PRIMARY KEY,
   restaurant_id INTEGER REFERENCES restaurants(id),
   name VARCHAR(255) NOT NULL,
   description TEXT,
   price DECIMAL(10, 2),
   dietary_tags TEXT[] -- e.g., {'vegetarian', 'gluten-free'}
);

-- Existing restaurants
INSERT INTO restaurants (name, cuisine, description, price_range, location) VALUES
('Mama Mia Pizzeria', 'Italian', 'Authentic Italian pizza and pasta', '$$', 'Downtown'),
('Spice Route', 'Indian', 'Rich and aromatic Indian curries', '$$', 'City Center'),
('Taco Fiesta', 'Mexican', 'Vibrant tacos and burritos', '$', 'Uptown'),
('Green Garden Cafe', 'Vegan', 'Fresh and healthy plant-based meals', '$$', 'Suburbia'),
('Sushi Central', 'Japanese', 'Fresh sushi and sashimi', '$$$', 'Financial District');

-- Add more restaurants
INSERT INTO restaurants (name, cuisine, description, price_range, location) VALUES
('Pasta Paradise', 'Italian', 'Handmade pasta and rich sauces', '$$$', 'Little Italy'),
('Thai Spice', 'Thai', 'Authentic Thai flavors with fresh ingredients', '$$', 'Downtown'),
('Beijing House', 'Chinese', 'Traditional Chinese cuisine', '$$', 'Chinatown'),
('El Mariachi', 'Mexican', 'Family recipes from Mexico City', '$$', 'West Side'),
('Mumbai Masala', 'Indian', 'Home-style Indian cooking with a modern twist', '$', 'East End'),
('Sapporo Ramen', 'Japanese', 'Authentic Japanese ramen and appetizers', '$', 'University District'),
('Napoli Trattoria', 'Italian', 'Southern Italian specialties', '$$', 'North End'),
('Delhi Delights', 'Indian', 'North Indian cuisine with tandoor specialties', '$$$', 'Midtown'),
('Bangkok Street', 'Thai', 'Street food inspired Thai dishes', '$', 'South Market'),
('Dragon Palace', 'Chinese', 'Dim sum and Cantonese specialties', '$$', 'East Village');

-- Existing dishes
INSERT INTO dishes (restaurant_id, name, description, price, dietary_tags) VALUES
(1, 'Margherita Pizza', 'Classic tomato and mozzarella pizza', 12.50, '{}'),
(1, 'Spaghetti Carbonara', 'Creamy pasta with bacon and egg', 15.00, '{}'),
(2, 'Chicken Tikka Masala', 'Creamy chicken curry', 18.00, '{}'),
(2, 'Vegetable Biryani', 'Fragrant rice with mixed vegetables', 16.00, '{vegetarian}'),
(3, 'Carne Asada Taco', 'Grilled steak taco', 4.00, '{}'),
(3, 'Veggie Burrito', 'Bean and rice burrito with fresh salsa', 10.00, '{vegetarian}'),
(4, 'Buddha Bowl', 'Quinoa, roasted veggies, and tahini dressing', 14.00, '{vegan,gluten-free}'),
(4, 'Lentil Soup', 'Hearty lentil and vegetable soup', 9.00, '{vegan,gluten-free}'),
(5, 'Salmon Nigiri', 'Fresh salmon over sushi rice', 6.00, '{}'),
(5, 'Avocado Roll', 'Avocado and rice wrapped in nori', 8.00, '{vegetarian,vegan}');

-- Add more dishes for existing restaurants
INSERT INTO dishes (restaurant_id, name, description, price, dietary_tags) VALUES
(1, 'Quattro Formaggi', 'Four cheese pizza with mozzarella, gorgonzola, parmesan, and ricotta', 16.50, '{vegetarian}'),
(1, 'Tiramisu', 'Classic Italian coffee-flavored dessert', 8.00, '{vegetarian}'),
(2, 'Butter Chicken', 'Tender chicken in a rich buttery tomato sauce', 19.00, '{}'),
(2, 'Chana Masala', 'Spiced chickpea curry', 14.00, '{vegetarian,vegan}'),
(3, 'Guacamole & Chips', 'Fresh avocado dip with homemade tortilla chips', 9.50, '{vegetarian,vegan,gluten-free}'),
(3, 'Chicken Quesadilla', 'Grilled flour tortilla filled with chicken and cheese', 12.00, '{}'),
(4, 'Avocado Toast', 'Sourdough toast with smashed avocado and microgreens', 11.00, '{vegetarian,vegan}'),
(4, 'Vegan Chocolate Cake', 'Rich chocolate cake made without animal products', 7.50, '{vegetarian,vegan}'),
(5, 'Dragon Roll', 'Shrimp tempura roll topped with avocado and spicy mayo', 16.00, '{}'),
(5, 'Miso Soup', 'Traditional Japanese soup with tofu and seaweed', 5.00, '{vegetarian}');

-- Add dishes for new restaurants
INSERT INTO dishes (restaurant_id, name, description, price, dietary_tags) VALUES
(6, 'Fettuccine Alfredo', 'Creamy pasta with parmesan cheese', 17.00, '{vegetarian}'),
(6, 'Lasagna', 'Layered pasta with meat sauce and cheese', 19.00, '{}'),
(7, 'Pad Thai', 'Stir-fried rice noodles with egg, tofu, and peanuts', 14.50, '{gluten-free}'),
(7, 'Green Curry', 'Spicy coconut curry with vegetables', 16.00, '{vegetarian,vegan,gluten-free}'),
(8, 'Kung Pao Chicken', 'Spicy stir-fried chicken with peanuts', 15.00, '{}'),
(8, 'Vegetable Dumplings', 'Steamed dumplings filled with vegetables', 10.00, '{vegetarian}'),
(9, 'Enchiladas', 'Corn tortillas filled with cheese and topped with salsa', 13.00, '{vegetarian}'),
(9, 'Churros', 'Fried dough pastry with cinnamon sugar', 6.00, '{vegetarian}'),
(10, 'Butter Paneer', 'Cottage cheese in a creamy tomato sauce', 16.00, '{vegetarian}'),
(10, 'Lamb Vindaloo', 'Spicy lamb curry with potatoes', 18.00, '{}'),
(11, 'Tonkotsu Ramen', 'Pork bone broth with noodles and toppings', 15.00, '{}'),
(11, 'Gyoza', 'Pan-fried dumplings with pork and vegetables', 8.00, '{}'),
(12, 'Gnocchi', 'Potato dumplings in tomato sauce', 16.00, '{vegetarian}'),
(12, 'Chicken Parmesan', 'Breaded chicken with tomato sauce and mozzarella', 18.00, '{}'),
(13, 'Tandoori Chicken', 'Clay oven roasted chicken with spices', 17.00, '{gluten-free}'),
(13, 'Malai Kofta', 'Vegetable dumplings in a creamy sauce', 15.00, '{vegetarian}'),
(14, 'Pad See Ew', 'Wide rice noodles stir-fried with vegetables', 13.00, '{vegetarian}'),
(14, 'Mango Sticky Rice', 'Sweet sticky rice with fresh mango', 7.00, '{vegetarian,vegan,gluten-free}'),
(15, 'Peking Duck', 'Roasted duck served with pancakes and hoisin sauce', 28.00, '{}'),
(15, 'Mapo Tofu', 'Spicy tofu dish with minced pork', 14.00, '{}');