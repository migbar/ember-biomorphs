import Ember from 'ember';

export default Ember.Component.extend({
  showAll: null,

  actions: {
    toggleShow() {
      this.toggleProperty('showAll');
    }
  }
});
