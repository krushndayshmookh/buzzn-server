#!/bin/bash

# Install node.js
rm -R ~/.npm ~/.nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash
. ~/.nvm/nvm.sh
nvm install --lts

node -e "console.log('Running Node.js ' + process.version)"

# Install nodemon
# sudo npm install nodemon -g

# Install pm2 module
# https://www.npmjs.com/package/pm2
npm install pm2 -g

# Clean working folder
# sudo find /home/ec2-user/test -type f -delete
