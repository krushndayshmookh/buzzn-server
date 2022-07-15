#!/bin/bash

cp /home/ec2-user/default_env /home/ec2-user/nodejs/.env

. ~/.nvm/nvm.sh

# Stop all servers and start the server as a daemon
cd /home/ec2-user/nodejs
pm2 stop all
pm2 start server.js

