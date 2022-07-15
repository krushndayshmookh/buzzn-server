#!/bin/bash

cp /home/ec2-user/default_env /home/ec2-user/nodejs/.env

. ~/.nvm/nvm.sh

# Stop all servers and start the server as a daemon
# forever stopall
# forever start/home/ec2-user/nodejs/server.js
cd /home/ec2-user/nodejs
PORT=80
npm start
