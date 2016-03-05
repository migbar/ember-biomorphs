import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('biomorph-tree', 'Integration | Component | biomorph tree', {
  integration: true
});

test('it renders', function(assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });"

  this.render(hbs`{{biomorph-tree}}`);

  assert.equal(this.$().text().trim(), '');

  // Template block usage:"
  this.render(hbs`
    {{#biomorph-tree}}
      template block text
    {{/biomorph-tree}}
  `);

  assert.equal(this.$().text().trim(), 'template block text');
});
