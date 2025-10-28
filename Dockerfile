FROM node:24.10 AS build

WORKDIR /app

ARG VITE_backendUrl=""
ENV VITE_backendUrl=${VITE_backendUrl}

ARG VITE_qubitTogglePassword="password"
ENV VITE_qubitTogglePassword=${VITE_qubitTogglePassword}

ARG VITE_adminUsername="admin"
ENV VITE_adminUsername=${VITE_adminUsername}

# copy package files first for layer caching
COPY package.json package-lock.json* ./

# install production and build-time deps
RUN npm ci --silent

# copy source and build
COPY . .
RUN npm run build

FROM nginx:stable-alpine AS runtime

# copy built static assets from builder
COPY --from=build /app/dist /usr/share/nginx/html

# copy custom nginx config for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

RUN mkdir -p /var/cache/nginx /var/run/nginx \
	&& chmod -R 0777 /var/cache/nginx /var/run/nginx \
	&& sed -i 's/^user .*;/# &/' /etc/nginx/nginx.conf || true

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
