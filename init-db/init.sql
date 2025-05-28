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

-- Add more diverse restaurants
INSERT INTO restaurants (name, cuisine, description, price_range, location) VALUES
('Mediterranean Oasis', 'Mediterranean', 'Fresh Mediterranean cuisine featuring authentic flavors from Greece and Lebanon', '$$', 'Waterfront'),
('Seoul Kitchen', 'Korean', 'Traditional Korean BBQ and bibimbap in a cozy setting', '$$', 'East Side'),
('Cajun Corner', 'Cajun', 'Spicy Cajun dishes with Louisiana flair', '$', 'French Quarter'),
('Bombay Dreams', 'Indian', 'North and South Indian cuisine with extensive vegetarian options', '$$', 'Downtown'),
('The Hungry Vegan', 'Vegan', 'Creative plant-based cuisine that satisfies even meat-lovers', '$$', 'Arts District'),
('Pho Paradise', 'Vietnamese', 'Authentic Vietnamese soups, banh mi, and rice dishes', '$', 'International District'),
('El Taquito', 'Mexican', 'Street-style tacos and traditional Mexican fare', '$', 'West End'),
('Burger Republic', 'American', 'Gourmet burgers with unique toppings and craft beer', '$$', 'Uptown'),
('Greek Islands', 'Greek', 'Family-owned Greek taverna with homemade specialties', '$$', 'Harbor View'),
('French Bistro', 'French', 'Classic French cuisine with modern interpretations', '$$$', 'Historic District'),
('The Smoky Pit', 'BBQ', 'Slow-smoked meats and classic BBQ sides', '$$', 'Riverside'),
('Taste of Ethiopia', 'Ethiopian', 'Traditional Ethiopian dishes served with injera bread', '$$', 'Central District'),
('Alpine Chalet', 'Swiss', 'Swiss and Alpine cuisine featuring fondue and raclette', '$$$', 'Mountain View'),
('Caribbean Breeze', 'Caribbean', 'Island flavors from Jamaica, Cuba, and Trinidad', '$$', 'Beachside'),
('Dim Sum Palace', 'Chinese', 'Authentic dim sum and Cantonese specialties', '$$', 'Chinatown');

-- Add dishes for the new restaurants
INSERT INTO dishes (restaurant_id, name, description, price, dietary_tags) VALUES
-- Mediterranean Oasis (ID 16)
(16, 'Hummus Platter', 'Creamy chickpea dip with olive oil, served with warm pita', 8.50, '{vegetarian,vegan,gluten-free}'),
(16, 'Falafel Wrap', 'Crispy falafel with tahini sauce and fresh vegetables in a wrap', 10.00, '{vegetarian,vegan}'),
(16, 'Lamb Shawarma', 'Slow-roasted marinated lamb with garlic sauce and pickles', 14.50, '{}'),
(16, 'Greek Salad', 'Cucumbers, tomatoes, olives, and feta cheese with olive oil dressing', 9.00, '{vegetarian,gluten-free}'),

-- Seoul Kitchen (ID 17)
(17, 'Bulgogi', 'Marinated and grilled thin slices of beef with vegetables', 16.00, '{gluten-free}'),
(17, 'Bibimbap', 'Mixed rice bowl with vegetables, beef, and a fried egg', 13.50, '{}'),
(17, 'Kimchi Stew', 'Spicy stew with fermented cabbage, tofu, and pork', 12.00, '{}'),
(17, 'Vegetable Japchae', 'Sweet potato noodles stir-fried with vegetables', 11.00, '{vegetarian,vegan}'),

-- Cajun Corner (ID 18)
(18, 'Jambalaya', 'Spicy rice dish with sausage, chicken, and shrimp', 14.00, '{}'),
(18, 'Crawfish Étouffée', 'Crawfish smothered in a rich, spicy sauce served over rice', 16.00, '{}'),
(18, 'Shrimp Po Boy', 'Fried shrimp sandwich with remoulade sauce on French bread', 12.00, '{}'),
(18, 'Red Beans and Rice', 'Slow-cooked red beans with rice and andouille sausage', 10.00, '{}'),

-- Bombay Dreams (ID 19)
(19, 'Chicken Tikka Masala', 'Grilled chicken in a creamy tomato curry sauce', 15.50, '{gluten-free}'),
(19, 'Palak Paneer', 'Homemade cheese cubes in a spinach sauce', 13.00, '{vegetarian,gluten-free}'),
(19, 'Masala Dosa', 'Crispy rice crepe filled with spiced potatoes', 12.00, '{vegetarian,vegan}'),
(19, 'Chana Masala', 'Spiced chickpea curry with tomatoes and onions', 11.00, '{vegetarian,vegan,gluten-free}'),

-- The Hungry Vegan (ID 20)
(20, 'Impossible Burger', 'Plant-based burger patty with all the fixings on a pretzel bun', 14.00, '{vegetarian,vegan}'),
(20, 'Jackfruit Tacos', 'Pulled jackfruit with taco seasoning, slaw, and avocado', 12.00, '{vegetarian,vegan,gluten-free}'),
(20, 'Cauliflower Wings', 'Crispy cauliflower florets tossed in buffalo sauce', 10.00, '{vegetarian,vegan}'),
(20, 'Rainbow Buddha Bowl', 'Colorful bowl of grains, roasted vegetables, and tahini dressing', 13.00, '{vegetarian,vegan,gluten-free}'),

-- Pho Paradise (ID 21)
(21, 'Beef Pho', 'Rice noodle soup with thinly sliced beef and aromatic herbs', 11.50, '{gluten-free}'),
(21, 'Banh Mi Sandwich', 'Vietnamese sandwich with grilled pork and pickled vegetables', 9.00, '{}'),
(21, 'Vegetable Spring Rolls', 'Fresh vegetables wrapped in rice paper with peanut sauce', 7.00, '{vegetarian,vegan,gluten-free}'),
(21, 'Vermicelli Bowl', 'Rice noodles with grilled chicken, fresh herbs, and fish sauce', 12.00, '{gluten-free}'),

-- El Taquito (ID 22)
(22, 'Street Tacos', 'Three soft corn tortillas with marinated pork, onions, and cilantro', 8.50, '{gluten-free}'),
(22, 'Chicken Enchiladas', 'Corn tortillas filled with chicken and topped with red sauce and cheese', 12.00, '{gluten-free}'),
(22, 'Vegetarian Burrito', 'Flour tortilla filled with beans, rice, cheese, and guacamole', 10.00, '{vegetarian}'),
(22, 'Carne Asada Fries', 'Crispy fries topped with grilled steak, cheese, and pico de gallo', 11.00, '{}'),

-- Burger Republic (ID 23)
(23, 'Classic Cheeseburger', 'Beef patty with American cheese, lettuce, tomato, and special sauce', 12.50, '{}'),
(23, 'Mushroom Swiss Burger', 'Beef patty topped with sautéed mushrooms and Swiss cheese', 14.00, '{}'),
(23, 'Veggie Burger', 'Housemade vegetable patty with avocado and sprouts', 13.00, '{vegetarian}'),
(23, 'Truffle Parmesan Fries', 'Crispy fries tossed with truffle oil and Parmesan cheese', 6.50, '{vegetarian}'),

-- Greek Islands (ID 24)
(24, 'Moussaka', 'Layered eggplant, potato, and ground beef casserole', 14.00, '{}'),
(24, 'Souvlaki Platter', 'Grilled chicken skewers with tzatziki, salad, and pita', 15.00, '{}'),
(24, 'Spanakopita', 'Spinach and feta cheese wrapped in phyllo dough', 10.00, '{vegetarian}'),
(24, 'Greek Lemon Chicken Soup', 'Avgolemono soup with chicken, rice, and lemon', 7.00, '{}'),

-- French Bistro (ID 25)
(25, 'Coq au Vin', 'Chicken braised with wine, mushrooms, and bacon', 22.00, '{}'),
(25, 'Beef Bourguignon', 'Slow-cooked beef stew with red wine, vegetables, and herbs', 24.00, '{}'),
(25, 'Ratatouille', 'Provençal vegetable stew with eggplant, zucchini, and bell peppers', 18.00, '{vegetarian,vegan,gluten-free}'),
(25, 'Crème Brûlée', 'Classic vanilla custard with caramelized sugar top', 9.00, '{vegetarian,gluten-free}'),

-- The Smoky Pit (ID 26)
(26, 'Brisket Plate', 'Slow-smoked beef brisket with two sides and cornbread', 17.00, '{}'),
(26, 'Pulled Pork Sandwich', 'Smoked pulled pork on a brioche bun with coleslaw', 12.00, '{}'),
(26, 'BBQ Ribs', 'St. Louis style ribs with house BBQ sauce', 19.00, '{gluten-free}'),
(26, 'Smoked Chicken', 'Half chicken smoked with hickory wood', 15.00, '{gluten-free}'),

-- Taste of Ethiopia (ID 27)
(27, 'Doro Wat', 'Spicy chicken stew with berbere sauce and hard-boiled egg', 14.00, '{gluten-free}'),
(27, 'Vegetarian Combo', 'Selection of vegetable dishes served with injera bread', 16.00, '{vegetarian,vegan}'),
(27, 'Tibs', 'Sautéed beef with peppers, onions, and Ethiopian spices', 15.00, '{gluten-free}'),
(27, 'Kitfo', 'Ethiopian steak tartare seasoned with spiced butter', 17.00, '{gluten-free}'),

-- Alpine Chalet (ID 28)
(28, 'Cheese Fondue', 'Melted Gruyère and Emmental cheeses with bread for dipping', 24.00, '{vegetarian}'),
(28, 'Raclette', 'Melted cheese served with potatoes, pickles, and charcuterie', 26.00, '{gluten-free}'),
(28, 'Rösti', 'Swiss potato pancake topped with bacon and fried egg', 16.00, '{gluten-free}'),
(28, 'Wiener Schnitzel', 'Breaded and fried veal cutlet with lemon and potatoes', 22.00, '{}'),

-- Caribbean Breeze (ID 29)
(29, 'Jerk Chicken', 'Spicy grilled chicken with Jamaican jerk seasoning', 15.00, '{gluten-free}'),
(29, 'Curry Goat', 'Slow-cooked goat curry with Scotch bonnet peppers', 17.00, '{gluten-free}'),
(29, 'Fried Plantains', 'Sweet ripe plantains, fried until golden', 6.00, '{vegetarian,vegan,gluten-free}'),
(29, 'Oxtail Stew', 'Tender oxtail braised with butter beans and thyme', 18.00, '{gluten-free}'),

-- Dim Sum Palace (ID 30)
(30, 'Har Gow', 'Steamed shrimp dumplings in translucent wrappers', 8.00, '{}'),
(30, 'Siu Mai', 'Open-faced dumplings with pork and shrimp', 7.00, '{}'),
(30, 'Char Siu Bao', 'Steamed buns filled with barbecue pork', 6.50, '{}'),
(30, 'Vegetable Spring Rolls', 'Crispy rolls filled with cabbage, carrots, and mushrooms', 6.00, '{vegetarian,vegan}');