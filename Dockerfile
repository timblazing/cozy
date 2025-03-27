FROM nginx:alpine
WORKDIR /usr/share/nginx/html/
COPY . .
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 3003
CMD ["nginx", "-g", "daemon off;"]
