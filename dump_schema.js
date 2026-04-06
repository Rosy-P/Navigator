fetch('/backend/getfacilities.php')
  .then(res => res.json())
  .then(json => {
    if (json.length > 0) {
        console.log("COLUMNS: " + Object.keys(json[0]).join(", "));
    } else {
        console.log("Empty data");
    }
  }).catch(e => console.error(e));
