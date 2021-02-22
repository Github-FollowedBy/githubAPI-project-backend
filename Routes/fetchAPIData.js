const express = require("express");
const routes = express.Router();
require("dotenv").config();
routes.use(express.json());
const axios = require("axios");

const isNullOrUndefined = (val) => {
  return val === null || val === undefined || val === "";
};

const getUserData = async (primaryUser, secondaryUser) => {
  try {
    const pageSize = 100;
    let pageNum = 1;
    let hasMorePages = true;
    while (hasMorePages) {
      const list = await axios.get(
        `https://api.github.com/users/${primaryUser}/following?per_page=${pageSize}&page=${pageNum}`
      );
      if (!list.data.length) {
        //All the users that primary user is following have been retreived.
        hasMorePages = false;
        break;
      }
      pageNum++;
    }
  } catch (error) {
    console.error(error);
  }
};

routes.get("/getData", async (req, res) => {
  try {
    const { primaryUser, secondaryUser } = req.query;
    if (isNullOrUndefined(primaryUser) || isNullOrUndefined(primaryUser)) {
      return res.status(400).send({ message: "Please provide the usernames" });
    }
    const listOfFollowing = getUserData(primaryUser, secondaryUser);
    //const listOfFollowers = getUserData("followers", secondaryUser);
    res.status(200).send({
      ok: true,
    });
  } catch (err) {
    res.status(500).send({ message: "Internal Server Error" });
  }
});

routes.get("/", async (req, res) => {
  res.send("Sever Running..");
});

module.exports = routes;
