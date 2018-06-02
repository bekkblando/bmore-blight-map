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
      d3.select("svg").append("path")
     .datum(data)
     .attr("d", path)
     .attr("id", "demolition")
     .style("fill", "red")

    });
  }else{
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
        console.log("Vacency Data: ", data)
        d3.select("svg").append("path")
       .datum(data)
       .attr("d", path)
       .attr("id", "vacency")
       .style("fill", "blue")
    });
  }else{
    $("#vacency").remove()
  }
});

function buildURL(baseURL, dateKey){
  return `${baseURL}?$where=${dateKey}>"${getBeginDate()}" AND ${dateKey}<"${getEndDate()}"&$order=${dateKey} DESC`
}

function getBeginDate(){
  return M.Datepicker.getInstance(document.querySelector('#begin')).toString('yyyy-mm-dd')
}

function getEndDate(){
  return M.Datepicker.getInstance(document.querySelector('#end')).toString('yyyy-mm-dd')
}
