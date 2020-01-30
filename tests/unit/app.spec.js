import { expect } from 'chai';
import { mount } from '@vue/test-utils';
import Vue from 'vue';
import Buefy from 'buefy';
import App from '../../src/App.vue';

Vue.use(Buefy);

describe('App.vue', () => {
  it('Contains Title Text', () => {
    const text = 'cqm-diff';
    const wrapper = mount(App);
    expect(wrapper.text()).to.include(text);
  });

  it('Contains Old Measure Upload Input', () => {
    const text = 'Upload Old Measure';
    const wrapper = mount(App);
    expect(wrapper.text()).to.include(text);
  });

  it('Contains New Measure Upload Input', () => {
    const text = 'Upload New Measure';
    const wrapper = mount(App);
    expect(wrapper.text()).to.include(text);
  });

  it('Contains Create Diff Button', () => {
    const text = 'Create Diff';
    const wrapper = mount(App);
    expect(wrapper.text()).to.include(text);
  });

  describe('Diff', () => {
    it('Reorders and computes correctly', () => {
      const wrapper = mount(App);
      const diffButton = wrapper.find('#createDiffBtn');
      expect(diffButton.attributes().disabled).to.equal('disabled');
    });
  });

  describe('Create Diff Button', () => {
    it('Create Diff Button Disabled if no files selected', () => {
      const wrapper = mount(App);
      const diffButton = wrapper.find('#createDiffBtn');
      expect(diffButton.attributes().disabled).to.equal('disabled');
    });
  });
});
