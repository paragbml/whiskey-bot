#!/bin/bash

# Clone puppeteer-extra and install it
git clone https://github.com/berstend/puppeteer-extra.git

# Install everything including puppeteer-extra
npm install ./puppeteer-extra/packages/puppeteer-extra
npm install
