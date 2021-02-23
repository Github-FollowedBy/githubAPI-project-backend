let app = require("../server");
let chai = require("chai");
let chaiHttp = require("chai-http");
let should = chai.should();
chai.use(chaiHttp);

/*
 * Test the /GET route
 */
describe("/GET Desired Users", () => {
  it("it should GET all the intersecting users", (done) => {
    chai
      .request(app)
      .get("/getData?primaryUser='pawarss1'&secondaryUser='pawarss1'")
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a("array");
        res.body.length.should.be.eql(1);
        done();
      });
  });
});
