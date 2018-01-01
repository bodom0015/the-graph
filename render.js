
var TheGraph = require('./index');
var React = require('react');
var ReactDOM = require('react-dom');

var darkTheme = require('./themes/the-graph-dark.css');
var lightTheme = require('./themes/the-graph-light.css');

// Generate some graph contents programatically
function addNode(graph) {
  var id = Math.round(Math.random()*100000).toString(36);
  var component = Math.random() > 0.5 ? 'basic' : 'basic';
  var metadata = {
    label: component,
    x: Math.round(Math.random()*800),
    y: Math.round(Math.random()*600)
  };
  var newNode = graph.addNode(id, component, metadata);
  return newNode;
};
function addEdge(graph, outNodeID) {
  var nodes = graph.nodes;
  var len = nodes.length;
  if ( len<1 ) { return; }
  var node1 = outNodeID || nodes[Math.floor(Math.random()*len)].id;
  var node2 = nodes[Math.floor(Math.random()*len)].id;
  var port1 = 'out' + Math.floor(Math.random()*3);
  var port2 = 'in' + Math.floor(Math.random()*12);
  var meta = { route: Math.floor(Math.random()*10) };
  var newEdge = graph.addEdge(node1, port1, node2, port2, meta);
  return newEdge;
};

function getTestData() {
    var componentLibrary = {
        basic: {
          name: 'basic',
          description: 'basic demo component',
          icon: 'eye',
          inports: [
            {'name': 'in0', 'type': 'all'},
            {'name': 'in1', 'type': 'all'},
            {'name': 'in2', 'type': 'all'}
          ],
          outports: [
            {'name': 'out', 'type': 'all'}
          ]
        },
    };
    var graph = new TheGraph.fbpGraph.Graph();
    addNode(graph);
    addNode(graph);
    addNode(graph);
    addNode(graph);
    addNode(graph);
    addEdge(graph);
    addEdge(graph);
    addEdge(graph);
    addEdge(graph);
    return { graph: graph, library: componentLibrary };
}




function applyStyleManual(element) {
    var style = getComputedStyle(element);
    var transferToAttribute = [

    ]
    var transferToStyle = [
        'fill',
        'stroke',
        'stroke-width',
        'opacity',
        'text-anchor',
        'font-size',
        'visibility',
    ]

    transferToAttribute.forEach(function (name) {
        var s = style.getPropertyValue(name);
        if (s) {
            element.setAttribute(name, s);
        }
    });
    transferToStyle.forEach(function (name) {
        var s = style.getPropertyValue(name);
        if (s) {
            element.style[name] = s;
        }
    }); 
}

// FIXME: background is missing
// FIXME: icons are broken
function applyStyle(tree) {
    var all = tree.getElementsByTagName("*")

    for (var i=0; i<all.length; i++) {
        applyStyleManual(all[i]);
    }
    return tree;
}


function renderImage(graphElement, options, callback) {
    if (!options) { options = {}; }
    options.format |= 'png';
    if (typeof options.background === 'undefined') { options.background = true; }

    var svgNode = graphElement.getElementsByTagName('svg')[0];
    var bgCanvas = graphElement.getElementsByTagName('canvas')[0];
    console.log('ss', svgNode)
    if (svgNode.tagName.toLowerCase() != 'svg') {
        return callback(new Error('renderImage input must be SVG, got ' + svgNode.tagName));
    }

    // FIXME: make copy
    //svgNode = svgNode.cloneNode(true, true);

    // Note: alternative to inlining style is to inject the CSS file into SVG file?
    // https://stackoverflow.com/questions/18434094/how-to-style-svg-with-external-css
    var withStyle = applyStyle(svgNode);

    // TODO: include background in SVG file
    // not that easy thougj, https://stackoverflow.com/questions/11293026/default-background-color-of-svg-root-element

    var serializer = new XMLSerializer();
    var svgData = serializer.serializeToString(withStyle);

    if (options.format == 'svg') {
        return callback(null, svgData);
    }

    var DOMURL = window.URL || window.webkitURL || window;

    var img = new Image();
    var svg = new Blob([svgData], {type: 'image/svg+xml'});
    var svgUrl = DOMURL.createObjectURL(svg);   

    var canvas = document.createElement('canvas');
    canvas.width = svgNode.getAttribute('width');
    canvas.height = svgNode.getAttribute('height');
    console.log('s', canvas)

    // TODO: allow resizing?
    // TODO: support background
    var ctx = canvas.getContext('2d');

    if (options.background) {
        var bgColor = getComputedStyle(graphElement)['background-color'];
        ctx.fillStyle = bgColor;
        ctx.fillRect(0,0,canvas.width,canvas.height);
        ctx.drawImage(bgCanvas, 0, 0);
    }

    img.onerror = function(err) {
        return callback(err);
    }
    img.onload = function() {
        ctx.drawImage(img, 0, 0);
        DOMURL.revokeObjectURL(svgUrl);
        return callback(null, canvas.toDataURL(options.format))
    }
    //console.log('loading image', svgUrl);
    img.src = svgUrl;

    //document.body.appendChild(img)
}



function libraryFromGraph(graph) {
    return {}; // FIXME: implement
}

function removeAllChildren(n) {
    while (n.firstChild) {
        n.removeChild(n.firstChild);
    }
}

function renderGraph(graph, options) {
    //options.library = libraryFromGraph(graph);
    options.theme = 'the-graph-dark';

    // FIXME: Set zoom-level, width,height so that whole graph shows with all info 
    // TODO: allow to specify maxWidth/maxHeight

    var props = {
        readonly: true,
        width: 1200,
        height: 600,
        graph: graph,
        library: options.library,
    };
    //console.log('render', props);

    var wrapper = document.createElement('div');
    wrapper.className = options.theme;
    wrapper.width = props.width;
    wrapper.height = props.height;

    // FIXME: find a less intrusive way  
    var container = document.body;
    removeAllChildren(container);
    container.appendChild(wrapper);

    var element = React.createElement(TheGraph.App, props);
    ReactDOM.render(element, wrapper);

    var svgElement = wrapper.children[0];
    return svgElement;
}

function waitForStyleLoad(callback) {
    // FIXME: check properly, https://gist.github.com/cvan/8a188df72a95a35888b70e5fda80450d
    setTimeout(callback, 500);
}

window.jsJobRun = function(inputdata, options, callback) {
    // FIXME: respect input/options
    
    var testData = getTestData();
    var svgNode = renderGraph(testData.graph, { library: testData.library });

    waitForStyleLoad(function() {

        var options = {};
        renderImage(svgNode, options, function(err, imageUrl) {
            // FIXME: decode and unpack the data?
            return callback(err, imageUrl);
        })
    });
};

