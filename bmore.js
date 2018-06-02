var path = d3.geoPath();

d3.json("bmore.json", function(error, bmore) {
  if (error) throw error;

  d3.select("#states")
      .datum(topojson.feature(bmore, bmore.objects.states))
      .attr("d", path);
});
