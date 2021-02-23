const axios = require("axios");
require("dotenv").config();

const getRespectiveListsForUsers = async (user, action) => {
  try {
    const pageSize = 100;
    let pageNum = 1;
    let hasMorePages = true;
    let listOfUsers = [];
    while (hasMorePages) {
      //The github api return at most 100 users data at a time
      try {
        const list = await axios.get(
          `https://api.github.com/users/${user}/${action}?per_page=${pageSize}&page=${pageNum}`,
          {
            headers: {
              Authorization: `${process.env.AUTHTOKEN}`,
            },
          }
        );
        //Merging the array with existing list that holds the users from previous pages
        listOfUsers = [].concat(listOfUsers, list.data);
        if (!list.data.length) {
          //All the users that primary user is following have been retreived.
          hasMorePages = false;
          break;
        }
        pageNum++;
      } catch (err) {
        console.log(err);
        return {
          listOfUsers: [],
          success: false,
          message: "Error in the API or API rate limit exceeded ",
        };
      }
    }
    return { listOfUsers, success: true };
  } catch (error) {
    return {
      listOfUsers: [],
      success: false,
      message: "Internal Server Error",
    };
  }
};
const getIntersection = (iterationList, targetList) => {
  try {
    /*Function that returns the list of common elements(userName in this case) 
  between two arrays.*/
    let followingListsMap = {};
    //Store the userlogin and avatar_url in a Map / Dictionary as the userLogin will always be unique
    iterationList.forEach(
      (curUser) => (followingListsMap[curUser.login] = curUser.avatar_url)
    );
    let intersectingList = [];
    targetList.forEach((curUser) => {
      if (curUser.login in followingListsMap) {
        intersectingList.push({
          login: curUser.login,
          profileUrl: curUser.avatar_url,
        });
      }
    });
    return { intersectingList, success: true };
  } catch (err) {
    console.log(err);
    return {
      intersectingList: [],
      success: false,
      message: "Internal Server Error",
    };
  }
};
exports.getIntersection = getIntersection;
exports.getRespectiveListsForUsers = getRespectiveListsForUsers;
