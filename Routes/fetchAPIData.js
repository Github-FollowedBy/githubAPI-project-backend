/*API that is used to get intersection of Users,
that Primary user follows and followers of secondary user 
-------------------------------------------------------------------------------------
Developer Name- Sanidhya Pawar
Creation Date- 23/02/2021
Last Updated on- 24/ 02/ 2021
Test Method- 
*/
const express = require("express");
const routes = express.Router();
require("dotenv").config();
routes.use(express.json());
const axios = require("axios");

const isNullOrUndefined = (val) => {
  return val === null || val === undefined || val === "";
};

const getFollowingForPrimaryUser = async (primaryUser) => {
  try {
    const pageSize = 100;
    let pageNum = 1;
    let hasMorePages = true;
    let listOfFollowings = [];
    while (hasMorePages) {
      //The github api return at most 100 users data at a time
      try {
        const list = await axios.get(
          `https://api.github.com/users/${primaryUser}/following?per_page=${pageSize}&page=${pageNum}`,
          {
            /*Without Auth Token only 5 API requests were allowed, hence used the Auth token
                to improve on the number of API calls that can be made.
              */
            headers: {
              Authorization: `${process.env.AUTHTOKEN}`,
            },
          }
        );
        //Merging the array with existing list that holds the users from previous pages
        listOfFollowings = [].concat(listOfFollowings, list.data);
        if (!list.data.length) {
          //All the users that primary user is following have been retreived.
          hasMorePages = false;
          break;
        }
        pageNum++;
      } catch (err) {
        return {
          listOfFollowings: [],
          success: false,
          message: "Error in the API or API rate limit exceeded ",
        };
      }
    }
    return { listOfFollowings, success: true };
  } catch (error) {
    return {
      listOfFollowings: [],
      success: false,
      message: "Internal Server Error",
    };
  }
};

const getMatchingUsers = async (listOfFollowings, secondaryUser) => {
  try {
    let intersectingUsersPromises = [];
    let userNameList = [];
    listOfFollowings.forEach((user) => {
      //Iterating over list of users that Primary User follows.
      try {
        /* Checking if the user that primary user follows, 
               follows the secondary user or not, if response from the API is 204,
               that means the current iteration user follows secondary user,
               if the response if 404, then we can conclude that the user doesn't follow the
               secondary user.
            */
        intersectingUsersPromises.push(
          axios.get(
            `https://api.github.com/users/${user.login}/following/${secondaryUser}`
          )
        );
        //List to store the userName
        userNameList.push(user.login);
      } catch (err) {
        return {
          intersectingUsers: [],
          success: false,
          message: "Error in the API or API rate limit exceeded ",
        };
      }
    });
    //Waiting for all the promises to be resolved (204) or rejected (404).
    const promistListResolved = await Promise.allSettled(
      intersectingUsersPromises
    );
    /*As we are pushing the promises in the above forEach loop on line 70,
      so this list of promises will maintain the sequence, as a result using
      index that is starting from 0 for userName retrieval.
    */
    let intersectingUsers = [];
    promistListResolved.forEach((promise, index) => {
      //If status code is 204, then the promise is fulfilled
      //else the status is rejected, i.e. status code is 404
      promise.status === "fulfilled"
        ? intersectingUsers.push(userNameList[index])
        : null;
    });
    return { intersectingUsers, success: true };
  } catch (err) {
    return {
      intersectingUsers: [],
      success: false,
      message: "Internal Server Error",
    };
  }
};

routes.get("/getData", async (req, res) => {
  try {
    const { primaryUser, secondaryUser } = req.query;
    if (isNullOrUndefined(primaryUser) || isNullOrUndefined(primaryUser)) {
      return res.status(400).send({ message: "Please provide the usernames" });
    }
    //Getting the users that Primary User is following.
    const followingUserResponse = await getFollowingForPrimaryUser(primaryUser);

    if (followingUserResponse.success) {
      /*Method to get the intersection of Users that Primary user follows
        and followers of secondary user.
      */
      getMatchingUsers(
        followingUserResponse.listOfFollowings,
        secondaryUser
      ).then((response) => {
        //As async method always returns a promise, hence using, .then() to handle it.
        console.log(response);
        if (response.success) {
          res.send({
            success: true,
            intersectionListOfUsers: response.intersectingUsers,
          });
          return;
        } else {
          res.send({
            success: false,
            message: "Error in the API or API rate limit exceeded ",
            intersectionListOfUsers: [],
          });
          return;
        }
      });
    } else {
      res.send({
        success: false,
        message: "Error in the API or API rate limit exceeded ",
        intersectionListOfUsers: [],
      });
      return;
    }
  } catch (err) {
    res.status(500).send({
      message: "Internal Server Error",
      success: false,
      intersectionListOfUsers: [],
    });
    return;
  }
});

routes.get("/", async (req, res) => {
  res.send("Sever Running..");
});

module.exports = routes;
