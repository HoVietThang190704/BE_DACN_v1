FROM node:20-alpine

# Cài dependency để build package native
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy file cấu hình trước để cache npm install
COPY package*.json ./

RUN npm install

# Copy toàn bộ source
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 5000

# Start app
CMD ["node", "dist/app.js"]