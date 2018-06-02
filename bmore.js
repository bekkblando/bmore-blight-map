var projection = d3.geoMercator(),
    path = d3.geoPath(projection);

d3.json("bmore.json", function(error, bmore) {
  if (error) throw error;

  var neighborhoods = topojson.feature(bmore, bmore.objects.neighborhoods);

  projection.fitSize([960, 600], neighborhoods);

  d3.select("#neighborhoods")
      .datum(neighborhoods)
      .attr("d", path);

});

$(function() {
  $('input[name="datetimes"]').daterangepicker({
    startDate: moment().startOf('hour'),
    endDate: moment().startOf('hour').add(32, 'hour'),
    showDropdowns: true,
    locale: {
      format: 'M/DD hh:mm A'
    }
  })
  $('input[name="datetimes"]').on('apply.daterangepicker',
    (event, obj) => {

      $.ajax({
          url: "https://data.baltimorecity.gov/resource/9t78-k3wf.geojson",
          type: "GET",
          data: {
            "$$app_token" : "eBYEhO8U5MV3A40adxqkH4JRq"
          }
      }).done(function(data) {
        console.log(data)
        let destructionFiltered = {
          "type": "FeatureCollection",
          "features":  getDataPoints(obj.startDate, obj.endDate, data, "dateissue")
        };
        console.log("Destruction ", destructionFiltered)
        d3.select("svg").append("path")
       .datum(destructionFiltered)
       .attr("d", path)
       .attr("class", "destruct")
       .style("fill", "red")

      });

      $.ajax({
          url: "https://data.baltimorecity.gov/resource/rw5h-nvv4.geojson",
          type: "GET",
          data: {
            "$$app_token" : "eBYEhO8U5MV3A40adxqkH4JRq"
          }
      }).done(function(data) {
          let vacencyFiltered = {
            "type": "FeatureCollection",
            "features": getDataPoints(obj.startDate, obj.endDate, data, "noticedate")
          };

          d3.select("svg").append("path")
         .datum(vacencyFiltered)
         .attr("d", path)
         .attr("class", "vacency")
         .style("fill", "blue")
      });

    });
});

function getDateFromElement(element, dateKey) {
  return new Date(element['properties'][dateKey]);
}

function getDataPoints(start, end, data, dateKey) {
  return data['features'].filter(datum => {
    const datumDate = getDateFromElement(datum, dateKey);
    return (start < datumDate && datumDate < end);
  }).sort((a, b) => {
    return getDateFromElement(b, dateKey) - getDateFromElement(a, dateKey);
    });
}
