const margin = {top: 20, right: 30, bottom: 50, left: 60};
const width = 700 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

// Create SVG
const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Set up scales
const x = d3.scaleLinear().range([0, width]);
const y = d3.scaleLinear().range([height, 0]);
const color = d3.scaleOrdinal(d3.schemeCategory10);

// Set up line generator
const line = d3.line()
    .x((d, i) => x(i + 1))
    .y(d => y(d));

// Generate initial conditions
const maxSubjects = 20;
const maxTrials = 10;
const baseJump = 50;
let initialConditions = [];

for (let i = 0; i < maxSubjects; i++) {
    initialConditions.push(baseJump + d3.randomNormal(0, 5)());
}

// Function to generate data
function generateData(numSubjects, numTrials, bias, variation, learning) {
    const data = [];
    
    for (let i = 0; i < numSubjects; i++) {
        const subject = [initialConditions[i]];
        
        for (let j = 1; j < numTrials; j++) {
            const biasEffect = bias / (1 + Math.exp(-(2.1 - learning) * (j - numTrials/2)));
            const jumpVariation = d3.randomNormal(0, variation)();
            const jump = subject[0] + biasEffect + jumpVariation;
            subject.push(jump);
        }
        data.push(subject);
    }
    return data;
}

// Function to update chart
function updateChart() {
    const numTrials = +d3.select("#trials-slider").property("value");
    const numSubjects = +d3.select("#subjects-slider").property("value");
    const bias = +d3.select("#bias-slider").property("value");
    const variation = +d3.select("#variation-slider").property("value");
    const learning = +d3.select("#learning-slider").property("value");
    
    const showGroupAverage = d3.select('input[name="group-average"]:checked').property("value") === "show";
    const showIndividualPaths = d3.select('input[name="individual-paths"]:checked').property("value") === "show";
    
    const data = generateData(numSubjects, numTrials, bias, variation, learning);

    // Update scales
    x.domain([0.5, numTrials + 0.5]);
    y.domain([30, 85]);

    // Clear previous elements
    svg.selectAll("*").remove();

    // Add subtle vertical grid lines
    svg.selectAll("line.vertical-grid")
        .data(d3.range(1, numTrials + 1))
        .enter()
        .append("line")
        .attr("class", "vertical-grid")
        .attr("x1", d => x(d))
        .attr("y1", 0)
        .attr("x2", d => x(d))
        .attr("y2", height)
        .attr("stroke", "#e0e0e0")
        .attr("stroke-width", 1)
        .attr("shape-rendering", "crispEdges");

    // Add X axis
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(numTrials).tickFormat(d3.format('d')));

    // Add X axis label
    svg.append("text")
        .attr("transform", `translate(${width/2}, ${height + 40})`)
        .style("text-anchor", "middle")
        .text("Trial Number");

    // Add Y axis
    svg.append("g")
        .call(d3.axisLeft(y));

    // Add Y axis label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Measured Output");

    if (showIndividualPaths) {
        // Add lines for each subject
        svg.selectAll(".line")
            .data(data)
            .enter()
            .append("path")
            .attr("fill", "none")
            .attr("stroke", (d, i) => color(i))
            .attr("stroke-width", 1.5)
            .attr("d", line);
    }

    if (showGroupAverage) {
        // Calculate and add mean line
        const means = d3.range(numTrials).map(i => d3.mean(data, d => d[i]));
        svg.append("path")
            .datum(means)
            .attr("fill", "none")
            .attr("stroke", "black")
            .attr("stroke-width", 3)
            .attr("d", line);

        // Calculate and add SD area
        const sds = d3.range(numTrials).map(i => d3.deviation(data, d => d[i]));
        const areaGenerator = d3.area()
            .x((d, i) => x(i + 1))
            .y0(d => y(d[0] - d[1]))
            .y1(d => y(d[0] + d[1]));

        svg.append("path")
            .datum(d3.zip(means, sds))
            .attr("fill", "rgba(0,0,0,0.1)")
            .attr("d", areaGenerator);
    }
}

// Initial chart render
updateChart();

// Update chart when sliders or radio buttons change
d3.selectAll("input").on("input change", function() {
    if (this.type === "range") {
        d3.select(`#${this.id}-value`).text(this.value);
    }
    updateChart();
});

// Initialize slider value displays
d3.selectAll("input[type='range']").each(function() {
    d3.select(`#${this.id}-value`).text(this.value);
});