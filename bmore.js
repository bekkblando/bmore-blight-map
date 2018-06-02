var projection = d3.geoMercator(),
    path = d3.geoPath(projection);


M.AutoInit();

d3.json("bmore.json", function(error, bmore) {
  if (error) throw error;

  var neighborhoods = topojson.feature(bmore, bmore.objects.neighborhoods);

  projection.fitSize([960, 600], neighborhoods);

  d3.select("#neighborhoods")
      .datum(neighborhoods)
      .attr("d", path);

});


// Get the demolition based off the dates if the checkbox is checked
$('#demolitionC').change(() => {
  if($('#demolitionC').is(":checked")) {
    console.log(buildURL("https://data.baltimorecity.gov/resource/9t78-k3wf.geojson", "dateissue"))
    $.ajax({
        url: buildURL("https://data.baltimorecity.gov/resource/9t78-k3wf.geojson", "dateissue"),
        type: "GET",
        data: {
          "$$app_token" : "eBYEhO8U5MV3A40adxqkH4JRq"
        }
    }).done(function(data) {
     addDataToMap(data, "demolition", "brown")
     outputProportion(data, "Percentage of Houses to Be Demolished")
    });
  }else{
    console.log("Remove Demolition")
    $("#demolition").remove()
  }
});

$('#vacencyC').change(() => {
  if($("#vacencyC").is(":checked")){
    $.ajax({
        url: buildURL("https://data.baltimorecity.gov/resource/rw5h-nvv4.geojson","noticedate"),
        type: "GET",
        data: {
          "$$app_token" : "eBYEhO8U5MV3A40adxqkH4JRq"
        }
    }).done(function(data) {
        addDataToMap(data, "vacency", "blue")
        outputProportion(data, "Percentage of Houses Vacant")
    });
  }else{
    $("#vacency").remove()
  }
});


$('#housePermitC').change(() => {
  if($("#housePermitC").is(":checked")){
    $.ajax({
        url: buildURL("https://data.baltimorecity.gov/resource/9t78-k3wf.geojson","dateexpire"),
        type: "GET",
        data: {
          "$$app_token" : "eBYEhO8U5MV3A40adxqkH4JRq"
        }
    }).done(function(data) {
        noDemPermit = {  "type": "FeatureCollection",  "features": []}
        data["features"].forEach((permit) => {
          if(permit["properties"]["permitnum"].slice(0,3) != "DEM"){
            noDemPermit["features"].push(permit);
          }else{
            console.log(permit["properties"]["permitnum"].slice(0,3))
          }
        });
        addDataToMap(noDemPermit, "housePermit", "green")
    });
  }else{
    $("#housePermit").remove()
  }
});




$('#liquorC').change(() => {
  if($("#liquorC").is(":checked")){
    $.ajax({
        url: buildURL("https://data.baltimorecity.gov/resource/g2jf-x8pp.geojson", ""),
        type: "GET",
        data: {
          "$$app_token" : "eBYEhO8U5MV3A40adxqkH4JRq"
        }
    }).done(function(data) {
        console.log(data)
        addDataToMap(data, "liquor", "yellow")
    });
  }else{
    $("#liquor").remove()
  }
});

function addDataToMap(data, id, color){
  d3.select("#map").append("path")
   .datum(data)
   .attr("d", path)
   .attr("id", id)
   .attr("r", 5.1)
   .style("fill", color)
}

function buildURL(baseURL, dateKey){
  if(dateKey != "")
    return `${baseURL}?$where=${dateKey}>"${getBeginDate()}" AND ${dateKey}<"${getEndDate()}"&$order=${dateKey} DESC&$limit=5000`;
  else
    return `${baseURL}?$limit=10000`;

}

function getBeginDate(){
  return M.Datepicker.getInstance(document.querySelector('#begin')).toString('yyyy-mm-dd')
}

function getEndDate(){
  return M.Datepicker.getInstance(document.querySelector('#end')).toString('yyyy-mm-dd')
}

function getVacantHousesInNeighborhood(data) {
  let dictionary = {};
  data["features"].forEach(datum => {
    if (dictionary[datum['properties']['neighborhood']])
      dictionary[datum['properties']['neighborhood']]++;
    else
      dictionary[datum['properties']['neighborhood']] = 1;
  });
  return dictionary;
}

function outputProportion(data, header){
  $('#propHead').html(header)
  $('proportions').html("")
  let vacantHouses = getVacantHousesInNeighborhood(data);
  Object.keys(vacantHouses).forEach(function(key) {
    console.log(key)
    $.ajax({
      url: `https://data.baltimorecity.gov/resource/piqw-tyem.json?csa2010=#{key}`,
      type: "GET"
    }).done((data) => {
      console.log(data)
      $('proportions').append(`<tr><td>${key}</td><td>${(vacantHouses[key]/data["shomes12"])*100}</td></tr>`);
    });
  });
}
