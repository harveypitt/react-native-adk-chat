# Use official Node.js runtime as base image
FROM node:18-slim

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy server code
COPY src ./src

# Create a non-root user and switch to it
RUN useradd -m -u 1001 nodeuser && \
    chown -R nodeuser:nodeuser /app
USER nodeuser

# Cloud Run will set PORT environment variable
ENV PORT=8080

# Expose the port
EXPOSE 8080

# Health check (optional but recommended)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:${PORT}/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); })"

# Start the server
CMD ["node", "src/index.js"]
