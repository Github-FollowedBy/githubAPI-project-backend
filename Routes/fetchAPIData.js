/*API that is used to get intersection of Users,
that Primary user follows and followers of secondary user 
-------------------------------------------------------------------------------------
Developer Name- Sanidhya Pawar
Creation Date- 23/02/2021
Last Updated on- 24/ 02/ 2021
Test Method- ../test/test.js
-------------------------------------------------------------------------------------
*/
const express = require("express");
const routes = express.Router();
require("dotenv").config();
routes.use(express.json());
const axios = require("axios");
const utilFunctions = require("./utilFunctions");

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
            `https://api.github.com/users/${user.login}/following/${secondaryUser}`,
            {
              headers: {
                Authorization: `${process.env.AUTHTOKEN}`,
              },
            }
          )
        );
        //List to store the userName and avatar url.
        userNameList.push({ login: user.login, profileUrl: user.avatar_url });
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
    /*As we are pushing the promises in the above forEach loop,
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

const checkIfUsersAreValid = async (primaryUser, secondaryUser) => {
  try {
    const primaryUserResponse = await axios.get(
      `https://api.github.com/users/${primaryUser}`,
      {
        headers: {
          Authorization: `${process.env.AUTHTOKEN}`,
        },
      }
    );
    if (primaryUser === secondaryUser) {
      /*If primary and secondary users are same, then we can avoid one API call.
        In this case, even 1 API call is important, as it can return upto 100 users in one call.
      */
      return {
        valid: true,
        primaryUserResponse,
        secondaryUserResponse: primaryUserResponse,
      };
    }
    const secondaryUserResponse = await axios.get(
      `https://api.github.com/users/${secondaryUser}`,
      {
        headers: {
          Authorization: `${process.env.AUTHTOKEN}`,
        },
      }
    );
    //If we are over here, that means both the users are valid
    return { valid: true, primaryUserResponse, secondaryUserResponse };
  } catch (err) {
    //If we are over here, that means some of the user is invalid or API limit exceeded
    return { valid: false };
  }
};

routes.get("/getData", async (req, res) => {
  try {
    /*Due to the restrictions of GITHUB-API that gives only 60 API calls per hour
      the sum of the followings of a primary user and followers of the secondary user
      should be less than ~5800, as 2 API calls are consumed of validation check.
      At max we can get 100 users from one API call.
    */
    const { primaryUser, secondaryUser } = req.query;
    if (isNullOrUndefined(primaryUser) || isNullOrUndefined(secondaryUser)) {
      return res.status(400).send({ message: "Please provide the usernames" });
    }
    //Checking if User Name is present on github or not.
    const validCheckResponse = await checkIfUsersAreValid(
      primaryUser,
      secondaryUser
    );
    if (!validCheckResponse.valid) {
      return res.status(400).send({
        message: "One of the UserName not Valid or API limit exceeded!",
        success: false,
      });
    }
    if (
      validCheckResponse.primaryUserResponse.data.following <= 58 &&
      validCheckResponse.secondaryUserResponse.data.followers >= 6000
    ) {
      /*If this is the case, then no point getting all the followers data also, 
        as we can simply get all the followings of primary user and make 58 or less API requests,
        As a result Approach 1 will be executed- Getting Followings of Primary User,
        for every user that is followed by primary user, we will check that users following and 
        if it contains the secondary user, add it to the reponse. 
        else, Approach 2 will be used.
        (If followers + following is are more than
         6000, anyways its impossible get all the followers due to API restriction.)
      */

      //Getting the users that Primary User is following.
      const followingUserResponse = await getFollowingForPrimaryUser(
        primaryUser
      );

      if (followingUserResponse.success) {
        /*Method to get the intersection of Users that Primary user follows
        and followers of secondary user.
      */
        getMatchingUsers(
          followingUserResponse.listOfFollowings,
          secondaryUser
        ).then((response) => {
          //As async method always returns a promise, hence using, .then() to handle it.
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
    } else {
      /*Approach 2: Pre-Requisite- Following of Primary User + Followers of Secondary User <= ~5988 due to API limit.
        Logic- Get all the following of Primary User and followers of Secondary User,
        simply find the intersection set and return it, this will comparitively consume less API calls.
      */
      const listOfFollowing = await utilFunctions.getRespectiveListsForUsers(
        primaryUser,
        "following"
      );
      const listOfFollowers = await utilFunctions.getRespectiveListsForUsers(
        secondaryUser,
        "followers"
      );
      /*As we will be constructing a Map in the Utils method using the first parameter,
       so to improve on the space complexity, 
       sending the list with smaller size in first parameter.
      */
      const intersectionResponse =
        listOfFollowing.listOfUsers.length <= listOfFollowers.listOfUsers.length
          ? utilFunctions.getIntersection(
              listOfFollowing.listOfUsers,
              listOfFollowers.listOfUsers
            )
          : utilFunctions.getIntersection(
              listOfFollowers.listOfUsers,
              listOfFollowing.listOfUsers
            );
      if (intersectionResponse.success) {
        res.send({
          success: true,
          intersectionListOfUsers: intersectionResponse.intersectingList,
        });
        return;
      } else {
        res.status(500).send({
          message: "Internal Server Error",
          success: false,
          intersectionListOfUsers: [],
        });
        return;
      }
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
