const express = require("express");
const cors = require("cors");

const google = require("./google");
const immoweb = require("./immoweb");

const app = express();
app.use(cors());

// GET /get-location?input=Brussels
app.get("/get-location", async (req, res) => {
  if (!req.query.input || req.query.input.length === 0)
    return res.send("please specify the input");
  const input = req.query.input;

  const inputCoordinates = await google.getCoordinatesFromText(input);
  const listOfHouses = await immoweb.getClassifieds(inputCoordinates);

  // filter those without geopoint
  const filtered = listOfHouses.filter(h =>
    h.property.location.hasOwnProperty("geoPoint")
  );

  const promiseFiltered = filtered.map(async item => {
    // do the google directions api call here to get duration
    itemCoordinates = [
      item.property.location.geoPoint.latitude,
      item.property.location.geoPoint.longitude
    ];
    item.travelDuration = {
      driving: await google.getDuration(
        inputCoordinates,
        itemCoordinates,
        "driving"
      ),
      walking: await google.getDuration(
        inputCoordinates,
        itemCoordinates,
        "walking"
      )
    };
    return item;
  });
  const results = await Promise.all(promiseFiltered);

  const cleanResults = results
    // only include those that we can find a route to
    .filter(item => item.travelDuration != "-1")
    // sort them by lowest travelroute
    .sort(
      (a, b) =>
        parseInt(a.travelDuration.driving, 10) -
        parseInt(b.travelDuration.driving, 10)
    );

  return res.send(cleanResults);
});

app.listen(3000, () => {
  // eslint-disable-next-line no-console
  console.log("Example app listening on port 3000!");
});
