const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "covid19India.db");
let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at localhost:3000/");
    });
  } catch (e) {
    console.log(`DB ERROR:${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();
covertStatesDBObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};
specificState = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};
specificDistrict = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

statsObject = (dbObject) => {
  return {
    totalCases: dbObject.totalCases,
    totalCured: dbObject.totalCured,
    totalActive: dbObject.totalActive,
    totalDeaths: dbObject.totalDeaths,
  };
};
//API1
app.get(`/states/`, async (request, response) => {
  const getStatesQuery = `SELECT * FROM state;`;
  const statesArray = await db.all(getStatesQuery);
  response.send(
    statesArray.map((eachState) =>
      covertStatesDBObjectToResponseObject(eachState)
    )
  );
});

//API2

app.get(`/states/:stateId/`, async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `SELECT * FROM state WHERE state_id=${stateId};`;
  const getState = await db.get(getStateQuery);
  response.send(specificState(getState));
});

//API3

app.post(`/districts/`, async (request, response) => {
  const stateDetails = request.body;
  const { districtName, stateId, cases, cured, active, deaths } = stateDetails;
  const InsertQuery = `INSERT INTO district
    (district_name,state_id,cases,cured,active,deaths)
    VALUES(
        '${districtName}',
        ${stateId},
        ${cases},
        ${cured},
        ${active},
        ${deaths}
    );`;
  const dbResponse = await db.run(InsertQuery);
  const districtId = dbResponse.lastID;
  response.send("District Successfully Added");
});

//API4
app.get(`/districts/:districtId/`, async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `SELECT * FROM district 
    WHERE district_id=${districtId};`;
  const district = await db.get(getDistrictQuery);
  response.send(specificDistrict(district));
});

//API5
app.delete(`/districts/:districtId/`, async (request, response) => {
  const { districtId } = request.params;
  const DeleteQuery = `DELETE FROM district 
    WHERE district_id=${districtId};`;
  await db.run(DeleteQuery);
  response.send("District Removed");
});

//API6
app.put(`/districts/:districtId/`, async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const UpdateQuery = `UPDATE district SET
        district_name='${districtName}',
        state_id=${stateId},
        cases=${cases},
        cured=${cured},
        active=${active},
        deaths=${deaths}
     WHERE district_id=${districtId};`;
  await db.run(UpdateQuery);
  response.send("District Details Updated");
});

//API7
app.get(`/states/:stateId/stats/`, async (request, response) => {
  const { stateId } = request.params;
  const statsQuery = `SELECT 
    SUM(d.cases) AS totalCases,
    SUM(d.cured) AS totalCured,
    SUM(d.active) AS totalActive,
    SUM(d.deaths) AS totalDeaths 
    FROM district d
    INNER JOIN state s ON d.state_id=s.state_id
    WHERE s.state_id=${stateId};`;
  const statsArray = await db.get(statsQuery);
  response.send(statsObject(statsArray));
});

//API8
app.get(`/districts/:districtId/details/`, async (request, response) => {
  const { districtId } = request.params;
  const districtDetailsQuery = `SELECT s.state_name FROM district d 
  Inner join state s ON d.state_id=s.state_id
  WHERE d.district_id=${districtId};`;
  const details = await db.get(districtDetailsQuery);
  response.send({ stateName: details.state_name });
});
module.exports = app;
