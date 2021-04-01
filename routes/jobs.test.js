"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u2Token
} = require("./_testCommon");

let jobId1;

beforeAll(async () => {
  await commonBeforeAll();
  const jobRes = await db.query(`SELECT id FROM jobs WHERE title='j1'`);
  jobId1 = jobRes.rows[0].id;
});
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs:
          [
            {
              title: "j1",
              salary: 60000,
              equity: "0.005",
              companyHandle: "c1"
            },
            {
              title: "j2",
              salary: 100000,
              equity: "0",
              companyHandle: "c2",
            }
          ]
    });
  });

  test("ok for anon with filters", async function () {
    const resp = await request(app).get("/jobs?title=j2&minSalary=80000&hasEquity=");
    expect(resp.body).toEqual({
      jobs:
          [
            {
              title: "j2",
              salary: 100000,
              equity: "0",
              companyHandle: "c2"
            }
          ]
    });
  });

  test("ok for anon with filters, no results", async function () {
    const resp = await request(app).get("/jobs?title=j1&minSalary=80000&hasEquity=");
    expect(resp.body).toEqual({
      jobs:
          []
    });
  });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE jobs CASCADE");
    const resp = await request(app)
        .get("/jobs")
    expect(resp.statusCode).toEqual(500);
  });
});

describe("GET /jobs/:id", () => {
  test('ok for non-admins', async () => {
    let resp = await request(app).get(`/jobs/${jobId1}`);
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      job:
        {
          id: jobId1,
          title: "j1",
          salary: 60000,
          equity: "0.005",
          companyHandle: "c1"
        }
    });
  });

  test('err for not-found job id', async () => {
    let resp = await request(app).get(`/jobs/0`);
    expect(resp.statusCode).toEqual(404);
  });
})

describe("POST /jobs", function () {
  const newJob = {
    title: "test created job",
    salary: 70000,
    equity: 0.0001,
    companyHandle: "c2"
  };

  test("ok for valid data for admins", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        title: "test created job",
        salary: 70000,
        equity: "0.0001",
        companyHandle: "c2"
      },
    });
  });

  test("not ok for non-admins", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not ok for garbage token", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer fdjsakflda121231df`);
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          salary: 70000
        })
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          ...newJob,
          equity: 3
        })
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});


describe("PATCH /jobs/:id", function () {
  test("works for admins", async function () {
    const resp = await request(app)
        .patch(`/jobs/${jobId1}`)
        .send({
          title: "new title",
          equity: 0.01
        })
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      job: {
        title: "new title",
        salary: 60000,
        equity: "0.01",
        companyHandle: "c1"
      }
    });
  });

  test("does not work for non-admins", async function () {
    const resp = await request(app)
      .patch(`/jobs/${jobId1}`)
      .send({
        title: "new title"
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("does not work for garbage token", async function () {
    const resp = await request(app)
      .patch(`/jobs/${jobId1}`)
      .send({
        title: "new title"
      })
      .set("authorization", `Bearer fdsjakldsf232`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
      .patch(`/jobs/${jobId1}`)
      .send({
        title: "new title",
      });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such job", async function () {
    const resp = await request(app)
        .patch(`/jobs/0`)
        .send({
          title: "new nope",
        })
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on handle change attempt", async function () {
    const resp = await request(app)
        .patch(`/jobs/${jobId1}`)
        .send({
          id: 20,
          companyHandle: "starbucks"
        })
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    const resp = await request(app)
        .patch(`/jobs/${jobId1}`)
        .send({
          equity: 3,
        })
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

describe("DELETE /companies/:handle", function () {
  test("works for admins", async function () {
    const resp = await request(app)
        .delete(`/jobs/${jobId1}`)
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.body).toEqual({ message: `Job id ${jobId1} was removed` });
  });

  test("does not work for non-admins", async function () {
    const resp = await request(app)
      .delete(`/jobs/${jobId1}`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .delete(`/jobs/${jobId1}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such job", async function () {
    const resp = await request(app)
        .delete(`/jobs/0`)
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(404);
  });
});
