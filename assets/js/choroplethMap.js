document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Load data asynchronously
        const geojsonUrl = 'data/법정구역_시군구.geojson';
        const dataUrl = 'data/accident_data.json'; // Updated to use JSON
        const responses = await Promise.all([
            fetch(geojsonUrl).then(resp => resp.json()),
            fetch(dataUrl).then(resp => resp.json()) // Fetching JSON data
        ]);
        const [geojson, accidentDataJson] = responses;

        // Data processing
        let accidentData = new Map(accidentDataJson.map(d => [d['위치코드_시군구'], d['사고건수']]));
        let maxAccidents = Math.max(...accidentData.values());
        let minAccidents = Math.min(...accidentData.values());

        // Setup color scale
        const color = d3.scaleQuantize([minAccidents, maxAccidents], d3.schemeBlues[9]);

        // Initialize the map
        const map = L.map('choroplethMap').setView([36.5, 127.5], 7); // 대한민국 중심 위치
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18 }).addTo(map);

        // Create SVG for the D3 legend
        const svg = d3.select(map.getPanes().overlayPane).append("svg")
            .attr("class", "leaflet-zoom-hide")
            .attr("width", 975)
            .attr("height", 610)
            .style("position", "absolute")
            .style("top", "10px")
            .style("left", "10px");

        // Add the legend
        svg.append("g")
            .attr("transform", "translate(10,10)")
            .append(() => Legend(color, { title: "사고 건수", width: 260 }));

        // Add GeoJSON layer with styles and popups
        L.geoJson(geojson, {
            style: function(feature) {
                var count = accidentData.get(feature.properties.SIG_CD) || 0;
                return {
                    fillColor: color(count),
                    weight: 2,
                    opacity: 1,
                    color: 'white',
                    fillOpacity: 0.7
                };
            },
            onEachFeature: function(feature, layer) {
                var count = accidentData.get(feature.properties.SIG_CD) || 0;
                layer.bindPopup(`<b>지역 코드: ${feature.properties.SIG_CD}</b><br>사고 건수: ${count}`);
            }
        }).addTo(map);

        // Add state borders (mesh)
        svg.append("path")
            .datum(topojson.mesh(geojson, geojson.features, (a, b) => a !== b))
            .attr("fill", "none")
            .attr("stroke", "white")
            .attr("stroke-linejoin", "round")
            .attr("d", d3.geoPath());

    } catch (err) {
        console.error('Error loading or processing data:', err);
    }
});

// Legend function to add the color scale bar
function Legend(color, { title, width = 320 } = {}) {
    const height = 44 + 30;
    const tickSize = 6;
    const marginTop = 18;
    const marginBottom = 16;
    const marginLeft = 0;
    const marginRight = 0;
    const ticks = width / 64;
    const tickFormat = undefined;
    const tickValues = color.range(); // Quantize 스케일의 범위 값 사용

    const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .style("overflow", "visible")
        .style("display", "block");

    // 범례의 x 축을 정의하는 대신 직접 color.domain()에서 스케일링함
    let x = d3.scaleLinear()
        .domain([d3.min(color.domain()), d3.max(color.domain())])
        .range([marginLeft, width - marginRight]);

    // 범례의 색상 바 생성
    svg.append("g")
        .attr("transform", `translate(0,${height - marginBottom})`)
        .call(d3.axisBottom(x)
            .ticks(ticks, typeof tickFormat === "string" ? tickFormat : undefined)
            .tickFormat(typeof tickFormat === "function" ? tickFormat : undefined)
            .tickSize(tickSize)
            .tickValues(tickValues))  // 범례의 눈금을 색상 스케일의 도메인 값으로 설정
        .call(g => g.select(".domain").remove())
        .call(g => g.append("text")
            .attr("x", marginLeft)
            .attr("y", marginTop + marginBottom - height - 6)
            .attr("fill", "currentColor")
            .attr("text-anchor", "start")
            .attr("font-weight", "bold")
            .text(title));

    return svg.node();
}

function ramp(color, n = 256) {
    const canvas = document.createElement("canvas");
    canvas.width = n;
    canvas.height = 1;
    const context = canvas.getContext("2d");
    for (let i = 0; i < n; ++i) {
        context.fillStyle = color(i / (n - 1));
        context.fillRect(i, 0, 1, 1);
    }
    return canvas;
}
