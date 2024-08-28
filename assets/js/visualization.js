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
            .style('background-color', 'white')
            .style('border', '1px solid #ccc')
            .style('padding', '5px')
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
                const count = accidentCountMap.get(code) || 0;
                tooltip.style('display', 'block')
                    .html(`SIG_CD: ${code}<br>사고건수: ${count}`);
                d3.select(this)
                    .attr('stroke', 'black')
                    .attr('stroke-width', 2);
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
// export function WholeMap() {
//     // 데이터 파일 로드
//     Promise.all([
//         d3.json('data/법정구역_시군구.geojson'),  // GeoJSON 파일 로드
//         d3.json('data/accident_data.json')        // 사고 데이터 파일 로드
//     ]).then(([geoData, accidentData]) => {

//         // 사고 건수에 따른 색상 맵핑을 위한 Map 객체 생성
//         const accidentCountMap = new Map();
//         accidentData.forEach(d => {
//             const code = d.위치코드_시군구;  // 시군구 코드
//             const count = d.사고건수;       // 사고 건수
//             if (accidentCountMap.has(code)) {
//                 accidentCountMap.set(code, accidentCountMap.get(code) + count);
//             } else {
//                 accidentCountMap.set(code, count);
//             }
//         });

//         // SVG 크기 설정
//         const width = document.getElementById('Map').clientWidth;
//         const height = 500;  // 고정 높이 설정
//         const svg = d3.select('#Map').append('svg')
//             .attr('width', width)
//             .attr('height', height);

//         // 색상 스케일 정의 (연한 하늘색 -> 진한 파란색)
//         const colorScale = d3.scaleLinear()
//             .domain([0, d3.max(Array.from(accidentCountMap.values()))])
//             .range(['#ADD8E6', '#08306B']);  // 연한 하늘색 -> 진한 파란색

//         // 투영법과 경로 설정
//         const projection = d3.geoMercator().fitSize([width, height], geoData);
//         const path = d3.geoPath().projection(projection);

//         // 도구를 추가
//         const tooltip = d3.select('body').append('div')
//             .attr('class', 'tooltip')
//             .style('position', 'absolute')
//             .style('background-color', 'white')
//             .style('border', '1px solid #ccc')
//             .style('padding', '5px')
//             .style('display', 'none')
//             .style('pointer-events', 'none');

//         // 지도 그리기
//         svg.selectAll('path')
//             .data(geoData.features)
//             .enter().append('path')
//             .attr('d', path)
//             .attr('fill', d => {
//                 const code = d.properties.SIG_CD;
//                 const count = accidentCountMap.get(code) || 0;
//                 return colorScale(count);
//             })
//             .attr('stroke', '#fff')
//             .attr('stroke-width', 1)
//             .on('mouseover', function (event, d) {
//                 const code = d.properties.SIG_CD;
//                 const count = accidentCountMap.get(code) || 0;
//                 tooltip.style('display', 'block')
//                     .html(`<strong>Code:</strong> ${code}<br><strong>사고건수:</strong> ${count}`);
//                 d3.select(this)
//                     .attr('stroke', 'black')
//                     .attr('stroke-width', 2);
//             })
//             .on('mousemove', function (event) {
//                 tooltip.style('left', (event.pageX + 10) + 'px')
//                     .style('top', (event.pageY - 10) + 'px');
//             })
//             .on('mouseout', function () {
//                 tooltip.style('display', 'none');
//                 d3.select(this)
//                     .attr('stroke', '#fff')
//                     .attr('stroke-width', 1);
//             });

//         // 세로 범례 추가
//         const legendHeight = 200;  // 범례의 높이
//         const legendWidth = 20;  // 범례의 폭
//         const legendScale = d3.scaleLinear()
//             .domain(colorScale.domain())
//             .range([legendHeight, 0]);

//         const legendAxis = d3.axisRight(legendScale)
//             .ticks(5)
//             .tickSize(6);

//         const legend = svg.append('g')
//             .attr('transform', `translate(${width - legendWidth - 20}, ${(height - legendHeight) / 2})`);

//         const gradient = legend.append("defs")
//             .append("linearGradient")
//             .attr("id", "gradient")
//             .attr("x1", "0%")
//             .attr("y1", "100%")
//             .attr("x2", "0%")
//             .attr("y2", "0%");

//         gradient.append("stop")
//             .attr("offset", "0%")
//             .attr("stop-color", "#ADD8E6");  // 연한 하늘색

//         gradient.append("stop")
//             .attr("offset", "100%")
//             .attr("stop-color", "#08306B");  // 진한 파란색

//         legend.append("rect")
//             .attr("width", legendWidth)
//             .attr("height", legendHeight)
//             .style("fill", "url(#gradient)");

//         legend.append("g")
//             .attr("transform", `translate(${legendWidth}, 0)`)
//             .call(legendAxis);

//     }).catch(error => console.error('데이터 로드 또는 처리 중 오류 발생:', error));
// }

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

