const { BadRequestError } = require("../expressError");

// dataToUpdate: Object of model properties to update
// jsToSql: Object that converts JS column name to SQL column name
// 
// sqlForPartialUpdate is used to capture data to update in model 
// with correct formatting for SQL command. Return obj will only include
// values that are being updated.

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  // cols: Formats SET SQL command string with parameterized queries
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

function sqlForFiltering(filterParams) {

  if(+filterParams.minEmployees > +filterParams.maxEmployees) {
    throw new BadRequestError("min employees can't be greater than max employees")
  }
  let paramCounter = 1;
  let sqlCols = [];
  let values = [];

  if(filterParams.name) {
    sqlCols.push(`name ILIKE '%' || $${paramCounter} || '%' `);
    paramCounter++;
    values.push(filterParams.name);
  }
  if(filterParams.minEmployees) {
    sqlCols.push(`num_employees >= $${paramCounter} `);
    paramCounter++;
    values.push(filterParams.minEmployees);
  }
  if(filterParams.maxEmployees) {
    sqlCols.push(`num_employees <= $${paramCounter} `);
    values.push(filterParams.maxEmployees);
  }
  
  return {
    sqlCols: sqlCols.join('AND '),
    values
  }
}

module.exports = { sqlForPartialUpdate, sqlForFiltering };
