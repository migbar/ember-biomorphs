import Ember from 'ember';
import d3 from 'd3';
import hbs from 'htmlbars-inline-precompile';
import GraphicSupport from 'ember-cli-d3/mixins/d3-support';
import MarginConvention from 'ember-cli-d3/mixins/margin-convention';
import { task, timeout } from 'ember-concurrency';

const { computed, get } = Ember;

export default Ember.Component.extend(GraphicSupport, MarginConvention, {
  layout: hbs`{{yield currentGenome}}`,
  currentGenome: [], //should be set during initializatiokn
  startingGenome: [20, 20, 20, -20, Math.sin(Math.PI / 4.0) * -20, 0, Math.sin(Math.PI / 4.0) * 20, 20, 5],

  width: 0, //injected
  height: 0, //injected
  scale: 0.8,
  mutationRate: 4,

  evolutionRate: 30,
  mutationCounter: 0,

  xOffset: computed('width', function() {
    return this.get('width') / 2
  }),

  yOffset: computed('height', function() {
    return this.get('height') / 2
  }),

  drawTree() {
    let biomorph = this.generateBiomorph(this.get('currentGenome'));
    this.drawLines(this.get('selection'), this.get('xOffset'), this.get('yOffset'), biomorph);
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

  mutate(genome) {
    var clone = genome.slice(0);
    var gene = this.randomGene();
    if (gene == 8) {
        clone[gene] += this.randomBranchingMutation();
    } else {
        clone[gene] += this.randomMutation();
    }
    return clone;
  },

  randomGene() {
    return Math.round(8 * Math.random());
  },

  randomGenes() {
    var genes = [];
    for (var i = 0; i < 3; i++) {
        var gene = this.randomGene();
        while (genes.indexOf(gene) != -1) {
            gene = this.randomGene();
        }
        genes.push(gene);
    };
    return genes;
  },

  randomSign() {
    return (Math.random() > 0.5) ? -1 : 1;
  },

  randomBranchingMutation() {
    return this.randomSign();
  },

  randomMutation() {
    return (this.get('mutationRate') + Math.random()) * this.randomSign();
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

  evolve() {
    let offspring = this.mutate(this.get('currentGenome'));
    this.transition(this.get('currentGenome'), offspring);
    this.set('currentGenome', offspring);
  },

  transition(genomeStart, genomeEnd) {
      // var container     = initContainer(),
      var container     = this.get('selection'),
          biomorphStart = this.generateBiomorph(genomeStart),
          biomorphEnd   = this.generateBiomorph(genomeEnd);

      var lines = {};

      let t = this.get('evolutionRate') * 0.4;

      for (var id in biomorphStart) {
          var line = biomorphStart[id];
          var x1 = line["x1"] + this.get('xOffset');
          var y1 = line["y1"] + this.get('yOffset');
          var x2 = line["x2"] + this.get('xOffset');
          var y2 = line["y2"] + this.get('yOffset');
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
                                      .delay(t)
                                      .duration(t);
          }
      };

      for (var id in biomorphEnd) {
          var newLine = biomorphEnd[id];
          var x1 = newLine["x1"] + this.get('xOffset');
          var y1 = newLine["y1"] + this.get('yOffset');
          var x2 = newLine["x2"] + this.get('xOffset');
          var y2 = newLine["y2"] + this.get('yOffset');
          if (lines.hasOwnProperty(id)) {
              lines[id].transition().attr("x1", x1)
                                      .attr("y1", y1)
                                      .attr("x2", x2)
                                      .attr("y2", y2)
                                      .delay(t)
                                      .duration(t);
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
                                      .delay(t)
                                      .duration(t);
          }
      };
  },

  evolution: task(function * () {
    this.set('mutationCounter', 0);
    this.initGenome();
    this.drawTree();

    while (true) {
      try {
        this.incrementProperty('mutationCounter');
        d3.selectAll('line').remove();
        this.evolve();
        yield timeout(this.get('evolutionRate'));
      } finally {
        console.log('mutation', this.get('mutationCounter'));
        console.log(this.get('currentGenome'));
        // console.log('in startEvolution finally', this.get('currentGenome'));
      }
    }

  }),

  call(selection) {
    this.initGenome();
    this.set('selection', selection);
    this.drawTree();
  },

  actions: {
    start() {
      this.set('currentGenome', genome.slice(0))
      this.drawTree();
      this.startEvolution(this.get('currentGenome'));
    }
  }

});
