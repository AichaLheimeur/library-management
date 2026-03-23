USE library_db;

UPDATE books SET description =
'Widely regarded as one of the most influential programming books ever written, Clean Code by Robert C. Martin teaches developers how to write code that is easy to read, understand, and maintain. Through dozens of real-world examples in Java, the book explains the principles behind clean naming, small focused functions, proper error handling, and meaningful comments. Martin argues that writing clean code is not just a matter of aesthetics — it is a professional responsibility. Whether you are a junior developer or a seasoned engineer, this book will fundamentally change the way you think about software quality.'
WHERE title = 'Clean Code';

UPDATE books SET description =
'The Pragmatic Programmer is a timeless guide to becoming a better software developer. Written by David Thomas and Andrew Hunt, it offers practical advice on topics ranging from personal responsibility and career development to technical skills like estimation, debugging, and refactoring. The book is filled with memorable tips — "Don\'t repeat yourself", "Make it easy to reuse" — that have become cornerstones of modern software engineering culture. It speaks directly to developers at every level and remains as relevant today as when it was first published.'
WHERE title = 'The Pragmatic Programmer';

UPDATE books SET description =
'Design Patterns: Elements of Reusable Object-Oriented Software, authored by Erich Gamma, Richard Helm, Ralph Johnson, and John Vlissides — collectively known as the "Gang of Four" — is the definitive catalog of software design patterns. It introduces 23 classic patterns organized into three categories: Creational, Structural, and Behavioral. Each pattern is described with its intent, applicability, structure, and trade-offs. This book established a shared vocabulary for software architects and developers worldwide, making it one of the most referenced books in computer science history.'
WHERE title = 'Design Patterns';

UPDATE books SET description =
'Introduction to Algorithms, affectionately known as CLRS, is the most comprehensive textbook on algorithms in existence. Covering everything from sorting and graph traversal to dynamic programming, greedy algorithms, and NP-completeness, it provides rigorous mathematical proofs alongside pseudocode for every algorithm. Used in universities around the world, it serves both as a course textbook and as a professional reference. The fourth edition has been thoroughly updated with new chapters and exercises, making it indispensable for anyone serious about computer science fundamentals.'
WHERE title = 'Introduction to Algorithms';

UPDATE books SET description =
'Computer Networks by Andrew S. Tanenbaum is the gold standard textbook for understanding how modern networks work. It covers the full protocol stack from the physical layer and data link protocols all the way up to the application layer, including HTTP, DNS, email, and multimedia networking. Each layer is explained with clarity, real-world examples, and historical context. The book also covers network security, wireless networks, and the architecture of the internet. A must-read for anyone working in networking, systems engineering, or distributed computing.'
WHERE title = 'Computer Networks';

UPDATE books SET description =
'Deep Learning by Ian Goodfellow, Yoshua Bengio, and Aaron Courville is the authoritative textbook on the mathematical and conceptual foundations of modern AI. It covers the full spectrum of deep learning: from basic neural network architectures and optimization techniques to advanced topics like convolutional networks, recurrent networks, autoencoders, and generative models. Written by three of the pioneers of the field, this book bridges theory and practice and is essential reading for researchers and practitioners in machine learning, computer vision, and natural language processing.'
WHERE title = 'Deep Learning';

UPDATE books SET description =
'Hands-On Machine Learning with Scikit-Learn, Keras, and TensorFlow is the most practical guide to building real-world machine learning and deep learning systems. Aurélien Géron walks readers through end-to-end ML projects, covering data preparation, model training, evaluation, and deployment. The second half of the book dives into deep learning using Keras and TensorFlow 2, including convolutional networks, recurrent networks, and reinforcement learning. With clear explanations and hands-on exercises, this book is the go-to resource for developers who want to apply ML in production.'
WHERE title = 'Hands-On Machine Learning';

UPDATE books SET description =
'The Web Application Hacker\'s Handbook is the most thorough practical guide to discovering and exploiting security vulnerabilities in web applications. Dafydd Stuttard and Marcus Pinto cover the full attack surface of modern web apps — SQL injection, cross-site scripting, authentication bypasses, session management flaws, and more — with step-by-step walkthroughs and detailed remediation advice. Whether you are a penetration tester, security researcher, or developer building secure systems, this book provides the knowledge and methodology needed to think like an attacker and defend like an expert.'
WHERE title = 'The Web Application Hacker\'s Handbook';

UPDATE books SET description =
'Hacking: The Art of Exploitation by Jon Erickson takes a uniquely technical approach to the world of hacking. Rather than simply listing known exploits, it teaches readers how to think creatively about security by understanding the underlying systems. Topics include C programming for exploitation, buffer overflows, format string attacks, network hacking, and shellcode writing. The book comes with a live Linux environment on CD so readers can practice every technique in a safe setting. It is essential reading for anyone who wants a deep, hands-on understanding of offensive security and low-level systems.'
WHERE title = 'Hacking: The Art of Exploitation';

UPDATE books SET description =
'Deep Work by Cal Newport makes a compelling case that the ability to focus without distraction on cognitively demanding tasks is both increasingly rare and increasingly valuable in today\'s economy. Drawing on neuroscience, philosophy, and the habits of highly productive figures — from Carl Jung to Bill Gates — Newport defines deep work and explains why it matters. He then provides a rigorous set of rules and strategies for training your mind to concentrate deeply: scheduling deep work blocks, eliminating shallow work, and embracing boredom. An essential read for knowledge workers seeking to produce their best work.'
WHERE title = 'Deep Work';
