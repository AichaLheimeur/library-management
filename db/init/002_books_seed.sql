USE library_db;

-- Vider les données liées pour repartir propre
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE wishlist;
TRUNCATE TABLE penalties;
TRUNCATE TABLE reservations;
TRUNCATE TABLE loans;
TRUNCATE TABLE books;
SET FOREIGN_KEY_CHECKS = 1;

-- 3. Insérer les 10 livres
INSERT INTO books (title, author, category, description, total_quantity, available_quantity, image_url) VALUES

('Clean Code', 'Robert C. Martin', 'Software',
'A handbook of agile software craftsmanship. Learn how to write readable, maintainable code that stands the test of time.',
3, 3, 'clean_code.jpg'),

('The Pragmatic Programmer', 'David Thomas & Andrew Hunt', 'Software',
'From journeyman to master — timeless lessons on software development, career growth, and engineering craft.',
2, 2, 'pragmatic_programmer.jpg'),

('Design Patterns', 'Gang of Four', 'Software',
'The classic reference for object-oriented design patterns. Essential reading for every software engineer.',
2, 1, 'design_patterns.jpg'),

('Introduction to Algorithms', 'Cormen, Leiserson, Rivest & Stein', 'Informatique',
'The definitive textbook on algorithms and data structures, used in universities worldwide.',
4, 4, 'intro_algorithms.jpg'),

('Computer Networks', 'Andrew S. Tanenbaum', 'Informatique',
'A comprehensive overview of computer networking, from physical layer to application protocols.',
2, 2, 'computer_networks.jpg'),

('Deep Learning', 'Ian Goodfellow', 'Data & AI',
'The authoritative reference on deep learning techniques, neural networks, and modern AI research.',
3, 3, 'deep_learning.jpg'),

('Hands-On Machine Learning', 'Aurélien Géron', 'Data & AI',
'Practical guide to building intelligent systems using Scikit-Learn, Keras, and TensorFlow.',
3, 2, 'hands_on_ml.jpg'),

('The Web Application Hacker\'s Handbook', 'Stuttard & Pinto', 'Cybersecurity',
'The most thorough guide to finding and exploiting security flaws in web applications.',
2, 2, 'web_hacker_handbook.jpg'),

('Hacking: The Art of Exploitation', 'Jon Erickson', 'Cybersecurity',
'A deep dive into hacking — buffer overflows, shellcode, networking attacks and more.',
2, 2, 'hacking_exploitation.jpg'),

('Deep Work', 'Cal Newport', 'Productivity',
'Rules for focused success in a distracted world. Learn to do more in less time by cultivating deep concentration.',
3, 3, 'deep_work.jpg');
