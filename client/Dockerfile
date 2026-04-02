FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Setting default API URL, this will be baked into the static build.
ENV VITE_API_BASE_URL=http://localhost:5159
RUN npm run build

FROM nginx:alpine
# Copy built React app to Nginx
COPY --from=build /app/dist /usr/share/nginx/html
# Inject custom nginx config for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
