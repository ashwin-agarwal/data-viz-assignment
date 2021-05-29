$(document).ready(function() {
    const GEOJSON_DATA_PATH = './data/filtered_countries.geojson',
        BUBBLE_MAP_DATA_PATH = './data/bubble_map_data.csv',
        DOUGHTNUT_DATA_PATH = "./data/doughnut.csv";
    // DOUGHTNUT2_DATA_PATH = "./data/doughnut_2.csv";

    var observer = new IntersectionObserver(function(entries) {
        if (entries[0].isIntersecting === true) {
            let target_id = entries[0].target.id;
            $('.nav-link').removeClass('active');
            $("a.nav-link[href='#" + target_id + "']").addClass('active');
            history.pushState(null, null, '#' + target_id);
        }
    }, { threshold: [0.4] });

    $('main > div').each(function() {
        observer.observe(this);
    });

    $("a.nav-link[href='" + window.location.hash + "']").addClass('active');


    let data_ready = function(_, geo_data, bubble_map_data, doughnut_data) {
        delete(bubble_map_data['columns']);
        createBubbleMap(geo_data, bubble_map_data);

        delete(doughnut_data['columns']);
        createDoughnut(doughnut_data);

        console.log(bubble_map_data);
        $('#bubble_map path, #bubble_map circle').each(function(_, d) {
            $(this).click(function() {
                let path_id = $(this).attr('id').replace('circle', 'map'),
                    circle_id = $(this).attr('id').replace('map', 'circle');

                if ($('#' + path_id).hasClass('highlight')) {
                    $('#bubble_map path').removeClass("faded").removeClass("highlight");
                    $('#bubble_map circle').removeClass("faded").removeClass("highlight");
                    createDoughnut(doughnut_data, "Overall");
                } else {
                    createDoughnut(doughnut_data, $(d).attr("text"));

                    $('#bubble_map path').removeClass("faded").removeClass("highlight");
                    $('#bubble_map circle').removeClass("faded").removeClass("highlight");

                    $('#bubble_map path[text!="' + $(d).attr("text") + '"]').addClass("faded");
                    $('#bubble_map circle[text!="' + $(d).attr("text") + '"]').addClass("faded");

                    $('text.doughnut_center').html($(d).attr("text"));
                    $('#' + path_id).addClass("highlight");
                }
            });
        });
    }


    d3.queue()
        .defer(d3.json, GEOJSON_DATA_PATH)
        .defer(d3.csv, BUBBLE_MAP_DATA_PATH)
        .defer(d3.csv, DOUGHTNUT_DATA_PATH)
        // .defer(d3.csv, DOUGHTNUT2_DATA_PATH)
        .await(data_ready);


    let createBubbleMap = function(dataGeo, counts_by_region) {
        // The svg
        var svg = d3.select("#bubble_map"),
            width = $("#bubble_map").parent().width(),
            height = $("#bubble_map").parent().height();


        // Map and projection
        var projection = d3.geoMercator()
            .center([0, 25]) // GPS of location to zoom on
            .scale(180) // This is like the zoom
            .translate([width / 2, height / 2]);

        var color = d3.scaleOrdinal(d3.schemeSet3);
        // var color = d3.scaleOrdinal(d3.schemePaired);

        // Add a scale for bubble size
        var valueExtent = d3.extent(counts_by_region, function(d) {
            return +d.value;
        })

        var size = d3.scaleSqrt()
            .domain(valueExtent) // What's in the data
            .range([6, 13]) // Size in pixel


        let bubbleMapMouseOver = function() {
            $('#circle-' + $(this).attr('id').split('-')[1]).toggleClass('hovered');
            $('#map-' + $(this).attr('id').split('-')[1]).toggleClass('hovered');

            $('#by-region div.tooltip').html("Country: " + $(this).attr('title'))
                .css({
                    "left": d3.mouse(this)[0] + $('#bubble_map').offset().left + 10,
                    "top": d3.mouse(this)[1] + $('#bubble_map').offset().top + 10,
                    "opacity": 1,
                    "display": "block"
                });
        }

        let bubbleMapMouseOut = function() {
            $('#map-' + $(this).attr('id').split('-')[1]).toggleClass('hovered');
            $('#circle-' + $(this).attr('id').split('-')[1]).toggleClass('hovered');
            $('#by-region div.tooltip').css({ "opacity": 0, "display": "none" });
        }

        let color_pallete_no = {};
        // Draw the map
        let i = -1;

        svg.append("g")
            .selectAll("path")
            .data(dataGeo.features)
            .enter()
            .append("path")
            // .attr("fill", "#fff")
            .attr("fill", function(d) {
                i += 1;
                color_pallete_no[d.properties.name] = i;
                return color(i);
            })
            .attr("d", d3.geoPath()
                .projection(projection)
            )
            .attr("id", d => "map-" + d.properties.name.replace(' ', '_').toLowerCase())
            .attr("text", d => d.properties.name)
            .attr('title', d => d.properties.name + "<br/>Click here to drill-down")
            .on('mouseover', bubbleMapMouseOver)
            .on('mouseout', bubbleMapMouseOut);



        // Add circles:        
        svg
            .selectAll("myCircles")
            .data(counts_by_region.sort(function(a, b) {
                return +b.value - +a.value;
            }))
            .enter()
            .append("circle")
            .attr("id", d => "circle-" + d.country_name.replace(' ', '_').toLowerCase())
            .attr("cx", function(d) {
                return projection([+d.longitude, +d.latitude])[0];
            })
            .attr("cy", function(d) {
                return projection([+d.longitude, +d.latitude])[1];
            })
            .attr("r", function(d) {
                return size(+d.value);
            })
            .style("fill", function(d) {
                return color(color_pallete_no[d.country_name]);
            })
            .attr("title", d => d.country_name + "<br/>Total videos: " + d.value.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,"))
            .attr("text", d => d.country_name)
            .attr("data-value", d => d.value)
            .on('mouseover', bubbleMapMouseOver)
            .on('mouseout', bubbleMapMouseOut);

        $('svg#bubble_map').prev().fadeOut('slow', function() {
            this.remove();
            $('svg#bubble_map').fadeIn('slow');
        });
    }

    let createDoughnut = function(data, filter = 'Overall') {
        let filtered_data = {},
            others_data;
        $(data).each(function(_, d) {
            if (d.country_name == filter) {
                filtered_data[d.category_title] = d.value;
            }
        });
        others_data = filtered_data['Others'];
        delete(filtered_data['Others']);
        filtered_data['Others'] = others_data;
        data = filtered_data;

        $("#doughnut").empty();
        var svg = d3.select("#doughnut").append("g"),
            width = $("#doughnut").parent().width(),
            height = $("#doughnut").parent().height(),
            radius = (Math.min(width, height) / 2) * 0.6;

        var color = d3.scaleOrdinal(d3.schemeCategory10);

        svg.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

        var pie = d3.pie()
            .value(function(d) {
                return d.value;
            })
            .sort(null);

        var data_ready = pie(d3.entries(data));

        var arc = d3.arc()
            .innerRadius(80) // This is the size of the donut hole
            .outerRadius(radius);

        var outerArc = d3.arc()
            .innerRadius(radius)
            .outerRadius(radius);

        svg
            .selectAll()
            .data(data_ready)
            .enter()
            .append('path')
            .attr('text', d => d.data.key)
            .attr('fill', function(d) {
                return color(d.index);
            })
            .attr('d', arc);

        svg
            .selectAll('allPolylines')
            .data(data_ready)
            .enter()
            .append('polyline')
            .attr('points', function(d) {
                var posA = arc.centroid(d) // line insertion in the slice
                var posB = outerArc.centroid(d) // line break: we use the other arc generator that has been built only for that
                var posC = outerArc.centroid(d); // Label position = almost the same as posB
                var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2 // we need the angle to see if the X position will be at the extreme right or extreme left

                posC[0] = radius * 0.95 * (midangle < Math.PI ? 1 : -1); // multiply by 1 or -1 to put it on the right or on the left
                return [posA, posB, posC]
            });

        svg
            .selectAll('allLabels')
            .data(data_ready)
            .enter()
            .append('text')
            .text(function(d) { return d.data.key + " - " + d.data.value + '%'; })
            .attr('transform', function(d) {
                var pos = outerArc.centroid(d);
                var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2;
                pos[0] = radius * 0.99 * (midangle < Math.PI ? 1 : -1);
                return 'translate(' + pos + ')';
            })
            .style('text-anchor', function(d) {
                var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2
                return (midangle < Math.PI ? 'start' : 'end')
            })
            .style('fill', function(d) {
                return color(d.index);
            });

        svg
            .append("text")
            .attr("class", "doughnut_center")
            .attr('y', 20)
            .text('Overall');

        $('svg#doughnut').prev().fadeOut('show', function() {
            this.remove();
            $('svg#doughnut').show('slide');
        });
    }
});