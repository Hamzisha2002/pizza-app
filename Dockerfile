# Use the official Node.js image as the base
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json and install dependencies
# This step is often cached, speeding up rebuilds
COPY package*.json ./
RUN npm install

# Copy the rest of the application code (app logic, components, etc.)
COPY . .

# Expose the port your Node.js application listens on
# IMPORTANT: Change 8080 if your app listens on a different port (e.g., 3000)
EXPOSE 8080

# Command to run your application when the container starts
# IMPORTANT: Change server.js to your actual startup file (e.g., index.js, app.js)
CMD ["node", "server.js"]
