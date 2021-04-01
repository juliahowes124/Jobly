"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll
} = require("./_testCommon");

let jobId1;

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);


describe('create', () => {
  const newJob = {
    title: "test job",
    salary: 500000,
    equity: 0.00123,
    companyHandle: "c2"
  };

  test("works", async () => {
    let job = await Job.create(newJob);
    expect({...job, equity: 0.00123}).toEqual({...newJob, id: expect.any(Number)});

    const result = await db.query(
      `SELECT title, salary, equity, company_handle AS "companyHandle"
       FROM jobs
       WHERE id = ${job.id}`);
  
    expect(result.rows[0]).toEqual({...newJob, equity: '0.00123'});
  });
})

describe("get", () => {
  test("works", async function () {
    let j1Res = await db.query(`SELECT id FROM jobs WHERE title='j1'`);
    jobId1 = j1Res.rows[0].id;
    const job = await Job.get(jobId1);
    expect(job).toEqual({
      title: "j1",
      salary: 60000,
      equity: "0.005",
      companyHandle: 'c1',
      id: jobId1});
  });

  test("not found if no such job", async function () {
    try {
      await Job.get(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
