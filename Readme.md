
# streamU- A video sharing web app

streamU  is a backend service that powers the streamU web application. It provides endpoints for user authentication, managing channels, uploading videos, posting tweets, and more.


## Features

**User Management:**
- Registration, login, logout, password reset
- Profile management (avatar, cover image, details)
- Watch history tracking

**Video Management:**
- Video upload and publishing
- Video search, sorting, and pagination
- Video editing and deletion
- Visibility control (publish/unpublish)

**Tweet Management**
- Tweet creation and publishing
- Viewing user tweets
- Updating and deleting tweets

**Subscription Management:**
- Subscribing to channels
- Viewing subscriber and subscribed channel lists

**Playlist Management:**
- Creating, updating, and deleting playlists
- Adding and removing videos from playlists
- Viewing user playlists

**Comment Management**
- Adding, updating, and deleting comments on videos

**Health Check:**
- Endpoint to verify the backend's health





## Tech Stack


**Server:** 
- Node.js: JavaScript runtime environment for server-side code.
- Express.js: Web application framework for building RESTful APIs.
- MongoDB: NoSQL database for storing user data, videos, tweets, and notifications.
- JSON Web Tokens (JWT): Token-based authentication mechanism for securing API endpoints.

**Additional Tools:**
- Cloudinary: Cloud-based media management platform for storing and serving video and image content.


## API Documentation

Detailed API documentation is available to help developers understand and use the MyTube API effectively. The documentation includes information about available endpoints, request and response formats, authentication requirements, and usage examples.

[Documentation](https://documenter.getpostman.com/view/17553568/2sA3BkctMN)


## Getting Started
To set up and run the streamU API locally, follow these steps:

Clone the project

```bash
  git clone https://github.com/kazisadman/Video-Streaming.git
```

Go to the project directory

```bash
  cd Video-Streaming
```

Install dependencies

```bash
  npm install
```
**Set up environment variables:**
- Create a .env file in the root directory.
- Add environment variables such as database connection URL, API keys, and other configuration settings


Start the server

```bash
  npm run dev
```
The API will be accessible at http://localhost:8000 or provided port in .env file.

