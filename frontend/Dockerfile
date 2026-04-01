FROM node:20-alpine

WORKDIR /app

# Install dependencies first for better layer caching
COPY package*.json ./
RUN npm install

# Copy source files
COPY . .

EXPOSE 5173

# Run Vite dev server and bind to all interfaces for Docker networking
CMD ["sh", "-lc", "if [ ! -d node_modules ]; then npm install; fi; npm run dev -- --host 0.0.0.0 --port 5173"]
