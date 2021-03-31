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

module.exports = { sqlForPartialUpdate };
