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

beforeAll(async () => {
  await commonBeforeAll();
  let j1Res = await db.query(`SELECT id FROM jobs WHERE title='j1'`);
  jobId1 = j1Res.rows[0].id;
});
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

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll({});
    expect(jobs).toEqual([
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
    ]);
  });

  test("works: filters", async function () {
    let jobs = await Job.findAll({title: 'j2', minSalary: 80000 , hasEquity: false});
    expect(jobs).toEqual([
      {
        title: "j2",
        salary: 100000,
        equity: "0",
        companyHandle: "c2",
      }
    ]);
  });

  test("works: filters, no results", async function () {
    let jobs = await Job.findAll({title: 'j1', minSalary: 80000 , hasEquity: false});
    expect(jobs).toEqual([]);
  });
});

/************************************** get */

describe("get", () => {
  test("works", async function () {
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

/************************************** update */

describe("update", () => {
  test("works for valid inputs", async function () {
    const job = await Job.update(jobId1, {salary: 80000, equity: 0.010});
    expect(job).toEqual({
      title: "j1",
      salary: 80000,
      equity: "0.01",
      companyHandle: "c1",
    });
  });

  test("works for null inputs", async function () {
    const job = await Job.update(jobId1, { salary: null, equity: null });
    expect(job).toEqual({
      title: "j1",
      salary: null,
      equity: null,
      companyHandle: "c1",
    });
  });

  test("does not update company handle", async function () {
    const job = await Job.update(jobId1, { title: "jtest1", companyHandle: "c5" });
    expect(job).toEqual({
      title: "jtest1",
      salary: 60000,
      equity: "0.005",
      companyHandle: "c1",
    });
  });

  test("not found if no such job", async function () {
    try {
      await Job.update(0, { salary: 80000 });
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("invalid, no data passed in", async function () {
    try {
      await Job.update(jobId1, {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", () => {
  test("works", async () => {
    const result = await Job.remove(jobId1);
    expect(result).toEqual({ id: jobId1 });

    const jobRes = await db.query(`SELECT * FROM jobs`);
    expect(jobRes.rows.length).toEqual(1);
  });
    
  test("invalid job id", async () => {
    try {
      await Job.remove(0);
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
      expect(err.message).toEqual(`No job: 0`)
    }
  });
})