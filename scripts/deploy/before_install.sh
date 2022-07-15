#!/bin/bash

# Install node.js
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash
. ~/.nvm/nvm.sh
nvm install --lts

node -e "console.log('Running Node.js ' + process.version)"

# Install nodemon
# sudo npm install nodemon -g

# Install forever module
# https://www.npmjs.com/package/forever
# sudo npm install forever -g

# Clean working folder
# sudo find /home/ubuntu/test -type f -delete
