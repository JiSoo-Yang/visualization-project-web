export function WholeMap() {
    // 데이터 파일 로드
    Promise.all([
        d3.json('data/법정구역_시군구.geojson'),  // GeoJSON 파일 로드
        d3.json('data/accident_data.json')        // 사고 데이터 파일 로드
    ]).then(([geoData, accidentData]) => {

        // 사고 건수에 따른 색상 맵핑을 위한 Map 객체 생성
        const accidentCountMap = new Map();
        accidentData.forEach(d => {
            const code = d.위치코드_시군구;  // 시군구 코드
            const count = d.사고건수;       // 사고 건수
            if (accidentCountMap.has(code)) {
                accidentCountMap.set(code, accidentCountMap.get(code) + count);
            } else {
                accidentCountMap.set(code, count);
            }
        });

        // SVG 크기 설정
        const width = document.getElementById('Map').clientWidth;
        const height = 500;  // 고정 높이 설정
        const svg = d3.select('#Map').append('svg')
            .attr('width', width)
            .attr('height', height);

        // 색상 스케일 정의 (연한 하늘색 -> 진한 파란색)
        const colorScale = d3.scaleLinear()
            .domain([0, d3.max(Array.from(accidentCountMap.values()))])
            .range(['#ADD8E6', '#08306B']);  // 연한 하늘색 -> 진한 파란색

        // 투영법과 경로 설정
        const projection = d3.geoMercator().fitSize([width, height], geoData);
        const path = d3.geoPath().projection(projection);

        // 도구를 추가
        const tooltip = d3.select('body').append('div')
            .attr('class', 'tooltip')
            .style('position', 'absolute')
            .style('background-color', 'midnightblue')
            .style('border', '1px solid #ccc')
            .style('padding', '5px')
            .style('font-size', '11px')
            .style('display', 'none')
            .style('pointer-events', 'none');

        // 지도 그리기
        svg.selectAll('path')
            .data(geoData.features)
            .enter().append('path')
            .attr('d', path)
            .attr('fill', d => {
                const code = d.properties.SIG_CD;
                const count = accidentCountMap.get(code) || 0;
                return colorScale(count);
            })
            .attr('stroke', '#fff')
            .attr('stroke-width', 1)
            .on('mouseover', function (event, d) {
                const code = d.properties.SIG_CD;
                const kor_nm = d.properties.SIG_KOR_NM;
                const count = accidentCountMap.get(code) || 0;
                tooltip.style('display', 'block')
                    .html(`행정구역: ${kor_nm}<br>사고건수: ${count}`);
                d3.select(this)
                    .attr('stroke', 'black')
                    .attr('stroke-width', 2);
                console.log(code, count);
            })
            .on('mousemove', function (event) {
                tooltip.style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 10) + 'px');
            })
            .on('mouseout', function () {
                tooltip.style('display', 'none');
                d3.select(this)
                    .attr('stroke', '#fff')
                    .attr('stroke-width', 1);
            });

        // 세로 범례 추가
        const legendHeight = 200;  // 범례의 높이
        const legendWidth = 20;  // 범례의 폭
        const legendScale = d3.scaleLinear()
            .domain(colorScale.domain())
            .range([legendHeight, 0]);

        const legendAxis = d3.axisRight(legendScale)
            .ticks(5)
            .tickSize(6);

        const legend = svg.append('g')
            .attr('transform', `translate(${width - legendWidth - 20}, ${(height - legendHeight) / 2})`);

        const gradient = legend.append("defs")
            .append("linearGradient")
            .attr("id", "gradient")
            .attr("x1", "0%")
            .attr("y1", "100%")
            .attr("x2", "0%")
            .attr("y2", "0%");

        gradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", "#ADD8E6");  // 연한 하늘색

        gradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", "#08306B");  // 진한 파란색

        legend.append("rect")
            .attr("width", legendWidth)
            .attr("height", legendHeight)
            .style("fill", "url(#gradient)");

        legend.append("g")
            .attr("transform", `translate(${legendWidth}, 0)`)
            .call(legendAxis);

    }).catch(error => console.error('데이터 로드 또는 처리 중 오류 발생:', error));
}

export function LocalMap() {
    const selectedRegion = document.getElementById('regionSelect').value;

    Promise.all([
        d3.json(`data/시도별json_new/${selectedRegion}_accidents.json`),
        d3.json('data/법정구역_시군구.geojson')
    ]).then(([accidentData, geoData]) => {
        const accidentCountMap = new Map();
        accidentData.forEach(d => {
            accidentCountMap.set(String(d.위치코드_시군구), { 사고건수: d.사고건수, 시군구명: d.시군구명 });
        });

        renderLocalMap(geoData, accidentCountMap, 'Map2');
        loadLocalAccidentTable(accidentData.slice(0, 5));  // Top 5 사고 다발 지역
    }).catch(error => {
        console.error('Error loading data:', error);
    });
}

function renderLocalMap(geoData, accidentCountMap, mapElementId) {
    const container = document.getElementById(mapElementId);
    const width = container.clientWidth;
    const height = 500;
    const svg = d3.select(`#${mapElementId}`).append('svg')
        .attr('width', width)
        .attr('height', height);

    const colorScale = d3.scaleLinear()
        .domain([0, d3.max([...accidentCountMap.values()].map(x => x.사고건수))])
        .range(['#ADD8E6', '#08306B']);

    const projection = d3.geoMercator().fitSize([width, height], geoData);
    const path = d3.geoPath().projection(projection);

    // Define tooltip
    const tooltip = d3.select('body').append('div')
        .attr('class', 'tooltip')
        .style('position', 'absolute')
        .style('visibility', 'hidden')
        .style('background-color', 'midnightblue')
        .style('color', 'white')
        .style('padding', '5px')
        .style('border-radius', '5px');

    svg.selectAll('path')
        .data(geoData.features)
        .enter().append('path')
        .attr('d', path)
        .attr('fill', d => {
            const accidentInfo = accidentCountMap.get(String(d.properties.SIG_CD));
            return accidentInfo ? colorScale(accidentInfo.사고건수) : '#FFF';
        })
        .attr('stroke', '#fff')
        .attr('stroke-width', 1)
        .on('mouseover', function(event, d) {
            const accidentInfo = accidentCountMap.get(String(d.properties.SIG_CD));
            if (accidentInfo) {
                d3.select(this).attr('stroke', 'black').attr('stroke-width', 2);
                tooltip.html(`행정구역: ${accidentInfo.시군구명}<br>사고건수: ${accidentInfo.사고건수}`)
                       .style('visibility', 'visible')
                       .style('left', `${event.pageX + 10}px`)
                       .style('top', `${event.pageY - 10}px`);
            }
        })
        .on('mouseout', function() {
            d3.select(this).attr('stroke', '#fff').attr('stroke-width', 1);
            tooltip.style('visibility', 'hidden');
        });
}

function loadLocalAccidentTable(accidentData) {
    // 상위 5개 데이터만 정렬 (사고건수가 많은 순서로)
    const topAccidents = accidentData.sort((a, b) => b.사고건수 - a.사고건수).slice(0, 5);

    const table = document.getElementById('local-accident-table');
    // 테이블 헤더 설정
    table.innerHTML = '<tr><th>Rank</th><th>Location</th><th>Accidents</th></tr>';

    // 테이블 데이터 채우기
    topAccidents.forEach((item, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${index + 1}</td><td>${item.시군구명}</td><td>${item.사고건수}</td>`;
        table.appendChild(row);
    });
}


export function graph1() {
    // Load the data from the JSON file.
    d3.json("data/55_accident.json").then(data => {
        // Parse the year and convert numeric fields from strings to numbers
        data.forEach(d => {
            d.발생년도 = +d.발생년도;
            d.사고건수 = +d.사고건수;
            d.사망자수 = +d.사망자수;
            d.중상자수 = +d.중상자수;
            d.경상자수 = +d.경상자수;
        });

        // Set dimensions and margins of the graph
        const width = 800;
        const height = 450;
        const margin = {top: 20, right: 30, bottom: 30, left: 40};

        // Set the ranges
        const x = d3.scaleLinear().domain(d3.extent(data, d => d.발생년도)).range([margin.left, width - margin.right]);
        const y = d3.scaleLinear().domain([0, Math.max(
            d3.max(data, d => d.사고건수),
            d3.max(data, d => d.사망자수),
            d3.max(data, d => d.중상자수),
            d3.max(data, d => d.경상자수)
        )]).range([height - margin.bottom, margin.top]);

        // Define the lines
        const line사고건수 = d3.line().x(d => x(d.발생년도)).y(d => y(d.사고건수)).curve(d3.curveMonotoneX);
        const line사망자수 = d3.line().x(d => x(d.발생년도)).y(d => y(d.사망자수)).curve(d3.curveMonotoneX);
        const line중상자수 = d3.line().x(d => x(d.발생년도)).y(d => y(d.중상자수)).curve(d3.curveMonotoneX);
        const line경상자수 = d3.line().x(d => x(d.발생년도)).y(d => y(d.경상자수)).curve(d3.curveMonotoneX);

        // Append the svg object to the specific div
        const svg = d3.select(".graph1 svg")
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", [0, 0, width, height])
            .attr("style", "max-width: 100%; height: auto; height: intrinsic;");

        // Add the X Axis
        svg.append("g")
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x).tickFormat(d3.format("d")));

        // Add the Y Axis
        svg.append("g")
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(y));

        // Add the lines
        svg.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 1.5)
            .attr("d", line사고건수);

        svg.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", "red")
            .attr("stroke-width", 1.5)
            .attr("d", line사망자수);

        svg.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", "green")
            .attr("stroke-width", 1.5)
            .attr("d", line중상자수);

        svg.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", "orange")
            .attr("stroke-width", 1.5)
            .attr("d", line경상자수);

        // Add the points
        const points = [
            {data: data, color: "steelblue", y: d => y(d.사고건수), name: "사고건수"},
            {data: data, color: "red", y: d => y(d.사망자수), name: "사망자수"},
            {data: data, color: "green", y: d => y(d.중상자수), name: "중상자수"},
            {data: data, color: "orange", y: d => y(d.경상자수), name: "경상자수"}
        ];

        points.forEach(point => {
            svg.selectAll("circle." + point.name)
                .data(point.data)
                .enter()
                .append("circle")
                .attr("class", point.name)
                .attr("cx", d => x(d.발생년도))
                .attr("cy", point.y)
                .attr("r", 4)
                .attr("fill", point.color)
                .on("mouseover", function(event, d) {
                    d3.select(this).attr("r", 6);
                    const tooltip = d3.select("body").append("div")
                        .attr("class", "tooltip")
                        .style("position", "absolute")
                        .style("background", "#f9f9f9")
                        .style("color", "black")
                        .style("font-size", "8px")
                        .style("padding", "5px 10px")
                        .style("border", "1px solid #d3d3d3")
                        .style("border-radius", "5px")
                        .style("pointer-events", "none")
                        .style("opacity", 0.9)
                        .html(`${point.name}: ${d[point.name]}<br>년도: ${d.발생년도}`)
                        .style("left", `${event.pageX + 5}px`)
                        .style("top", `${event.pageY - 28}px`);
                })
                .on("mouseout", function() {
                    d3.select(this).attr("r", 4);
                    d3.select(".tooltip").remove();
                });
        });
    });
}

export function graph2() {
    Promise.all([
        d3.json("data/luner_new_year_accident.json"),
        d3.json("data/chuseok_accident.json")
    ]).then(data => {
        const [lunarData, chuseokData] = data;

        // 데이터 정제 및 집계 함수
        function aggregateData(data) {
            return d3.groups(data, d => d.발생년도).map(([year, values]) => ({
                year,
                사고건수: d3.sum(values, d => d.사고건수),
                사망자수: d3.sum(values, d => d.사망자수),
                중상자수: d3.sum(values, d => d.중상자수),
                경상자수: d3.sum(values, d => d.경상자수),
            }));
        }

        // 데이터 집계
        const lunarStats = aggregateData(lunarData);
        const chuseokStats = aggregateData(chuseokData);

        // 차트 그리는 함수
        function drawChart(containerId, stats, title) {
            const margin = {top: 10, right: 30, bottom: 40, left: 60},
                width = 460 - margin.left - margin.right,
                height = 400 - margin.top - margin.bottom;

            const svg = d3.select(".graph2 svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", `translate(${margin.left},${margin.top})`);

            // X scale
            const x = d3.scaleBand()
                .domain(stats.map(d => d.year))
                .range([0, width])
                .padding(0.2);

            // Y scale
            const y = d3.scaleLinear()
                .domain([0, d3.max(stats, d => d.사고건수)])
                .range([height, 0]);

            // X축 및 Y축 추가
            svg.append("g")
                .attr("transform", `translate(0,${height})`)
                .call(d3.axisBottom(x).tickFormat(d3.format("d")));

            svg.append("g")
                .call(d3.axisLeft(y));

            // 선 추가 함수
            function addLine(color, key) {
                const line = d3.line()
                    .x(d => x(d.year) + x.bandwidth() / 2)
                    .y(d => y(d[key]));

                svg.append("path")
                    .datum(stats)
                    .attr("fill", "none")
                    .attr("stroke", color)
                    .attr("stroke-width", 1.5)
                    .attr("d", line);
            }

            // 각 항목별 선 그리기
            addLine("steelblue", "사고건수");
            addLine("red", "사망자수");
            addLine("green", "중상자수");
            addLine("orange", "경상자수");

            // 타이틀 추가
            svg.append("text")
                .attr("x", (width / 2))
                .attr("y", 0 - (margin.top / 2))
                .attr("text-anchor", "middle")
                .style("font-size", "16px")
                .style("text-decoration", "underline")
                .text(title);
        }

        // 그래프 그리기
        drawChart("#lunarChartContainer", lunarStats, '설날 교통사고 추이 (2016-2023)');
        drawChart("#chuseokChartContainer", chuseokStats, '추석 교통사고 추이 (2016-2023)');
    });
}


export function chart2() {
    // Load JSON data
    d3.json("data/agg.json").then(data => {
        // Parse the date and convert numeric fields from strings to numbers
        data.forEach(d => {
            d.date = new Date(d.date); // Convert Unix timestamp to Date object
            d.사고건수 = +d.사고건수;
            d.사망자수 = +d.사망자수;
            d.중상자수 = +d.중상자수;
            d.경상자수 = +d.경상자수;
            d.부상신고자수 = +d.부상신고자수;
            d.rate = +d.rate;
        });

        // Set the dimensions of the SVG canvas
        const margin = {top: 20, right: 30, bottom: 50, left: 60},
              width = 800 - margin.left - margin.right,
              height = 600 - margin.top - margin.bottom;

        // Append the SVG object to the correct container
        d3.select(".chart2 svg").remove(); // Remove existing SVG if present to avoid overlap
        const svg = d3.select(".chart2") // Ensure that #chart2 is correctly targeted
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // X axis (Rate)
        const x = d3.scaleLinear()
            .domain(d3.extent(data, d => d.rate)) // Set domain based on rate
            .range([0, width]);

        svg.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(x).ticks(10))
            .append("text")
            .attr("y", 40) // Adjust position
            .attr("x", width / 2)
            .attr("text-anchor", "middle")
            .attr("fill", "white")
            .attr("font-size", "16px")   
            .text("Rate");

        // Y axis (사고건수)
        const y = d3.scaleLinear()
            .domain(d3.extent(data, d => d['사고건수'])) // Set domain based on 사고건수
            .range([height, 0]);

        svg.append("g")
            .call(d3.axisLeft(y))
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", -60)  // y 값을 더 큰 음수로 설정하여 거리를 넓힘
            .attr("x", -height / 2)
            .attr("dy", "1em")
            .attr("text-anchor", "middle")
            .attr("fill", "white")
            .attr("font-size", "16px")
            .text("Count");
        

        // Tooltip
        const tooltip = d3.select("body").append("div")
            .style("position", "absolute")
            .style("visibility", "hidden")
            .style("background", "#f8f8f8")
            .style("border", "1px solid #d4d4d4")
            .style("padding", "10px")
            .style("border-radius", "4px")
            .style("font-size", "12px")
            .style("color", "blue");

        // Add dots
        svg.selectAll("circle")
            .data(data) // Use the processed data
            .enter()
            .append("circle")
            .attr("cx", d => x(d.rate))
            .attr("cy", d => y(d['사고건수']))
            .attr("r", 5)
            .style("fill", "lemonchiffon")
            .on("mouseover", (event, d) => {
                tooltip.style("visibility", "visible")
                    .html(`Date: ${d3.timeFormat("%Y-%m-%d")(d.date)}<br>
                           사고건수: ${d['사고건수']}<br>
                           사망자수: ${d['사망자수']}<br>
                           중상자수: ${d['중상자수']}<br>
                           경상자수: ${d['경상자수']}<br>
                           부상신고자수: ${d['부상신고자수']}<br>
                           Rate: ${d.rate}`);
            })
            .on("mousemove", event => {
                tooltip.style("top", (event.pageY - 50) + "px")
                       .style("left", (event.pageX + 10) + "px");
            })
            .on("mouseout", () => {
                tooltip.style("visibility", "hidden");
            });

        // // Add the legend
        // svg.append("text")
        //     .attr("x", width / 2)
        //     .attr("y", height + margin.bottom - 10)
        //     .attr("text-anchor", "middle")
        //     .style("color", "white")
        //     .text("Rate");
    })
    .catch(error => console.error("Error loading the data:", error)); // Add error handling
}

