import Ember from 'ember';
import d3 from 'd3';
import hbs from 'htmlbars-inline-precompile';
import GraphicSupport from 'ember-cli-d3/mixins/d3-support';
import MarginConvention from 'ember-cli-d3/mixins/margin-convention';

const { computed, get } = Ember;

//...........................................
//...........................................

var BIOMORPHS = (function() {
    var scale        = 0.6,
        mutationRate = 4,
        width        = 960,
        height       = 700,
        xOffset      = width / 2,
        yOffset      = height / 2;

    var simpleTree     = [20, 20, 20, -20, Math.sin(Math.PI / 4.0) * -20, 0, Math.sin(Math.PI / 4.0) * 20, 20, 2],
        tree           = [20, 20, 20, -20, Math.sin(Math.PI / 4.0) * -20, 0, Math.sin(Math.PI / 4.0) * 20, 20, 5],
        treeWithBranch = [20, 20, 20, -20, Math.sin(Math.PI / 4.0) * -20, 0, Math.sin(Math.PI / 4.0) * 20, 20, 6],
        tree1          = [30, 20, 20, -20, Math.sin(Math.PI / 4.0) * -20, 0, Math.sin(Math.PI / 4.0) * 20, 20, 5],
        tree2          = [20, 40, 20, -20, Math.sin(Math.PI / 4.0) * -20, 0, Math.sin(Math.PI / 4.0) * 20, 20, 5],
        tree3          = [20, 20, 20, -20, Math.sin(Math.PI / 4.0) * -30, 0, Math.sin(Math.PI / 4.0) * 20, 32, 5],
        insect         = [5, 10, 30, -10, Math.sin(Math.PI / 4.0) * -10, 0, Math.sin(Math.PI / 4.0) * 20, 20, 7],
        insect2        = [-5, -1, 2, 3, Math.sin(Math.PI / 4.0) * -5, 0, Math.sin(Math.PI / 2.0) * 5, 3, 11],
        insect3        = [-5, 2, 2, 3, Math.sin(Math.PI / 4.0) * -5, 0, Math.sin(Math.PI / 2.0) * 5, 3, 11],
        insect4        = [-5, 2, 4, 3, Math.sin(Math.PI / 4.0) * -8, 0, Math.sin(Math.PI / 2.0) * 6, 10, 10],
        insect5        = [-5, -1, 2, 3, Math.sin(Math.PI / 4.0) * -5, 0, Math.sin(Math.PI / 2.0) * 5, 3, 11],
        candle         = [-15, 10, 20, -10, Math.sin(Math.PI / 4.0) * -10, 0, Math.sin(Math.PI / 4.0) * 2, 10, 8],
        chalice        = [-15, 10, 12, -2, Math.sin(Math.PI / 4.0) * -10, 0, Math.sin(Math.PI / 2.0) * 5, 12, 8],
        chalice2       = [-5, 2, 2, -2, Math.sin(Math.PI / 4.0) * -5, 0, Math.sin(Math.PI / 2.0) * 5, 3, 12],
        geome          = [-5, 2, 2, 3, Math.sin(Math.PI / 4.0) * -8, 0, Math.sin(Math.PI / 2.0) * -5, 3, 11];

    var genomes = [
        { name: 'tree', genome: tree },
        { name: 'candle', genome: candle },
        { name: 'chalice', genome: chalice },
        { name: 'chalice2', genome: chalice2 },
        { name: 'geome', genome: geome },
        { name: 'insect', genome: insect },
        { name: 'insect2', genome: insect2 },
        { name: 'insect3', genome: insect3 },
        { name: 'insect4', genome: insect4 },
        { name: 'insect5', genome: insect5 },
        { name: 'simpleTree', genome: simpleTree },
        { name: 'treeWithBranch', genome: treeWithBranch },
        { name: 'tree1', genome: tree1 },
        { name: 'tree2', genome: tree2 },
        { name: 'tree3', genome: tree3 }
    ];

    var currentGenome,
        evolutionId;

    function findGenome(name) {
        for (var i = 0; i < genomes.length; ++i) {
            if (name == genomes[i].name) {
                return genomes[i].genome;
            }
        }
    }

    function randomGenome() {
        return genomes[Math.round(14 * Math.random())].genome;
    }

    function evolution(genome) {
        currentGenome = genome.slice(0);
        drawBiomorph(currentGenome);
        evolutionId = setInterval(function() {
            evolve();
        }, 2000);
    }

    function start() {
        evolution(currentGenome);
    }

    function stop() {
        clearInterval(evolutionId);
    }

    function reset() {
        stop();
        initContainer();
    }

    function evolve() {
        var offspring = mutate(currentGenome);
        transition(currentGenome, offspring);
        currentGenome = offspring;
    }

    function transition(genomeStart, genomeEnd) {
        var container     = initContainer(),
            biomorphStart = generateBiomorph(genomeStart),
            biomorphEnd   = generateBiomorph(genomeEnd);

        var lines = {};

        for (var id in biomorphStart) {
            var line = biomorphStart[id];
            var x1 = line["x1"] + xOffset;
            var y1 = line["y1"] + yOffset;
            var x2 = line["x2"] + xOffset;
            var y2 = line["y2"] + yOffset;
            lines[id] = container.append("line").attr("x1", x1)
                                                .attr("y1", y1)
                                                .attr("x2", x2)
                                                .attr("y2", y2)
                                                .attr("stroke-width", 2)
                                                .attr("stroke", "black");
            if (!biomorphEnd.hasOwnProperty(id)) {
                // branch should die
                lines[id].transition().attr("x1", x1)
                                        .attr("y1", y1)
                                        .attr("x2", x1)
                                        .attr("y2", y1)
                                        .delay(600)
                                        .duration(400);
            }
        };

        for (var id in biomorphEnd) {
            var newLine = biomorphEnd[id];
            var x1 = newLine["x1"] + xOffset;
            var y1 = newLine["y1"] + yOffset;
            var x2 = newLine["x2"] + xOffset;
            var y2 = newLine["y2"] + yOffset;
            if (lines.hasOwnProperty(id)) {
                lines[id].transition().attr("x1", x1)
                                        .attr("y1", y1)
                                        .attr("x2", x2)
                                        .attr("y2", y2)
                                        .delay(1000)
                                        .duration(1000);
            } else {
                // new branch
                container.append("line").attr("x1", x1)
                                        .attr("y1", y1)
                                        .attr("x2", x1)
                                        .attr("y2", y1)
                                        .transition()
                                        .attr("x1", x1)
                                        .attr("y1", y1)
                                        .attr("x2", x2)
                                        .attr("y2", y2)
                                        .attr("stroke-width", 2)
                                        .attr("stroke", "black")
                                        .delay(2000)
                                        .duration(400);
            }
        };
    }

    function drawBiomorph(genome) {
        reset();
        var container = initContainer();

        currentGenome = genome.slice(0);
        var biomorph = generateBiomorph(currentGenome);

        drawLines(container, xOffset, yOffset, biomorph);
    }

    function initContainer() {
        d3.select("svg").remove();
        return d3.select("body").append("svg").attr("width", width).attr("height", height);
    }

    function generateBiomorph(genome) {
        var branching = genome[8];
        var dx = [
            genome[1] * -1,
            genome[0] * -1,
            0,
            genome[0],
            genome[1],
            genome[2],
            0,
            genome[2] * -1
        ];
        var dy = [
            genome[5],
            genome[4],
            genome[3],
            genome[4],
            genome[5],
            genome[6],
            genome[7],
            genome[6],
        ];

        scaleDecodedGenome(dx, dy);

        var lines = {};
        generateLines("a", 0, 0, branching, 10, dx, dy, lines);

        return lines;
    }

    // from dawkins' algorithm - http://www.sussex.ac.uk/Users/rudil/FAI_WEB_PAGES/DawkinsBiomorphs.htm
    function generateLines(id, x1, y1, length, dir, dx, dy, lines) {
        if (dir < 0) {
            dir += 8;
        } else if (dir >= 8) {
            dir -= 8;
        }

        var x2 = x1 + (length * dx[dir]);
        var y2 = y1 + (length * dy[dir]);

        // don't want zero length lines
        if ((x2 - x1) != 0 || (y2 - y1) != 0) {
            lines[id] = {x1: x1, y1: y1, x2: x2, y2: y2};
        }

        if (length > 0) {
            generateLines(id + "a", x2, y2, length - 1, dir - 1, dx, dy, lines);
            generateLines(id + "b", x2, y2, length - 1, dir + 1, dx, dy, lines);
        }
    }

    function drawLines(container, xOffset, yOffset, lines) {
        for (var key in lines) {
            var x1 = lines[key]["x1"] + xOffset;
            var y1 = lines[key]["y1"] + yOffset;
            var x2 = lines[key]["x2"] + xOffset;
            var y2 = lines[key]["y2"] + yOffset;
            drawLine(container, x1, y1, x2, y2);
        };
    }

    function drawLine(container, x1, y1, x2, y2) {
        container.append("line").attr("x1", x1)
                                .attr("y1", y1)
                                .attr("x2", x2)
                                .attr("y2", y2)
                                .attr("stroke-width", 2)
                                .attr("stroke", "black");
    }

    function mutate(genome) {
        var clone = genome.slice(0);
        var gene = randomGene();
        if (gene == 8) {
            clone[gene] += randomBranchingMutation();
        } else {
            clone[gene] += randomMutation();
        }
        return clone;
    }

    function randomGene() {
        return Math.round(8 * Math.random());
    }

    function randomGenes() {
        var genes = [];
        for (var i = 0; i < 3; i++) {
            var gene = randomGene();
            while (genes.indexOf(gene) != -1) {
                gene = randomGene();
            }
            genes.push(gene);
        };
        return genes;
    }

    function randomSign() {
        return (Math.random() > 0.5) ? -1 : 1;
    }

    function randomBranchingMutation() {
        return randomSign();
    }

    function randomMutation() {
        return (mutationRate + Math.random()) * randomSign();
    }

    function scaleDecodedGenome(dx, dy) {
        for (var i = 0; i < dx.length; i++) {
            dx[i] *= scale;
            dy[i] *= scale;
        };
    }

    ///////////////////////////////////////////////////////////

    return {
        init: function() {
            d3.select("div#genome-select")
                .append("select")
                .attr("id", "genomes")
                .on('change', function() {
                    stop();
                    var target = findGenome(this.value);
                    transition(currentGenome, target);
                    currentGenome = target;
                })
                .selectAll("option")
                .data(genomes)
                .enter()
                .append("option")
                .attr("value", function(d) { return d.name; })
                .text(function(d) { return d.name; });

            d3.select("div#genome-select")
                .append("button")
                .text("Evolve")
                .on("click", function() {
                    start();
                });

            d3.select("div#genome-select")
                .append("button")
                .text("Random Transition")
                .on("click", function() {
                    stop();
                    var random = randomGenome();
                    transition(currentGenome, random);
                    currentGenome = random;
                });

            // default tree
            drawBiomorph(tree);
        }
    };
}());
//...........................................
//...........................................









export default Ember.Component.extend(GraphicSupport, MarginConvention, {
  layout: hbs`{{yield currentGenome}}`,
  currentGenome: [], //should be set during initializatiokn
  startingGenome: [20, 20, 20, -20, Math.sin(Math.PI / 4.0) * -20, 0, Math.sin(Math.PI / 4.0) * 20, 20, 5],  

  width: 0, //injected
  height: 0, //injected
  scale: 0.8,

  xOffset: computed('width', function() {
    return this.get('width') / 2
  }),

  yOffset: computed('height', function() {
    return this.get('height') / 2
  }),

  drawTree(selection) {
    let biomorph = this.generateBiomorph(this.get('currentGenome'));
    this.drawLines(selection, this.get('xOffset'), this.get('yOffset'), biomorph);
  },

  generateLines(id, x1, y1, length, dir, dx, dy, lines) {
      if (dir < 0) {
          dir += 8;
      } else if (dir >= 8) {
          dir -= 8;
      }

      var x2 = x1 + (length * dx[dir]);
      var y2 = y1 + (length * dy[dir]);

      // don't want zero length lines
      if ((x2 - x1) != 0 || (y2 - y1) != 0) {
          lines[id] = {x1: x1, y1: y1, x2: x2, y2: y2};
      }

      if (length > 0) {
          this.generateLines(id + "a", x2, y2, length - 1, dir - 1, dx, dy, lines);
          this.generateLines(id + "b", x2, y2, length - 1, dir + 1, dx, dy, lines);
      }
  },

  drawLines(container, xOffset, yOffset, lines) {
      for (var key in lines) {
          var x1 = lines[key]["x1"] + xOffset;
          var y1 = lines[key]["y1"] + yOffset;
          var x2 = lines[key]["x2"] + xOffset;
          var y2 = lines[key]["y2"] + yOffset;
          this.drawLine(container, x1, y1, x2, y2);
      };
  },

  drawLine(container, x1, y1, x2, y2) {
      container.append("line").attr("x1", x1)
                              .attr("y1", y1)
                              .attr("x2", x2)
                              .attr("y2", y2)
                              .attr("stroke-width", 2)
                              .attr("stroke", "black");
  },

  generateBiomorph(genome) {
      var branching = genome[8];
      var dx = [
          genome[1] * -1,
          genome[0] * -1,
          0,
          genome[0],
          genome[1],
          genome[2],
          0,
          genome[2] * -1
      ];
      var dy = [
          genome[5],
          genome[4],
          genome[3],
          genome[4],
          genome[5],
          genome[6],
          genome[7],
          genome[6],
      ];

      this.scaleDecodedGenome(dx, dy);

      var lines = {};
      this.generateLines("a", 0, 0, branching, 10, dx, dy, lines);

      return lines;
  },

  scaleDecodedGenome(dx, dy) {
      for (var i = 0; i < dx.length; i++) {
          dx[i] *= this.get('scale');
          dy[i] *= this.get('scale');
      };
  },

  initGenome() {
    this.set('currentGenome', this.get('startingGenome'));
  },

  call(selection) {
    this.initGenome()
    this.drawTree(selection);
  }

});
