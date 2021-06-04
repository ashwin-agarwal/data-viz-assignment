"use strict";

const GEOJSON_DATA_PATH = './data/filtered_countries.geojson',
    BUBBLE_MAP_DATA_PATH = './data/bubble_map_data.csv',
    DOUGHTNUT_DATA_PATH = "./data/doughnut.csv",
    WORDCLOUD_DATA_PATH = "./data/wordcloud.csv",
    BUBBLE_PLOT_DATA_PATH = "./data/bubble_plot_data.csv",
    STACKED_BAR_PLOT_PATH = "./data/stacked_barplot.csv",
    CIRCULAR_BARPLOT_PATH = "./data/circular_barplot.csv",
    LINE_CHART_PATH = "./data/line_chart.csv";

const BUBBLE_PLOT = "#bubble_plot",
    BUBBLE_MAP = "#bubble_map",
    WORDCLOUD = "#wordcloud",
    DOUGHNUT = "#doughnut",
    STACKED_BARCHART = "#stacked_barchart",
    CIRCULAR_BARPLOT = "#circular_barplot",
    LINE_CHART = "#line_chart";

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

const country_colors = {
    "Brazil": "#a6cee3",
    "Canada": "#1f78b4",
    "France": "#33a02c",
    "Germany": "#b2df8a",
    "India": "#e31a1c",
    "Japan": "#fdbf6f",
    "Mexico": "#cab2d6",
    "Russia": "#6a3d9a",
    "S Korea": "#ff7f00",
    "UK": "#fb9a99",
    "USA": "#ffff99"
};

let sliderChange, mouseposition = {};

$(document).ready(function() {

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
        read_data();
    });

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

    let data_ready = function(_, geo_data, bubble_map_data, doughnut_data, wordcloud_data, bubble_plot_data, stacked_bar_plot_data, circular_bar_plot_data, line_chart_data) {
        delete(bubble_map_data['columns']);
        createBubbleMap(geo_data, bubble_map_data);

        delete(doughnut_data['columns']);
        createDoughnut(doughnut_data);

        delete(wordcloud_data['columns']);
        createWordCloud(wordcloud_data);

        delete(bubble_plot_data['columns']);
        createBubblePlot(bubble_plot_data);

        delete(stacked_bar_plot_data['columns']);
        createStackedBarchart(stacked_bar_plot_data, "Overall");

        delete(circular_bar_plot_data['columns']);
        delete(line_chart_data['columns']);

        $('#bubble_map path, #bubble_map circle[id^=circle-]').each(function(_, d) {
            $(this).click(function() {
                let path_id = $(this).attr('id').replace('circle', 'map');

                if ($('#' + path_id).hasClass('highlight')) {
                    $('#bubble_map path').removeClass("faded").removeClass("highlight");
                    $('#bubble_map circle').removeClass("faded").removeClass("highlight");

                    createDoughnut(doughnut_data, "Overall");
                    createWordCloud(wordcloud_data);
                } else {
                    $('#bubble_map path').removeClass("faded").removeClass("highlight");
                    $('#bubble_map circle').removeClass("faded").removeClass("highlight");

                    createDoughnut(doughnut_data, $(d).attr("text"));
                    createWordCloud(wordcloud_data, $(d).attr("text"));


                    $('#bubble_map path[text!="' + $(d).attr("text") + '"]').addClass("faded");
                    $('#bubble_map circle[id^=circle-]').addClass("faded");

                    $('#bubble_map circle[text="' + $(d).attr("text") + '"]').removeClass("faded");

                    $('text.doughnut_center').html($(d).attr("text"));
                    $('#' + path_id).addClass("highlight");
                }
            });
        });

        $('#bubble_plot circle.bubble, #bubble_plot circle.legend').each(function() {
            $(this).click(function() {
                let circle_text = $(this).attr("text");

                if ($("#bubble_plot circle.bubble[text='" + circle_text + "']").hasClass("highlight")) {
                    $('#bubble_plot circle.bubble').removeClass("faded").removeClass("highlight");
                    createStackedBarchart(stacked_bar_plot_data, "Overall");
                } else {
                    $('#bubble_plot circle.bubble').removeClass("faded").removeClass("highlight");
                    $('#bubble_plot circle.bubble[text="' + $(this).attr('text') + '"]').addClass("highlight");
                    $('#bubble_plot circle.bubble:not(.highlight)').addClass("faded");
                    createStackedBarchart(stacked_bar_plot_data, $(this).attr("text"));
                }
            });
        });

        $('input[name="sort_radio"]').click(function() {
            let country_selected = "Overall";

            if ($("#bubble_plot circle.bubble").hasClass("highlight")) {
                country_selected = $("#bubble_plot circle.bubble.highlight").attr("text");
            }
            createStackedBarchart(stacked_bar_plot_data, country_selected);
        });

        let circularBarplotClick = function() {
            setTimeout(function() {
                createCircularBarPlot(circular_bar_plot_data);
                createLineChart(line_chart_data);

                $('[class^="circular_barplot_"]:not(text)').click(function() {
                    $('#circular_barplot .highlight').removeClass("highlight");
                    $('.' + $(this).attr("class").split(' ')[0]).addClass("highlight");
                    createLineChart(line_chart_data);
                });
            }, 10);
        }

        $('input[name="country_select"]').click(function() {
            let not_checked = $('input[name="country_select"]:not(checked)'),
                checked = $('input[name="country_select"]:checked'),
                overall = $('input[value="Overall"]');

            if ($(this).val() == "Overall") {
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
            circularBarplotClick();
        });

        $('input[name="top_channels"]').click(circularBarplotClick);

        $('#channelN').change(circularBarplotClick);

        sliderChange = function(new_val) {
            $("#channel_count").text(new_val);
            circularBarplotClick();
        }
        circularBarplotClick();
        setTimeout(function() {
            $('.user_interaction *').fadeIn("slow");
            $('.sort_radio').fadeIn("slow");
        }, 1500);

    }


    let read_data = function() {
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

    let createLineChart = function(data, plot_id = LINE_CHART) {
        let margin = { top: 60, left: 100 },
            sort_col = $('input[name="top_channels"]:checked').val();

        $(plot_id).empty();

        var width = ($(plot_id).parent().width()) * 0.75,
            height = ($(plot_id).parent().height()) * 0.65,
            svg = d3.select(plot_id)
            .append("g")
            .attr("width", width)
            .attr("height", height)
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        if ($('#circular_barplot .highlight').length == 0) {
            $('.circular_barplot_0').addClass("highlight");
        }

        let channel_name = $('#circular_barplot text.highlight').attr("title");

        let filter = [];
        $('input[name="country_select"]:checked').each(function(d) {
            filter.push($(this).val());
        });

        if (filter.length == 0) {
            svg.append("text").attr("x", margin.left).attr("y", (height + margin.top) / 2).text("Please select at least one country").attr("fill", "rgb(180, 180, 180)");
            return;
        }


        data = data.filter(function(d) {
            if ($.inArray(d.country_name, filter) >= 0 && d.channel_title === channel_name) {
                return d;
            }
        });

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


        let filtered_data = [];
        $(data).each(function(_, d) {
            filtered_data.push({
                category_title: d.value.category_title,
                x_axis: d3.timeParse("%Y-%m-%d")(d.value['trending_date']),
                y_axis: d.value[sort_col]
            });
        })

        data = filtered_data;

        // Add X axis-- > it is a date format
        var xScale = d3.scaleTime()
            .domain(d3.extent(data, d => d.x_axis)).range([0, width]);


        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .attr("class", "axis")
            .call(d3.axisBottom(xScale).tickFormat(function(d) {
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

        svg.append("g")
            .attr("class", "axis")
            .call(d3.axisLeft(yScale).tickFormat(function(d) {
                return formatN(d, 1);
            }).ticks(5));

        var groups = Array.from(new Set(data.map(function(d) { return d.category_title }))) // list of group names        

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
                return cat_colors[d.key];
            })
            .attr("d", function(d) {
                return d3.line()
                    .x(d => xScale(d.x_axis))
                    .y(d => yScale(d.y_axis)).curve(d3.curveBasis)
                    (d.values.sort(function(a, b) {
                        return b.x_axis - a.x_axis;
                    }))
            });

        svg.append("text")
            .attr("text-anchor", "start")
            .attr("x", 0)
            .attr("y", -35)
            .style("font-size", "22px")
            .style("fill", "#fff")
            .text(channel_name);


        //groups legend
        var yLegend = -14;
        svg.selectAll(plot_id)
            .data(groups)
            .enter()
            .append("circle")
            .attr("cy", yLegend)
            .attr("cx", function(d, i) { return 6 + (i * 180); })
            .attr("r", 7)
            .style("fill", d => cat_colors[d]);

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

        showPlot(plot_id);
    }

    let createCircularBarPlot = function(data, plot_id = CIRCULAR_BARPLOT) {

        let sort_col = $('input[name="top_channels"]:checked').val();
        let other_col = (sort_col == "views") ? "videos" : "views";
        var color = (d3.schemeCategory10 + ',' + d3.schemePaired + ',' + d3.schemeDark2 + ',' + d3.schemeTableau10 + ',' + d3.schemeAccent + ',' + d3.schemeSet2 + ' ' + d3.schemeSet3 + ',' + d3.schemePastel1 + ',' + d3.schemePastel2 + ' ' + d3.schemeSet3 + ',' + d3.schemePastel1 + ',' + d3.schemePastel2).split(',');
        color.splice(83, 1);
        color.splice(55, 1);
        color.splice(45, 1);
        color.splice(15, 1);
        color.splice(3, 1);

        $(plot_id).empty();

        var width = ($(plot_id).parent().width()) * 0.9,
            height = ($(plot_id).parent().height()) * 0.9,
            innerRadius = 130,
            outerRadius = (Math.min(width, height) / 2) * 0.8,
            svg = d3.select(plot_id)
            .append("g")
            .attr("width", width)
            .attr("height", height)
            .attr("transform", "translate(" + (width / 2) + "," + ((height + 30) / 2) + ")");

        let filter = [];

        $('input[name="country_select"]:checked').each(function(d) {
            filter.push($(this).val());
        });

        data = data.filter(function(d) {
            if ($.inArray(d.country_name, filter) >= 0) {
                return d;
            }
        });

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


        if (data.length == 0) {
            svg.append("text").attr("x", -120).attr("y", 0).text("Please select at least one country").attr("fill", "rgb(180, 180, 180)");
            return;
        }

        // X scale: common for 2 data series
        var x = d3.scaleBand()
            .range([0, 2 * Math.PI]) // X axis goes from 0 to 2pi = all around the circle. If I stop at 1Pi, it will be around a half circle
            .align(0) // This does nothing
            .domain(data.map(function(d) { return d.key; })); // The domain of the X axis is the list of states.

        var y = d3.scaleRadial()
            .range([innerRadius, outerRadius]) // Domain will be define later.
            .domain([d3.min(data, function(d) {
                return d.value[sort_col] * 0.6;
            }), d3.max(data, function(d) {
                return d.value[sort_col];
            })]); // Domain of Y is from 0 to the max seen in the data

        // Second barplot Scales
        var ybis = d3.scaleRadial()
            .range([innerRadius, 5]) // Domain will be defined later.
            .domain([d3.min(data, function(d) {
                return d.value[other_col] * 0.5;
            }), d3.max(data, function(d) {
                return d.value[other_col];
            })]);

        let barplotMouseOver = function(d) {
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
            $('div.tooltip')
                .css({
                    "left": mouseposition.x - 100,
                    "top": mouseposition.y - 150
                });
        }

        let barplotMouseOut = function() {
            $(plot_id + " .hovered").removeClass("hovered");
            $('div.tooltip').css({ "opacity": 0, "display": "none" });
        }

        // Add the bars
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
            .attr("d", d3.arc() // imagine your doing a part of a donut plot
                .innerRadius(innerRadius)
                .outerRadius(function(d) { return y(d.value[sort_col]); })
                .startAngle(function(d) { return x(d.key); })
                .endAngle(function(d) { return x(d.key) + x.bandwidth(); })
                .padAngle(0.01)
                .padRadius(innerRadius))
            .on("mouseover", barplotMouseOver)
            .on("mousemove", barplotMouseMove)
            .on("mouseout", barplotMouseOut);


        // Add the second series
        svg.append("g")
            .selectAll("path")
            .data(data)
            .enter()
            .append("path")
            .attr("fill", "red")
            .attr("class", function(_, i) {
                return "circular_barplot_" + i;
            })
            .attr("d", d3.arc() // imagine your doing a part of a donut plot
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

        // Add the labels
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

        d3.select(plot_id)
            .append("g")
            .selectAll("g");

        showPlot(plot_id);
    }

    let createStackedBarchart = function(data, filter = "Overall", plot_id = STACKED_BARCHART) {

        let margin = { top: 26, right: 60, bottom: 30, left: 210 };
        let sort_col = $('input[name="sort_radio"]:checked').val();

        data = data.filter(d => d.country_name == filter);

        $(plot_id).empty();

        var width = ($(plot_id).parent().width() - margin.left - margin.right),
            height = ($(plot_id).parent().height() - margin.top - margin.bottom) * 0.7,
            svg = d3.select(plot_id)
            .append("g")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

        var subgroups = ["likes", "comments", "dislikes"];

        data = data.sort(function(a, b) {
            return +b[sort_col] - +a[sort_col];
        });

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

        // Add X axis
        var y = d3.scaleBand()
            .domain(groups)
            .range([0, height])
            .padding([0.2]);

        svg.append("g")
            .call(d3.axisLeft(y).tickSizeOuter(0));


        // color palette = one color per subgroup
        var color = d3.scaleOrdinal()
            .domain(subgroups)
            .range(['#7fff00', '#15f4ee', '#ff0000']);


        //stack the data? --> stack per subgroup
        var stackedData = d3.stack()
            .keys(subgroups)
            (data);

        var stackedBarChartMouseOver = function(d) {

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

            // $("#bubble_plot [text='" + $(this).attr("text") + "']").toggleClass("hovered");
        }

        var stackedBarChartMouseOut = function() {
            // alert('b');
            $('div.tooltip').css({ "opacity": 0, "display": "none" });
            // $("#bubble_plot [text='" + $(this).attr("text") + "']").toggleClass("hovered");
        };

        var stackedBarChartMouseMove = function(d) {
            $('div.tooltip')
                .css({
                    "left": d3.mouse(this)[0] + $(plot_id).offset().left + 100,
                    "top": d3.mouse(this)[1] + $(plot_id).offset().top - 140
                });
        }

        // Show the bars
        svg.append("g")
            .selectAll("g")
            // Enter in the stack data = loop key per key = group per group
            .data(stackedData)
            .enter().append("g")
            .attr("fill", function(d) { return color(d.key); })
            .selectAll("rect")
            // enter a second time = loop subgroup per subgroup to add all rectangles
            .data(function(d) { return d; })
            .enter().append("rect")
            .attr("x", function(d) { return x(d[0]); })
            .attr("y", function(d) { return y(d.data.category_title); })
            .attr("width", function(d) { return x(d[1]) - x(d[0]); })
            .attr("height", y.bandwidth())
            .on("mouseover", stackedBarChartMouseOver)
            .on("mousemove", stackedBarChartMouseMove)
            .on("mouseout", stackedBarChartMouseOut);


        //subgroups legend
        var yLegend = height + 70;
        svg.selectAll(plot_id)
            .data(subgroups)
            .enter()
            .append("circle")
            .attr("cy", yLegend)
            .attr("cx", function(d, i) { return (i * 150); })
            .attr("r", 7)
            .style("fill", (_, i) => color(i));

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

        showPlot(plot_id);

    }

    let createBubblePlot = function(data, plot_id = BUBBLE_PLOT) {

        let margin = { top: 50, right: 20, bottom: 30, left: 100 };
        let filtered_data = [];

        data = $(data).each(function(_, d) {
            filtered_data.push({
                key: d.country_name,
                value: {
                    comments: Math.round(d.comments),
                    likes: Math.round(d.likes),
                    dislikes: Math.round(d.dislikes),
                    views: Math.round(d.views)
                }
            });
        });

        data = filtered_data;

        $(plot_id).empty();
        var svg = d3.select(plot_id).append("g"),
            width = ($(plot_id).parent().width() - margin.left - margin.right),
            height = ($(plot_id).parent().height() - margin.top - margin.bottom) * 0.7;

        svg.attr("width", $(plot_id).parent().width()).attr("height", $(plot_id).parent().height() * 0.8).attr("transform", "translate(" + margin.left + "," + margin.top + ")");


        // Add X axis
        var x = d3.scaleLinear()
            .domain([35e3, d3.max(data, function(d) {
                return d.value.likes + 2e4;
            })])
            .range([0, width]);

        // X axis labels
        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x).ticks(5).tickFormat(d => formatN(d, 0)));


        // Add X axis name
        svg.append("text")
            .attr("text-anchor", "end")
            .attr("x", width)
            .attr("y", height + 45)
            .style("font-size", "18px")
            .style("fill", "rgb(180, 180, 180)")
            .text("Average Likes");

        // Add Y axis
        var y = d3.scaleLinear()
            .domain([35e2, d3.max(data, function(d) {
                return d.value.comments + 2e3;
            })])
            .range([height, 0]);

        svg.append("g")
            .call(d3.axisLeft(y).ticks(5).tickFormat(d => formatN(d, 0)));

        // Add Y axis label:
        svg.append("text")
            .attr("x", 10)
            .attr("y", 0)
            .html("Average Comments (billions)")
            .style("font-size", "18px")
            .attr("text-anchor", "start");


        // Add a scale for bubble size
        var z = d3.scaleSqrt()
            .domain([1, d3.max(data, function(d) {
                return d.value.views;
            })])
            .range([2, 40]);

        // -2- Create 3 functions to show / update (when mouse move but stay on same circle) / hide the tooltip
        var bubblePlotMouseOver = function(d) {
            $('div.tooltip')
                .html("<strong>" + d.key + "</strong><br/><strong>Views:</strong> " + formatN(d.value.views) + "<br/><strong>Likes:</strong> " + formatN(d.value.likes) + "<br/><strong>Dislikes:</strong> " + formatN(d.value.dislikes) + "<br/><strong>Comments:</strong> " + formatN(d.value.comments) + "<br/>Click to drill-down.")
                .css({
                    "left": d3.mouse(this)[0] + $(plot_id).offset().left + 130,
                    "top": d3.mouse(this)[1] + $(plot_id).offset().top + 10,
                    "opacity": 1,
                    "display": "block"
                });

            $("#bubble_plot [text='" + $(this).attr("text") + "']").toggleClass("hovered");
        }
        var bubblePlotMouseOut = function(d) {
            $('div.tooltip').css({ "opacity": 0, "display": "none" });
            $("#bubble_plot [text='" + $(this).attr("text") + "']").toggleClass("hovered");
        }

        var bubblePlotMouseMove = function(d) {
            $('div.tooltip')
                .css({
                    "left": d3.mouse(this)[0] + $(plot_id).offset().left + 130,
                    "top": d3.mouse(this)[1] + $(plot_id).offset().top + 10
                });
        }

        svg.append("g")
            .selectAll("dot")
            .data(data)
            .enter()
            .append("circle")
            .attr("class", "bubble")
            .attr("cx", function(d) { return x(d.value.likes); })
            .attr("cy", function(d) { return y(d.value.comments); })
            .attr("r", function(d) { return z(d.value.views); })
            .attr("title", function(d) { return d.value.likes + " " + d.value.comments })
            .attr("text", function(d) { return d.key })
            .style("fill", function(d) { return country_colors[d.key]; })
            // -3- Trigger the functions
            .on("mouseover", bubblePlotMouseOver)
            .on("mousemove", bubblePlotMouseMove)
            .on("mouseout", bubblePlotMouseOut);


        // Add legend: circles
        var valuesToShow = [5e5, 20e5, 40e5],
            xCircle = width - 85,
            xLabel = xCircle + 60,
            yHeight = height - 80;

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

        // Add legend: labels
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

        // Legend title
        svg.append("text")
            .attr('x', xCircle)
            .attr("y", yHeight + 30)
            .style("fill", "rgb(180, 180, 180)")
            .text("Views")
            .attr("text-anchor", "middle")


        //country legend
        var yLegend = height + 70;
        svg.selectAll(plot_id)
            .data(data)
            .enter()
            .append("circle")
            .attr("class", "legend")
            .attr("text", d => d.key)
            .attr("cy", function(d, i) { return yLegend + (Math.floor(i / 6) * 30); })
            .attr("cx", function(d, i) { return ((i % 6) * (width / 6) * 1.05) % width })
            .attr("r", 7)
            .style("fill", function(d) { return country_colors[d.key]; })
            .on("mouseover", bubblePlotMouseOver)
            .on("mouseout", bubblePlotMouseOut);


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

        showPlot(plot_id);
    }

    let createBubbleMap = function(dataGeo, counts_by_region, plot_id = BUBBLE_MAP) {
        $(plot_id).empty();
        // The svg
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

            $(plot_id + " #legend_circle-" + $(this).attr('id').split('-')[1]).toggleClass('hovered');
            $(plot_id + " #legend_text-" + $(this).attr('id').split('-')[1]).toggleClass('hovered');

            $('div.tooltip').html("<strong>Country:</strong> " + $(this).attr('title'))
                .css({
                    "left": mouseposition.x - 120,
                    "top": mouseposition.y - 80,
                    "opacity": 1,
                    "display": "block"
                });
        }

        let bubbleMapMouseOut = function() {
            $('#map-' + $(this).attr('id').split('-')[1]).toggleClass('hovered');
            $('#circle-' + $(this).attr('id').split('-')[1]).toggleClass('hovered');
            $(plot_id + " #legend_circle-" + $(this).attr('id').split('-')[1]).toggleClass('hovered');
            $(plot_id + " #legend_text-" + $(this).attr('id').split('-')[1]).toggleClass('hovered');
            $('div.tooltip').css({ "opacity": 0, "display": "none" });
        }

        var bubbleMapMouseMove = function(d) {
            $('div.tooltip')
                .css({
                    "left": mouseposition.x - 120,
                    "top": mouseposition.y - 80,
                });
        }

        // Draw the map    
        svg.append("g")
            .selectAll("path")
            .data(dataGeo.features)
            .enter()
            .append("path")
            // .attr("fill", "#fff")
            .attr("fill", function(d) {
                return country_colors[d.properties.name];
            })
            .attr("d", d3.geoPath()
                .projection(projection)
            )
            .attr("id", d => "map-" + d.properties.name.replace(' ', '_').toLowerCase())
            .attr("text", d => d.properties.name)
            .attr('title', d => d.properties.name + "<br/>Click here to drill-down")
            .on('mouseover', bubbleMapMouseOver)
            .on('mousemove', bubbleMapMouseMove)
            .on('mouseout', bubbleMapMouseOut);



        // Add circles:        
        svg
            .selectAll("bubbles")
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
                return country_colors[d.country_name];
            })
            .attr("title", d => d.country_name + "<br/><strong>Total videos:</strong> " + formatN(d.value))
            .attr("text", d => d.country_name)
            .attr("data-value", d => d.value)
            .on('mouseover', bubbleMapMouseOver)
            .on('mousemove', bubbleMapMouseMove)
            .on('mouseout', bubbleMapMouseOut);

        // Add legend: circles
        var valuesToShow = [43000, 47000],
            xCircle = 70,
            xLabel = xCircle + 60,
            yHeight = height - 50;

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

        // Add legend: labels
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

        // Legend title
        svg.append("text")
            .attr('x', xCircle)
            .attr("y", yHeight + 18)
            .attr("fill", "rgb(180, 180, 180)")
            .style("font-size", "12px")
            .text("Total Videos")
            .attr("text-anchor", "middle")

        //country legend
        var yLegend = height - 70,
            xLegend = width * 0.45;

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
            .style("fill", function(d) { return country_colors[d.country_name]; })
            .attr("title", d => d.country_name + "<br/>Click map to drill-down")
            .on("mouseover", bubbleMapMouseOver)
            .on("mouseout", bubbleMapMouseOut);


        svg.selectAll(plot_id)
            .data(counts_by_region)
            .enter()
            .append("text")
            .attr("id", d => "legend_text-" + d.country_name.replace(" ", "_").toLowerCase())
            .attr("y", function(d, i) { return yLegend + (25 * Math.floor(i / 6)) + 2; })
            .attr("x", function(d, i) { return xLegend + 14 + ((i % 6) * (width / 11)) % width })
            .style("fill", function(d) { return country_colors[d.country_name] })
            .text(function(d) { return d.country_name })
            .style("alignment-baseline", "middle");

        showPlot(plot_id);
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
            width = $(plot_id).parent().width() * 0.9,
            height = $(plot_id).parent().height() * 0.9;


        var color = d3.scaleOrdinal(d3.schemeTableau10);

        var xScale = d3.scaleLinear()
            .domain([0, d3.max(data, function(d) {
                return d.size;
            })])
            .range([5, 25]);

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
                    .text(function(d) { return d.text; })
                    .on("mouseover", function(d) {
                        $('div.tooltip').html("<strong><div class='text-center'>" + d.text + "</div>")
                            .css({
                                "left": mouseposition.x - 100,
                                "top": mouseposition.y - 80,
                                "opacity": 1,
                                "display": "block"
                            });
                    })
                    .on("mouseout", function() {
                        $('div.tooltip').css({ "opacity": 0, "display": "none" });
                    })
                    .on("mousemove", function() {
                        $('div.tooltip').css({
                            "left": mouseposition.x - 100,
                            "top": mouseposition.y - 80
                        });
                    });
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
            radius = (Math.min(width, height) / 2) * 0.5;

        svg.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

        var pie = d3.pie()
            .value(function(d) {
                return d.value;
            })
            .sort(null);

        var data_ready = pie(d3.entries(data));

        var arc = d3.arc()
            .innerRadius(60) // This is the size of the donut hole
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
                return cat_colors[d.data.key];
            })
            .attr('d', arc)
            .on("mouseover", function(d) {
                $('div.tooltip').html("<strong>" + $('.doughnut_center').text() + "<br/></strong><strong>" + d.data.key + ":</strong> " + d.data.value + "%")
                    .css({
                        "left": mouseposition.x - 100,
                        "top": mouseposition.y - 100,
                        "opacity": 1,
                        "display": "block"
                    });
            })
            .on("mouseout", function() {
                $('div.tooltip').css({ "opacity": 0, "display": "none" });
            })
            .on("mousemove", function() {
                $('div.tooltip').css({
                    "left": mouseposition.x - 100,
                    "top": mouseposition.y - 100
                });
            });

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
                return cat_colors[d.data.key];
            });

        svg
            .append("text")
            .attr("class", "doughnut_center")
            .attr('y', 15)
            .text('Overall');

        showPlot(plot_id);
    }

    $("#pageLoadModal").modal('show');

    $('#pageLoadModal button').click(function() {
        $("#pageLoadModal").modal('hide');
    });

    $("a.nav-link[href='" + window.location.hash + "']").addClass('active');

    $(document).mousemove(function(event) {
        mouseposition.x = event.pageX;
        mouseposition.y = event.pageY;
    });
});