What is DZ Research Connect?
DZ Research Connect is a web platform built to bring together Algerian computer science researchers and their published work in one searchable place. Think of it as a national research directory where anyone can find a researcher, explore their publications, and see how they connect with other scholars in the field.

Who is it for?
The platform serves three main groups. General visitors can search and browse researcher profiles and publications without needing an account. Researchers can register, create a profile, and link their academic identity to an internationally recognized ID called OpenAlex. Administrators manage the data behind the scenes — keeping information up to date and making sure automated features like weekly digest emails keep running smoothly.

How is it built?
The platform has two main parts. The backend is built with FastAPI, a modern Python web framework, and stores all data in a SQLite database. Researcher and publication data is loaded from spreadsheets (CSV files) when the application first starts up. The frontend is a React application that users interact with directly in their browser.
On top of that, there is an optional AI layer powered by machine learning models. This layer analyzes researcher profiles and publications to find meaningful similarities between researchers — even if they have never collaborated directly — and powers a semantic search feature that understands the meaning behind a query, not just the exact words typed.

Key features
Users can search for researchers by name, topic, or location. Each researcher has a profile page showing their publications, citation count, and h-index. Registered researchers can claim their profile and edit their bio, website, and areas of specialty.
The platform also generates two types of visual network graphs. The first is a co-authorship graph that shows researchers who have published papers together. The second is a similarity network that connects researchers whose work is semantically related, based on the AI analysis.
Logged-in users can save their search filters for later, and can subscribe to weekly digest emails that summarize new researchers or publications matching their interests.
