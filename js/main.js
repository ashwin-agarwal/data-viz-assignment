/*
  Data Exploration Project
  Author: Ashwin Agarwal  
  Date created: 26-May-21
  Last update: 5-Jun-21
*/
// Enable user strict so that undefined variables aren't used
"use strict";

// Define the location for each data file used for visualization
const GEOJSON_DATA_PATH = './data/filtered_countries.geojson',
    BUBBLE_MAP_DATA_PATH = './data/bubble_map_data.csv',
    DOUGHTNUT_DATA_PATH = "./data/doughnut.csv",
    WORDCLOUD_DATA_PATH = "./data/wordcloud.csv",
    BUBBLE_PLOT_DATA_PATH = "./data/bubble_plot_data.csv",
    STACKED_BAR_PLOT_PATH = "./data/stacked_barplot.csv",
    CIRCULAR_BARPLOT_PATH = "./data/circular_barplot.csv",
    LINE_CHART_PATH = "./data/line_chart.csv";

// Define the ID for each visualization 
const BUBBLE_PLOT = "#bubble_plot",
    BUBBLE_MAP = "#bubble_map",
    WORDCLOUD = "#wordcloud",
    DOUGHNUT = "#doughnut",
    STACKED_BARCHART = "#stacked_barchart",
    CIRCULAR_BARPLOT = "#circular_barplot",
    LINE_CHART = "#line_chart";

// Define the colors to be used for categories
const cat_colors = {
    "Entertainment": "#1f77b4",
    "Music": "#ff7f0e",
    "People & Blogs": "#2ca02c",
    "Sports": "#d62728",
    "Gaming": "#9467bd",
    "Comedy": "#8c564b",
    "News & Politics": "#e377c2",
    "Howto & Style": "#7f7f7f",
    "Film & Animation": "#bcbd22",
    "Autos & Vehicles": "#17becf",
    "Science & Technology": "#a6cee3",
    "Pets & Animals": "#1f78b4",
    "Education": "#b2df8a",
    "Travel & Events": "#33a02c",
    "Nonprofits & Activism": "#fb9a99",
    "Others": "#ffff99"

};

// Define the colors to be used for countries
const country_colors = {
    "Brazil": "#3949AB",
    "Canada": "#009900",
    "France": "#6D4C41",
    "Germany": "#FF5733",
    "India": "#D81B60",
    "Japan": "#C70039",
    "Mexico": "#00ACC1",
    "Russia": "#8E24AA",
    "S Korea": "#FF9999",
    "UK": "#4A148C",
    "USA": "#FFB300"
};

// Variable declaration for global variables
let sliderChange, mouseposition = {};

// on document ready
$(document).ready(function() {

    // action to perform when the Fullscreen button is clicked
    $(".btn-fullscreen").click(function() {
        // https://stackoverflow.com/questions/13303151/getting-fullscreen-mode-to-my-browser-using-jquery
        if (!document.fullscreenElement && // alternative standard method
            !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) { // current working methods
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen();
            } else if (document.documentElement.msRequestFullscreen) {
                document.documentElement.msRequestFullscreen();
            } else if (document.documentElement.mozRequestFullScreen) {
                document.documentElement.mozRequestFullScreen();
            } else if (document.documentElement.webkitRequestFullscreen) {
                document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
        }
        // call the read_data() function again so that visualization are loaded as per the new window size
        read_data();
    });

    // observer that keeps a watch on page scroll and change the navigation menu highlight when pages are changed
    var observer = new IntersectionObserver(function(entries) {
        if (entries[0].isIntersecting === true) {
            let target_id = entries[0].target.id;
            $('.nav-link').removeClass('active');
            $("a.nav-link[href='#" + target_id + "']").addClass('active');
            // the following code changes the URL hash as per the section that is selected
            history.pushState(null, null, '#' + target_id);
        }
        // threshold means what percentage of the new page is seen when it should assume that page has changed
    }, { threshold: [0.4] });

    $('main > div').each(function() {
        // observe for each div right under main (which is the main sections - home, by-region, by-engagement, by-channel)
        observer.observe(this);
    });

    // execute this function when data is completely read from the files 
    let data_ready = function(_, geo_data, bubble_map_data, doughnut_data, wordcloud_data, bubble_plot_data, stacked_bar_plot_data, circular_bar_plot_data, line_chart_data) {
        // delete column key from the CSV file
        delete(bubble_map_data['columns']);
        createBubbleMap(geo_data, bubble_map_data); // create bubble map based on the data read

        // delete column key from the CSV file
        delete(doughnut_data['columns']);
        createDoughnut(doughnut_data); // create doughnut based on the data read

        // delete column key from the CSV file
        delete(wordcloud_data['columns']);
        createWordCloud(wordcloud_data); // create word cloud based on the data read

        // delete column key from the CSV file
        delete(bubble_plot_data['columns']);
        createBubblePlot(bubble_plot_data); // create bubble plot based on the data read

        // delete column key from the CSV file
        delete(stacked_bar_plot_data['columns']);
        createStackedBarchart(stacked_bar_plot_data, "Overall"); // create stacked bar chart based on the data read

        // delete column key from the CSV files
        delete(circular_bar_plot_data['columns']);
        delete(line_chart_data['columns']);

        // this section handles interactions in the by-region page
        $('#bubble_map path, #bubble_map circle[id^=circle-],[id^=legend_circle]').each(function(_, d) {
            // define what to do when the bubble map circles or path or legend is clicked
            $(this).click(function() {
                let path_id = $(this).attr('id').replace('legend_circle', 'map').replace('circle', 'map');

                if ($('#' + path_id).hasClass('highlight')) {
                    // if a country is already highlighted and it is clicked, remove the higlight and switch to overall view
                    $('#bubble_map path').removeClass("faded").removeClass("highlight");
                    $('#bubble_map circle').removeClass("faded").removeClass("highlight");

                    // create overall doughnut and word cloud
                    createDoughnut(doughnut_data, "Overall");
                    createWordCloud(wordcloud_data);
                } else {
                    // if the country whuch is not highlighted is clicked, switch to the particular country's view
                    $('#bubble_map path').removeClass("faded").removeClass("highlight");
                    $('#bubble_map circle').removeClass("faded").removeClass("highlight");

                    // create doughnut and word cloud specific to the country
                    createDoughnut(doughnut_data, $(d).attr("text"));
                    createWordCloud(wordcloud_data, $(d).attr("text"));

                    // fade other countries
                    $('#bubble_map path[text!="' + $(d).attr("text") + '"]').addClass("faded");
                    $('#bubble_map circle[id^=circle-]').addClass("faded");
                    $('#bubble_map circle[text="' + $(d).attr("text") + '"]').removeClass("faded");

                    $('text.doughnut_center').html($(d).attr("text"));
                    $('#' + path_id).addClass("highlight");
                }
            });
        });

        $('#bubble_plot circle.bubble, #bubble_plot circle.legend').each(function() {
            // define what to do when the bubble plot circles are clicked 
            $(this).click(function() {
                let circle_text = $(this).attr("text");

                if ($("#bubble_plot circle.bubble[text='" + circle_text + "']").hasClass("highlight")) {
                    // if the bubble that is already highlighted is clicked, then show Overall view
                    $('#bubble_plot circle.bubble').removeClass("faded").removeClass("highlight");
                    createStackedBarchart(stacked_bar_plot_data, "Overall"); // update the stacked barchart
                } else {
                    // If the bubble not already highlighted is clicked, show the country specific view
                    $('#bubble_plot circle.bubble').removeClass("faded").removeClass("highlight");
                    $('#bubble_plot circle.bubble[text="' + $(this).attr('text') + '"]').addClass("highlight");
                    $('#bubble_plot circle.bubble:not(.highlight)').addClass("faded");
                    createStackedBarchart(stacked_bar_plot_data, $(this).attr("text")); // update the stacked barchart
                }
            });
        });

        $('input[name="sort_radio"]').click(function() {
            // define what to do when the radio buttons are clicked
            let country_selected = "Overall";

            if ($("#bubble_plot circle.bubble").hasClass("highlight")) {
                // If a circle or bubble is highlighted, that means country specific view is loaded
                // get the name of the country currently loaded
                country_selected = $("#bubble_plot circle.bubble.highlight").attr("text");
            }
            // updated the stacked bar chart based on sorting criteria
            createStackedBarchart(stacked_bar_plot_data, country_selected);
        });

        let circularBarplotClick = function() {
            // action to perform when the circular bar plot is clicked
            setTimeout(function() {
                // we add set time out here for asynchronous operation
                // create/update the circular barplot and line chart
                createCircularBarPlot(circular_bar_plot_data);
                createLineChart(line_chart_data);

                $('[class^="circular_barplot_"]:not(text)').click(function() {
                    // If barplot is clicked, highlight the barplot and update the line chart
                    $('#circular_barplot .highlight').removeClass("highlight");
                    $('.' + $(this).attr("class").split(' ')[0]).addClass("highlight");

                    createLineChart(line_chart_data); // update the line chart
                });
            }, 10);
        }

        $('input[name="country_select"]').click(function() {
            // action to perform when the countries are selected from the filters
            let not_checked = $('input[name="country_select"]:not(checked)'),
                checked = $('input[name="country_select"]:checked'),
                overall = $('input[value="Overall"]');

            if ($(this).val() == "Overall") {
                // if overall is selected, it should tick all the countries in the list (if not already ticked)
                if ($(this).prop("checked")) {
                    not_checked.prop('checked', true);
                } else {
                    checked.prop('checked', false);
                }
            } else {
                if (overall.prop('checked') && not_checked.length > 0) {
                    overall.prop('checked', false);
                } else if (!overall.prop('checked') && checked.length == 11) {
                    overall.prop('checked', true);
                }

            }
            circularBarplotClick(); // update the circular barplot and the line chart
        });
        // if basis is changed, update circular barplot and line chart
        $('input[name="top_channels"]').click(circularBarplotClick);

        // if the number of channels is changed from the slider, update circular barplot and line chart
        $('#channelN').change(circularBarplotClick);

        sliderChange = function(new_val) {
            // if slider is moved, update the number above the slider and update line chart and circular barplot
            $("#channel_count").text(new_val);
            circularBarplotClick();
        }

        // create circular bar plot and line chart
        circularBarplotClick();
        setTimeout(function() {
            // show the filters slowly when the visualization are ready
            $('.user_interaction *').fadeIn("slow");
            $('.sort_radio').fadeIn("slow");
        }, 1500);

    }


    let read_data = function() {
        // read all the data files here
        d3.queue()
            .defer(d3.json, GEOJSON_DATA_PATH)
            .defer(d3.csv, BUBBLE_MAP_DATA_PATH)
            .defer(d3.csv, DOUGHTNUT_DATA_PATH)
            .defer(d3.csv, WORDCLOUD_DATA_PATH)
            .defer(d3.csv, BUBBLE_PLOT_DATA_PATH)
            .defer(d3.csv, STACKED_BAR_PLOT_PATH)
            .defer(d3.csv, CIRCULAR_BARPLOT_PATH)
            .defer(d3.csv, LINE_CHART_PATH)
            .await(data_ready);
    }
    read_data();


    let showPlot = function(id, effect = "fade") {
        //  helper function to show the plot and remove the loading spinner
        setTimeout(function() {
            $('svg' + id).prev().fadeOut('slow', function() {
                $(this).parent().find('[role="status"]').parent().remove()
                    // this.remove();
                if (effect == "fade") {
                    $('svg' + id).fadeIn('slow');
                } else if (effect == "slide") {
                    $('svg' + id).show('slide');
                }
            });
        }, 1000);
    }

    let formatN = function(n, decimal = 2) {
        // helper function to format the number in billions, millions, and thousands format
        n = parseInt(n);
        if (n >= 1e9) {
            return (n / 1e9).toFixed(decimal) + " B";
        } else if (n >= 1e6) {
            return (n / 1e6).toFixed(decimal) + " M";
        } else if (n >= 1e3) {
            return (n / 1e3).toFixed(decimal) + " K";
        } else {
            return n.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,");
        }
    }

    let createBubbleMap = function(dataGeo, counts_by_region, plot_id = BUBBLE_MAP) {
        // function to create and update bubble map. Snippets taken from: https://www.d3-graph-gallery.com/graph/bubblemap_template.html
        $(plot_id).empty(); // empty the plot

        // define the height and width for the plot
        var svg = d3.select(plot_id),
            width = $(plot_id).parent().width(),
            height = $(plot_id).parent().height();

        // Map and projection
        var projection = d3.geoMercator()
            .scale(width / 2 / Math.PI)
            .rotate([-11, 0])
            .precision(.1)
            .center([0, 45]) // GPS of location to zoom on
            .scale(160) // This is like the zoom
            .translate([width / 2, height / 2]);

        // Scale for bubble size
        var valueExtent = d3.extent(counts_by_region, function(d) {
            return +d.value;
        })

        // Define size of the bubble
        var size = d3.scaleSqrt()
            .domain(valueExtent) // using the extent computed above
            .range([6, 13]) // size in pixels for the bubbles


        let bubbleMapMouseOver = function() {
            // action to perform on bubble mouse over (show tooltip and hover effect on map, circle, and text)
            $('#circle-' + $(this).attr('id').split('-')[1]).toggleClass('hovered');
            $('#map-' + $(this).attr('id').split('-')[1]).toggleClass('hovered');

            $(plot_id + " #legend_circle-" + $(this).attr('id').split('-')[1]).toggleClass('hovered');
            $(plot_id + " #legend_text-" + $(this).attr('id').split('-')[1]).toggleClass('hovered');

            $('div.tooltip').html("<strong>Country:</strong> " + $("#circle-" + $(this).attr('id').split('-')[1]).attr("title"))
                .css({
                    "left": mouseposition.x - 100,
                    "top": mouseposition.y - 120,
                    "opacity": 1,
                    "display": "block"
                });
        }

        let bubbleMapMouseOut = function() {
            // action to perform on bubble mouse out (hide tooltip and hover effect on map, circle, and text)
            $('#map-' + $(this).attr('id').split('-')[1]).toggleClass('hovered');
            $('#circle-' + $(this).attr('id').split('-')[1]).toggleClass('hovered');
            $(plot_id + " #legend_circle-" + $(this).attr('id').split('-')[1]).toggleClass('hovered');
            $(plot_id + " #legend_text-" + $(this).attr('id').split('-')[1]).toggleClass('hovered');
            $('div.tooltip').css({ "opacity": 0, "display": "none" });
        }

        var bubbleMapMouseMove = function(d) {
            // action to perform when mouse moves on the bubble, map, or text (move tooltip as per the mouse)
            $('div.tooltip')
                .css({
                    "left": mouseposition.x - 100,
                    "top": mouseposition.y - 120,
                });
        }

        // Draw the map    
        svg.append("g")
            .selectAll("path")
            .data(dataGeo.features)
            .enter()
            .append("path")
            .attr("fill", function(d) {
                // fill the map as per country colors defined above
                return country_colors[d.properties.name];
            })
            .attr("d", d3.geoPath()
                // use projection defined above
                .projection(projection)
            )
            .attr("id", d => "map-" + d.properties.name.replace(' ', '_').toLowerCase()) // set id for each map
            .attr("text", d => d.properties.name)
            // functions to call on mouseover, mouseout, and mousemove
            .on('mouseover', bubbleMapMouseOver)
            .on('mousemove', bubbleMapMouseMove)
            .on('mouseout', bubbleMapMouseOut);



        // Add bubbles on top of the map  
        svg
            .selectAll("bubbles")
            .data(counts_by_region.sort(function(a, b) {
                return +b.value - +a.value;
            }))
            .enter()
            .append("circle") // add circle
            .attr("id", d => "circle-" + d.country_name.replace(' ', '_').toLowerCase()) // set id for the bubble
            .attr("cx", function(d) {
                return projection([+d.longitude, +d.latitude])[0];
            })
            .attr("cy", function(d) {
                return projection([+d.longitude, +d.latitude])[1];
            })
            .attr("r", function(d) {
                // size of the bubble based on scale defined above
                return size(+d.value);
            })
            .style("fill", function(d) {
                // fill as per country colors specified
                return country_colors[d.country_name];
            })
            // title content is shown as tooltip on mouseover
            .attr("title", d => d.country_name + "<br/><strong>Total videos:</strong> " + formatN(d.value) + "<br/>Click here to drill-down")
            .attr("text", d => d.country_name)
            .attr("data-value", d => d.value)
            // functions to call on mouseover, mouseout, and mousemove
            .on('mouseover', bubbleMapMouseOver)
            .on('mousemove', bubbleMapMouseMove)
            .on('mouseout', bubbleMapMouseOut);

        // Define values for legend for the bubble size
        var valuesToShow = [43000, 47000],
            xCircle = 70,
            xLabel = xCircle + 60,
            yHeight = height - 50;

        // Add circle for the bubble size legend
        svg
            .selectAll("legend")
            .attr("class", "legend")
            .data(valuesToShow)
            .enter()
            .append("circle")
            .attr("cx", xCircle)
            .attr("cy", function(d) { return yHeight - size(d) })
            .attr("r", function(d) { return size(d) })
            .style("fill", "none");

        // Add line for the bubble size legend to connect the text and the circle
        svg
            .selectAll("legend")
            .data(valuesToShow)
            .enter()
            .append("line")
            .attr('x1', function(d) { return xCircle + size(d) })
            .attr('x2', xLabel)
            .attr('y1', function(d) { return yHeight - size(d) })
            .attr('y2', function(d) { return yHeight - size(d) })
            .attr('stroke', 'rgb(180, 180, 180)')
            .style('stroke-dasharray', ('2,2'));

        // Add text next to each bubble in the bubble size legend
        svg
            .selectAll("legend")
            .data(valuesToShow)
            .enter()
            .append("text")
            .attr('x', xLabel + 2)
            .attr('y', function(d) { return yHeight - size(d) })
            .text(function(d) { return formatN(d, 0) })
            .style("font-size", "9px")
            .attr("fill", "rgb(180, 180, 180)")
            .attr('alignment-baseline', 'middle');

        // Add text below the bubble size legend
        svg.append("text")
            .attr('x', xCircle)
            .attr("y", yHeight + 18)
            .attr("fill", "rgb(180, 180, 180)")
            .style("font-size", "12px")
            .text("Total Videos")
            .attr("text-anchor", "middle")

        // Define position for country legends
        var yLegend = height - 70,
            xLegend = width * 0.45;

        // Add circle for each country in the legend
        svg.selectAll(plot_id)
            .data(counts_by_region.sort(function(a, b) {
                return d3.ascending(a.country_name, b.country_name);
            }))
            .enter()
            .append("circle")
            .attr("id", d => "legend_circle-" + d.country_name.replace(" ", "_").toLowerCase())
            .attr("cy", function(d, i) { return yLegend + (25 * Math.floor(i / 6)); })
            .attr("cx", function(d, i) { return xLegend + ((i % 6) * (width / 11)) % width })
            .attr("r", 7)
            .attr("text", d => d.country_name)
            .style("fill", function(d) { return country_colors[d.country_name]; })
            .on("mouseover", bubbleMapMouseOver)
            .on("mouseout", bubbleMapMouseOut);

        // Add text next to the circle in the legend
        svg.selectAll(plot_id)
            .data(counts_by_region)
            .enter()
            .append("text")
            .attr("id", d => "legend_text-" + d.country_name.replace(" ", "_").toLowerCase())
            .attr("y", function(d, i) { return yLegend + (25 * Math.floor(i / 6)) + 2; })
            .attr("x", function(d, i) { return xLegend + 14 + ((i % 6) * (width / 11)) % width })
            .style("fill", function(d) { return country_colors[d.country_name] })
            .attr("text", d => d.country_name)
            .text(function(d) { return d.country_name })
            .style("alignment-baseline", "middle");

        showPlot(plot_id); // show the plot
    }

    let createDoughnut = function(data, filter = 'Overall', plot_id = DOUGHNUT) {
        // function to create doughnut. Snippet taken from: https://www.d3-graph-gallery.com/graph/donut_label.html

        // filter the data as per the country selected in the bubble map. If no country is selected, then we consider "Overall"
        let filtered_data = {},
            others_data;
        $(data).each(function(_, d) {
            if (d.country_name == filter) {
                filtered_data[d.category_title] = d.value;
            }
        });
        // remove others category data from the main data
        others_data = filtered_data['Others'];
        delete(filtered_data['Others']);

        // add it back to the main data. This is done so that the others category appears in the end of the doughnut.
        filtered_data['Others'] = others_data;
        data = filtered_data;

        $(plot_id).empty(); // empty the plot

        // define dimensions for the plot
        var svg = d3.select(plot_id).append("g"),
            width = $(plot_id).parent().width(),
            height = $(plot_id).parent().height(),
            radius = (Math.min(width, height) / 2) * 0.5;

        svg.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

        // create the pie scale for the doughnut
        var pie = d3.pie()
            .value(function(d) {
                return d.value;
            })
            .sort(null);

        // prepare the data as per the pie scale defined above
        var data_ready = pie(d3.entries(data));

        // create the arc by specify the inner and the outer radius
        var arc = d3.arc()
            .innerRadius(60) // This is the size of the donut hole
            .outerRadius(radius);

        // the outer arc is used for adding labels
        var outerArc = d3.arc()
            .innerRadius(radius)
            .outerRadius(radius);

        // create the doughnut chart
        svg
            .selectAll()
            .data(data_ready)
            .enter()
            .append('path')
            .attr('text', d => d.data.key)
            .attr('fill', function(d) {
                // fill colors as per the category colours defined above
                return cat_colors[d.data.key];
            })
            .attr('d', arc)
            .on("mouseover", function(d) {
                // show tooltip on mouseover with information about the category
                $('div.tooltip').html("<strong>" + $('.doughnut_center').text() + "<br/></strong><strong>" + d.data.key + ":</strong> " + d.data.value + "%")
                    .css({
                        "left": mouseposition.x - 100,
                        "top": mouseposition.y - 100,
                        "opacity": 1,
                        "display": "block"
                    });
            })
            .on("mouseout", function() {
                // hide tooltip on mouseout
                $('div.tooltip').css({ "opacity": 0, "display": "none" });
            })
            .on("mousemove", function() {
                // move tooltip on mousemove
                $('div.tooltip').css({
                    "left": mouseposition.x - 100,
                    "top": mouseposition.y - 100
                });
            });

        // add line on the outside of the doughnut
        svg
            .selectAll('allPolylines')
            .data(data_ready)
            .enter()
            .append('polyline')
            .attr('points', function(d) {
                var posA = arc.centroid(d) // add lines to the slices
                var posB = outerArc.centroid(d) // add line breaks in the outerarc which we created above for this purpose
                var posC = outerArc.centroid(d); // define the label poisitions
                var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2 // angle to see where to place the label

                posC[0] = radius * 0.95 * (midangle < Math.PI ? 1 : -1); // if multiplied by 1, it appears on right. If -1, it appears on left
                return [posA, posB, posC] // return the position
            });

        // Add text to the labels at the end of the line drawn above
        svg
            .selectAll('allLabels')
            .data(data_ready)
            .enter()
            .append('text')
            .text(function(d) { return d.data.key + " - " + d.data.value + '%'; })
            .attr('transform', function(d) {
                // define the position for the text
                var pos = outerArc.centroid(d);
                var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2;
                pos[0] = radius * 0.99 * (midangle < Math.PI ? 1 : -1);
                return 'translate(' + pos + ')';
            })
            .style('text-anchor', function(d) {
                // define anchor based on the position in which the text should appear. If right, then start. If left, then end.
                var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2
                return (midangle < Math.PI ? 'start' : 'end')
            })
            .style('fill', function(d) {
                // fill category colors
                return cat_colors[d.data.key];
            });

        // Add the country name in the center of the doughnut. Show Overall for all countries.
        svg
            .append("text")
            .attr("class", "doughnut_center")
            .attr('y', 15)
            .text('Overall');

        showPlot(plot_id); // Show the plot
    }

    let createWordCloud = function(data, filter = 'Overall', plot_id = WORDCLOUD) {
        // function to create word cloud. Snippet taken from: http://bl.ocks.org/joews/9697914

        // arrange the data in a certain format
        let filtered_data = [];
        $(data).each(function(_, d) {
            if (d.country_name == filter) {
                filtered_data.push({ "text": d.words, "size": d.count });
            }
        });
        data = filtered_data;

        $(plot_id).empty(); // empty the plot

        // specify the dimensions and variables for the visualization
        var svg = d3.select(plot_id).append("g"),
            width = $(plot_id).parent().width() * 0.9,
            height = $(plot_id).parent().height() * 0.9;

        // define the color scheme for the word cloud
        var color = d3.scaleOrdinal(d3.schemeTableau10);

        // define the scale for the word cloud (the maximum occurence of word takes the biggest size and vice versa)
        var xScale = d3.scaleLinear()
            .domain([0, d3.max(data, function(d) {
                return d.size;
            })])
            .range([5, 25]);

        // create the layout for the D3 word cloud
        d3.layout.cloud().size([width, height])
            .timeInterval(20)
            .words(data)
            .fontSize(function(d) { return xScale(+d.size); })
            .text(function(d) { return d.text; })
            .rotate(function() { return ~~(Math.random() * 2) * 90; })
            .font("Impact") // use impact font
            .on("end", function() {
                svg.attr("transform", "translate(" + [width >> 1, height >> 1] + ")")
                    .selectAll("text")
                    .data(data)
                    .enter().append("text") // adding text for the word cloud
                    .style("font-size", function(d) { return d.size + "px"; })
                    .style("font-family", "Impact")
                    .style("fill", function(d, i) { return color(i); })
                    .attr("text-anchor", "middle")
                    .attr("transform", function(d) {
                        return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
                    })
                    .text(function(d) { return d.text; })
                    .on("mouseover", function(d) {
                        // show tooltip on mouseover
                        $('div.tooltip').html("<strong><div class='text-center'>" + d.text + "</div>")
                            .css({
                                "left": mouseposition.x - 100,
                                "top": mouseposition.y - 80,
                                "opacity": 1,
                                "display": "block"
                            });
                    })
                    .on("mouseout", function() {
                        // hide tooltip on mouse out
                        $('div.tooltip').css({ "opacity": 0, "display": "none" });
                    })
                    .on("mousemove", function() {
                        // mouse tooltip when mouse is moved on the word cloud
                        $('div.tooltip').css({
                            "left": mouseposition.x - 100,
                            "top": mouseposition.y - 80
                        });
                    });
            })
            .start(); // start making the layout

        d3.layout.cloud().stop(); // stop making the layout

        showPlot(plot_id); // show the plot
    }

    let createBubblePlot = function(data, plot_id = BUBBLE_PLOT) {
        // code to create and update the bubble plot. Snippets taken from: https://www.d3-graph-gallery.com/graph/bubble_template.html
        let margin = { top: 50, right: 20, bottom: 30, left: 100 };

        // data arrange in a certain format for bubble plot
        let filtered_data = [];
        data = $(data).each(function(_, d) {
            filtered_data.push({
                key: d.country_name,
                value: {
                    comments: Math.round(d.comments),
                    likes: Math.round(d.likes),
                    dislikes: Math.round(d.dislikes),
                    views: Math.round(d.views),
                    likes_dislikes: Math.round(d.likes_dislikes)
                }
            });
        });
        data = filtered_data;

        $(plot_id).empty(); // emtpy the plot

        // set the dimensions for the plot. The height of the bubble plot is set to 70% of the available space. The space below is used for legend.
        var svg = d3.select(plot_id).append("g"),
            width = ($(plot_id).parent().width() - margin.left - margin.right),
            height = ($(plot_id).parent().height() - margin.top - margin.bottom) * 0.7;

        // transform the width the height
        svg.attr("width", $(plot_id).parent().width()).attr("height", $(plot_id).parent().height() * 0.8).attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        // Add X axis
        var x = d3.scaleLinear()
            .domain([36e3, d3.max(data, function(d) {
                // we increase the domain a little bit so that the bubbles do not cut out
                return d.value.likes_dislikes + 2e4;
            })])
            .range([0, width]);

        // X axis labels
        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x).ticks(5).tickFormat(d => formatN(d, 0))); // we format the tick values

        // Add X axis name
        svg.append("text")
            .attr("text-anchor", "end")
            .attr("x", width)
            .attr("y", height + 45)
            .style("font-size", "18px")
            .style("fill", "rgb(180, 180, 180)")
            .text("Average Likes + Dislikes");

        // Add Y axis
        var y = d3.scaleLinear()
            .domain([36e2, d3.max(data, function(d) {
                // we increase the domain a little bit so that the bubbles do not cut out
                return d.value.comments + 2e3;
            })])
            .range([height, 0]);

        // Add Y axis labels
        svg.append("g")
            .call(d3.axisLeft(y).ticks(5).tickFormat(d => formatN(d, 0))); // we format the tick values

        // Add Y axis name
        svg.append("text")
            .attr("x", 10)
            .attr("y", 0)
            .html("Average Comments")
            .style("font-size", "18px")
            .attr("text-anchor", "start");

        // Add a scale for bubble size
        var z = d3.scaleSqrt()
            .domain([1, d3.max(data, function(d) {
                return d.value.views;
            })])
            .range([10, 38]);

        var bubblePlotMouseOver = function(d) {
            // this function defines the action that should take place on bubble plot mouse over (show tool and hover effect)
            $('div.tooltip')
                .html("<strong>" + d.key + "</strong><br/><strong>Views:</strong> " + formatN(d.value.views) + "<br/><strong>Likes:</strong> " + formatN(d.value.likes) + "<br/><strong>Dislikes:</strong> " + formatN(d.value.dislikes) + "<br/><strong>Comments:</strong> " + formatN(d.value.comments) + "<br/>Click to drill-down.")
                .css({
                    "left": d3.mouse(this)[0] + $(plot_id).offset().left + 130,
                    "top": d3.mouse(this)[1] + $(plot_id).offset().top + 10,
                    "opacity": 1,
                    "display": "block"
                });

            $("#bubble_plot [text='" + $(this).attr("text") + "']").toggleClass("hovered"); // adding the hover class to other related elements
        }
        var bubblePlotMouseOut = function(d) {
            // this function defines the action that should take place when mouse is out the bubble plot (hide tooltip and hover effect)
            $('div.tooltip').css({ "opacity": 0, "display": "none" });
            $("#bubble_plot [text='" + $(this).attr("text") + "']").toggleClass("hovered");
        }

        var bubblePlotMouseMove = function(d) {
            // this function defines the actions that should take place when mouse is moving on the bubble plot (move tooltip)
            $('div.tooltip')
                .css({
                    "left": d3.mouse(this)[0] + $(plot_id).offset().left + 130,
                    "top": d3.mouse(this)[1] + $(plot_id).offset().top + 10
                });
        }

        // create the bubble plot
        svg.append("g")
            .selectAll("dot")
            .data(data.sort(function(a, b) {
                return d3.ascending(b.key, a.key);
            }))
            .enter()
            .append("circle")
            .attr("class", "bubble")
            //show likes + dislikes in X-axis, comments in Y-axis, and views in Z-axis
            .attr("cx", function(d) { return x(d.value.likes_dislikes); })
            .attr("cy", function(d) { return y(d.value.comments); })
            .attr("r", function(d) { return z(d.value.views); })
            .attr("title", function(d) { return d.value.likes_dislikes + " " + d.value.comments })
            .attr("text", function(d) { return d.key })
            .style("fill", function(d) { return country_colors[d.key]; })
            // trigger the mouseover, mouseout, and mousemove functions        
            .on("mouseover", bubblePlotMouseOver)
            .on("mousemove", bubblePlotMouseMove)
            .on("mouseout", bubblePlotMouseOut);


        // Define boundaries for legends
        var valuesToShow = [5e5, 30e5],
            xCircle = width - 85,
            xLabel = xCircle + 60,
            yHeight = height - 80;

        // Add legend: two circles to indicate size of views
        svg
            .selectAll("legend")
            .data(valuesToShow)
            .enter()
            .append("circle")
            .attr("cx", xCircle)
            .attr("cy", function(d) { return yHeight - z(d) })
            .attr("r", function(d) { return z(d) })
            .attr("stroke", "rgb(180, 180, 180)")
            .style("fill", "none");

        // Add legend: circle line for views pointing towards the text
        svg
            .selectAll("legend")
            .data(valuesToShow)
            .enter()
            .append("line")
            .attr('x1', function(d) { return xCircle + z(d) })
            .attr('x2', xLabel)
            .attr('y1', function(d) { return yHeight - z(d) })
            .attr('y2', function(d) { return yHeight - z(d) })
            .attr('stroke', "rgb(180, 180, 180)")
            .style('stroke-dasharray', ('2,2'));

        // Add legend: text for circles
        svg
            .selectAll("legend")
            .data(valuesToShow)
            .enter()
            .append("text")
            .attr('x', xLabel + 2)
            .attr('y', function(d) { return yHeight - z(d) })
            .text(function(d) { return formatN(d, 0) })
            .style("font-size", 10)
            .attr('alignment-baseline', 'middle');

        // Add legend: Text below circle legend
        svg.append("text")
            .attr('x', xCircle)
            .attr("y", yHeight + 30)
            .style("fill", "rgb(180, 180, 180)")
            .text("Views")
            .attr("text-anchor", "middle")


        // country legend circles
        var yLegend = height + 70;
        svg.selectAll(plot_id)
            .data(data.sort(function(a, b) {
                return d3.ascending(a.key, b.key);
            }))
            .enter()
            .append("circle")
            .attr("class", "legend")
            .attr("text", d => d.key)
            .attr("cy", function(d, i) { return yLegend + (Math.floor(i / 6) * 30); })
            .attr("cx", function(d, i) { return ((i % 6) * (width / 6) * 1.05) % width })
            .attr("r", 7)
            .style("fill", function(d) { return country_colors[d.key]; })
            // added mouse over effect on the legend circles for country
            .on("mouseover", bubblePlotMouseOver)
            .on("mouseout", bubblePlotMouseOut);

        // country legend text
        svg.selectAll(plot_id)
            .data(data)
            .enter()
            .append("text")
            .attr("class", "legend")
            .attr("y", function(d, i) { return yLegend + (Math.floor(i / 6) * 30) + 2; })
            .attr("x", function(d, i) { return 14 + ((i % 6) * (width / 6) * 1.05) % width })
            .style("fill", function(d) { return country_colors[d.key] })
            .attr("text", d => d.key)
            .text(function(d) { return d.key })
            .attr("text-anchor", "left")
            .style("alignment-baseline", "middle");

        showPlot(plot_id); // show the plot
    }

    let createStackedBarchart = function(data, filter = "Overall", plot_id = STACKED_BARCHART) {
        // code to create and update stacked barchart. Snippets taken from: https://www.d3-graph-gallery.com/graph/barplot_stacked_percent.html
        let margin = { top: 26, right: 60, bottom: 30, left: 210 };
        let sort_col = $('input[name="sort_radio"]:checked').val();

        // filter the data based on the country selected in the bubble plot
        data = data.filter(d => d.country_name == filter);

        $(plot_id).empty(); // empty the plot

        // set the width and height for the visualization. Height is set to 70% of the entire available space.
        var width = ($(plot_id).parent().width() - margin.left - margin.right),
            height = ($(plot_id).parent().height() - margin.top - margin.bottom) * 0.7,
            svg = d3.select(plot_id)
            .append("g")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

        // define the subgroups for the line chart
        var subgroups = ["likes", "comments", "dislikes"];

        // sort the data based on the sort column selected in the radio button
        data = data.sort(function(a, b) {
            return +b[sort_col] - +a[sort_col];
        });

        // get the category titles
        var groups = d3.map(data, function(d) {
            return (d.category_title);
        }).keys();

        // Add X axis
        var x = d3.scaleLinear()
            .domain([0, 100])
            .range([0, width]);
        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x));

        // Add Y axis
        var y = d3.scaleBand()
            .domain(groups)
            .range([0, height])
            .padding([0.2]);
        svg.append("g")
            .call(d3.axisLeft(y).tickSizeOuter(0));

        // color palette = one color per subgroup
        var color = d3.scaleOrdinal()
            .domain(subgroups)
            .range(['#7efe00', '#00fefe', '#fa0000']);

        //stack the data per group
        var stackedData = d3.stack()
            .keys(subgroups)
            (data);

        var stackedBarChartMouseOver = function(d) {
            // action to perform on stacked bar chart mouseover (show tooltip and hover effect)
            $('div.tooltip')
                .html(function() {
                    return "<strong>" + d.data.category_title + "</strong><br/><strong>Views:</strong> " + formatN(d.data.views) + " <br/><strong>Engagement rate:</strong> " + d.data.engagement_rate + "%<br/><strong>Likes:</strong> " + d.data.likes + "%<br/><strong>Comments:</strong> " + d.data.comments + "%<br/><strong>Dislikes:</strong> " + d.data.dislikes + "%";
                })
                .css({
                    "left": d3.mouse(this)[0] + $(plot_id).offset().left + 100,
                    "top": d3.mouse(this)[1] + $(plot_id).offset().top - 140,
                    "opacity": 1,
                    "display": "block"
                });
        }

        var stackedBarChartMouseOut = function() {
            // action to perform on stacked bar chart mouse out (hide tooltip and hover effect)     
            $('div.tooltip').css({ "opacity": 0, "display": "none" });
        };

        var stackedBarChartMouseMove = function(d) {
            // action to perform when mouse is moved on the stacked bar chart (move tooltip)
            $('div.tooltip')
                .css({
                    "left": d3.mouse(this)[0] + $(plot_id).offset().left + 100,
                    "top": d3.mouse(this)[1] + $(plot_id).offset().top - 140
                });
        }

        // Show the bars
        svg.append("g")
            .selectAll("g")
            .data(stackedData) // entering stacked data
            .enter().append("g")
            .attr("fill", function(d) { return color(d.key); }) // set colors defined above
            .selectAll("rect")
            .data(function(d) { return d; }) // read sub group data
            .enter().append("rect") // create rectangles for the bar
            .attr("x", function(d) { return x(d[0]); })
            .attr("y", function(d) { return y(d.data.category_title); })
            .attr("width", function(d) { return x(d[1]) - x(d[0]); })
            .attr("height", y.bandwidth())
            .on("mouseover", stackedBarChartMouseOver)
            .on("mousemove", stackedBarChartMouseMove)
            .on("mouseout", stackedBarChartMouseOut);


        // Add legend circle for likes, dislikes, comments
        var yLegend = height + 70;
        svg.selectAll(plot_id)
            .data(subgroups)
            .enter()
            .append("circle")
            .attr("cy", yLegend)
            .attr("cx", function(d, i) { return (i * 150); })
            .attr("r", 7)
            .style("fill", (_, i) => color(i));

        // Add legend text for likes, dislikes, comments
        svg.selectAll(plot_id)
            .data(subgroups)
            .enter()
            .append("text")
            .attr("y", yLegend + 2)
            .attr("x", function(d, i) { return 14 + (i * 150); })
            .text(function(d) { return d.charAt().toUpperCase() + d.slice(1) })
            .style("fill", (_, i) => color(i))
            .attr("text-anchor", "center")
            .style("alignment-baseline", "middle");

        // Add X axis name
        svg.append("text")
            .attr("text-anchor", "end")
            .attr("x", width)
            .attr("y", height + 45)
            .style("font-size", "18px")
            .style("fill", "rgb(180, 180, 180)")
            .text("Engagement %");


        // Add country name to the chart
        svg.append("text")
            .attr("text-anchor", "end")
            .attr("x", width)
            .attr("y", 0)
            .style("font-size", "22px")
            .style("fill", "#fff")
            .text(filter);

        showPlot(plot_id); // show the plot and hide the loading spinner
    }

    let createCircularBarPlot = function(data, plot_id = CIRCULAR_BARPLOT) {
        // this function creates and updates the circular barplot. Snippets taken from: https://www.d3-graph-gallery.com/graph/circular_barplot_double.html

        let sort_col = $('input[name="top_channels"]:checked').val(); // the column to sort on (views or videos)
        let other_col = (sort_col == "views") ? "videos" : "views"; // the other column (not the sort column)

        // defining the color schema
        var color = (d3.schemeCategory10 + ',' + d3.schemePaired + ',' + d3.schemeDark2 + ',' + d3.schemeTableau10 + ',' + d3.schemeAccent + ',' + d3.schemeSet2 + ' ' + d3.schemeSet3 + ',' + d3.schemePastel1 + ',' + d3.schemePastel2 + ' ' + d3.schemeSet3 + ',' + d3.schemePastel1 + ',' + d3.schemePastel2).split(',');

        // Removing colors I wish to exclude from the color scheme
        color.splice(83, 1);
        color.splice(55, 1);
        color.splice(45, 1);
        color.splice(15, 1);
        color.splice(3, 1);

        $(plot_id).empty(); // emptying the plot to remove anything it contains

        // setting width to 90% of the available area
        var width = ($(plot_id).parent().width()) * 0.9,
            height = ($(plot_id).parent().height()) * 0.9,
            innerRadius = 130,
            outerRadius = (Math.min(width, height) / 2) * 0.8,
            svg = d3.select(plot_id)
            .append("g")
            .attr("width", width)
            .attr("height", height)
            .attr("transform", "translate(" + (width / 2) + "," + ((height + 30) / 2) + ")");

        // getting country name selected in the filter
        let filter = [];
        $('input[name="country_select"]:checked').each(function(d) {
            filter.push($(this).val());
        });

        // filtering the data based on countries selected in the filter
        data = data.filter(function(d) {
            if ($.inArray(d.country_name, filter) >= 0) {
                return d;
            }
        });

        // grouping the data and finding total views and videos. Getting topN channels based on the slider.
        data = d3.nest()
            .key(function(d) { return d.channel_title; })
            .rollup(function(v) {
                return {
                    videos: d3.sum(v, function(d) { return d.videos; }),
                    views: d3.sum(v, function(d) { return d.views; })
                };
            })
            .entries(data)
            .sort(function(a, b) {
                return +b.value[other_col] - +a.value[other_col];
            })
            .sort(function(a, b) {
                return +b.value[sort_col] - +a.value[sort_col];
            }).slice(0, $('#channelN').val());

        // If data is empty, then show the message below   
        if (data.length == 0) {
            svg.append("text").attr("x", -120).attr("y", 0).text("Please select at least one country").attr("fill", "rgb(180, 180, 180)");
            return;
        }

        // X scale: common for both data series
        var x = d3.scaleBand()
            .range([0, 2 * Math.PI]) // X axis goes from 0 to 2pi for full circular bar plot
            .align(0)
            .domain(data.map(function(d) { return d.key; })); // The domain of the X axis

        // First barplot series (views by default)
        var y = d3.scaleRadial()
            .range([innerRadius, outerRadius])
            .domain([d3.min(data, function(d) {
                return d.value[sort_col] * 0.6;
            }), d3.max(data, function(d) {
                return d.value[sort_col];
            })]); // minimum value of the column selected is the minimum domain, the maximum domain is the maximum value

        // Second barplot Scales (videos by default)
        var ybis = d3.scaleRadial()
            .range([innerRadius, 5])
            .domain([d3.min(data, function(d) {
                return d.value[other_col] * 0.5;
            }), d3.max(data, function(d) {
                return d.value[other_col];
            })]); // minimum value of the column not selected is the minimum domain, and maximum value maximum domain

        let barplotMouseOver = function(d) {
            // action to perform on mouse over (such as show tooltip and hover effect)
            $("." + $(this).attr("class")).toggleClass("hovered");
            $('div.tooltip')
                .html(function() {
                    if (sort_col == "views") {
                        return "<strong>" + d.key + "</strong><br/><strong>Views:</strong> " + formatN(d.value.views) + " <br/><strong>Videos:</strong> " + d.value.videos;
                    } else {
                        return "<strong>" + d.key + "</strong><br/><strong>Videos:</strong> " + d.value.videos + " <br/><strong>Views:</strong> " + formatN(d.value.views);
                    }
                })
                .css({
                    "left": mouseposition.x - 100,
                    "top": mouseposition.y - 150,
                    "opacity": 1,
                    "display": "block"
                });
        }

        let barplotMouseMove = function(d) {
            // action to perform when mouse moves in the barplot (i.e. move tooltip)
            $('div.tooltip')
                .css({
                    "left": mouseposition.x - 100,
                    "top": mouseposition.y - 150
                });
        }

        let barplotMouseOut = function() {
            // action to perform when the mouse is taken outside the barplot (i.e. remove tooltip and hide hover effect)
            $(plot_id + " .hovered").removeClass("hovered");
            $('div.tooltip').css({ "opacity": 0, "display": "none" });
        }

        // Add the bars (views by default)
        svg.append("g")
            .selectAll("path")
            .data(data)
            .enter()
            .append("path")
            .attr("fill", "#69b3a2")
            .attr("class", function(_, i) {
                return "circular_barplot_" + i;
            })
            .attr("fill", function(_, i) {
                return color[i];
            })
            .attr("d", d3.arc() // similar to doughnut plot
                .innerRadius(innerRadius)
                .outerRadius(function(d) { return y(d.value[sort_col]); })
                .startAngle(function(d) { return x(d.key); })
                .endAngle(function(d) { return x(d.key) + x.bandwidth(); })
                .padAngle(0.01)
                .padRadius(innerRadius))
            .on("mouseover", barplotMouseOver)
            .on("mousemove", barplotMouseMove)
            .on("mouseout", barplotMouseOut);


        // Add the second series (videos by default)
        svg.append("g")
            .selectAll("path")
            .data(data)
            .enter()
            .append("path")
            .attr("fill", "red")
            .attr("class", function(_, i) {
                return "circular_barplot_" + i;
            })
            .attr("d", d3.arc() // similar to doughnut plot
                .innerRadius(function(d) { return ybis(0) })
                .outerRadius(function(d) {
                    return ybis(d.value[other_col]);
                })
                .startAngle(function(d) { return x(d.key); })
                .endAngle(function(d) { return x(d.key) + x.bandwidth(); })
                .padAngle(0.01)
                .padRadius(innerRadius))
            .on("mouseover", barplotMouseOver)
            .on("mousemove", barplotMouseMove)
            .on("mouseout", barplotMouseOut);

        // Add the labels (channel names)
        svg.append("g")
            .selectAll("g")
            .data(data)
            .enter()
            .append("g")
            .attr("text-anchor", function(d) { return (x(d.key) + x.bandwidth() / 2 + Math.PI) % (2 * Math.PI) < Math.PI ? "end" : "start"; })
            .attr("transform", function(d) { return "rotate(" + ((x(d.key) + x.bandwidth() / 2) * 180 / Math.PI - 90) + ")" + "translate(" + (y(d.value[sort_col]) + 10) + ",0)"; })
            .append("text")
            .attr("fill", function(_, i) {
                return color[i];
            })
            .attr("class", function(_, i) {
                return "circular_barplot_" + i;
            })
            .text(function(d) {
                if (d.key.length > 16) {
                    return (d.key.substring(0, 13) + "...");
                }
                return d.key;
            })
            .attr("title", d => d.key)
            .attr("transform", function(d) { return (x(d.key) + x.bandwidth() / 2 + Math.PI) % (2 * Math.PI) < Math.PI ? "rotate(180)" : "rotate(0)"; })
            .style("font-size", "12px")
            .attr("alignment-baseline", "middle")
            .on("mouseover", barplotMouseOver)
            .on("mousemove", barplotMouseMove)
            .on("mouseout", barplotMouseOut);

        // show the plot
        showPlot(plot_id);
    }

    let createLineChart = function(data, plot_id = LINE_CHART) {
        // code to create and update the line chart. Snippets reused from: https://www.d3-graph-gallery.com/graph/line_several_group.html
        let margin = { top: 60, left: 100 },
            sort_col = $('input[name="top_channels"]:checked').val();

        $(plot_id).empty(); // empty the plot if it contains anything

        // set the width and height to 75% of available space
        var width = ($(plot_id).parent().width()) * 0.75,
            height = ($(plot_id).parent().height()) * 0.65,
            svg = d3.select(plot_id)
            .append("g")
            .attr("width", width)
            .attr("height", height)
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        // highlight the first entry in the circular barplot
        if ($('#circular_barplot .highlight').length == 0) {
            $('.circular_barplot_0').addClass("highlight");
        }

        // get channel name clicked
        let channel_name = $('#circular_barplot text.highlight').attr("title");

        let filter = [];
        // get all filtered selected for country
        $('input[name="country_select"]:checked').each(function(d) {
            filter.push($(this).val());
        });

        if (filter.length == 0) {
            // if no country is selected, show a message
            svg.append("text").attr("x", margin.left).attr("y", (height + margin.top) / 2).text("Please select at least one country").attr("fill", "rgb(180, 180, 180)");
            return;
        }

        data = data.filter(function(d) {
            // filter the data
            if ($.inArray(d.country_name, filter) >= 0 && d.channel_title === channel_name) {
                return d;
            }
        });

        // group the data by category and trending data
        data = d3.nest()
            .key(function(d) { return [d.category_title, d.trending_date]; })
            .rollup(function(v) {
                return {
                    category_title: v[0].category_title,
                    trending_date: v[0].trending_date,
                    videos: d3.sum(v, function(d) { return d.videos; }),
                    views: d3.sum(v, function(d) { return d.views; })
                };
            })
            .entries(data);

        // prepare the data in a certain format
        let filtered_data = [];
        $(data).each(function(_, d) {
            filtered_data.push({
                category_title: d.value.category_title,
                x_axis: d3.timeParse("%Y-%m-%d")(d.value['trending_date']),
                y_axis: d.value[sort_col]
            });
        })

        data = filtered_data;

        // Add X axis in date format
        var xScale = d3.scaleTime()
            .domain(d3.extent(data, d => d.x_axis)).range([0, width]);

        // Add X axis labels for each value
        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .attr("class", "axis")
            .call(d3.axisBottom(xScale).tickFormat(function(d) {
                // define the format the value of the X-axis ticks
                return d3.timeFormat("%d")(d).substring(0, 3) + "-" + d3.timeFormat("%B")(d).substring(0, 3) + "-" + d3.timeFormat("%Y")(d).substring(2, 4);
            }).ticks(5))
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-65)");

        // Add Y axis
        var yScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => +d.y_axis)])
            .range([height, 0]);

        // Add Y-axis labels for each value
        svg.append("g")
            .attr("class", "axis")
            .call(d3.axisLeft(yScale).tickFormat(function(d) {
                // define the format of the Y-axis ticks
                return formatN(d, 1);
            }).ticks(5));

        // get all category names for the clicked channel
        var groups = Array.from(new Set(data.map(function(d) { return d.category_title }))) // list of group names        

        // transform data in key value format
        data = d3.nest().key(d => d.category_title).entries(data);

        // Draw the line
        svg.selectAll(".line")
            .append("g")
            .data(data)
            .enter()
            .append("path")
            .attr("fill", "none")
            .attr("stroke-width", 2.5)
            .attr("stroke", function(d) {
                // use the category colors defined
                return cat_colors[d.key];
            })
            .attr("d", function(d) {
                // draw the line here
                return d3.line()
                    .x(d => xScale(d.x_axis))
                    .y(d => yScale(d.y_axis)).curve(d3.curveBasis)
                    (d.values.sort(function(a, b) {
                        return b.x_axis - a.x_axis;
                    }))
            });

        // Add channel name to the top of the visualization
        svg.append("text")
            .attr("text-anchor", "start")
            .attr("x", 0)
            .attr("y", -35)
            .style("font-size", "22px")
            .style("fill", "#fff")
            .text(channel_name);

        // Add legend circle below the channel name
        var yLegend = -14;
        svg.selectAll(plot_id)
            .data(groups)
            .enter()
            .append("circle")
            .attr("cy", yLegend)
            .attr("cx", function(d, i) { return 6 + (i * 180); })
            .attr("r", 7)
            .style("fill", d => cat_colors[d]);

        // Add legend text next to the legend circle
        svg.selectAll(plot_id)
            .data(groups)
            .enter()
            .append("text")
            .attr("y", yLegend)
            .attr("x", function(d, i) { return 16 + (i * 180); })
            .text(function(d) { return d.charAt().toUpperCase() + d.slice(1) })
            .style("fill", (d) => cat_colors[d])
            .attr("text-anchor", "center")
            .style("alignment-baseline", "middle");

        // Add X axis name
        svg.append("text")
            .attr("text-anchor", "end")
            .attr("x", width)
            .attr("y", height + 105)
            .style("font-size", "18px")
            .style("fill", "rgb(180, 180, 180)")
            .text("Trending date");

        // Add Y axis name
        svg.append("text")
            .attr("text-anchor", "end")
            .attr("x", -14)
            .attr("y", -8)
            .style("font-size", "18px")
            .style("fill", "rgb(180, 180, 180)")
            .text(sort_col.charAt().toUpperCase() + sort_col.slice(1));

        // show the plot using this helper function
        showPlot(plot_id);
    }

    $("#pageLoadModal").modal('show'); // Show modal window on page load

    $('.modal button').click(function() {
        // hide modal window on clicking any button in the modal window
        $(".modal").modal('hide');
    });

    // select the default navigation item based on the hash value in the URL
    // if #home select, Home in the top nav and so on
    $("a.nav-link[href='" + window.location.hash + "']").addClass('active');

    $(document).mousemove(function(event) {
        // captures the current position of the mouse in the document and stores it in the mouseposition variable
        mouseposition.x = event.pageX;
        mouseposition.y = event.pageY;
    });

    $('.interesting-insights').on("mouseover", function() {
        // show tooltip when the "Did you notice?" button is hovered
        $('.bulb').addClass('hovered');
        $('div.tooltip').html("<div class='text-center'>Click here for interesting insights</div>")
            .css({
                "left": mouseposition.x - 100,
                "top": mouseposition.y - 100,
                "opacity": 1,
                "display": "block"
            });
    }).on("mousemove", function() {
        // move tooltip when the mouse moves on the "Did you notice?" button
        $('div.tooltip')
            .css({
                "left": mouseposition.x - 100,
                "top": mouseposition.y - 100
            });
    }).on("mouseout", function() {
        // hide tooltip when mouse leaves the "Did you notice?" button
        $('.bulb').removeClass('hovered');
        $('div.tooltip').css({ "opacity": 0, "display": "none" });
    }).on("click", function() {
        // action to perform when "Did you notice?" button is clicked
        let modal_body = [`
        <ul>
            <li>Russia is the only country that has "News & Politics" in the top three trending categories. All other countries have "Entertainment" and "Music" in the top three.</li>
            <li>While comedy videos may not be high in number, the word cloud suggests that every country loves to laugh. We see that "Comedy" and "Funny" are the prominent keywords in the overall word cloud.</li>
            <li>There are equal number of trending videos for all 11 countries, which means that each country contributes equal data to the analysis and visualization.</li>
        </ul>`, `
        <ul>
            <li>We can see that as views (bubble size) increase, the likes/comments also increase almost linearly. This shows a clear correlation between likes, views, and comments.</li>
            <li>"News & Politics" are most disliked and commented categories in all of these countries. If a "News & Politics" category video trends, it is mostly because the video is talking about something really good or something ridiculously bad.</li>
            <li>In all countries, except Japan, "Music" videos have the highest views. Japan is the only country where the most viewed category is "Science & Technology".</li>
            <li>People engage more in "Music" and "Comedy" videos. If a content creator is looking to target higher engagement videos, they should advertise in these categories.</li>
        </ul>`, `
        <ul>
            <li>Most channels with higher views are producing "Music" videos. World recognized artists such as Cardi B, DJ Khaled, BlackEyedPeas etc have higher views overall, and trend in most of these countries.</li>
            <li>Basis the number of trending videos, channels like ColorsTV, Vijay Television, Sports Channels, etc that produce daily entertainment and sports videos trend more. Overall they have more trending videos, but at a given time, they have only 5-10 videos (as per the line chart).</li>
            <li>If a content creator is looking to tie up with channels that have more views, they should go with top music channels. However, if advertisement to the same set of people is the focus, then they could consider "Entertainment" and "Sports" category. This visualization makes it easy for content creators to identify the channels they should target based on their requirement.</li>
        </ul>`];

        // replace the text in the modal window as per the button clicked. If 1st button click, then show first content and so on.
        $('#insights .modal-body').html(modal_body[$(this).attr("data-index")]);

        $("#insights").modal('show'); // show the modal window
    });
});