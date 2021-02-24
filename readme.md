### Followed BY- Backend Server for mananaging following functionality-

Input will a primary user and a secondary user. Objective is to
display users who are followed by the primary user, and are
following the secondary user.

### Routes for the API are-

#### Method GET- /getData,

##### This will accept 2 query params, primaryUser and secondaryUser. This will return the status of the execution, list of desired users and err msg, if any.

### API used- Github
### For more info- https://docs.github.com/en/rest

#### Tests also included in the directory. "mocha", "chai" are used for writing test methods. "nyc" is used to display the code coverage. 

#### Steps to start the development server, if trying to run locally-
##### 1. run npm install
##### 2. (Optional) cd to the test directory, execute npm test (if the dev wants to run the test suite)
##### 3. Go to the working directory of server.js and execute node server
