# 1. Use official Node.js LTS image
FROM node:18

# 2. Set working directory
WORKDIR /app

# 3. Copy package files
COPY package*.json ./

# 4. Install dependencies
RUN npm install

# 5. Copy rest of the source code
COPY . .

# 6. Set environment variable for production
ENV NODE_ENV=production

# 7. Expose backend port
EXPOSE 3000

# 8. Command to run the app
CMD ["node", "main.js"]
