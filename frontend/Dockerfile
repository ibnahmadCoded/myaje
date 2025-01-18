# Use a lightweight Node.js image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install
#RUN npm install --production --no-cache   # for production scenario

# Copy the rest of the application code
COPY . .
RUN ls -la /app/src/components/ui
RUN ls -la /app/src/components/admin

# Expose the application port
EXPOSE 3000

# Command to run the app
CMD ["npm", "run", "dev"]
