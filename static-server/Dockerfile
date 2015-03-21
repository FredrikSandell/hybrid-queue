FROM node
COPY . /static-server
#RUN cd static-server; npm install; npm install -g gulp; gulp buildCss; gulp buildJs;
RUN cd static-server; npm install; npm install -g gulp
EXPOSE 3000:3000
EXPOSE 3001:3001
EXPOSE 8080:8080
EXPOSE 9000:9000
#//CMD ["node", "static-server/app.js"]
