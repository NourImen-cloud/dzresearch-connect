# DZ Research Connect

## What is DZ Research Connect?

DZ Research Connect is a web platform designed to bring together Algerian computer science researchers and their published work in one searchable place. It acts as a national research directory where users can discover researchers, explore their publications, and understand connections between scholars across the field.

---

## Who is it for?

The platform serves three main types of users:

### General Visitors
Visitors can freely search and browse researcher profiles and publications without creating an account.

### Researchers
Researchers can register on the platform, claim or create their profile, and connect their academic identity using an internationally recognized researcher identifier called **OpenAlex**.

### Administrators
Administrators manage the platform data and ensure the smooth operation of automated services such as weekly digest emails and data updates.

---

## System Architecture

DZ Research Connect is composed of two main parts:

### Backend
The backend is built using **FastAPI**, a modern Python web framework.  
All application data is stored in a **SQLite** database.

Researcher and publication information is initially imported from **CSV files** during application startup.

### Frontend
The frontend is developed with **React**, providing users with an interactive and responsive web interface.

---

## AI-Powered Features

The platform optionally integrates machine learning models to provide advanced research discovery features.

The AI layer analyzes researcher profiles and publications to:

- Detect semantic similarities between researchers
- Recommend related researchers
- Enable semantic search capabilities

Unlike traditional keyword search, semantic search understands the meaning and context behind a user's query.

---

## Key Features

### Researcher Search
Users can search researchers by:

- Name
- Research topic
- Location

### Researcher Profiles
Each researcher profile includes:

- Publications
- Citation count
- h-index
- Biography
- Website
- Research specialties

### Profile Claiming
Registered researchers can claim and manage their own profiles.

### Network Visualization
The platform generates two types of research networks:

#### Co-authorship Network
Displays researchers who have collaborated on publications together.

#### Similarity Network
Connects researchers whose work is semantically related based on AI analysis.

### Saved Searches
Authenticated users can save search filters and preferences for future use.

### Weekly Digest Emails
Users can subscribe to automated weekly digest emails summarizing:

- Newly added researchers
- Recent publications
- Updates matching their interests

---

## Technologies Used

### Backend
- FastAPI
- Python
- SQLite

### Frontend
- React

### Data Processing
- CSV-based data import
- Machine Learning / NLP models

---

## Future Improvements

Potential future enhancements include:

- Integration with additional academic databases
- Advanced analytics dashboards
- Research collaboration recommendations
- Real-time publication updates
- Institution-level statistics and insights

---

## Goal of the Platform

The main goal of DZ Research Connect is to improve visibility, accessibility, and collaboration within the Algerian computer science research community by centralizing academic information into one intelligent and easy-to-use platform.
