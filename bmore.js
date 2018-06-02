var projection = d3.geoMercator(),
    path = d3.geoPath(projection);

d3.json("bmore.json", function(error, bmore) {
  if (error) throw error;

  var neighborhoods = topojson.feature(bmore, bmore.objects.neighborhoods);

  projection.fitSize([960, 600], neighborhoods);

  d3.select("#neighborhoods")
      .datum(neighborhoods)
      .attr("d", path);

  d3.json("stuff.json", function(error, stuff){
    if (error) throw error;
    var svg = d3.select("svg");
    svg.append("path")
    .datum(stuff)
    .attr("d", path)
    .attr("class", "place");

  });
});
