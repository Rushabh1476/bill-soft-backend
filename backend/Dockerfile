FROM node:20-alpine

WORKDIR /app

# Install wget for health checks and build tools for native modules
RUN apk add --no-cache python3 make g++ wget

RUN mkdir -p /app/data \
    /app/uploads/general \
    /app/uploads/products \
    /app/uploads/logo \
    /app/uploads/avatars \
    /app/uploads/profiles \
    && chmod -R 777 /app/data /app/uploads

# Copy server-specific package.json for lighter build
COPY package*.json ./

# Remove package-lock.json to force resolution of platform-specific dependencies
RUN rm -f package-lock.json

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy Prisma schema
COPY prisma ./prisma
RUN npx prisma generate

# Copy all source code
COPY . .

# Expose backend port
EXPOSE 5001

# Start the server (prisma generate is in server script)
CMD ["npm", "run", "server"]
