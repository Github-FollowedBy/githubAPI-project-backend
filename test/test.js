let app = require("../server");
let chai = require("chai");
let chaiHttp = require("chai-http");
let should = chai.should();
chai.use(chaiHttp);

/*
 * Test the /GET route
 */
describe("/GET Desired Users", () => {
  context("Scenario 1: Testing Approach 1 in the route", function () {
    it("should GET all the intersecting users", (done) => {
      chai
        .request(app)
        .get("/getData?primaryUser=pawarss1&secondaryUser=pawarss1")
        .end((err, res) => {
          res.should.have.status(200);
          res.body.intersectionListOfUsers.should.be.a("array");
          done();
        });
    });
  });
  context("Scenario 2: Testing Approach 2 in the route", function () {
    it("should GET all the intersecting users with followers > 6000 & following < 60 with minimum API calls", (done) => {
      chai
        .request(app)
        .get("/getData?primaryUser=pawarss1&secondaryUser=torvalds")
        .end((err, res) => {
          res.should.have.status(200);
          res.body.intersectionListOfUsers.should.be.a("array");
          done();
        });
    });
  });
  context("Scenario 3: UserName Invalid", function () {
    it("should return err msg and status as 400", (done) => {
      chai
        .request(app)
        .get("/getData?primaryUser=pawarss112&secondaryUser=pawarss11243")
        .end((err, res) => {
          console.log(res);
          res.should.have.status(400);
          done();
        });
    });
  });
  context("Scenario 4: UserName Missing", function () {
    it("should return appropriate err msg and status as 400", (done) => {
      chai
        .request(app)
        .get("/getData?secondaryUser=pawarss11243")
        .end((err, res) => {
          res.should.have.status(400);
          done();
        });
    });
  });
});
