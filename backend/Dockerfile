FROM node:18

# Install ffmpeg and yt-dlp
RUN apt-get update && \
    apt-get install -y ffmpeg wget && \
    wget -O /usr/local/bin/yt-dlp https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp

WORKDIR /app
COPY . .

RUN npm install

EXPOSE 3001

CMD ["node", "server.js"] 