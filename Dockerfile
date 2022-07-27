# pull the Node.js Docker image
FROM node:alpine

# update the package index
RUN apk update

# add busybox initscripts to the PATH
RUN apk add --no-cache busybox-initscripts curl openrc

# start cron daemon
RUN rc-update add crond

# create the directory inside the container
WORKDIR /usr/src/app

# copy the package.json files from local machine to the workdir in container
COPY package*.json ./

# run npm install in our local machine
RUN npm install

# copy the generated modules and all other files to the container
COPY . .

# push schema to postgres
RUN npx prisma db push

# generate prisma client
RUN npx prisma generate

# make script executable
RUN chmod 0744 ./scripts/purge.sh

# add cronjob
RUN echo "* * * * * usr/src/app/scripts/purge.sh" >> /etc/crontabs/root

# our app is running on port 3000 within the container, so need to expose it
EXPOSE 3000

# create optimized build for production
RUN npm run build

# the command that starts our app
CMD ["npm", "start" && "/usr/sbin/crond", "-f"]