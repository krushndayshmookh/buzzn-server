#!/bin/bash

. ~/.nvm/nvm.sh

# Stop all servers and start the server as a daemon
# forever stopall
# forever start /home/ec2-user/nodejs/app.js
PORT=80
sudo npm start
