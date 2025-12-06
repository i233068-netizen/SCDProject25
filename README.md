Docker Compose Setup (Part 7)

This project now includes full Docker Compose support.

How to Run the Project

Build the containers:

docker compose up --build


View running services:

docker ps


Stop all services:

docker compose down

Included Features

Builds backend image from the local Dockerfile

Starts backend + MongoDB services

Uses a private Docker network

Mounts a persistent MongoDB volume

Loads environment variables from .env

Environment Variables

A .env file is required in the project root.

Example:

MONGO_URI=mongodb://scd-local-mongo:27017/scdserverdb
