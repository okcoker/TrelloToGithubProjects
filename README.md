<p align="center"><img src="https://user-images.githubusercontent.com/1030830/35209029-56cb3678-ff19-11e7-9e2c-d7dd0e05fd87.png"  alt=""/></p>

# Trello to Projects

This is a small app built on top of [next.js](https://github.com/zeit/next.js/) that will help you migrate your Trello board into a GitHub project. Currently it only migrates a trello board to a github organization project.

## Build and Run on Windows
First You need to install several packages and applications:
1) Python 2.7 (version 3.x is not supported by node-gyp [link](https://github.com/nodejs/node-gyp/issues/1977)), you may download the latest version from [here](https://www.python.org/downloads/windows/)
2) install node-gyp `npm install --global node-gyp@latest`
3) run `npm install --global windows-build-tools` to let your node-gyp execute correct
4) run `npm run dev:windows`

**If you face issue related to `can't find python 2` you have to set up default path to your python 2.7:**
1) `npm config set python "c:\Python27\python.exe"`
2) delete node_modules folder and try to install again

## Running locally

`yarn`

`npm run dev`
