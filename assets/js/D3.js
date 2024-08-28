// D3.js
function drawMap() {
    console.log("drawMap function started");

    // GeoJSON과 데이터를 병합하여 지도에 표시
    d3.json('data/법정구역_시군구.geojson').then(function(geojson) {
        console.log("GeoJSON loaded:", geojson); // GeoJSON 데이터가 제대로 로드되었는지 확인
        
        // 사고건수 데이터 로드
        d3.json('data/accident_data.json').then(function(data) {
            console.log("Accident data loaded:", data); // 사고 데이터가 제대로 로드되었는지 확인
            
            const width = 975;
            const height = 610;

            // 사고건수 맵핑
            const accidentMap = new Map(data.map(d => [d.위치코드_시군구, d.사고건수]));
            console.log("Accident map created:", accidentMap);

            // 색상 스케일
            const color = d3.scaleQuantize([0, d3.max(data, d => d.사고건수)], d3.schemeBlues[9]);
            console.log("Color scale created:", color);

            const svg = d3.select("#Map")
                .append("svg")
                .attr("width", width)
                .attr("height", height)
                .attr("viewBox", [0, 0, width, height])
                .attr("style", "max-width: 100%; height: auto;");
            console.log("SVG created");

            const path = d3.geoPath();
            console.log("GeoPath created");

            svg.append("g")
                .selectAll("path")
                .data(geojson.features)
                .join("path")
                .attr("fill", d => {
                    const sig_cd = d.properties.SIG_CD;
                    const accidentCount = accidentMap.get(sig_cd) || 0;
                    console.log(`Filling path for SIG_CD ${sig_cd} with accident count ${accidentCount}`);
                    return color(accidentCount);
                })
                .attr("d", path)
                .append("title")
                .text(d => `${d.properties.SIG_KOR_NM}\n사고건수: ${accidentMap.get(d.properties.SIG_CD) || 0}`);
            console.log("Paths and titles added to SVG");

            // 지도 경계선 추가
            svg.append("path")
                .datum(topojson.mesh(geojson, geojson.features, (a, b) => a !== b))
                .attr("fill", "none")
                .attr("stroke", "white")
                .attr("stroke-linejoin", "round")
                .attr("d", path);
            console.log("Map boundaries added");

            // 색상 범례 추가
            const legend = svg.append("g")
                .attr("transform", `translate(${width - 40}, 20)`);
            console.log("Legend group created");

            const legendScale = d3.scaleLinear()
                .domain([0, d3.max(data, d => d.사고건수)])
                .range([0, 200]);
            console.log("Legend scale created");

            const legendAxis = d3.axisRight(legendScale)
                .ticks(9)
                .tickFormat(d3.format(".0f"));
            console.log("Legend axis created");

            legend.selectAll("rect")
                .data(color.range().map(d => {
                    const r = color.invertExtent(d);
                    if (!r[0]) r[0] = legendScale.domain()[0];
                    if (!r[1]) r[1] = legendScale.domain()[1];
                    console.log(`Creating legend rect for range ${r}`);
                    return r;
                }))
                .join("rect")
                .attr("width", 8)
                .attr("y", d => legendScale(d[0]))
                .attr("height", d => legendScale(d[1]) - legendScale(d[0]))
                .attr("fill", d => color(d[0]));
            console.log("Legend rectangles added");

            legend.append("text")
                .attr("x", 24)
                .attr("y", -6)
                .attr("fill", "currentColor")
                .attr("text-anchor", "start")
                .attr("font-weight", "bold")
                .text("사고건수");
            console.log("Legend text added");

            legend.call(legendAxis);
            console.log("Legend axis added");
        });
    });
}

// 페이지 로드 후 실행
// document.addEventListener('DOMContentLoaded', drawMap);

document.addEventListener('DOMContentLoaded', () => {
    drawMap();
});