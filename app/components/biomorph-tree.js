import Ember from 'ember';
import d3 from 'd3';
import hbs from 'htmlbars-inline-precompile';
import GraphicSupport from 'ember-cli-d3/mixins/d3-support';
import MarginConvention from 'ember-cli-d3/mixins/margin-convention';

const { computed, get } = Ember;

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
