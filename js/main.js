"use strict";

const GEOJSON_DATA_PATH = './data/filtered_countries.geojson',
    BUBBLE_MAP_DATA_PATH = './data/bubble_map_data.csv',
    DOUGHTNUT_DATA_PATH = "./data/doughnut.csv",
    WORDCLOUD_DATA_PATH = "./data/wordcloud.csv",
    ENGAGEMENT_DATA_PATH = "./data/engagement_data.csv";

const BUBBLE_PLOT = "#bubble_plot",
    BUBBLE_MAP = "#bubble_map",
    WORDCLOUD = "#wordcloud",
    DOUGHNUT = "#doughnut";


$(document).ready(function() {
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


    //taken from https://www.geeksforgeeks.org/how-to-convert-long-number-into-abbreviated-string-in-javascript/
    let convrt = function(val) {
        // thousands, millions, billions etc..
        var s = ["", "k", "m", "b", "t"];

        // dividing the value by 3.
        var sNum = Math.floor(("" + val).length / 3);

        // calculating the precised value.
        var sVal = parseFloat((
            sNum != 0 ? (val / Math.pow(1000, sNum)) : val).toPrecision(2));

        if (sVal % 1 != 0) {
            sVal = sVal.toFixed(1);
        }

        // appending the letter to precised val.
        return sVal + s[sNum];
    }

    let data_ready = function(_, geo_data, bubble_map_data, doughnut_data, wordcloud_data, engagement_data) {
        delete(bubble_map_data['columns']);
        let country_colors = createBubbleMap(geo_data, bubble_map_data);

        delete(doughnut_data['columns']);
        createDoughnut(doughnut_data);

        delete(wordcloud_data['columns']);
        createWordCloud(wordcloud_data);

        delete(engagement_data['columns']);

        createBubblePlot(engagement_data, country_colors);

        $('#bubble_map path, #bubble_map circle').each(function(_, d) {
            $(this).click(function() {
                let path_id = $(this).attr('id').replace('circle', 'map'),
                    circle_id = $(this).attr('id').replace('map', 'circle');

                if ($('#' + path_id).hasClass('highlight')) {
                    $('#bubble_map path').removeClass("faded").removeClass("highlight");
                    $('#bubble_map circle').removeClass("faded").removeClass("highlight");

                    createDoughnut(doughnut_data, "Overall");
                    createWordCloud(wordcloud_data);
                } else {
                    createDoughnut(doughnut_data, $(d).attr("text"));
                    createWordCloud(wordcloud_data, $(d).attr("text"));

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
        .defer(d3.csv, WORDCLOUD_DATA_PATH)
        .defer(d3.csv, ENGAGEMENT_DATA_PATH)
        .await(data_ready);


    let showPlot = function(id, effect = "fade") {
        $('svg' + id).prev().fadeOut('slow', function() {
            this.remove();
            if (effect == "fade") {
                $('svg' + id).fadeIn('slow');
            } else if (effect == "slide") {
                $('svg' + id).show('slide');
            }
        });
    }

    /* WORKING HERE */
    let createBubblePlot = function(data, country_colors, plot_id = BUBBLE_PLOT) {

        let margin = { top: 100, right: 20, bottom: 30, left: 100 };

        data = d3.nest()
            .key(d => d.country_name)
            .rollup(function(v) {
                return {
                    comments: d3.sum(v, d => d.comments),
                    likes: d3.sum(v, d => d.likes),
                    views: d3.sum(v, d => d.views)
                };
            })
            .entries(data);

        var svg = d3.select(plot_id).append("g"),
            width = ($(plot_id).parent().width() - margin.left - margin.right),
            height = ($(plot_id).parent().height() - margin.top - margin.bottom) * 0.6;

        svg.attr("width", $(plot_id).parent().width()).attr("height", $(plot_id).parent().height() * 0.6).attr("transform", "translate(" + margin.left + "," + margin.top + ")");


        // Add X axis
        var x = d3.scaleLinear()
            .domain([1e9, d3.max(data, function(d) {
                return d.value.likes + 1e9;
            })])
            .range([0, width]);

        // X axis labels
        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .attr("color", "#fff")
            .call(d3.axisBottom(x).ticks(5));


        // Add X axis name
        // svg.append("text")
        //     .attr("text-anchor", "end")
        //     .attr("x", width + margin.left)
        //     .attr("y", height + 50 + margin.top)
        //     // .attr('fill', '#fff')
        //     .text("Likes");

        // Add Y axis
        var y = d3.scaleLinear()
            .domain([1e8, d3.max(data, function(d) {
                return d.value.comments + 1e8;
            })])
            .range([height, 0]);

        svg.append("g")
            .call(d3.axisLeft(y).ticks(5));

        // Add Y axis label:
        // svg.append("text")
        //     .attr("text-anchor", "end")
        //     .attr("x", 20)
        //     .attr("y", 50)
        //     .text("Comments")
        //     .attr("text-anchor", "start");
        // .attr("fill", "#fff");


        // Add a scale for bubble size
        var z = d3.scaleSqrt()
            .domain([200000, d3.max(data, function(d) {
                return d.value.views;
            })])
            .range([2, 50]);

        // -1- Create a tooltip div that is hidden by default:
        var tooltip = d3.select(plot_id)
            .append("div")
            .style("opacity", 0)
            .attr("class", "tooltip")
            .style("background-color", "black")
            .style("border-radius", "5px")
            .style("padding", "10px")
            .style("color", "white")

        // -2- Create 3 functions to show / update (when mouse move but stay on same circle) / hide the tooltip
        var showTooltip = function(d) {
            tooltip
                .transition()
                .duration(200)
            tooltip
                .style("opacity", 1)
                .html("Country: " + d.key + "<br/>Likes:" + d.value.likes + "<br/>Comments:" + d.value.comments + "<br/>Views:" + d.value.views)
                .style("left", (d3.mouse(this)[0] + 30) + "px")
                .style("top", (d3.mouse(this)[1] + 30) + "px")
        }
        var moveTooltip = function(d) {
            tooltip
                .style("left", (d3.mouse(this)[0] + 30) + "px")
                .style("top", (d3.mouse(this)[1] + 30) + "px")
        }
        var hideTooltip = function(d) {
            tooltip
                .transition()
                .duration(200)
                .style("opacity", 0)
        }

        svg.append('g')
            .selectAll("dot")
            .data(data)
            .enter()
            .append("circle")
            .attr("class", function(d) { return "bubbles " + d.key })
            .attr("cx", function(d) { return x(d.value.likes); })
            .attr("cy", function(d) { return y(d.value.comments); })
            .attr("r", function(d) { return z(d.value.views); })
            .attr("title", function(d) { return d.value.likes + " " + d.value.comments })
            .style("fill", function(d) { return country_colors[d.key]; })
            // -3- Trigger the functions
            .on("mouseover", showTooltip)
            .on("mousemove", moveTooltip)
            .on("mouseleave", hideTooltip);

        showPlot(plot_id);
    }


    let createBubbleMap = function(dataGeo, counts_by_region, plot_id = BUBBLE_MAP) {
        // The svg
        var svg = d3.select(plot_id),
            width = $(plot_id).parent().width(),
            height = $(plot_id).parent().height();

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
                    "left": d3.mouse(this)[0] + $(plot_id).offset().left + 10,
                    "top": d3.mouse(this)[1] + $(plot_id).offset().top + 10,
                    "opacity": 1,
                    "display": "block"
                });
        }

        let bubbleMapMouseOut = function() {
            $('#map-' + $(this).attr('id').split('-')[1]).toggleClass('hovered');
            $('#circle-' + $(this).attr('id').split('-')[1]).toggleClass('hovered');
            $('#by-region div.tooltip').css({ "opacity": 0, "display": "none" });
        }

        // Draw the map
        let color_pallete_no = {};
        let i = -1;

        svg.append("g")
            .selectAll("path")
            .data(dataGeo.features)
            .enter()
            .append("path")
            // .attr("fill", "#fff")
            .attr("fill", function(d) {
                i += 1;
                color_pallete_no[d.properties.name] = color(i);
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
                return color_pallete_no[d.country_name];
            })
            .attr("title", d => d.country_name + "<br/>Total videos: " + d.value.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,"))
            .attr("text", d => d.country_name)
            .attr("data-value", d => d.value)
            .on('mouseover', bubbleMapMouseOver)
            .on('mouseout', bubbleMapMouseOut);

        showPlot(plot_id);

        return color_pallete_no;
    }

    let createWordCloud = function(data, filter = 'Overall', plot_id = WORDCLOUD) {
        let filtered_data = [];
        // let filtered_data = {};
        $(data).each(function(_, d) {
            if (d.country_name == filter) {
                filtered_data.push({ "text": d.words, "size": d.count });
                // filtered_data[d.words] = d.count;
            }
        });
        data = filtered_data;

        $(plot_id).empty();

        var svg = d3.select(plot_id).append("g"),
            width = $(plot_id).parent().width(),
            height = $(plot_id).parent().height() - 100;


        var color = d3.scaleOrdinal(d3.schemeTableau10);

        var xScale = d3.scaleLinear()
            .domain([0, d3.max(data, function(d) {
                return d.size;
            })])
            .range([0, 18]);

        d3.layout.cloud().size([width, height])
            .timeInterval(20)
            .words(data)
            .fontSize(function(d) { return xScale(+d.size); })
            .text(function(d) { return d.text; })
            .rotate(function() { return ~~(Math.random() * 2) * 90; })
            .font("Impact")
            .on("end", function() {
                svg.attr("transform", "translate(" + [width >> 1, height >> 1] + ")")
                    .selectAll("text")
                    .data(data)
                    .enter().append("text")
                    .style("font-size", function(d) { return d.size + "px"; })
                    .style("font-family", "Impact")
                    .style("fill", function(d, i) { return color(i); })
                    .attr("text-anchor", "middle")
                    .attr("transform", function(d) {
                        return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
                    })
                    .text(function(d) { return d.text; });
            })
            .start();

        d3.layout.cloud().stop();

        showPlot(plot_id);
    }

    let createDoughnut = function(data, filter = 'Overall', plot_id = DOUGHNUT) {
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

        $(plot_id).empty();
        var svg = d3.select(plot_id).append("g"),
            width = $(plot_id).parent().width(),
            height = $(plot_id).parent().height(),
            radius = (Math.min(width, height) / 2) * 0.65;

        // var color = d3.scaleOrdinal(d3.schemeCategory10);
        var color = d3.scaleOrdinal(d3.schemePaired);

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

        showPlot(plot_id, "slide");
    }
});