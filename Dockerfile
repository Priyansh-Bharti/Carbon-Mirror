# Carbon Mirror — Static Asset Server
# Used for containerised preview deployments and local testing.
# Production deployment uses Firebase Hosting (firebase deploy).
#
# Build: docker build -t carbon-mirror .
# Run:   docker run -p 8080:80 carbon-mirror
# Access: http://localhost:8080

FROM nginx:alpine AS production

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy nginx configuration
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Copy static application files
COPY public/ /usr/share/nginx/html/

# Security: remove default nginx files
RUN rm -f /usr/share/nginx/html/50x.html

# Run as non-root user for security
RUN addgroup -g 1001 -S nginx_group && \
    adduser -u 1001 -S nginx_user -G nginx_group && \
    chown -R nginx_user:nginx_group /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:80/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
